# AI & Machine Learning Features

## Features

- Match outcome predictions
- Personalized match recommendations
- User churn risk analysis
- Tournament bracket optimization
- Optimal match time predictions
- Sports insights and analytics
- Performance predictions
- Opponent analysis
- Training recommendations
- Machine learning-powered suggestions

## Endpoints

### Match Predictions

- `GET /api/v1/ai/match/:matchId/predict` → Get AI-powered match outcome prediction (requires auth)

### Recommendations

- `GET /api/v1/ai/recommendations/matches` → Get personalized match recommendations (requires auth)
- `GET /api/v1/ai/training-recommendations` → Get AI-powered training recommendations (requires auth)

### Analytics & Insights

- `GET /api/v1/ai/churn-analysis` → Analyze user churn risk (requires auth)
- `GET /api/v1/ai/churn-analysis/:userId` → Analyze specific user churn risk (requires auth, admin)
- `GET /api/v1/ai/sports-insights` → Get personalized sports insights (requires auth)
- `GET /api/v1/ai/performance-predictions` → Get performance predictions (requires auth)

### Match & Tournament Optimization

- `POST /api/v1/ai/tournament/:tournamentId/bracket` → Generate optimal tournament bracket (requires auth)
- `GET /api/v1/ai/optimal-times` → Get optimal match times for user (requires auth)
- `GET /api/v1/ai/optimal-times/:userId` → Get optimal times for specific user (requires auth, admin)

### Opponent Analysis

- `GET /api/v1/ai/opponent-analysis/:opponentId` → Get detailed opponent analysis (requires auth)

## Request/Response Examples

### Get Match Outcome Prediction

**Request:**
```http
GET /api/v1/ai/match/60d5ecb54b24a50015c4d2a0/predict
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "matchId": "60d5ecb54b24a50015c4d2a0",
    "predictions": {
      "player1": {
        "_id": "60d5ecb54b24a50015c4d1a0",
        "username": "johndoe",
        "winProbability": 62,
        "predictedScore": "6-4, 6-3"
      },
      "player2": {
        "_id": "60d5ecb54b24a50015c4d1a1",
        "username": "janedoe",
        "winProbability": 38,
        "predictedScore": "4-6, 3-6"
      },
      "confidence": 75,
      "estimatedDuration": 90
    },
    "factors": {
      "historicalPerformance": {
        "player1WinRate": 72,
        "player2WinRate": 65,
        "weight": 30
      },
      "headToHead": {
        "player1Wins": 3,
        "player2Wins": 2,
        "weight": 25
      },
      "recentForm": {
        "player1": "excellent",
        "player2": "good",
        "weight": 20
      },
      "skillLevel": {
        "player1": "advanced",
        "player2": "intermediate",
        "weight": 15
      },
      "venue": {
        "surfaceType": "hard",
        "favorability": "player1",
        "weight": 10
      }
    },
    "recommendation": "Based on historical data and recent performance, Player 1 has a strong advantage in this matchup.",
    "generatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Get Match Recommendations

**Request:**
```http
GET /api/v1/ai/recommendations/matches?limit=5&includeReasons=true
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "match": {
          "_id": "60d5ecb54b24a50015c4d2a1",
          "sport": "tennis",
          "skillLevel": "intermediate",
          "schedule": {
            "date": "2024-01-20T00:00:00.000Z",
            "time": "14:00"
          },
          "venue": {
            "name": "Central Park Tennis Courts",
            "location": {
              "city": "New York"
            }
          },
          "participants": 2,
          "maxPlayers": 4
        },
        "score": 92,
        "reasons": [
          {
            "factor": "Skill Level Match",
            "description": "This match is perfectly suited for your intermediate skill level",
            "weight": 30
          },
          {
            "factor": "Preferred Sport",
            "description": "Tennis is your most played sport",
            "weight": 25
          },
          {
            "factor": "Location",
            "description": "Only 2.5 km from your usual location",
            "weight": 20
          },
          {
            "factor": "Schedule",
            "description": "Matches your typical play time (afternoons)",
            "weight": 15
          },
          {
            "factor": "Player Compatibility",
            "description": "Players have similar win rates and playing style",
            "weight": 10
          }
        ]
      },
      {
        "match": {
          "_id": "60d5ecb54b24a50015c4d2a2",
          "sport": "tennis",
          "skillLevel": "intermediate",
          "schedule": {
            "date": "2024-01-21T00:00:00.000Z",
            "time": "10:00"
          },
          "venue": {
            "name": "Riverside Tennis Club"
          },
          "participants": 3,
          "maxPlayers": 4
        },
        "score": 85,
        "reasons": [
          {
            "factor": "Social Connection",
            "description": "2 of your friends are already in this match",
            "weight": 35
          },
          {
            "factor": "Skill Level Match",
            "description": "Intermediate level matches your profile",
            "weight": 30
          }
        ]
      }
    ],
    "metadata": {
      "totalRecommendations": 5,
      "basedOn": {
        "playHistory": 25,
        "skillLevel": "intermediate",
        "preferredSports": ["tennis", "basketball"],
        "preferredTimes": ["afternoons", "weekends"]
      }
    }
  }
}
```

### Analyze User Churn Risk

**Request:**
```http
GET /api/v1/ai/churn-analysis
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "churnAnalysis": {
      "userId": "60d5ecb54b24a50015c4d1a0",
      "riskLevel": "low",
      "churnProbability": 15,
      "factors": {
        "activityLevel": {
          "score": 85,
          "trend": "increasing",
          "description": "User has been very active in the past 30 days"
        },
        "engagement": {
          "score": 78,
          "matchesPerWeek": 3.5,
          "lastMatchDate": "2024-01-14T00:00:00.000Z"
        },
        "socialConnections": {
          "score": 72,
          "followers": 120,
          "following": 85,
          "activeFriends": 15
        },
        "appUsage": {
          "score": 80,
          "averageSessionDuration": 1845,
          "dailyLogins": 6
        }
      },
      "predictions": {
        "next7Days": {
          "churnProbability": 12,
          "confidenceLevel": 85
        },
        "next30Days": {
          "churnProbability": 18,
          "confidenceLevel": 78
        }
      },
      "recommendations": [
        "Continue current engagement level",
        "Consider joining upcoming tournaments",
        "Explore new sports to maintain variety"
      ]
    }
  }
}
```

### Generate Optimal Tournament Bracket

**Request:**
```http
POST /api/v1/ai/tournament/60d5ecb54b24a50015c4d5a0/bracket
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "optimizationGoal": "balanced",
  "considerSkillLevel": true,
  "considerHistory": true
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "bracket": {
      "tournamentId": "60d5ecb54b24a50015c4d5a0",
      "format": "single-elimination",
      "optimizationScore": 87,
      "rounds": [
        {
          "round": 1,
          "matches": [
            {
              "matchNumber": 1,
              "player1": {
                "_id": "60d5ecb54b24a50015c4d1a0",
                "username": "johndoe",
                "skillScore": 85
              },
              "player2": {
                "_id": "60d5ecb54b24a50015c4d1a1",
                "username": "janedoe",
                "skillScore": 82
              },
              "balanceScore": 95,
              "competitivenessScore": 92
            }
          ]
        }
      ],
      "insights": {
        "averageMatchBalance": 90,
        "expectedCompetitiveness": 88,
        "estimatedDuration": "3 hours"
      },
      "factors": [
        "Skill level differences minimized",
        "Head-to-head history considered",
        "Geographic diversity in early rounds",
        "Seeding based on recent performance"
      ]
    }
  },
  "message": "Optimal bracket generated successfully"
}
```

### Get Optimal Match Times

**Request:**
```http
GET /api/v1/ai/optimal-times
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "optimalTimes": {
      "userId": "60d5ecb54b24a50015c4d1a0",
      "recommendations": [
        {
          "dayOfWeek": "Saturday",
          "timeSlot": "14:00-16:00",
          "score": 95,
          "reasons": [
            "Highest historical participation",
            "85% match completion rate",
            "Preferred by 12 of your regular partners"
          ]
        },
        {
          "dayOfWeek": "Sunday",
          "timeSlot": "10:00-12:00",
          "score": 88,
          "reasons": [
            "Good venue availability",
            "Optimal weather conditions",
            "Low cancellation rate"
          ]
        },
        {
          "dayOfWeek": "Tuesday",
          "timeSlot": "18:00-20:00",
          "score": 82,
          "reasons": [
            "Weekday convenience",
            "Active player pool",
            "Good historical attendance"
          ]
        }
      ],
      "basedOn": {
        "historicalMatches": 45,
        "partnerPreferences": true,
        "venueAvailability": true,
        "weatherPatterns": true
      }
    }
  }
}
```

### Get Sports Insights

**Request:**
```http
GET /api/v1/ai/sports-insights
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "insights": {
      "performance": {
        "tennis": {
          "winRate": 72,
          "trend": "improving",
          "strengthAreas": ["serve", "backhand"],
          "improvementAreas": ["net play", "volleys"],
          "recommendations": [
            "Focus on net play drills",
            "Practice serve placement"
          ]
        },
        "basketball": {
          "winRate": 65,
          "trend": "stable",
          "strengthAreas": ["shooting", "defense"],
          "improvementAreas": ["passing", "court vision"]
        }
      },
      "playingPatterns": {
        "preferredTimes": ["afternoons", "weekends"],
        "averageMatchesPerWeek": 3.5,
        "favoriteVenues": ["Central Park", "Riverside Club"],
        "regularPartners": 8
      },
      "growthOpportunities": [
        {
          "suggestion": "Try beach volleyball",
          "reason": "Your coordination skills from tennis would transfer well",
          "confidence": 78
        },
        {
          "suggestion": "Join intermediate tournaments",
          "reason": "Your skill level has improved significantly",
          "confidence": 85
        }
      ],
      "socialInsights": {
        "networkSize": 120,
        "activeConnections": 35,
        "recommendedPlayers": [
          {
            "_id": "60d5ecb54b24a50015c4d1a5",
            "username": "alexsmith",
            "compatibilityScore": 92,
            "reason": "Similar skill level and playing style"
          }
        ]
      }
    }
  }
}
```

### Get Performance Predictions

**Request:**
```http
GET /api/v1/ai/performance-predictions
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "predictions": {
      "next7Days": {
        "expectedMatches": 4,
        "predictedWinRate": 74,
        "confidenceLevel": 82
      },
      "next30Days": {
        "expectedMatches": 16,
        "predictedWinRate": 75,
        "skillLevelProgression": "intermediate → advanced",
        "confidenceLevel": 75
      },
      "milestones": [
        {
          "milestone": "50 Total Wins",
          "currentProgress": 45,
          "estimatedDate": "2024-02-15",
          "confidence": 85
        },
        {
          "milestone": "Advanced Skill Level",
          "currentProgress": 78,
          "estimatedDate": "2024-03-01",
          "confidence": 72
        }
      ],
      "recommendations": [
        "Maintain current practice schedule",
        "Focus on net play to reach advanced level",
        "Consider joining competitive tournaments"
      ]
    }
  }
}
```

### Get Opponent Analysis

**Request:**
```http
GET /api/v1/ai/opponent-analysis/60d5ecb54b24a50015c4d1a1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "analysis": {
      "opponent": {
        "_id": "60d5ecb54b24a50015c4d1a1",
        "username": "janedoe",
        "skillLevel": "intermediate"
      },
      "statistics": {
        "totalMatches": 67,
        "winRate": 65,
        "averageMatchDuration": 75,
        "preferredSports": ["tennis", "badminton"]
      },
      "strengths": [
        {
          "area": "Serve accuracy",
          "score": 85,
          "description": "Consistently strong first serve"
        },
        {
          "area": "Court positioning",
          "score": 78,
          "description": "Excellent spatial awareness"
        }
      ],
      "weaknesses": [
        {
          "area": "Backhand returns",
          "score": 62,
          "description": "Struggles with high backhands"
        },
        {
          "area": "Stamina",
          "score": 68,
          "description": "Performance drops in long matches"
        }
      ],
      "headToHead": {
        "totalMatches": 5,
        "yourWins": 3,
        "opponentWins": 2,
        "averageScoreDifferential": "+2 points per set"
      },
      "playingStyle": {
        "type": "aggressive baseline",
        "description": "Prefers long rallies, strong from baseline",
        "pace": "moderate to fast"
      },
      "recommendations": [
        "Target backhand with high balls",
        "Mix up pace to disrupt rhythm",
        "Extend rallies to exploit stamina weakness",
        "Come to net more often"
      ],
      "winProbability": 58,
      "confidenceLevel": 82
    }
  }
}
```

### Get Training Recommendations

**Request:**
```http
GET /api/v1/ai/training-recommendations
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "recommendations": {
      "priorityAreas": [
        {
          "skill": "Net Play",
          "currentLevel": 65,
          "targetLevel": 78,
          "priority": "high",
          "estimatedTime": "4 weeks",
          "exercises": [
            {
              "name": "Volley Drills",
              "duration": "20 minutes",
              "frequency": "3x per week",
              "difficulty": "intermediate"
            },
            {
              "name": "Approach Shot Practice",
              "duration": "15 minutes",
              "frequency": "2x per week",
              "difficulty": "intermediate"
            }
          ]
        },
        {
          "skill": "Serve Consistency",
          "currentLevel": 72,
          "targetLevel": 85,
          "priority": "medium",
          "estimatedTime": "3 weeks",
          "exercises": [
            {
              "name": "Target Serving",
              "duration": "25 minutes",
              "frequency": "4x per week",
              "difficulty": "intermediate"
            }
          ]
        }
      ],
      "weeklyPlan": {
        "totalHours": 6,
        "breakdown": {
          "skillDrills": 4,
          "matchPlay": 2,
          "conditioning": 0
        }
      },
      "progressTracking": {
        "suggestedMetrics": [
          "First serve percentage",
          "Net approach success rate",
          "Volley accuracy"
        ],
        "reviewFrequency": "weekly"
      }
    }
  }
}
```

## Query Parameters

### Get Match Recommendations (`/ai/recommendations/matches`)
- `limit` (default: 10, max: 50) - Number of recommendations
- `includeReasons` (default: false) - Include detailed reasons for recommendations

### Generate Bracket (`/ai/tournament/:tournamentId/bracket`)
Body parameters:
- `optimizationGoal` - Optimization strategy (balanced, competitive, fair)
- `considerSkillLevel` (default: true) - Factor in skill levels
- `considerHistory` (default: true) - Consider head-to-head history

## Notes on Auth/Security

### JWT Authentication Required
All AI endpoints require authentication:
```http
Authorization: Bearer <jwt_token>
```

### Rate Limiting
- AI endpoints are computationally expensive
- Rate limit: **30 requests per 15 minutes per user**
- Prediction endpoints: **10 requests per hour per user**

### Data Privacy
- AI models use aggregated, anonymized data for training
- Personal predictions are user-specific and private
- No sharing of individual prediction data

## Model Information

### ML Models Used
- **Match Prediction**: Gradient Boosting (XGBoost)
- **Churn Analysis**: Random Forest Classifier
- **Recommendations**: Collaborative Filtering + Content-Based
- **Time Optimization**: Time Series Analysis (ARIMA)
- **Performance Prediction**: LSTM Neural Network

### Model Performance
- Match Prediction Accuracy: 72-78%
- Churn Prediction Accuracy: 85%
- Recommendation Relevance: 82%
- Time Prediction Accuracy: 68%

## Real-time Requirements

### No WebSocket Events
AI predictions are on-demand and don't require real-time updates.

### Caching
- Predictions are cached for 1 hour
- Recommendations updated daily
- Churn analysis updated weekly

## Best Practices

### Frontend Implementation
1. Show confidence levels with predictions
2. Explain AI reasoning to users
3. Allow users to provide feedback on recommendations
4. Cache predictions to reduce API calls
5. Show loading states (predictions can take 2-5 seconds)
6. Provide fallback for when AI service is unavailable
