#!/bin/bash
# =============================================================================
# Deployment Script - Deploy to AWS ECS
# =============================================================================
# This script handles deployment to different environments
# Usage: ./scripts/deploy.sh [environment] [image-tag]
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
AWS_REGION="${AWS_REGION:-us-east-1}"
ECR_REPOSITORY="sportification-api"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

usage() {
    cat << EOF
Usage: $0 [ENVIRONMENT] [IMAGE_TAG]

Deploy Sportification API to AWS ECS

Arguments:
    ENVIRONMENT     Target environment (dev, test, prod)
    IMAGE_TAG       Docker image tag to deploy (optional, defaults to latest)

Examples:
    $0 dev
    $0 prod v1.2.3

Environment Variables:
    AWS_REGION      AWS region (default: us-east-1)
    AWS_PROFILE     AWS profile to use (optional)

EOF
    exit 1
}

check_requirements() {
    log_info "Checking requirements..."
    
    command -v aws >/dev/null 2>&1 || { log_error "AWS CLI not found. Install: https://aws.amazon.com/cli/"; exit 1; }
    command -v jq >/dev/null 2>&1 || { log_error "jq not found. Install: apt-get install jq"; exit 1; }
    
    # Check AWS credentials
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        log_error "AWS credentials not configured. Run: aws configure"
        exit 1
    fi
    
    log_info "✓ All requirements met"
}

get_account_id() {
    aws sts get-caller-identity --query Account --output text
}

deploy() {
    local environment=$1
    local image_tag=${2:-"${environment}-latest"}
    local account_id=$(get_account_id)
    local cluster_name="sportification-cluster-${environment}"
    local service_name="sportification-api-${environment}"
    local image_uri="${account_id}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:${image_tag}"
    
    log_info "Starting deployment to ${environment}..."
    log_info "Image: ${image_uri}"
    log_info "Cluster: ${cluster_name}"
    log_info "Service: ${service_name}"
    
    # Check if image exists in ECR
    log_info "Checking if image exists in ECR..."
    if ! aws ecr describe-images \
        --repository-name "${ECR_REPOSITORY}" \
        --image-ids imageTag="${image_tag}" \
        --region "${AWS_REGION}" >/dev/null 2>&1; then
        log_error "Image ${image_uri} not found in ECR"
        exit 1
    fi
    
    # Get current task definition
    log_info "Fetching current task definition..."
    local task_def_arn=$(aws ecs describe-services \
        --cluster "${cluster_name}" \
        --services "${service_name}" \
        --query 'services[0].taskDefinition' \
        --output text \
        --region "${AWS_REGION}")
    
    if [ "$task_def_arn" == "None" ]; then
        log_error "Service ${service_name} not found in cluster ${cluster_name}"
        exit 1
    fi
    
    log_info "Current task definition: ${task_def_arn}"
    
    # Get task definition JSON
    local task_def_json=$(aws ecs describe-task-definition \
        --task-definition "${task_def_arn}" \
        --query 'taskDefinition' \
        --region "${AWS_REGION}")
    
    # Update image in task definition
    log_info "Creating new task definition with updated image..."
    local new_task_def=$(echo "${task_def_json}" | jq --arg image "${image_uri}" '
        .containerDefinitions[0].image = $image |
        del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy)
    ')
    
    # Register new task definition
    local new_task_def_arn=$(echo "${new_task_def}" | \
        aws ecs register-task-definition \
            --cli-input-json file:///dev/stdin \
            --region "${AWS_REGION}" \
            --query 'taskDefinition.taskDefinitionArn' \
            --output text)
    
    log_info "New task definition registered: ${new_task_def_arn}"
    
    # Update ECS service
    log_info "Updating ECS service..."
    aws ecs update-service \
        --cluster "${cluster_name}" \
        --service "${service_name}" \
        --task-definition "${new_task_def_arn}" \
        --force-new-deployment \
        --region "${AWS_REGION}" >/dev/null
    
    log_info "✓ Service update initiated"
    
    # Wait for service to become stable
    if [ "${WAIT_FOR_STABLE:-true}" == "true" ]; then
        log_info "Waiting for service to stabilize (this may take several minutes)..."
        if aws ecs wait services-stable \
            --cluster "${cluster_name}" \
            --services "${service_name}" \
            --region "${AWS_REGION}"; then
            log_info "✓ Service is stable"
        else
            log_error "Service failed to stabilize"
            show_recent_events "${cluster_name}" "${service_name}"
            exit 1
        fi
    fi
    
    # Get service info
    local running_count=$(aws ecs describe-services \
        --cluster "${cluster_name}" \
        --services "${service_name}" \
        --query 'services[0].runningCount' \
        --output text \
        --region "${AWS_REGION}")
    
    local desired_count=$(aws ecs describe-services \
        --cluster "${cluster_name}" \
        --services "${service_name}" \
        --query 'services[0].desiredCount' \
        --output text \
        --region "${AWS_REGION}")
    
    log_info "Deployment Summary:"
    echo "  Environment: ${environment}"
    echo "  Image: ${image_uri}"
    echo "  Task Definition: ${new_task_def_arn}"
    echo "  Running Tasks: ${running_count}/${desired_count}"
    
    log_info "✓ Deployment completed successfully!"
    
    # Health check
    if [ "${RUN_HEALTH_CHECK:-true}" == "true" ]; then
        log_info "Running health check..."
        run_health_check "${environment}"
    fi
}

show_recent_events() {
    local cluster=$1
    local service=$2
    
    log_warn "Recent service events:"
    aws ecs describe-services \
        --cluster "${cluster}" \
        --services "${service}" \
        --query 'services[0].events[0:5].[createdAt,message]' \
        --output table \
        --region "${AWS_REGION}"
}

run_health_check() {
    local environment=$1
    local health_url=""
    
    case $environment in
        dev)
            health_url="https://dev-api.sportification.com/health"
            ;;
        test)
            health_url="https://staging-api.sportification.com/health"
            ;;
        prod)
            health_url="https://api.sportification.com/health"
            ;;
    esac
    
    if [ -n "$health_url" ]; then
        log_info "Checking health endpoint: ${health_url}"
        sleep 10 # Wait for ALB to update
        
        if curl -sf "${health_url}" >/dev/null; then
            log_info "✓ Health check passed"
        else
            log_warn "Health check failed or endpoint not accessible"
        fi
    fi
}

rollback() {
    local environment=$1
    local cluster_name="sportification-cluster-${environment}"
    local service_name="sportification-api-${environment}"
    
    log_warn "Rolling back to previous task definition..."
    
    # Get previous task definition
    local task_defs=$(aws ecs list-task-definitions \
        --family-prefix "sportification-api-${environment}" \
        --sort DESC \
        --max-items 2 \
        --query 'taskDefinitionArns' \
        --output json \
        --region "${AWS_REGION}")
    
    local previous_task_def=$(echo "${task_defs}" | jq -r '.[1]')
    
    if [ "$previous_task_def" == "null" ] || [ -z "$previous_task_def" ]; then
        log_error "No previous task definition found"
        exit 1
    fi
    
    log_info "Rolling back to: ${previous_task_def}"
    
    aws ecs update-service \
        --cluster "${cluster_name}" \
        --service "${service_name}" \
        --task-definition "${previous_task_def}" \
        --force-new-deployment \
        --region "${AWS_REGION}" >/dev/null
    
    log_info "✓ Rollback initiated"
}

# Main script
main() {
    if [ $# -lt 1 ]; then
        usage
    fi
    
    local environment=$1
    local image_tag=${2:-""}
    
    # Validate environment
    if [[ ! "$environment" =~ ^(dev|test|prod)$ ]]; then
        log_error "Invalid environment: ${environment}"
        usage
    fi
    
    # Production confirmation
    if [ "$environment" == "prod" ]; then
        log_warn "⚠️  You are deploying to PRODUCTION!"
        read -p "Are you sure? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            log_info "Deployment cancelled"
            exit 0
        fi
    fi
    
    check_requirements
    deploy "$environment" "$image_tag"
}

# Run main function
main "$@"
