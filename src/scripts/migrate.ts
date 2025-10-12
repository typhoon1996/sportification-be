import mongoose from 'mongoose';
import { User } from '../modules/users/domain/models/User';
import { Profile } from '../modules/users/domain/models/Profile';
import { Match } from '../modules/matches/domain/models/Match';
import { Tournament } from '../modules/tournaments/domain/models/Tournament';
import { Notification } from '../modules/notifications/domain/models/Notification';
import { Venue } from '../modules/venues/domain/models/Venue';
import { Chat } from '../modules/chat/domain/models/Chat';
import { Message } from '../modules/chat/domain/models/Message';
import config from '../shared/config';
import logger from '../shared/infrastructure/logging';

/**
 * Database Migration Script
 *
 * This script creates indexes, applies schema changes, and ensures database consistency
 * Run with: npm run migrate
 */

interface Migration {
  id: string;
  description: string;
  up: () => Promise<void>;
}

const migrations: Migration[] = [
  {
    id: '001_initial_indexes',
    description: 'Create initial database indexes for performance',
    up: async () => {
      // User indexes
      await User.collection.createIndex({ email: 1 }, { unique: true });
      await User.collection.createIndex({ isActive: 1, lastLoginAt: -1 });

      // Profile indexes
      await Profile.collection.createIndex({ user: 1 }, { unique: true });
      await Profile.collection.createIndex({ username: 1 }, { unique: true });
      await Profile.collection.createIndex(
        { firstName: 'text', lastName: 'text', username: 'text' },
        { name: 'profile_search_index' }
      );

      // Match indexes
      await Match.collection.createIndex({ 'schedule.date': 1, status: 1 });
      await Match.collection.createIndex({ type: 1, status: 1 });
      await Match.collection.createIndex({ participants: 1 });
      await Match.collection.createIndex({ createdBy: 1, status: 1 });
      await Match.collection.createIndex({ sport: 1, 'schedule.date': 1 });

      // Tournament indexes
      await Tournament.collection.createIndex({ startDate: 1, status: 1 });
      await Tournament.collection.createIndex({ participants: 1 });
      await Tournament.collection.createIndex({ createdBy: 1, status: 1 });
      await Tournament.collection.createIndex({
        name: 'text',
        description: 'text',
      });

      // Notification indexes
      await Notification.collection.createIndex({
        user: 1,
        read: 1,
        timestamp: -1,
      });
      await Notification.collection.createIndex({
        user: 1,
        type: 1,
        timestamp: -1,
      });
      await Notification.collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

      logger.info('✅ Created initial database indexes');
    },
  },

  {
    id: '002_venue_system',
    description: 'Set up venue management system indexes',
    up: async () => {
      // Venue indexes for geospatial queries
      await Venue.collection.createIndex({
        'location.coordinates': '2dsphere',
      });
      await Venue.collection.createIndex({ isPublic: 1, 'location.city': 1 });
      await Venue.collection.createIndex({ name: 'text', description: 'text' });
      await Venue.collection.createIndex({ createdBy: 1, isPublic: 1 });

      logger.info('✅ Created venue system indexes');
    },
  },

  {
    id: '003_chat_system',
    description: 'Set up chat and messaging system indexes',
    up: async () => {
      // Chat indexes
      await Chat.collection.createIndex({ participants: 1 });
      await Chat.collection.createIndex({ type: 1, createdAt: -1 });
      await Chat.collection.createIndex({ relatedEntity: 1 });

      // Message indexes
      await Message.collection.createIndex({ chat: 1, timestamp: -1 });
      await Message.collection.createIndex({ sender: 1, timestamp: -1 });
      await Message.collection.createIndex({ chat: 1, type: 1, timestamp: -1 });

      logger.info('✅ Created chat and messaging system indexes');
    },
  },

  {
    id: '004_performance_indexes',
    description: 'Add performance-optimized compound indexes',
    up: async () => {
      // Compound indexes for common queries
      await Match.collection.createIndex(
        {
          status: 1,
          type: 1,
          'schedule.date': 1,
        },
        { name: 'match_status_type_date' }
      );

      await Tournament.collection.createIndex(
        {
          status: 1,
          startDate: 1,
          maxParticipants: 1,
        },
        { name: 'tournament_status_date_capacity' }
      );

      await User.collection.createIndex(
        {
          isActive: 1,
          isEmailVerified: 1,
          createdAt: -1,
        },
        { name: 'user_active_verified_created' }
      );

      logger.info('✅ Created performance-optimized compound indexes');
    },
  },
];

class MigrationRunner {
  private async getMigrationStatus(): Promise<Set<string>> {
    const db = mongoose.connection.db;
    if (!db) throw new Error('Database connection not available');

    const migrationsCollection = db.collection('migrations');

    const completedMigrations = await migrationsCollection
      .find({}, { projection: { _id: 1 } })
      .toArray();

    return new Set(completedMigrations.map((m) => m._id.toString()));
  }

  private async markMigrationComplete(migrationId: string): Promise<void> {
    const db = mongoose.connection.db;
    if (!db) throw new Error('Database connection not available');

    const migrationsCollection = db.collection('migrations');

    await migrationsCollection.replaceOne(
      { _id: migrationId as any },
      {
        _id: migrationId as any,
        completedAt: new Date(),
        version: '1.0.0',
      },
      { upsert: true }
    );
  }

  async runMigrations(): Promise<void> {
    const completedMigrations = await this.getMigrationStatus();

    for (const migration of migrations) {
      if (!completedMigrations.has(migration.id)) {
        logger.info(`🔄 Running migration: ${migration.id} - ${migration.description}`);

        try {
          await migration.up();
          await this.markMigrationComplete(migration.id);
          logger.info(`✅ Completed migration: ${migration.id}`);
        } catch (error) {
          logger.error(`❌ Failed migration: ${migration.id}`, error);
          throw error;
        }
      } else {
        logger.info(`⏭️  Skipping completed migration: ${migration.id}`);
      }
    }
  }

  async getStatus(): Promise<void> {
    const completedMigrations = await this.getMigrationStatus();

    logger.info('📊 Migration Status:');
    for (const migration of migrations) {
      const status = completedMigrations.has(migration.id) ? '✅ Completed' : '⏳ Pending';
      logger.info(`  ${migration.id}: ${status} - ${migration.description}`);
    }
  }
}

async function runMigrations() {
  try {
    logger.info('🚀 Starting database migrations...');

    // Connect to database
    await mongoose.connect(config.database.uri);
    logger.info('📡 Connected to database');

    const runner = new MigrationRunner();

    // Check if --status flag is provided
    if (process.argv.includes('--status')) {
      await runner.getStatus();
    } else {
      await runner.runMigrations();
      logger.info('🎉 All migrations completed successfully');
    }
  } catch (error) {
    logger.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    logger.info('👋 Database connection closed');
  }
}

// Run migrations if this script is executed directly
if (require.main === module) {
  runMigrations();
}

export { runMigrations, MigrationRunner };
