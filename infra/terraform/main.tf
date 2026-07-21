data "aws_availability_zones" "available" { state = "available" }
data "aws_caller_identity" "current" {}
data "aws_ec2_managed_prefix_list" "cloudfront" { name = "com.amazonaws.global.cloudfront.origin-facing" }

locals {
  name = var.project_name
  azs  = slice(data.aws_availability_zones.available.names, 0, 2)
  common_environment = [
    { name = "NODE_ENV", value = "production" },
    { name = "PORT", value = "5000" },
    { name = "AWS_REGION", value = var.aws_region },
    { name = "STORAGE_DRIVER", value = "s3" },
    { name = "DOCUMENT_BUCKET", value = aws_s3_bucket.documents.id },
    { name = "REDIS_URL", value = "rediss://${aws_elasticache_replication_group.queue.primary_endpoint_address}:6379" },
    { name = "PARSER_TIMEOUT_MS", value = "120000" },
    { name = "PARSER_CONCURRENCY", value = "2" },
    { name = "MAX_UPLOAD_MB", value = "20" },
    { name = "MAX_DAILY_QA_TOKENS_PER_USER", value = "100000" },
    { name = "API_RATE_LIMIT_PER_15_MIN", value = "300" },
    { name = "SUMMARY_MODEL", value = "gpt-4.1-mini" },
    { name = "QA_MODEL", value = "gpt-4.1-mini" },
    { name = "IMAGE_MODEL", value = "gpt-image-1" },
    { name = "VIDEO_MODEL", value = "sora-2" },
    { name = "FRONTEND_URL", value = "https://${aws_cloudfront_distribution.app.domain_name}" },
  ]
  secrets = [
    { name = "MONGO_URI", valueFrom = "${var.app_secret_arn}:MONGO_URI::" },
    { name = "ACCESS_TOKEN_SECRET", valueFrom = "${var.app_secret_arn}:ACCESS_TOKEN_SECRET::" },
    { name = "REFRESH_TOKEN_SECRET", valueFrom = "${var.app_secret_arn}:REFRESH_TOKEN_SECRET::" },
    { name = "OPENAI_API_KEY", valueFrom = "${var.app_secret_arn}:OPENAI_API_KEY::" },
  ]
}

resource "aws_vpc" "main" {
  cidr_block = var.vpc_cidr
  enable_dns_support = true
  enable_dns_hostnames = true
  tags = { Name = "${local.name}-vpc" }
}

resource "aws_internet_gateway" "main" { vpc_id = aws_vpc.main.id }

resource "aws_subnet" "public" {
  count = 2
  vpc_id = aws_vpc.main.id
  availability_zone = local.azs[count.index]
  cidr_block = cidrsubnet(var.vpc_cidr, 8, count.index)
  map_public_ip_on_launch = true
  tags = { Name = "${local.name}-public-${count.index + 1}" }
}

resource "aws_subnet" "private" {
  count = 2
  vpc_id = aws_vpc.main.id
  availability_zone = local.azs[count.index]
  cidr_block = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  tags = { Name = "${local.name}-private-${count.index + 1}" }
}

resource "aws_eip" "nat" { domain = "vpc" }
resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id = aws_subnet.public[0].id
  depends_on = [aws_internet_gateway.main]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
}
resource "aws_route_table_association" "public" {
  count = 2
  subnet_id = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }
}
resource "aws_route_table_association" "private" {
  count = 2
  subnet_id = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

resource "aws_security_group" "alb" {
  name = "${local.name}-alb"
  vpc_id = aws_vpc.main.id
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    prefix_list_ids = [data.aws_ec2_managed_prefix_list.cloudfront.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
resource "aws_security_group" "ecs" {
  name = "${local.name}-ecs"
  vpc_id = aws_vpc.main.id
  ingress {
    from_port       = 5000
    to_port         = 5000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
resource "aws_security_group" "redis" {
  name = "${local.name}-redis"
  vpc_id = aws_vpc.main.id
  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }
}

resource "aws_s3_bucket" "documents" { bucket_prefix = "${local.name}-documents-" }
resource "aws_s3_bucket_public_access_block" "documents" {
  bucket = aws_s3_bucket.documents.id
  block_public_acls = true
  block_public_policy = true
  ignore_public_acls = true
  restrict_public_buckets = true
}
resource "aws_s3_bucket_server_side_encryption_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id
  rule { apply_server_side_encryption_by_default { sse_algorithm = "AES256" } }
}
resource "aws_s3_bucket_versioning" "documents" {
  bucket = aws_s3_bucket.documents.id
  versioning_configuration { status = "Enabled" }
}
resource "aws_s3_bucket_lifecycle_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id
  rule {
    id = "expire-source-documents"
    status = "Enabled"
    expiration { days = var.document_retention_days }
    noncurrent_version_expiration { noncurrent_days = 7 }
  }
}

resource "aws_s3_bucket" "frontend" { bucket_prefix = "${local.name}-frontend-" }
resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  block_public_acls = true
  block_public_policy = true
  ignore_public_acls = true
  restrict_public_buckets = true
}
resource "aws_s3_bucket_server_side_encryption_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  rule { apply_server_side_encryption_by_default { sse_algorithm = "AES256" } }
}

resource "aws_ecr_repository" "api" {
  name = "${local.name}-api"
  image_scanning_configuration { scan_on_push = true }
  image_tag_mutability = "IMMUTABLE"
}
resource "aws_ecr_lifecycle_policy" "api" {
  repository = aws_ecr_repository.api.name
  policy = jsonencode({ rules = [{ rulePriority = 1, description = "Keep 20 images", selection = { tagStatus = "any", countType = "imageCountMoreThan", countNumber = 20 }, action = { type = "expire" } }] })
}

resource "aws_elasticache_subnet_group" "queue" {
  name = "${local.name}-queue"
  subnet_ids = aws_subnet.private[*].id
}
resource "aws_elasticache_replication_group" "queue" {
  replication_group_id = "${local.name}-queue"
  description = "BullMQ Redis"
  node_type = "cache.t4g.micro"
  port = 6379
  parameter_group_name = "default.redis7"
  engine = "redis"
  engine_version = "7.1"
  num_cache_clusters = 1
  subnet_group_name = aws_elasticache_subnet_group.queue.name
  security_group_ids = [aws_security_group.redis.id]
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  automatic_failover_enabled = false
  snapshot_retention_limit = 1
  apply_immediately = true
}

resource "aws_iam_role" "execution" {
  name = "${local.name}-ecs-execution"
  assume_role_policy = jsonencode({ Version = "2012-10-17", Statement = [{ Effect = "Allow", Principal = { Service = "ecs-tasks.amazonaws.com" }, Action = "sts:AssumeRole" }] })
}
resource "aws_iam_role_policy_attachment" "execution" {
  role = aws_iam_role.execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}
resource "aws_iam_role_policy" "execution_secrets" {
  role = aws_iam_role.execution.id
  policy = jsonencode({ Version = "2012-10-17", Statement = [{ Effect = "Allow", Action = ["secretsmanager:GetSecretValue"], Resource = [var.app_secret_arn] }] })
}
resource "aws_iam_role" "task" {
  name = "${local.name}-ecs-task"
  assume_role_policy = jsonencode({ Version = "2012-10-17", Statement = [{ Effect = "Allow", Principal = { Service = "ecs-tasks.amazonaws.com" }, Action = "sts:AssumeRole" }] })
}
resource "aws_iam_role_policy" "task_s3" {
  role = aws_iam_role.task.id
  policy = jsonencode({ Version = "2012-10-17", Statement = [{ Effect = "Allow", Action = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"], Resource = "${aws_s3_bucket.documents.arn}/*" }] })
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "/ecs/${local.name}/api"
  retention_in_days = 30
}
resource "aws_cloudwatch_log_group" "worker" {
  name              = "/ecs/${local.name}/worker"
  retention_in_days = 30
}
resource "aws_ecs_cluster" "main" {
  name = local.name
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_lb" "api" {
  name = "${local.name}-api"
  internal = false
  load_balancer_type = "application"
  security_groups = [aws_security_group.alb.id]
  subnets = aws_subnet.public[*].id
  enable_deletion_protection = false
}
resource "aws_lb_target_group" "api" {
  name = "${local.name}-api"
  port = 5000
  protocol = "HTTP"
  vpc_id = aws_vpc.main.id
  target_type = "ip"
  deregistration_delay = 30
  health_check {
    path                = "/health/ready"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    matcher             = "200"
  }
}
resource "aws_lb_listener" "api" {
  load_balancer_arn = aws_lb.api.arn
  port = 80
  protocol = "HTTP"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
}

resource "aws_ecs_task_definition" "api" {
  family = "${local.name}-api"
  network_mode = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu = var.api_cpu
  memory = var.api_memory
  execution_role_arn = aws_iam_role.execution.arn
  task_role_arn = aws_iam_role.task.arn
  container_definitions = jsonencode([{
    name = "api", image = "${aws_ecr_repository.api.repository_url}:${var.api_image_tag}", essential = true,
    portMappings = [{ containerPort = 5000, protocol = "tcp" }],
    environment = concat(local.common_environment, [{ name = "SERVICE_NAME", value = "${local.name}-api" }]),
    secrets = local.secrets,
    healthCheck = { command = ["CMD-SHELL", "node -e \"fetch('http://127.0.0.1:5000/health/live').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))\""], interval = 30, timeout = 5, retries = 3, startPeriod = 30 },
    logConfiguration = { logDriver = "awslogs", options = { "awslogs-group" = aws_cloudwatch_log_group.api.name, "awslogs-region" = var.aws_region, "awslogs-stream-prefix" = "api" } }
  }])
}
resource "aws_ecs_task_definition" "worker" {
  family = "${local.name}-worker"
  network_mode = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu = var.worker_cpu
  memory = var.worker_memory
  execution_role_arn = aws_iam_role.execution.arn
  task_role_arn = aws_iam_role.task.arn
  container_definitions = jsonencode([{
    name = "worker", image = "${aws_ecr_repository.api.repository_url}:${var.worker_image_tag}", essential = true,
    command = ["node", "workers/parserWorker.js"],
    environment = concat(local.common_environment, [{ name = "SERVICE_NAME", value = "${local.name}-worker" }]),
    secrets = local.secrets,
    logConfiguration = { logDriver = "awslogs", options = { "awslogs-group" = aws_cloudwatch_log_group.worker.name, "awslogs-region" = var.aws_region, "awslogs-stream-prefix" = "worker" } }
  }])
}
resource "aws_ecs_service" "api" {
  name = "api"
  cluster = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count = 1
  launch_type = "FARGATE"
  enable_execute_command = true
  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }
  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }
  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 5000
  }
  depends_on = [aws_lb_listener.api]
}
resource "aws_ecs_service" "worker" {
  name = "worker"
  cluster = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.worker.arn
  desired_count = 1
  launch_type = "FARGATE"
  enable_execute_command = true
  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }
  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }
}

resource "aws_appautoscaling_target" "api" {
  max_capacity = 4
  min_capacity = 1
  resource_id = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.api.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace = "ecs"
}
resource "aws_appautoscaling_policy" "api_cpu" {
  name = "${local.name}-api-cpu"
  policy_type = "TargetTrackingScaling"
  resource_id = aws_appautoscaling_target.api.resource_id
  scalable_dimension = aws_appautoscaling_target.api.scalable_dimension
  service_namespace = aws_appautoscaling_target.api.service_namespace
  target_tracking_scaling_policy_configuration {
    target_value = 60
    predefined_metric_specification { predefined_metric_type = "ECSServiceAverageCPUUtilization" }
  }
}

resource "aws_cloudfront_origin_access_control" "frontend" {
  name = "${local.name}-frontend"
  origin_access_control_origin_type = "s3"
  signing_behavior = "always"
  signing_protocol = "sigv4"
}
resource "aws_cloudfront_distribution" "app" {
  enabled = true
  default_root_object = "index.html"
  origin {
    domain_name = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id = "frontend-s3"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }
  origin {
    domain_name = aws_lb.api.dns_name
    origin_id = "api-alb"
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }
  default_cache_behavior {
    target_origin_id = "frontend-s3"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods = ["GET", "HEAD", "OPTIONS"]
    cached_methods = ["GET", "HEAD"]
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"
  }
  dynamic "ordered_cache_behavior" {
    for_each = toset(["/auth", "/auth/*", "/dash", "/dash/*", "/summarize", "/summarize/*", "/documents", "/documents/*", "/conversations", "/conversations/*", "/track", "/track/*", "/health", "/health/*"])
    content {
      path_pattern = ordered_cache_behavior.value
      target_origin_id = "api-alb"
      viewer_protocol_policy = "redirect-to-https"
      allowed_methods = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
      cached_methods = ["GET", "HEAD"]
      cache_policy_id = "413f160d-9937-4ce5-9b4f-9f5e2a45f282"
      origin_request_policy_id = "b689b0a8-53d0-40ab-baf2-68738e2966ac"
    }
  }
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }
  restrictions { geo_restriction { restriction_type = "none" } }
  viewer_certificate { cloudfront_default_certificate = true }
  price_class = "PriceClass_100"
}
resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  policy = jsonencode({ Version = "2012-10-17", Statement = [{ Effect = "Allow", Principal = { Service = "cloudfront.amazonaws.com" }, Action = "s3:GetObject", Resource = "${aws_s3_bucket.frontend.arn}/*", Condition = { StringEquals = { "AWS:SourceArn" = aws_cloudfront_distribution.app.arn } } }] })
}

resource "aws_cloudwatch_metric_alarm" "api_5xx" {
  alarm_name = "${local.name}-api-5xx"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods = 2
  metric_name = "HTTPCode_Target_5XX_Count"
  namespace = "AWS/ApplicationELB"
  period = 60
  statistic = "Sum"
  threshold = 5
  treat_missing_data = "notBreaching"
  dimensions = { LoadBalancer = aws_lb.api.arn_suffix, TargetGroup = aws_lb_target_group.api.arn_suffix }
  alarm_actions = [aws_sns_topic.alerts.arn]
}
resource "aws_sns_topic" "alerts" { name = "${local.name}-alerts" }
resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.budget_email
}
resource "aws_budgets_budget" "monthly" {
  name = "${local.name}-monthly-cost"
  budget_type = "COST"
  limit_amount = tostring(var.monthly_budget_usd)
  limit_unit = "USD"
  time_unit = "MONTHLY"
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = [var.budget_email]
  }
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.budget_email]
  }
}
