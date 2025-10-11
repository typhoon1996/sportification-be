# =============================================================================
# Terraform Variables - Development Environment
# =============================================================================

environment  = "dev"
aws_region   = "us-east-1"
project_name = "sportification"

# Network Configuration
vpc_cidr             = "10.0.0.0/16"
az_count             = 2
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24"]
enable_nat_gateway   = true
single_nat_gateway   = true # Cost saving for dev

# Database Configuration (Smaller instances for dev)
db_instance_class           = "db.t3.medium"
db_instance_count           = 1
db_backup_retention_period  = 3
db_preferred_backup_window  = "03:00-05:00"

# Redis Configuration
redis_node_type             = "cache.t3.micro"
redis_num_nodes             = 1
redis_automatic_failover    = false

# ECS Configuration (Smaller for dev)
ecs_task_cpu            = 256
ecs_task_memory         = 512
ecs_task_desired_count  = 1
ecs_task_min_capacity   = 1
ecs_task_max_capacity   = 3

container_name = "sportification-api"
container_port = 3000
container_image = "ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/sportification-api:dev-latest"

# S3 Configuration
s3_enable_versioning = false # Not needed for dev

# Monitoring
log_retention_days = 7
