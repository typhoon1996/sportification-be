# =============================================================================
# Terraform Variables - Test/Staging Environment
# =============================================================================

environment  = "test"
aws_region   = "us-east-1"
project_name = "sportification"

# Network Configuration
vpc_cidr             = "10.1.0.0/16"
az_count             = 2
public_subnet_cidrs  = ["10.1.1.0/24", "10.1.2.0/24"]
private_subnet_cidrs = ["10.1.11.0/24", "10.1.12.0/24"]
enable_nat_gateway   = true
single_nat_gateway   = true

# Database Configuration
db_instance_class           = "db.t3.medium"
db_instance_count           = 2
db_backup_retention_period  = 7
db_preferred_backup_window  = "03:00-05:00"

# Redis Configuration
redis_node_type             = "cache.t3.small"
redis_num_nodes             = 2
redis_automatic_failover    = true

# ECS Configuration
ecs_task_cpu            = 512
ecs_task_memory         = 1024
ecs_task_desired_count  = 2
ecs_task_min_capacity   = 1
ecs_task_max_capacity   = 5

container_name = "sportification-api"
container_port = 3000
container_image = "ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/sportification-api:test-latest"

# S3 Configuration
s3_enable_versioning = true

# Monitoring
log_retention_days = 14
