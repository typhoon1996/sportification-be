# ✅ Production Deployment Checklist

## Sportification Backend - Pre-Deployment Verification

Use this checklist before deploying to production to ensure everything is properly configured.

---

## 📋 Pre-Deployment Checklist

### 1. AWS Account Setup

- [ ] AWS account created
- [ ] IAM user created with programmatic access
- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] Correct permissions assigned:
  - [ ] ECR (Full)
  - [ ] ECS (Full)
  - [ ] VPC (Full)
  - [ ] DocumentDB (Full)
  - [ ] ElastiCache (Full)
  - [ ] S3 (Full)
  - [ ] Secrets Manager (Full)
  - [ ] CloudWatch (Full)
  - [ ] IAM (Limited)

### 2. GitHub Repository Setup

- [ ] Repository access configured
- [ ] Branch protection rules enabled for `main` and `develop`
- [ ] GitHub Secrets configured:
  - [ ] `AWS_ACCESS_KEY_ID`
  - [ ] `AWS_SECRET_ACCESS_KEY`
  - [ ] `AWS_ROLE_TO_ASSUME` (if using assumed roles)
  - [ ] `CODECOV_TOKEN` (optional)
  - [ ] `SNYK_TOKEN` (optional)
  - [ ] `SLACK_WEBHOOK_URL` (optional)
- [ ] GitHub Environments created:
  - [ ] `development` (auto-deploy)
  - [ ] `staging` (auto-deploy)
  - [ ] `production` (manual approval required)

### 3. Local Development Setup

- [ ] Node.js 18+ installed
- [ ] Docker and Docker Compose installed
- [ ] Dependencies installed (`npm install`)
- [ ] Local environment file configured (`.env.development`)
- [ ] Local tests passing (`npm test`)
- [ ] Local build successful (`npm run build`)
- [ ] Docker build successful (`docker build .`)

### 4. Initial AWS Resources

Run: `./scripts/aws-setup.sh`

- [ ] ECR repository created
- [ ] S3 bucket for Terraform state created
- [ ] DynamoDB table for state locking created
- [ ] CloudWatch log groups created
- [ ] SNS topics for alerts created
- [ ] Alert email subscriptions confirmed

### 5. Domain & SSL Setup

- [ ] Domain purchased/configured
- [ ] Route 53 hosted zone created
- [ ] SSL certificate requested in ACM
- [ ] SSL certificate validated and issued
- [ ] Certificate ARN recorded

### 6. Infrastructure Configuration

- [ ] Terraform variables updated in `infrastructure/terraform/environments/*.tfvars`:
  - [ ] AWS Account ID replaced
  - [ ] ECR image URIs updated
  - [ ] SSL certificate ARN added
  - [ ] Domain names configured
- [ ] Terraform initialized (`terraform init`)
- [ ] Terraform plan reviewed (`terraform plan`)

### 7. Secrets Configuration

For each environment (dev, test, prod):

- [ ] MongoDB password generated
- [ ] JWT secrets generated (64+ characters)
- [ ] Session secrets generated
- [ ] OAuth credentials obtained:
  - [ ] Google OAuth
  - [ ] GitHub OAuth
  - [ ] Facebook OAuth
- [ ] Email service credentials obtained
- [ ] Secrets stored in AWS Secrets Manager

### 8. Development Environment

- [ ] Infrastructure deployed (`terraform apply -var-file=environments/dev.tfvars`)
- [ ] Initial Docker image built
- [ ] Image pushed to ECR
- [ ] Application deployed to ECS
- [ ] Health check passing
- [ ] API accessible
- [ ] Database connection verified
- [ ] Redis connection verified

### 9. Test/Staging Environment

- [ ] Infrastructure deployed
- [ ] Application deployed
- [ ] Integration tests passing
- [ ] API endpoints tested
- [ ] WebSocket connections tested
- [ ] File uploads tested
- [ ] Authentication flow tested

### 10. Production Environment

- [ ] Infrastructure deployed
- [ ] Backup strategy configured
- [ ] Monitoring dashboards created
- [ ] Alarms configured
- [ ] Log retention policies set
- [ ] Auto-scaling policies verified
- [ ] Security groups reviewed
- [ ] Network ACLs reviewed

### 11. Security Verification

- [ ] HTTPS enforced
- [ ] Security groups follow least privilege
- [ ] Database in private subnet
- [ ] Redis in private subnet
- [ ] No secrets in code or Docker images
- [ ] IAM roles properly configured
- [ ] Encryption at rest enabled
- [ ] Encryption in transit enabled
- [ ] WAF rules configured (if applicable)
- [ ] Security scanning passed (Snyk, Trivy)

### 12. CI/CD Pipeline

- [ ] CI workflow tested (`.github/workflows/ci.yml`)
- [ ] CD workflow tested (`.github/workflows/cd-aws.yml`)
- [ ] Automated tests passing
- [ ] Code quality checks passing
- [ ] Security scans passing
- [ ] Docker build succeeding
- [ ] Deployment to dev working
- [ ] Deployment to staging working
- [ ] Production approval gate configured

### 13. Monitoring & Alerting

- [ ] CloudWatch logs flowing
- [ ] CloudWatch metrics collecting
- [ ] CloudWatch alarms configured:
  - [ ] High CPU (>80%)
  - [ ] High memory (>80%)
  - [ ] High error rate (>5%)
  - [ ] Health check failures
- [ ] SNS notifications working
- [ ] Prometheus configured (optional)
- [ ] Grafana dashboards created (optional)

### 14. Backup & Recovery

- [ ] Database automated backups enabled
- [ ] Backup retention period configured
- [ ] Point-in-time recovery tested
- [ ] Disaster recovery plan documented
- [ ] Rollback procedure tested

### 15. Documentation

- [ ] README updated
- [ ] API documentation generated
- [ ] Environment variables documented
- [ ] Deployment procedures documented
- [ ] Troubleshooting guide created
- [ ] Runbooks created for common issues

### 16. Load Testing (Pre-Production)

- [ ] Load tests performed
- [ ] Performance benchmarks established
- [ ] Auto-scaling triggers verified
- [ ] Database performance validated
- [ ] Cache hit rates measured

### 17. Final Production Deployment

- [ ] Maintenance window scheduled
- [ ] Team notified
- [ ] Rollback plan prepared
- [ ] Production deployment executed
- [ ] Health checks passing
- [ ] API responding correctly
- [ ] Database connections stable
- [ ] Redis connections stable
- [ ] Monitoring dashboards reviewed
- [ ] No critical errors in logs

### 18. Post-Deployment

- [ ] Smoke tests executed
- [ ] End-to-end tests executed
- [ ] Performance metrics baseline established
- [ ] Team notified of successful deployment
- [ ] Documentation updated with production URLs
- [ ] Incident response plan activated

---

## 🚨 Rollback Procedure

If issues occur during deployment:

```bash
# Immediate rollback
./scripts/deploy.sh prod rollback

# Or via AWS Console:
# ECS → Cluster → Service → Update Service → Previous Task Definition
```

---

## 📊 Success Metrics

After deployment, verify these metrics:

| Metric | Target | Status |
|--------|--------|--------|
| API Response Time | < 200ms | ☐ |
| Error Rate | < 1% | ☐ |
| CPU Utilization | < 70% | ☐ |
| Memory Utilization | < 70% | ☐ |
| Database Connections | < 80% of pool | ☐ |
| Health Check Status | 100% healthy | ☐ |

---

## 🔐 Security Review

### Before Going Live

- [ ] OWASP Top 10 vulnerabilities addressed
- [ ] Penetration testing completed
- [ ] Security audit performed
- [ ] Compliance requirements met (GDPR, etc.)
- [ ] Data privacy policies implemented
- [ ] Incident response plan in place

---

## 💰 Cost Optimization

### Review These Settings

- [ ] ECS task count appropriate for load
- [ ] Database instance size appropriate
- [ ] Redis instance size appropriate
- [ ] CloudWatch log retention optimized
- [ ] S3 lifecycle policies configured
- [ ] Unused resources removed
- [ ] Reserved instances considered (for long-term)

---

## 📞 Emergency Contacts

| Role | Name | Contact |
|------|------|---------|
| DevOps Lead | [Name] | [Email/Phone] |
| Backend Lead | [Name] | [Email/Phone] |
| AWS Support | - | [Support Level] |
| Database Admin | [Name] | [Email/Phone] |
| Security Team | [Name] | [Email/Phone] |

---

## 📝 Deployment Log

### Production Deployments

| Date | Version | Deployed By | Status | Notes |
|------|---------|-------------|--------|-------|
| YYYY-MM-DD | v1.0.0 | [Name] | ✅ Success | Initial deployment |
| | | | | |

---

## ✅ Sign-Off

### Approvals Required Before Production Deployment

- [ ] Technical Lead: _________________ Date: _______
- [ ] DevOps Lead: _________________ Date: _______
- [ ] Security Team: _________________ Date: _______
- [ ] Product Owner: _________________ Date: _______

---

**Last Updated**: October 11, 2025  
**Next Review**: Before each production deployment
