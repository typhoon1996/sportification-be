# Microservices Implementation Guide

This guide provides practical, step-by-step instructions for implementing the microservices architecture.

## Quick Start: Phase 0 - Infrastructure Setup

### 1. Set Up Development Environment

#### Install Required Tools

```bash
# Docker and Docker Compose (already have)
# Install Kubernetes CLI
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install Helm (Kubernetes package manager)
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Install k9s (Kubernetes CLI UI - optional but recommended)
curl -sS https://webinstall.sh/k9s | bash
```

#### Set Up Local Kubernetes

```bash
# Using Docker Desktop Kubernetes
# Enable Kubernetes in Docker Desktop settings

# OR use Minikube
minikube start --cpus=4 --memory=8192 --disk-size=50g
```

### 2. Create Shared Libraries Package

Create a new NPM workspace for shared code:

```bash
# Create shared libraries directory
mkdir -p packages/common
cd packages/common
npm init -y
```

### 3. Set Up Message Bus (RabbitMQ)

```bash
# Create RabbitMQ deployment
kubectl create namespace messaging

helm repo add bitnami https://charts.bitnami.com/bitnami
helm install rabbitmq bitnami/rabbitmq \
  --namespace messaging \
  --set auth.username=admin \
  --set auth.password=secretpassword \
  --set persistence.size=10Gi
```

### 4. Set Up Monitoring Stack

```bash
# Create monitoring namespace
kubectl create namespace monitoring

# Install Prometheus and Grafana
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring
```

### 5. Set Up API Gateway (Kong)

```bash
# Create gateway namespace
kubectl create namespace gateway

# Install Kong
helm repo add kong https://charts.konghq.com
helm install kong kong/kong \
  --namespace gateway \
  --set ingressController.enabled=true \
  --set admin.enabled=true
```

## Phase 1: Extract IAM Service

### Step 1: Create Service Structure

```bash
# Create IAM service directory
mkdir -p microservices/iam-service
cd microservices/iam-service

# Initialize package.json
npm init -y

# Install dependencies
npm install express typescript @types/express @types/node
npm install jsonwebtoken bcryptjs speakeasy qrcode
npm install mongoose redis dotenv cors helmet
npm install @sportification/common  # Once created

# Install dev dependencies
npm install -D nodemon ts-node @types/jsonwebtoken @types/bcryptjs
```

### Step 2: Create Service Files

```
microservices/iam-service/
├── src/
│   ├── index.ts              # Entry point
│   ├── app.ts                # Express app
│   ├── config/
│   │   └── index.ts          # Configuration
│   ├── controllers/
│   │   ├── AuthController.ts
│   │   └── MFAController.ts
│   ├── models/
│   │   ├── User.ts
│   │   └── RefreshToken.ts
│   ├── routes/
│   │   └── auth.ts
│   ├── middleware/
│   │   └── validation.ts
│   ├── services/
│   │   ├── TokenService.ts
│   │   ├── MFAService.ts
│   │   └── EventPublisher.ts
│   └── types/
│       └── index.ts
├── Dockerfile
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

### Step 3: Implement IAM Service

**src/index.ts**:
```typescript
import app from './app';
import { connectDatabase } from './config/database';
import { connectMessageBus } from './services/EventPublisher';
import logger from './utils/logger';

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('✓ Database connected');

    // Connect to message bus
    await connectMessageBus();
    logger.info('✓ Message bus connected');

    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 IAM Service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start service:', error);
    process.exit(1);
  }
}

start();
```

**src/app.ts**:
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'iam-service',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);

// Error handling
app.use(errorHandler);

export default app;
```

**src/services/EventPublisher.ts**:
```typescript
import amqp, { Connection, Channel } from 'amqplib';
import logger from '../utils/logger';

let connection: Connection;
let channel: Channel;

export async function connectMessageBus() {
  const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost';
  
  connection = await amqp.connect(rabbitmqUrl);
  channel = await connection.createChannel();
  
  // Declare exchange
  await channel.assertExchange('sportification.events', 'topic', {
    durable: true
  });
  
  logger.info('Connected to RabbitMQ');
}

export async function publishEvent(eventType: string, payload: any) {
  const event = {
    eventId: generateUUID(),
    eventType,
    timestamp: new Date().toISOString(),
    payload
  };
  
  const routingKey = `iam.${eventType.toLowerCase()}`;
  
  channel.publish(
    'sportification.events',
    routingKey,
    Buffer.from(JSON.stringify(event)),
    { persistent: true }
  );
  
  logger.info(`Published event: ${eventType}`, { routingKey });
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
```

**src/controllers/AuthController.ts**:
```typescript
import { Request, Response } from 'express';
import { User } from '../models/User';
import { TokenService } from '../services/TokenService';
import { publishEvent } from '../services/EventPublisher';
import bcrypt from 'bcryptjs';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User already exists'
        });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Create user
      const user = await User.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        isActive: true
      });
      
      // Generate tokens
      const tokens = await TokenService.generateTokenPair(user.id, email);
      
      // Publish event
      await publishEvent('UserRegistered', {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      });
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
          },
          tokens
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed'
      });
    }
  }
  
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      
      // Find user
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
      
      // Verify password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
      
      // Generate tokens
      const tokens = await TokenService.generateTokenPair(user.id, email);
      
      // Publish event
      await publishEvent('UserLoggedIn', {
        userId: user.id,
        email: user.email,
        timestamp: new Date()
      });
      
      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email
          },
          tokens
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed'
      });
    }
  }
}
```

**Dockerfile**:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start service
CMD ["node", "dist/index.js"]
```

**docker-compose.yml** (for local development):
```yaml
version: '3.8'

services:
  iam-service:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - PORT=3001
      - MONGODB_URI=mongodb://mongo:27017/iam_db
      - RABBITMQ_URL=amqp://rabbitmq:5672
      - JWT_SECRET=your-secret-key
    depends_on:
      - mongo
      - rabbitmq
    volumes:
      - ./src:/app/src
    command: npm run dev

  mongo:
    image: mongo:7.0
    ports:
      - "27018:27017"
    volumes:
      - iam_mongo_data:/data/db

  rabbitmq:
    image: rabbitmq:3-management-alpine
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      - RABBITMQ_DEFAULT_USER=admin
      - RABBITMQ_DEFAULT_PASS=secretpassword

volumes:
  iam_mongo_data:
```

### Step 4: Create Kubernetes Deployment

**k8s/iam-service-deployment.yaml**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: iam-service
  namespace: default
spec:
  replicas: 3
  selector:
    matchLabels:
      app: iam-service
  template:
    metadata:
      labels:
        app: iam-service
        version: v1
    spec:
      containers:
      - name: iam-service
        image: sportification/iam-service:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3001"
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: iam-secrets
              key: mongodb-uri
        - name: RABBITMQ_URL
          valueFrom:
            secretKeyRef:
              name: iam-secrets
              key: rabbitmq-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: iam-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: iam-service
  namespace: default
spec:
  selector:
    app: iam-service
  ports:
  - port: 3001
    targetPort: 3001
  type: ClusterIP
```

**k8s/iam-service-secrets.yaml**:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: iam-secrets
  namespace: default
type: Opaque
stringData:
  mongodb-uri: "mongodb://username:password@mongo-service:27017/iam_db"
  rabbitmq-url: "amqp://admin:password@rabbitmq-service:5672"
  jwt-secret: "your-super-secret-jwt-key"
```

### Step 5: Deploy to Kubernetes

```bash
# Create secrets
kubectl apply -f k8s/iam-service-secrets.yaml

# Deploy service
kubectl apply -f k8s/iam-service-deployment.yaml

# Check deployment
kubectl get pods -l app=iam-service
kubectl logs -f deployment/iam-service

# Test service
kubectl port-forward service/iam-service 3001:3001

# Test endpoint
curl http://localhost:3001/health
```

### Step 6: Configure API Gateway

**kong-iam-config.yaml**:
```yaml
apiVersion: configuration.konghq.com/v1
kind: KongPlugin
metadata:
  name: iam-rate-limiting
plugin: rate-limiting
config:
  minute: 20
  policy: local
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: iam-service-ingress
  annotations:
    konghq.com/plugins: iam-rate-limiting
    konghq.com/strip-path: "true"
spec:
  ingressClassName: kong
  rules:
  - http:
      paths:
      - path: /api/v1/auth
        pathType: Prefix
        backend:
          service:
            name: iam-service
            port:
              number: 3001
```

### Step 7: Update Monolith to Route to New Service

In your existing monolith, create a proxy middleware:

**src/middleware/serviceProxy.ts**:
```typescript
import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

const IAM_SERVICE_URL = process.env.IAM_SERVICE_URL || 'http://localhost:3001';

export const proxyToIAM = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check feature flag
    if (!process.env.USE_IAM_SERVICE) {
      return next(); // Continue to monolith handler
    }
    
    // Forward request to IAM service
    const response = await axios({
      method: req.method,
      url: `${IAM_SERVICE_URL}${req.path}`,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers
      }
    });
    
    res.status(response.status).json(response.data);
  } catch (error: any) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      // Fallback to monolith on service error
      console.error('IAM service error, falling back to monolith:', error.message);
      next();
    }
  }
};
```

Update auth routes:
```typescript
// src/routes/auth.ts
import { proxyToIAM } from '../middleware/serviceProxy';

router.post('/register', proxyToIAM, registerValidation, validateRequest, AuthController.register);
router.post('/login', proxyToIAM, loginValidation, validateRequest, AuthController.login);
```

## Phase 2: Extract Notification Service

### Step 1: Create Notification Service

```bash
mkdir -p microservices/notification-service
cd microservices/notification-service
npm init -y
npm install express typescript amqplib nodemailer
```

**src/index.ts**:
```typescript
import { startEventConsumer } from './services/EventConsumer';
import { connectDatabase } from './config/database';
import app from './app';

const PORT = process.env.PORT || 3002;

async function start() {
  await connectDatabase();
  await startEventConsumer();
  
  app.listen(PORT, () => {
    console.log(`Notification Service running on port ${PORT}`);
  });
}

start();
```

**src/services/EventConsumer.ts**:
```typescript
import amqp from 'amqplib';
import { handleUserRegistered } from './handlers/UserRegisteredHandler';
import { handleMatchCreated } from './handlers/MatchCreatedHandler';

export async function startEventConsumer() {
  const connection = await amqp.connect(process.env.RABBITMQ_URL!);
  const channel = await connection.createChannel();
  
  await channel.assertExchange('sportification.events', 'topic', { durable: true });
  
  const queue = await channel.assertQueue('notification-service', { durable: true });
  
  // Subscribe to events
  await channel.bindQueue(queue.queue, 'sportification.events', 'iam.userregistered');
  await channel.bindQueue(queue.queue, 'sportification.events', 'match.matchcreated');
  
  channel.consume(queue.queue, async (msg) => {
    if (msg) {
      const event = JSON.parse(msg.content.toString());
      
      try {
        switch (event.eventType) {
          case 'UserRegistered':
            await handleUserRegistered(event.payload);
            break;
          case 'MatchCreated':
            await handleMatchCreated(event.payload);
            break;
        }
        
        channel.ack(msg);
      } catch (error) {
        console.error('Event handling error:', error);
        channel.nack(msg, false, true); // Requeue on error
      }
    }
  });
  
  console.log('Notification service listening for events');
}
```

## Testing Strategy

### 1. Contract Testing

Use Pact for consumer-driven contract testing:

```typescript
// IAM service test
import { Pact } from '@pact-foundation/pact';

describe('User Service -> IAM Service Contract', () => {
  const provider = new Pact({
    consumer: 'user-service',
    provider: 'iam-service'
  });
  
  it('should validate user token', async () => {
    await provider.addInteraction({
      state: 'user exists',
      uponReceiving: 'a request to validate token',
      withRequest: {
        method: 'POST',
        path: '/api/auth/validate',
        headers: { 'Content-Type': 'application/json' },
        body: { token: 'valid-token' }
      },
      willRespondWith: {
        status: 200,
        body: { valid: true, userId: '123' }
      }
    });
    
    // Test your service
  });
});
```

### 2. Integration Testing

```typescript
// Test service communication
describe('Microservices Integration', () => {
  it('should create user and send notification', async () => {
    // Register user via IAM service
    const response = await request(IAM_SERVICE_URL)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'password' });
    
    expect(response.status).toBe(201);
    
    // Wait for event processing
    await sleep(2000);
    
    // Check notification was created
    const notifications = await request(NOTIFICATION_SERVICE_URL)
      .get(`/api/notifications?userId=${response.body.data.user.id}`);
    
    expect(notifications.body.data).toHaveLength(1);
  });
});
```

## Monitoring and Observability

### 1. Add Prometheus Metrics

```typescript
// src/middleware/metrics.ts
import promClient from 'prom-client';

const register = new promClient.Registry();

export const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

export const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

// Middleware
export function metricsMiddleware(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    
    httpRequestDuration.observe(
      { method: req.method, route: req.route?.path || req.path, status_code: res.statusCode },
      duration
    );
    
    httpRequestTotal.inc({
      method: req.method,
      route: req.route?.path || req.path,
      status_code: res.statusCode
    });
  });
  
  next();
}

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### 2. Add Distributed Tracing

```typescript
// src/middleware/tracing.ts
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

export function tracingMiddleware(req, res, next) {
  const tracer = trace.getTracer('iam-service');
  
  const span = tracer.startSpan(`${req.method} ${req.path}`);
  
  span.setAttributes({
    'http.method': req.method,
    'http.url': req.url,
    'http.target': req.path
  });
  
  res.on('finish', () => {
    span.setAttribute('http.status_code', res.statusCode);
    
    if (res.statusCode >= 400) {
      span.setStatus({ code: SpanStatusCode.ERROR });
    }
    
    span.end();
  });
  
  context.with(trace.setSpan(context.active(), span), next);
}
```

## Next Steps

1. **Complete Phase 0** - Set up all infrastructure
2. **Implement IAM Service** - Follow steps above
3. **Test thoroughly** - Ensure IAM service works standalone
4. **Enable proxy routing** - Route traffic through API gateway
5. **Monitor metrics** - Watch for errors and performance issues
6. **Gradually increase traffic** - Start with 10%, then 50%, then 100%
7. **Move to Phase 2** - Extract Notification Service

## Resources

- [Microservices Patterns](https://microservices.io/patterns/)
- [Kong API Gateway Docs](https://docs.konghq.com/)
- [RabbitMQ Tutorials](https://www.rabbitmq.com/getstarted.html)
- [Kubernetes Patterns](https://k8spatterns.io/)
- [OpenTelemetry](https://opentelemetry.io/)

---

This guide provides a practical foundation for your microservices migration. Adjust based on your specific requirements and infrastructure.
