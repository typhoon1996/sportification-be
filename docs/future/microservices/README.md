# Microservices Quick Reference

## 📚 Documentation Index

1. **[DECISION_MATRIX.md](./DECISION_MATRIX.md)** - Should you migrate? Read this first!
2. **[MICROSERVICES_MIGRATION_PLAN.md](../MICROSERVICES_MIGRATION_PLAN.md)** - Complete migration strategy
3. **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Step-by-step code examples

## 🚀 Quick Decision

### Am I Ready for Microservices?

**Check all that apply**:
- [ ] 50,000+ users (or expect to reach this in 3-6 months)
- [ ] Team size ≥ 6 engineers
- [ ] Dedicated DevOps engineer
- [ ] Budget: $335K-560K for migration + $200K/year ongoing
- [ ] Experiencing scaling issues that vertical scaling can't solve
- [ ] Product is stable (not pivoting every month)

**Score**:
- ✅ **5-6 boxes checked**: GO for microservices
- ⚠️ **3-4 boxes checked**: Consider modular monolith first
- ❌ **0-2 boxes checked**: STAY with enhanced monolith

## 📦 Current Architecture

```
Monolithic API (Node.js + TypeScript + MongoDB)
├── Authentication (JWT, OAuth, MFA)
├── User Management
├── Match System
├── Tournament System
├── Team Management
├── Real-time Chat (Socket.IO)
├── Notifications
├── Venue Management
├── Analytics
└── AI/ML Features
```

## 🎯 Target Architecture (If Migrating)

```
API Gateway (Kong/NGINX)
├── IAM Service (Node.js) - Port 3001
├── User Service (Node.js) - Port 3002
├── Match Service (Node.js) - Port 3003
├── Tournament Service (Node.js) - Port 3004
├── Team Service (Node.js) - Port 3005
├── Chat Service (Node.js + Socket.IO) - Port 3006
├── Notification Service (Node.js) - Port 3007
├── Venue Service (Node.js) - Port 3008
├── Analytics Service (Node.js) - Port 3009
└── AI/ML Service (Python) - Port 3010

Message Bus (RabbitMQ)
Service Discovery (Consul/K8s DNS)
Monitoring (Prometheus + Grafana)
Tracing (Jaeger)
```

## ⏱️ Migration Timeline

| Phase | Duration | What |
|-------|----------|------|
| 0 | 2 weeks | Infrastructure setup |
| 1 | 2 weeks | IAM Service |
| 2 | 2 weeks | Notification Service |
| 3 | 3 weeks | Chat Service |
| 4 | 2 weeks | User Service |
| 5 | 2 weeks | Match Service |
| 6 | 3 weeks | Tournament Service |
| 7 | 2 weeks | Team Service |
| 8 | 2 weeks | Venue Service |
| 9 | 4 weeks | Analytics/AI Services |
| 10 | 2+ weeks | Decommission monolith |
| **Total** | **~6 months** | Full migration |

## 💰 Cost Estimate

### One-Time Costs
- Engineering: $300K-500K (6 months, 6 engineers)
- Infrastructure: $10K-20K
- Training: $5K-10K
- Testing: $20K-30K
- **Total**: $335K-560K

### Ongoing Costs (Monthly)
- Kubernetes cluster: $500-2000
- Databases: $1000-3000
- Message bus: $200-500
- Monitoring: $300-800
- CDN: $100-500
- **Total**: $2,300-7,300/month

## 🛠️ Technologies Needed

### Current Stack (Keep)
- Node.js 18+
- TypeScript
- Express.js
- MongoDB
- Redis
- Socket.IO

### New Stack (Add)
- **Container Orchestration**: Kubernetes
- **API Gateway**: Kong or NGINX
- **Message Bus**: RabbitMQ or Apache Kafka
- **Service Discovery**: Consul or Kubernetes DNS
- **Monitoring**: Prometheus + Grafana
- **Tracing**: Jaeger or Zipkin
- **Logging**: ELK Stack or Loki
- **CI/CD**: GitHub Actions + ArgoCD

## 📋 Migration Checklist

### Before Starting
- [ ] Get stakeholder approval
- [ ] Allocate budget
- [ ] Hire/train DevOps engineer(s)
- [ ] Document current system thoroughly
- [ ] Set up monitoring on monolith (baseline metrics)
- [ ] Create rollback plan

### Phase 0: Infrastructure
- [ ] Set up Kubernetes cluster
- [ ] Install API Gateway (Kong)
- [ ] Install RabbitMQ
- [ ] Install Prometheus + Grafana
- [ ] Install Jaeger for tracing
- [ ] Set up CI/CD pipelines
- [ ] Create shared libraries package

### Phase 1: First Service (IAM)
- [ ] Extract authentication code
- [ ] Create IAM microservice
- [ ] Set up database for IAM
- [ ] Implement event publishing
- [ ] Deploy to Kubernetes
- [ ] Configure API Gateway routing
- [ ] Add proxy in monolith
- [ ] Test thoroughly
- [ ] Route 10% traffic → Monitor
- [ ] Route 50% traffic → Monitor
- [ ] Route 100% traffic → Monitor for 2 weeks

### Repeat for Each Service

## 🔑 Key Patterns

### 1. Strangler Fig Pattern
Gradually replace monolith by routing traffic to new services while keeping monolith as fallback.

### 2. Database Per Service
Each microservice has its own database for loose coupling.

### 3. Event-Driven Communication
Services communicate via message bus for async operations.

### 4. API Gateway
Single entry point for all client requests.

### 5. Service Discovery
Services register themselves; clients discover services dynamically.

### 6. Circuit Breaker
Prevent cascading failures by failing fast.

### 7. Saga Pattern
Manage distributed transactions across services.

## 🚨 Common Pitfalls

1. **Starting Too Early** - Migrate when you have clear need
2. **Too Many Services** - Start with 2-3, not 10
3. **Shared Database** - Each service needs its own DB
4. **Synchronous Calls** - Use async/events where possible
5. **No Monitoring** - Set up observability from day 1
6. **Ignoring Network Costs** - Inter-service calls add latency
7. **Underestimating Complexity** - 3-5x more complex to operate
8. **No Rollback Plan** - Always have a way back
9. **Ignoring Data Migration** - Plan data migration carefully
10. **Skipping Tests** - Need contract tests, integration tests

## 📊 Success Metrics

Track these KPIs during and after migration:

### Technical Metrics
- Service uptime: Target 99.9%+
- API response time: <200ms (p95)
- Error rate: <0.1%
- Deployment frequency: Daily
- Mean time to recovery (MTTR): <30min
- Service-to-service latency: <50ms

### Business Metrics
- User-facing incidents: 0 during migration
- Data loss: 0
- User satisfaction: Maintain or improve
- Feature velocity: 2-3x improvement (after stabilization)

## 🔧 Essential Commands

### Docker
```bash
# Build service
docker build -t sportification/iam-service:v1.0 .

# Run locally
docker run -p 3001:3001 sportification/iam-service:v1.0

# Push to registry
docker push sportification/iam-service:v1.0
```

### Kubernetes
```bash
# Apply configuration
kubectl apply -f k8s/iam-service-deployment.yaml

# Check pods
kubectl get pods -l app=iam-service

# View logs
kubectl logs -f deployment/iam-service

# Port forward for testing
kubectl port-forward service/iam-service 3001:3001

# Scale service
kubectl scale deployment iam-service --replicas=5

# Rollback deployment
kubectl rollout undo deployment/iam-service
```

### RabbitMQ
```bash
# Publish message
curl -u admin:password -X POST http://localhost:15672/api/exchanges/%2F/sportification.events/publish \
  -H "Content-Type: application/json" \
  -d '{"routing_key":"iam.userregistered","payload":"{\"userId\":\"123\"}"}'

# List queues
rabbitmqctl list_queues

# Purge queue
rabbitmqctl purge_queue notification-service
```

### Monitoring
```bash
# Port forward Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80

# Port forward Prometheus
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090

# Port forward Jaeger
kubectl port-forward -n tracing svc/jaeger-query 16686:16686
```

## 📖 Service Communication Examples

### Synchronous (REST)
```typescript
// User Service calling IAM Service
const response = await axios.get(`${IAM_SERVICE_URL}/api/auth/validate`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### Asynchronous (Events)
```typescript
// IAM Service publishes event
await publishEvent('UserRegistered', {
  userId: user.id,
  email: user.email,
  timestamp: new Date()
});

// Notification Service consumes event
channel.consume('notification-service', async (msg) => {
  const event = JSON.parse(msg.content.toString());
  if (event.eventType === 'UserRegistered') {
    await sendWelcomeEmail(event.payload);
  }
  channel.ack(msg);
});
```

## 🆘 Troubleshooting

### Service Won't Start
```bash
# Check logs
kubectl logs deployment/iam-service

# Check events
kubectl describe pod <pod-name>

# Check resources
kubectl top pods
```

### High Latency
```bash
# Check service-to-service network
kubectl exec -it <pod-name> -- curl http://other-service:3002/health

# View distributed trace in Jaeger
# Open http://localhost:16686
```

### Data Inconsistency
```bash
# Check event queue
rabbitmqctl list_queues

# Check dead letter queue
# View failed events and retry
```

## 📚 Learning Resources

### Books
- "Building Microservices" by Sam Newman
- "Microservices Patterns" by Chris Richardson
- "Site Reliability Engineering" by Google

### Online
- [Microservices.io](https://microservices.io/) - Patterns and best practices
- [Martin Fowler's Blog](https://martinfowler.com/microservices/) - Architecture insights
- [Kubernetes Patterns](https://k8spatterns.io/) - K8s design patterns

### Courses
- "Microservices with Node.js and React" (Udemy)
- "Kubernetes for Developers" (Pluralsight)
- "Building Microservices" (LinkedIn Learning)

## 🎓 Recommended Learning Path

### Week 1-2: Fundamentals
- [ ] Docker basics
- [ ] Kubernetes basics
- [ ] Message queues (RabbitMQ)
- [ ] API Gateway concepts

### Week 3-4: Intermediate
- [ ] Kubernetes deployments
- [ ] Service mesh basics
- [ ] Monitoring with Prometheus
- [ ] Distributed tracing

### Week 5-6: Advanced
- [ ] Event sourcing
- [ ] Saga pattern
- [ ] CQRS
- [ ] Chaos engineering

## 🤝 Team Structure

### Recommended Roles

**For 6-8 Person Team**:
- 1 Lead Engineer (Architecture decisions)
- 4-5 Backend Engineers (Service development)
- 1-2 DevOps Engineers (Infrastructure, CI/CD)
- 1 QA Engineer (Testing strategy)

**Team Organization Options**:

1. **By Service** (Recommended for 8+ engineers)
   - Team A: IAM + User services
   - Team B: Match + Tournament services
   - Team C: Chat + Notification services

2. **By Phase** (Recommended for 6-8 engineers)
   - All engineers work on one service at a time
   - Move to next service after completion

## 📞 Support

### Getting Help

1. **Documentation**: Start with these docs
2. **Team Discussion**: Slack/Teams channel
3. **Office Hours**: Weekly architecture reviews
4. **External**: Stack Overflow, GitHub Discussions

### Escalation Path

1. Team Lead → Architecture decision
2. DevOps Lead → Infrastructure issues
3. CTO → Strategic decisions

---

## 🎯 Remember

> **"You're not Google. Start simple, scale when needed."**

- ✅ Solve real problems, not imaginary ones
- ✅ Measure before optimizing
- ✅ Incremental changes > Big bang rewrites
- ✅ Monitor everything
- ✅ Automate all the things
- ✅ Document decisions (ADRs)
- ✅ Test, test, test

## 🚦 Status Dashboard

| Service | Status | Version | Uptime | Last Deploy |
|---------|--------|---------|--------|-------------|
| Monolith | 🟢 Active | 1.0.0 | 99.5% | - |
| IAM | ⚪ Planned | - | - | - |
| User | ⚪ Planned | - | - | - |
| Match | ⚪ Planned | - | - | - |

Legend: 🟢 Active | 🟡 In Progress | 🔴 Issues | ⚪ Planned

---

**Quick Links**:
- [Migration Plan](../MICROSERVICES_MIGRATION_PLAN.md)
- [Decision Matrix](./DECISION_MATRIX.md)
- [Implementation Guide](./IMPLEMENTATION_GUIDE.md)
- [Architecture Docs](../support_docs/ARCHITECTURE.md)

**Last Updated**: October 9, 2025
