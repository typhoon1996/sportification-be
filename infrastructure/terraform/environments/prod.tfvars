# =============================================================================
# Terraform Variables - Production Environment
# =============================================================================

environment  = "prod"
aws_region   = "us-east-1"
project_name = "sportification"

# Network Configuration (Production needs more resources)
vpc_cidr             = "10.2.0.0/16"
az_count             = 3
public_subnet_cidrs  = ["10.2.1.0/24", "10.2.2.0/24", "10.2.3.0/24"]
private_subnet_cidrs = ["10.2.11.0/24", "10.2.12.0/24", "10.2.13.0/24"]
enable_nat_gateway   = true
single_nat_gateway   = false # HA for production

# Database Configuration (Production-grade)
db_instance_class           = "db.r5.large"
db_instance_count           = 3
db_backup_retention_period  = 30
db_preferred_backup_window  = "03:00-05:00"
db_preferred_maintenance_window = "sun:05:00-sun:07:00"

# Redis Configuration (Production-grade)
redis_node_type             = "cache.r5.large"
redis_num_nodes             = 3
redis_automatic_failover    = true

# ECS Configuration (Production scale)
ecs_task_cpu            = 1024
ecs_task_memory         = 2048
ecs_task_desired_count  = 4
ecs_task_min_capacity   = 2
ecs_task_max_capacity   = 20

container_name = "sportification-api"
container_port = 3000
container_image = "ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/sportification-api:prod-latest"

# ACM Certificate for HTTPS
acm_certificate_arn = "arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/CERTIFICATE_ID"

# S3 Configuration
s3_enable_versioning = true

# Monitoring
log_retention_days = 90

# SNS for alarms
sns_alarm_topic_arn = "arn:aws:sns:us-east-1:ACCOUNT_ID:sportification-prod-alerts"
