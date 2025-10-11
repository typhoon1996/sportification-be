# =============================================================================
# Terraform Configuration - Main
# =============================================================================
# This is the main Terraform configuration for deploying Sportification
# infrastructure on AWS
# =============================================================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  # Backend configuration for state management
  # Uncomment and configure for production use
  backend "s3" {
    bucket         = "sportification-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}

# =============================================================================
# Provider Configuration
# =============================================================================
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "Sportification"
      Environment = var.environment
      ManagedBy   = "Terraform"
      CostCenter  = var.cost_center
    }
  }
}

# =============================================================================
# Data Sources
# =============================================================================
data "aws_caller_identity" "current" {}
data "aws_availability_zones" "available" {
  state = "available"
}

# =============================================================================
# Local Variables
# =============================================================================
locals {
  name_prefix = "${var.project_name}-${var.environment}"
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    Repository  = var.repository_url
  }
  
  azs = slice(data.aws_availability_zones.available.names, 0, var.az_count)
}

# =============================================================================
# Networking Module
# =============================================================================
module "vpc" {
  source = "./modules/vpc"

  name_prefix         = local.name_prefix
  vpc_cidr            = var.vpc_cidr
  availability_zones  = local.azs
  public_subnet_cidrs = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  enable_nat_gateway  = var.enable_nat_gateway
  single_nat_gateway  = var.single_nat_gateway
  
  tags = local.common_tags
}

# =============================================================================
# Security Groups Module
# =============================================================================
module "security_groups" {
  source = "./modules/security"

  name_prefix = local.name_prefix
  vpc_id      = module.vpc.vpc_id
  vpc_cidr    = var.vpc_cidr
  
  tags = local.common_tags
}

# =============================================================================
# Database Module (DocumentDB for MongoDB compatibility)
# =============================================================================
module "database" {
  source = "./modules/database"

  name_prefix               = local.name_prefix
  cluster_instance_class    = var.db_instance_class
  cluster_instance_count    = var.db_instance_count
  master_username           = var.db_master_username
  subnet_ids                = module.vpc.private_subnet_ids
  security_group_ids        = [module.security_groups.database_sg_id]
  backup_retention_period   = var.db_backup_retention_period
  preferred_backup_window   = var.db_preferred_backup_window
  preferred_maintenance_window = var.db_preferred_maintenance_window
  
  tags = local.common_tags
}

# =============================================================================
# Cache Module (ElastiCache for Redis)
# =============================================================================
module "cache" {
  source = "./modules/cache"

  name_prefix          = local.name_prefix
  node_type            = var.redis_node_type
  num_cache_nodes      = var.redis_num_nodes
  parameter_group_family = var.redis_parameter_group_family
  subnet_ids           = module.vpc.private_subnet_ids
  security_group_ids   = [module.security_groups.cache_sg_id]
  automatic_failover_enabled = var.redis_automatic_failover
  
  tags = local.common_tags
}

# =============================================================================
# ECS Cluster Module
# =============================================================================
module "ecs" {
  source = "./modules/ecs"

  name_prefix                = local.name_prefix
  vpc_id                     = module.vpc.vpc_id
  private_subnet_ids         = module.vpc.private_subnet_ids
  public_subnet_ids          = module.vpc.public_subnet_ids
  
  # Task Configuration
  task_cpu                   = var.ecs_task_cpu
  task_memory                = var.ecs_task_memory
  task_desired_count         = var.ecs_task_desired_count
  task_min_capacity          = var.ecs_task_min_capacity
  task_max_capacity          = var.ecs_task_max_capacity
  
  # Container Configuration
  container_name             = var.container_name
  container_port             = var.container_port
  container_image            = var.container_image
  
  # Load Balancer
  alb_security_group_ids     = [module.security_groups.alb_sg_id]
  ecs_security_group_ids     = [module.security_groups.ecs_sg_id]
  certificate_arn            = var.acm_certificate_arn
  
  # Environment Variables
  environment_variables = {
    NODE_ENV = var.environment
    PORT     = tostring(var.container_port)
  }
  
  # Secrets from AWS Secrets Manager
  secrets = {
    MONGODB_URI        = module.database.connection_secret_arn
    REDIS_URL          = module.cache.connection_secret_arn
    JWT_SECRET         = aws_secretsmanager_secret.jwt_secret.arn
    JWT_REFRESH_SECRET = aws_secretsmanager_secret.jwt_refresh_secret.arn
  }
  
  tags = local.common_tags
}

# =============================================================================
# S3 Buckets for File Storage
# =============================================================================
module "storage" {
  source = "./modules/storage"

  name_prefix           = local.name_prefix
  enable_versioning     = var.s3_enable_versioning
  enable_encryption     = true
  lifecycle_rules       = var.s3_lifecycle_rules
  cors_rules            = var.s3_cors_rules
  
  tags = local.common_tags
}

# =============================================================================
# CloudWatch Log Groups
# =============================================================================
resource "aws_cloudwatch_log_group" "app" {
  name              = "/aws/ecs/${local.name_prefix}"
  retention_in_days = var.log_retention_days

  tags = local.common_tags
}

# =============================================================================
# Secrets Manager - Application Secrets
# =============================================================================
resource "random_password" "jwt_secret" {
  length  = 64
  special = true
}

resource "random_password" "jwt_refresh_secret" {
  length  = 64
  special = true
}

resource "aws_secretsmanager_secret" "jwt_secret" {
  name                    = "${local.name_prefix}/jwt-secret"
  description             = "JWT secret for ${var.environment}"
  recovery_window_in_days = var.environment == "prod" ? 30 : 0

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id     = aws_secretsmanager_secret.jwt_secret.id
  secret_string = random_password.jwt_secret.result
}

resource "aws_secretsmanager_secret" "jwt_refresh_secret" {
  name                    = "${local.name_prefix}/jwt-refresh-secret"
  description             = "JWT refresh secret for ${var.environment}"
  recovery_window_in_days = var.environment == "prod" ? 30 : 0

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "jwt_refresh_secret" {
  secret_id     = aws_secretsmanager_secret.jwt_refresh_secret.id
  secret_string = random_password.jwt_refresh_secret.result
}

# =============================================================================
# CloudWatch Alarms
# =============================================================================
module "monitoring" {
  source = "./modules/monitoring"

  name_prefix           = local.name_prefix
  ecs_cluster_name      = module.ecs.cluster_name
  ecs_service_name      = module.ecs.service_name
  alb_arn_suffix        = module.ecs.alb_arn_suffix
  target_group_arn_suffix = module.ecs.target_group_arn_suffix
  sns_alarm_topic_arn   = var.sns_alarm_topic_arn
  
  tags = local.common_tags
}

# =============================================================================
# Outputs
# =============================================================================
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = module.ecs.alb_dns_name
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}

output "database_endpoint" {
  description = "Database endpoint"
  value       = module.database.endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "Redis endpoint"
  value       = module.cache.endpoint
  sensitive   = true
}

output "s3_bucket_name" {
  description = "S3 bucket name for uploads"
  value       = module.storage.bucket_name
}
