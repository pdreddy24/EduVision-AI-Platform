output "ecr_repository_url" { value = aws_ecr_repository.api.repository_url }
output "ecs_cluster_name" { value = aws_ecs_cluster.main.name }
output "application_url" { value = "https://${aws_cloudfront_distribution.app.domain_name}" }
output "frontend_bucket" { value = aws_s3_bucket.frontend.id }
output "document_bucket" { value = aws_s3_bucket.documents.id }
output "nat_gateway_public_ip" {
  value       = aws_eip.nat.public_ip
  description = "Allow this IP in MongoDB Atlas Network Access."
}
output "redis_endpoint" { value = aws_elasticache_replication_group.queue.primary_endpoint_address }
output "cloudfront_distribution_id" { value = aws_cloudfront_distribution.app.id }
