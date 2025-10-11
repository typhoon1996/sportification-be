#!/bin/bash
# =============================================================================
# AWS Setup Script
# =============================================================================
# Initialize AWS resources needed for the project
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

AWS_REGION="${AWS_REGION:-us-east-1}"
PROJECT_NAME="sportification"

check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI not found. Install: https://aws.amazon.com/cli/"
        exit 1
    fi
    
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured. Run: aws configure"
        exit 1
    fi
    
    log_info "✓ AWS CLI configured"
}

create_ecr_repository() {
    log_step "Creating ECR repository..."
    
    if aws ecr describe-repositories --repository-names "${PROJECT_NAME}-api" --region "$AWS_REGION" &> /dev/null; then
        log_info "✓ ECR repository already exists"
    else
        aws ecr create-repository \
            --repository-name "${PROJECT_NAME}-api" \
            --region "$AWS_REGION" \
            --image-scanning-configuration scanOnPush=true \
            --encryption-configuration encryptionType=AES256
        
        log_info "✓ ECR repository created"
    fi
    
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    ECR_URI="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}-api"
    
    echo ""
    log_info "ECR Repository URI: ${ECR_URI}"
    echo ""
}

create_s3_terraform_backend() {
    log_step "Creating S3 bucket for Terraform state..."
    
    BUCKET_NAME="${PROJECT_NAME}-terraform-state"
    
    if aws s3 ls "s3://${BUCKET_NAME}" &> /dev/null; then
        log_info "✓ S3 bucket already exists"
    else
        aws s3 mb "s3://${BUCKET_NAME}" --region "$AWS_REGION"
        
        # Enable versioning
        aws s3api put-bucket-versioning \
            --bucket "${BUCKET_NAME}" \
            --versioning-configuration Status=Enabled
        
        # Enable encryption
        aws s3api put-bucket-encryption \
            --bucket "${BUCKET_NAME}" \
            --server-side-encryption-configuration '{
                "Rules": [{
                    "ApplyServerSideEncryptionByDefault": {
                        "SSEAlgorithm": "AES256"
                    }
                }]
            }'
        
        # Block public access
        aws s3api put-public-access-block \
            --bucket "${BUCKET_NAME}" \
            --public-access-block-configuration \
                "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
        
        log_info "✓ S3 bucket created and configured"
    fi
}

create_dynamodb_lock_table() {
    log_step "Creating DynamoDB table for Terraform state locking..."
    
    TABLE_NAME="terraform-state-lock"
    
    if aws dynamodb describe-table --table-name "$TABLE_NAME" --region "$AWS_REGION" &> /dev/null; then
        log_info "✓ DynamoDB table already exists"
    else
        aws dynamodb create-table \
            --table-name "$TABLE_NAME" \
            --attribute-definitions AttributeName=LockID,AttributeType=S \
            --key-schema AttributeName=LockID,KeyType=HASH \
            --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
            --region "$AWS_REGION"
        
        log_info "✓ DynamoDB table created"
    fi
}

create_log_groups() {
    log_step "Creating CloudWatch log groups..."
    
    for env in dev test prod; do
        LOG_GROUP="/aws/ecs/${PROJECT_NAME}-${env}"
        
        if aws logs describe-log-groups --log-group-name-prefix "$LOG_GROUP" --region "$AWS_REGION" | grep -q "$LOG_GROUP"; then
            log_info "✓ Log group ${LOG_GROUP} already exists"
        else
            aws logs create-log-group --log-group-name "$LOG_GROUP" --region "$AWS_REGION"
            
            # Set retention
            RETENTION_DAYS=7
            [ "$env" == "prod" ] && RETENTION_DAYS=90
            [ "$env" == "test" ] && RETENTION_DAYS=14
            
            aws logs put-retention-policy \
                --log-group-name "$LOG_GROUP" \
                --retention-in-days "$RETENTION_DAYS" \
                --region "$AWS_REGION"
            
            log_info "✓ Log group ${LOG_GROUP} created (retention: ${RETENTION_DAYS} days)"
        fi
    done
}

create_sns_topics() {
    log_step "Creating SNS topics for alarms..."
    
    for env in dev test prod; do
        TOPIC_NAME="${PROJECT_NAME}-${env}-alerts"
        
        if aws sns list-topics --region "$AWS_REGION" | grep -q "$TOPIC_NAME"; then
            log_info "✓ SNS topic ${TOPIC_NAME} already exists"
        else
            TOPIC_ARN=$(aws sns create-topic --name "$TOPIC_NAME" --region "$AWS_REGION" --query 'TopicArn' --output text)
            log_info "✓ SNS topic created: ${TOPIC_ARN}"
            
            # Add email subscription (optional)
            read -p "Enter email for ${env} alerts (or press Enter to skip): " email
            if [ -n "$email" ]; then
                aws sns subscribe \
                    --topic-arn "$TOPIC_ARN" \
                    --protocol email \
                    --notification-endpoint "$email" \
                    --region "$AWS_REGION"
                log_info "✓ Email subscription added (check email for confirmation)"
            fi
        fi
    done
}

print_summary() {
    echo ""
    echo "======================================================================"
    log_info "AWS Setup Complete!"
    echo "======================================================================"
    echo ""
    echo "Next Steps:"
    echo ""
    echo "1. Update Terraform variables in infrastructure/terraform/environments/*.tfvars"
    echo "   - Replace ACCOUNT_ID with: ${ACCOUNT_ID}"
    echo "   - Update ECR image URIs"
    echo ""
    echo "2. Initialize Terraform:"
    echo "   cd infrastructure/terraform"
    echo "   terraform init"
    echo ""
    echo "3. Deploy infrastructure:"
    echo "   terraform apply -var-file=environments/dev.tfvars"
    echo ""
    echo "4. Build and push Docker image:"
    echo "   aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_URI}"
    echo "   docker build -t ${PROJECT_NAME}-api:latest ."
    echo "   docker tag ${PROJECT_NAME}-api:latest ${ECR_URI}:dev-latest"
    echo "   docker push ${ECR_URI}:dev-latest"
    echo ""
    echo "======================================================================"
}

main() {
    log_info "Starting AWS setup for ${PROJECT_NAME}..."
    log_info "Region: ${AWS_REGION}"
    echo ""
    
    check_aws_cli
    create_ecr_repository
    create_s3_terraform_backend
    create_dynamodb_lock_table
    create_log_groups
    create_sns_topics
    print_summary
}

main "$@"
