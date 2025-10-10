# Admin APIs

## Features

- Comprehensive analytics dashboard
- User engagement analytics
- Performance monitoring
- Business intelligence reports
- System health monitoring
- Predictive analytics
- Custom report generation
- Application insights
- User behavior analysis
- Competitive analysis
- System management
- User management

## Endpoints

### Analytics Dashboard

- `GET /api/v1/admin/analytics/dashboard` → Get comprehensive analytics dashboard (admin only)
- `GET /api/v1/admin/analytics/user-engagement` → Get user engagement analytics (admin only)
- `GET /api/v1/admin/analytics/performance` → Get performance metrics (admin only)
- `GET /api/v1/admin/analytics/business-intelligence` → Get business intelligence data (admin only)
- `GET /api/v1/admin/analytics/system-health` → Get system health monitoring (admin only)
- `GET /api/v1/admin/analytics/predictive` → Get predictive analytics (admin only)
- `POST /api/v1/admin/analytics/reports/custom` → Generate custom reports (admin only)

### Application Insights

- `GET /api/v1/admin/insights/application` → Get application insights (admin only)
- `GET /api/v1/admin/insights/user-behavior` → Get user behavior insights (admin only)
- `GET /api/v1/admin/insights/business` → Get business insights (admin only)
- `GET /api/v1/admin/insights/predictive` → Get predictive insights (admin only)
- `GET /api/v1/admin/insights/competitive` → Get competitive insights (admin only)

### System Management

- `GET /api/v1/admin/system/overview` → Get system overview (admin only)
- `GET /api/v1/admin/users/management` → Get user management data (admin only)

## Request/Response Examples

### Get Analytics Dashboard

**Request:**
```http
GET /api/v1/admin/analytics/dashboard?timeframe=week
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (admin token)
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "dashboard": {
      "overview": {
        "totalUsers": 1250,
        "activeUsers": 450,
        "newUsersToday": 23,
        "totalMatches": 3420,
        "activeTournaments": 12,
        "totalRevenue": 45678.90
      },
      "activeUsers": 450,
      "requestsPerMinute": [
        { "timestamp": "2024-01-15T10:00:00.000Z", "count": 45 },
        { "timestamp": "2024-01-15T10:01:00.000Z", "count": 52 },
        { "timestamp": "2024-01-15T10:02:00.000Z", "count": 48 }
      ],
      "avgResponseTime": 125,
      "errorRate": 0.5,
      "systemHealth": [
        {
          "service": "api",
          "status": "healthy",
          "uptime": 99.98,
          "lastCheck": "2024-01-15T10:30:00.000Z"
        },
        {
          "service": "database",
          "status": "healthy",
          "uptime": 99.99,
          "lastCheck": "2024-01-15T10:30:00.000Z"
        },
        {
          "service": "websocket",
          "status": "healthy",
          "uptime": 99.95,
          "lastCheck": "2024-01-15T10:30:00.000Z"
        }
      ],
      "topEndpoints": [
        {
          "endpoint": "GET /api/v1/matches",
          "requests": 5420,
          "avgResponseTime": 85
        },
        {
          "endpoint": "GET /api/v1/tournaments",
          "requests": 3210,
          "avgResponseTime": 92
        },
        {
          "endpoint": "POST /api/v1/chats/:id/messages",
          "requests": 2890,
          "avgResponseTime": 45
        }
      ],
      "userActivities": [
        {
          "activity": "Match Creation",
          "count": 145,
          "trend": "+12%"
        },
        {
          "activity": "Tournament Registration",
          "count": 89,
          "trend": "+8%"
        },
        {
          "activity": "Messages Sent",
          "count": 2340,
          "trend": "+15%"
        }
      ],
      "deviceBreakdown": {
        "mobile": 65,
        "desktop": 30,
        "tablet": 5
      }
    },
    "insights": {
      "peakHours": ["14:00-16:00", "18:00-20:00"],
      "popularSports": [
        { "sport": "tennis", "percentage": 45 },
        { "sport": "football", "percentage": 30 },
        { "sport": "basketball", "percentage": 25 }
      ],
      "userRetention": {
        "day1": 85,
        "day7": 65,
        "day30": 42
      }
    }
  }
}
```

### Get User Engagement Analytics

**Request:**
```http
GET /api/v1/admin/analytics/user-engagement?startDate=2024-01-01T00:00:00.000Z&endDate=2024-01-15T23:59:59.000Z&groupBy=day
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (admin token)
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "engagement": {
      "totalUsers": 1250,
      "activeUsers": 450,
      "engagementRate": 36,
      "avgSessionDuration": 1845,
      "avgSessionsPerUser": 3.2,
      "dailyActiveUsers": [
        { "date": "2024-01-01", "count": 380 },
        { "date": "2024-01-02", "count": 420 },
        { "date": "2024-01-03", "count": 450 }
      ],
      "userActions": {
        "matchesCreated": 145,
        "matchesJoined": 567,
        "tournamentsJoined": 89,
        "messagesSent": 2340,
        "profileUpdates": 78
      },
      "topUsers": [
        {
          "_id": "60d5ecb54b24a50015c4d1a0",
          "username": "johndoe",
          "activityScore": 950,
          "matchesPlayed": 45,
          "tournamentsJoined": 8
        }
      ],
      "churnRisk": {
        "low": 1050,
        "medium": 150,
        "high": 50
      }
    }
  }
}
```

### Get Performance Analytics

**Request:**
```http
GET /api/v1/admin/analytics/performance?startDate=2024-01-01T00:00:00.000Z&endDate=2024-01-15T23:59:59.000Z
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (admin token)
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "performance": {
      "responseTime": {
        "avg": 125,
        "p50": 95,
        "p95": 250,
        "p99": 450
      },
      "throughput": {
        "requestsPerSecond": 45,
        "requestsPerMinute": 2700,
        "requestsPerHour": 162000
      },
      "errors": {
        "total": 234,
        "rate": 0.5,
        "byType": {
          "4xx": 180,
          "5xx": 54
        }
      },
      "database": {
        "queryTime": {
          "avg": 25,
          "p95": 85
        },
        "connectionPool": {
          "active": 8,
          "idle": 12,
          "total": 20
        }
      },
      "cache": {
        "hitRate": 85,
        "missRate": 15,
        "avgLatency": 2
      }
    }
  }
}
```

### Get Business Intelligence

**Request:**
```http
GET /api/v1/admin/analytics/business-intelligence?startDate=2024-01-01T00:00:00.000Z&endDate=2024-01-15T23:59:59.000Z
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (admin token)
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "businessIntelligence": {
      "userGrowth": {
        "total": 1250,
        "newThisPeriod": 145,
        "growthRate": 13.2,
        "projectedNextMonth": 1485
      },
      "engagement": {
        "dau": 450,
        "mau": 980,
        "dauMauRatio": 45.9
      },
      "revenue": {
        "total": 45678.90,
        "bySource": {
          "premium": 32000,
          "venues": 8900,
          "tournaments": 4778.90
        },
        "trend": "+18%"
      },
      "featureAdoption": {
        "matches": 95,
        "tournaments": 72,
        "chat": 88,
        "socialFeatures": 65
      },
      "geography": [
        {
          "country": "USA",
          "users": 650,
          "percentage": 52
        },
        {
          "country": "UK",
          "users": 250,
          "percentage": 20
        },
        {
          "country": "Canada",
          "users": 180,
          "percentage": 14.4
        }
      ]
    }
  }
}
```

### Get System Health

**Request:**
```http
GET /api/v1/admin/analytics/system-health
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (admin token)
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "health": {
      "overall": "healthy",
      "services": [
        {
          "name": "API Server",
          "status": "healthy",
          "uptime": 99.98,
          "cpu": 45,
          "memory": 62,
          "disk": 38
        },
        {
          "name": "Database",
          "status": "healthy",
          "uptime": 99.99,
          "connections": 18,
          "replication": "synced"
        },
        {
          "name": "WebSocket",
          "status": "healthy",
          "uptime": 99.95,
          "activeConnections": 450
        },
        {
          "name": "Redis Cache",
          "status": "healthy",
          "uptime": 99.97,
          "memoryUsage": 48,
          "hitRate": 85
        }
      ],
      "alerts": [
        {
          "level": "warning",
          "message": "CPU usage above 80% for 5 minutes",
          "timestamp": "2024-01-15T09:30:00.000Z",
          "resolved": true
        }
      ]
    }
  }
}
```

### Get Predictive Analytics

**Request:**
```http
GET /api/v1/admin/analytics/predictive
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (admin token)
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "predictions": {
      "userGrowth": {
        "nextWeek": 1310,
        "nextMonth": 1485,
        "confidence": 85
      },
      "churnRisk": {
        "highRiskUsers": 50,
        "predictedChurn": 42,
        "preventionRecommendations": [
          "Increase engagement notifications",
          "Personalized tournament recommendations",
          "Re-engagement campaign"
        ]
      },
      "peakUsageTimes": {
        "nextWeek": ["2024-01-20T14:00", "2024-01-20T18:00"],
        "confidence": 90
      },
      "popularFeatures": {
        "trending": ["tournaments", "group_chat"],
        "declining": ["direct_messages"]
      }
    }
  }
}
```

### Generate Custom Report

**Request:**
```http
POST /api/v1/admin/analytics/reports/custom
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (admin token)
Content-Type: application/json

{
  "reportType": "user_retention",
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-01-15T23:59:59.000Z",
  "filters": {
    "sport": "tennis",
    "location": "New York"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "report": {
      "type": "user_retention",
      "period": {
        "start": "2024-01-01T00:00:00.000Z",
        "end": "2024-01-15T23:59:59.000Z"
      },
      "data": {
        "cohorts": [
          {
            "cohort": "2024-W01",
            "users": 125,
            "retention": {
              "day1": 85,
              "day7": 68,
              "day14": 52,
              "day30": 42
            }
          }
        ],
        "overallRetention": {
          "day1": 85,
          "day7": 65,
          "day30": 42
        }
      },
      "generatedAt": "2024-01-15T10:30:00.000Z",
      "downloadUrl": "https://api.example.com/reports/user_retention_20240115.pdf"
    }
  }
}
```

### Get Application Insights

**Request:**
```http
GET /api/v1/admin/insights/application
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (admin token)
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "insights": {
      "performance": {
        "score": 85,
        "recommendations": [
          "Optimize database queries for match listing",
          "Implement CDN for static assets",
          "Enable response compression"
        ]
      },
      "reliability": {
        "score": 98,
        "uptime": 99.95,
        "errorBudget": 95
      },
      "scalability": {
        "score": 80,
        "currentCapacity": 2000,
        "peakLoad": 1500,
        "utilizationRate": 75
      },
      "security": {
        "score": 92,
        "vulnerabilities": 0,
        "lastAudit": "2024-01-10T00:00:00.000Z"
      }
    }
  }
}
```

### Get User Behavior Insights

**Request:**
```http
GET /api/v1/admin/insights/user-behavior
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (admin token)
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "insights": {
      "userJourney": {
        "mostCommonPath": [
          "register",
          "search_matches",
          "join_match",
          "send_message"
        ],
        "dropoffPoints": [
          { "step": "profile_completion", "dropoff": 15 },
          { "step": "first_match_join", "dropoff": 8 }
        ]
      },
      "featureUsage": {
        "matches": {
          "usage": 95,
          "satisfaction": 4.5
        },
        "tournaments": {
          "usage": 72,
          "satisfaction": 4.7
        },
        "chat": {
          "usage": 88,
          "satisfaction": 4.3
        }
      },
      "userSegments": [
        {
          "segment": "Power Users",
          "count": 125,
          "characteristics": ["Daily login", "Multiple matches/week"]
        },
        {
          "segment": "Casual Users",
          "count": 650,
          "characteristics": ["Weekly login", "Occasional matches"]
        },
        {
          "segment": "At Risk",
          "count": 50,
          "characteristics": ["Declining activity", "No recent matches"]
        }
      ]
    }
  }
}
```

### Get System Overview

**Request:**
```http
GET /api/v1/admin/system/overview
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (admin token)
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "system": {
      "version": "1.0.0",
      "environment": "production",
      "uptime": 2592000,
      "startTime": "2023-12-15T00:00:00.000Z",
      "resources": {
        "cpu": {
          "usage": 45,
          "cores": 8
        },
        "memory": {
          "used": 6442450944,
          "total": 17179869184,
          "percentage": 37.5
        },
        "disk": {
          "used": 107374182400,
          "total": 536870912000,
          "percentage": 20
        }
      },
      "dependencies": {
        "mongodb": "6.0.3",
        "redis": "7.0.5",
        "nodejs": "18.17.0"
      }
    }
  }
}
```

## Query Parameters

### Get Analytics Dashboard (`/admin/analytics/dashboard`)
- `timeframe` - Timeframe for insights (day, week, month)

### Get User Engagement (`/admin/analytics/user-engagement`)
- `startDate` (required) - Start date (ISO 8601)
- `endDate` (required) - End date (ISO 8601)
- `userId` - Specific user ID to analyze
- `groupBy` - Grouping interval (hour, day, week, month)

### Get Performance/Business Intelligence
- `startDate` (required) - Start date (ISO 8601)
- `endDate` (required) - End date (ISO 8601)

### Custom Report Body
- `reportType` (required) - Type: user_retention, feature_adoption, performance_summary, revenue_analysis
- `startDate` (required) - Start date (ISO 8601)
- `endDate` (required) - End date (ISO 8601)
- `filters` - Additional filters (optional)

## Notes on Auth/Security

### Admin Authorization Required
All admin endpoints require:
1. Valid JWT authentication
2. Admin role authorization

```http
Authorization: Bearer <admin_jwt_token>
```

### Access Control
- Only users with `role: 'admin'` can access these endpoints
- Audit logs track all admin actions
- Rate limiting: **60 requests per 15 minutes per admin user**

### Data Privacy
- Admin analytics aggregate and anonymize user data where appropriate
- Personal identifiable information (PII) is protected
- Comply with GDPR and privacy regulations

## Real-time Requirements

### WebSocket Events for Admins

**System Alerts:**
```javascript
socket.on('system-alert', (alert) => {
  console.log('System alert:', alert);
  // alert: { level: 'critical', message: '...', timestamp: '...' }
});
```

**Performance Metrics:**
```javascript
socket.on('performance-update', (metrics) => {
  console.log('Performance metrics:', metrics);
  // Real-time CPU, memory, request rate updates
});
```

## Best Practices

### Frontend Implementation for Admin Dashboard
1. Implement real-time metric updates via WebSocket
2. Use charts and visualizations for analytics data
3. Cache dashboard data with appropriate TTL
4. Implement export functionality for reports
5. Show historical trends and comparisons
6. Provide drill-down capabilities for detailed analysis
7. Implement alerting for critical thresholds
