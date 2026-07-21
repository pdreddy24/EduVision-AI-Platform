variable "project_name" {
  type    = string
  default = "eduvision"
}
variable "aws_region" {
  type    = string
  default = "us-east-1"
}
variable "vpc_cidr" {
  type    = string
  default = "10.20.0.0/16"
}
variable "app_secret_arn" {
  description = "ARN of an existing Secrets Manager secret containing MONGO_URI, JWT secrets, and OPENAI_API_KEY."
  type        = string
  sensitive   = true
}
variable "api_image_tag" {
  type    = string
  default = "latest"
}
variable "worker_image_tag" {
  type    = string
  default = "latest"
}
variable "api_cpu" {
  type    = number
  default = 512
}
variable "api_memory" {
  type    = number
  default = 1024
}
variable "worker_cpu" {
  type    = number
  default = 1024
}
variable "worker_memory" {
  type    = number
  default = 2048
}
variable "document_retention_days" {
  type    = number
  default = 30
}
variable "monthly_budget_usd" {
  type    = number
  default = 50
}
variable "budget_email" { type = string }
