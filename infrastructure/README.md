# 🏗️ Infrastructure

This directory contains Infrastructure as Code (IaC) configurations for deploying and managing the Sportification Backend infrastructure.

## 📁 Directory Structure

```
infrastructure/
├── terraform/                 # Terraform configurations
│   ├── main.tf               # Main Terraform configuration
│   ├── variables.tf          # Variable definitions
│   └── environments/         # Environment-specific configs
│       ├── dev.tfvars
│       ├── test.tfvars
│       └── prod.tfvars
│
└── kubernetes/                # Kubernetes manifests (Coming Soon)
    ├── deployments/
    ├── services/
    └── ingress/
```

## ☁️ Terraform

Terraform configuration for provisioning AWS infrastructure.

### Resources Managed

- **EC2/ECS**: Application hosting
- **RDS**: MongoDB managed service
- **ElastiCache**: Redis cache
- **VPC**: Network configuration
- **Security Groups**: Firewall rules
- **Load Balancers**: Traffic distribution
- **S3**: File storage
- **CloudWatch**: Monitoring and logs

### Usage

```bash
# Initialize Terraform
cd infrastructure/terraform
terraform init

# Plan changes (development)
terraform plan -var-file=environments/dev.tfvars

# Apply changes
terraform apply -var-file=environments/dev.tfvars

# Destroy infrastructure
terraform destroy -var-file=environments/dev.tfvars
```

### Environments

- **dev.tfvars** - Development environment (small instances)
- **test.tfvars** - Testing environment (medium instances)
- **prod.tfvars** - Production environment (high availability)

## ☸️ Kubernetes

Kubernetes manifests for container orchestration (Future microservices deployment).

### Components (Planned)

- Deployments for each service
- Services for inter-service communication
- Ingress for external access
- ConfigMaps for configuration
- Secrets for sensitive data
- Persistent Volume Claims for data storage

## 🔐 Security

- **Secrets**: Use AWS Secrets Manager or Kubernetes Secrets
- **IAM Roles**: Least privilege access
- **Network Policies**: Restrict inter-service communication
- **Encryption**: At-rest and in-transit

## 📝 Best Practices

1. **Version Control**: All IaC in Git
2. **State Management**: Use remote state (S3 + DynamoDB)
3. **Environments**: Separate configs for each environment
4. **Modules**: Reusable Terraform modules
5. **Documentation**: Comment complex configurations

## 🚀 Deployment Workflow

```
1. Code Change → 2. Git Push → 3. CI/CD Pipeline →
4. Terraform Plan → 5. Manual Approval → 6. Terraform Apply →
7. Deploy Application → 8. Health Checks → 9. Success ✓
```

## 🔗 Related Documentation

- [Deployment Checklist](../docs/deployment/DEPLOYMENT_CHECKLIST.md)
- [AWS Setup Script](../scripts/deployment/aws-setup.sh)
- [Environment Configuration](../docs/ENVIRONMENT_CONFIGURATION.md)

## 🆘 Troubleshooting

### Terraform State Lock

```bash
# Force unlock (use with caution)
terraform force-unlock <LOCK_ID>
```

### Authentication Issues

```bash
# Configure AWS credentials
aws configure

# Or use environment variables
export AWS_ACCESS_KEY_ID="..."
export AWS_SECRET_ACCESS_KEY="..."
```

### Resource Conflicts

```bash
# Import existing resource
terraform import aws_instance.example i-1234567890abcdef0
```

---

**Last Updated:** October 11, 2025
