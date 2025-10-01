// MongoDB initialization script for Docker setup
// This script runs when the MongoDB container starts for the first time

// Switch to the application database
db = db.getSiblingDB('sportificatoin_dev');

// Create application user with read/write permissions
db.createUser({
  user: 'sportificatoin_user',
  pwd: 'sportificatoin_pass',
  roles: [
    {
      role: 'readWrite',
      db: 'sportificatoin_dev'
    }
  ]
});

// Create collections with validation rules
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'password'],
      properties: {
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
        },
        password: {
          bsonType: 'string',
          minLength: 8
        },
        isActive: {
          bsonType: 'bool'
        },
        isEmailVerified: {
          bsonType: 'bool'
        }
      }
    }
  }
});

db.createCollection('profiles', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['user', 'firstName', 'lastName', 'username'],
      properties: {
        user: {
          bsonType: 'objectId'
        },
        firstName: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 50
        },
        lastName: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 50
        },
        username: {
          bsonType: 'string',
          minLength: 3,
          maxLength: 30
        }
      }
    }
  }
});

db.createCollection('matches', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['type', 'sport', 'schedule', 'createdBy'],
      properties: {
        type: {
          bsonType: 'string',
          enum: ['public', 'private']
        },
        sport: {
          bsonType: 'string',
          minLength: 1
        },
        status: {
          bsonType: 'string',
          enum: ['upcoming', 'ongoing', 'completed', 'expired']
        },
        'schedule.date': {
          bsonType: 'date'
        }
      }
    }
  }
});

db.createCollection('tournaments', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'startDate', 'createdBy'],
      properties: {
        name: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 100
        },
        status: {
          bsonType: 'string',
          enum: ['upcoming', 'ongoing', 'completed', 'cancelled']
        },
        startDate: {
          bsonType: 'date'
        },
        maxParticipants: {
          bsonType: 'int',
          minimum: 4,
          maximum: 256
        }
      }
    }
  }
});

db.createCollection('venues', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'location', 'createdBy'],
      properties: {
        name: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 100
        },
        'location.coordinates': {
          bsonType: 'array',
          minItems: 2,
          maxItems: 2,
          items: {
            bsonType: 'double'
          }
        },
        surfaceType: {
          bsonType: 'string',
          enum: ['grass', 'clay', 'hard', 'indoor', 'outdoor', 'sand', 'pool', 'court']
        }
      }
    }
  }
});

// Create basic indexes for better performance
print('Creating indexes...');

// User indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ isActive: 1, lastLoginAt: -1 });

// Profile indexes
db.profiles.createIndex({ user: 1 }, { unique: true });
db.profiles.createIndex({ username: 1 }, { unique: true });

// Match indexes
db.matches.createIndex({ 'schedule.date': 1, status: 1 });
db.matches.createIndex({ participants: 1 });
db.matches.createIndex({ createdBy: 1 });

// Tournament indexes
db.tournaments.createIndex({ startDate: 1, status: 1 });
db.tournaments.createIndex({ participants: 1 });
db.tournaments.createIndex({ createdBy: 1 });

// Venue indexes (geospatial)
db.venues.createIndex({ 'location.coordinates': '2dsphere' });
db.venues.createIndex({ isPublic: 1, 'location.city': 1 });

// Notification indexes
db.notifications.createIndex({ user: 1, read: 1, timestamp: -1 });
db.notifications.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Chat and message indexes
db.chats.createIndex({ participants: 1 });
db.messages.createIndex({ chat: 1, timestamp: -1 });

print('Database initialization completed!');
print('Created database: sportificatoin_dev');
print('Created user: sportificatoin_user');
print('Created collections with validation rules');
print('Created performance indexes');