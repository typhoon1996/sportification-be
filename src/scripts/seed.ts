import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../modules/users/domain/models/User';
import { Profile } from '../modules/users/domain/models/Profile';
import { Match } from '../modules/matches/domain/models/Match';
import { Tournament } from '../modules/tournaments/domain/models/Tournament';
import { Venue } from '../modules/venues/domain/models/Venue';
import { Notification } from '../modules/notifications/domain/models/Notification';
import config from '../shared/config';
import logger from '../shared/utils/logger';
import { MatchType, MatchStatus, TournamentStatus, NotificationType } from '../shared/types';

/**
 * Database Seeding Script
 *
 * This script populates the database with sample data for development and testing
 * Run with: npm run seed
 */

interface SeedOptions {
  users?: boolean;
  venues?: boolean;
  matches?: boolean;
  tournaments?: boolean;
  notifications?: boolean;
  clean?: boolean;
}

class DatabaseSeeder {
  private users: any[] = [];
  private venues: any[] = [];

  async cleanDatabase(): Promise<void> {
    logger.info('🧹 Cleaning existing data...');

    const collections = [
      'users',
      'profiles',
      'matches',
      'tournaments',
      'venues',
      'notifications',
      'chats',
      'messages',
    ];

    for (const collectionName of collections) {
      try {
        const db = mongoose.connection.db;
        if (!db) {
          logger.warn(`Could not access database for cleaning ${collectionName}`);
          continue;
        }
        const collection = db.collection(collectionName);
        const result = await collection.deleteMany({});
        logger.info(`  Deleted ${result.deletedCount} documents from ${collectionName}`);
      } catch (error) {
        logger.warn(`  Could not clean ${collectionName}:`, error);
      }
    }

    logger.info('✅ Database cleaned');
  }

  async seedUsers(): Promise<void> {
    logger.info('👥 Seeding users...');

    const userData = [
      {
        email: 'john.doe@example.com',
        password: 'Password123',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          username: 'johndoe',
          bio: 'Tennis enthusiast and tournament organizer',
          location: 'New York, NY',
        },
      },
      {
        email: 'jane.smith@example.com',
        password: 'Password123',
        profile: {
          firstName: 'Jane',
          lastName: 'Smith',
          username: 'janesmith',
          bio: 'Professional badminton player',
          location: 'Los Angeles, CA',
        },
      },
      {
        email: 'mike.johnson@example.com',
        password: 'Password123',
        profile: {
          firstName: 'Mike',
          lastName: 'Johnson',
          username: 'mikej',
          bio: 'Basketball coach and sports analyst',
          location: 'Chicago, IL',
        },
      },
      {
        email: 'sarah.wilson@example.com',
        password: 'Password123',
        profile: {
          firstName: 'Sarah',
          lastName: 'Wilson',
          username: 'sarahw',
          bio: 'Football goalkeeper and fitness trainer',
          location: 'Miami, FL',
        },
      },
      {
        email: 'alex.brown@example.com',
        password: 'Password123',
        profile: {
          firstName: 'Alex',
          lastName: 'Brown',
          username: 'alexb',
          bio: 'Olympic swimmer and water sports instructor',
          location: 'San Diego, CA',
        },
      },
    ];

    for (const data of userData) {
      // Create user
      const hashedPassword = await bcrypt.hash(data.password, config.security.bcryptRounds);
      const user = new User({
        email: data.email,
        password: hashedPassword,
        isEmailVerified: true,
        isActive: true,
        lastLoginAt: new Date(),
        preferences: {
          theme: Math.random() > 0.5 ? 'light' : 'dark',
          notifications: true,
          language: 'en',
        },
        stats: {
          matchesPlayed: Math.floor(Math.random() * 50),
          matchesWon: Math.floor(Math.random() * 25),
          tournamentsPlayed: Math.floor(Math.random() * 10),
          tournamentsWon: Math.floor(Math.random() * 3),
        },
      });

      await user.save();

      // Create profile
      const profile = new Profile({
        user: user._id,
        ...data.profile,
        achievements: ['early_adopter', 'first_match'].slice(0, Math.floor(Math.random() * 2) + 1),
        dateOfBirth: new Date(
          1990 + Math.floor(Math.random() * 20),
          Math.floor(Math.random() * 12),
          Math.floor(Math.random() * 28) + 1
        ),
      });

      await profile.save();

      // Update user with profile reference
      user.profile = profile._id as any;
      await user.save();

      this.users.push(user);
    }

    // Create friend relationships
    if (this.users.length >= 3) {
      this.users[0].friends.push(this.users[1]._id, this.users[2]._id);
      this.users[1].friends.push(this.users[0]._id, this.users[3]._id);
      this.users[2].friends.push(this.users[0]._id, this.users[4]._id);

      await Promise.all(this.users.slice(0, 3).map((user) => user.save()));
    }

    logger.info(`✅ Seeded ${this.users.length} users with profiles and relationships`);
  }

  async seedVenues(): Promise<void> {
    logger.info('🏟️ Seeding venues...');

    const venueData = [
      {
        name: 'Central Park Tennis Courts',
        description: 'Premium outdoor tennis facility in the heart of Manhattan',
        location: {
          coordinates: [-73.9654, 40.7829],
          address: '1 Central Park West',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          zipCode: '10023',
        },
        surfaceType: 'hard',
        capacity: 50,
        amenities: ['parking', 'restrooms', 'lighting', 'pro_shop'],
        isPublic: true,
      },
      {
        name: 'Elite Sports Complex',
        description: 'Multi-sport indoor facility with state-of-the-art equipment',
        location: {
          coordinates: [-118.2437, 34.0522],
          address: '123 Olympic Blvd',
          city: 'Los Angeles',
          state: 'CA',
          country: 'USA',
          zipCode: '90015',
        },
        surfaceType: 'indoor',
        capacity: 200,
        amenities: ['parking', 'restrooms', 'lockers', 'cafe', 'equipment_rental'],
        isPublic: true,
      },
      {
        name: 'Lakeside Basketball Courts',
        description: 'Outdoor basketball courts with scenic lake views',
        location: {
          coordinates: [-87.6298, 41.8781],
          address: '789 Lakeshore Drive',
          city: 'Chicago',
          state: 'IL',
          country: 'USA',
          zipCode: '60601',
        },
        surfaceType: 'outdoor',
        capacity: 30,
        amenities: ['parking', 'restrooms', 'lighting'],
        isPublic: true,
      },
      {
        name: 'Miami Beach Volleyball Arena',
        description: 'Professional beach volleyball facility with tournament setup',
        location: {
          coordinates: [-80.1918, 25.7617],
          address: '456 Ocean Drive',
          city: 'Miami',
          state: 'FL',
          country: 'USA',
          zipCode: '33139',
        },
        surfaceType: 'sand',
        capacity: 100,
        amenities: ['parking', 'restrooms', 'showers', 'equipment_rental', 'cafe'],
        isPublic: true,
      },
      {
        name: 'Aquatic Center Pool',
        description: 'Olympic-sized swimming pool for competitive and recreational use',
        location: {
          coordinates: [-117.2713, 32.7157],
          address: '321 Harbor View',
          city: 'San Diego',
          state: 'CA',
          country: 'USA',
          zipCode: '92101',
        },
        surfaceType: 'pool',
        capacity: 80,
        amenities: ['parking', 'restrooms', 'lockers', 'showers', 'timing_system'],
        isPublic: true,
      },
    ];

    for (const data of venueData) {
      const venue = new Venue({
        ...data,
        createdBy: this.users[Math.floor(Math.random() * this.users.length)]._id,
        operatingHours: {
          monday: { open: '06:00', close: '22:00' },
          tuesday: { open: '06:00', close: '22:00' },
          wednesday: { open: '06:00', close: '22:00' },
          thursday: { open: '06:00', close: '22:00' },
          friday: { open: '06:00', close: '23:00' },
          saturday: { open: '07:00', close: '23:00' },
          sunday: { open: '07:00', close: '21:00' },
        },
      });

      await venue.save();
      this.venues.push(venue);
    }

    logger.info(`✅ Seeded ${this.venues.length} venues`);
  }

  async seedMatches(): Promise<void> {
    logger.info('🏆 Seeding matches...');

    const sports = ['Tennis', 'Basketball', 'Football', 'Badminton', 'Swimming'];
    const matchCount = 15;

    for (let i = 0; i < matchCount; i++) {
      const createdBy = this.users[Math.floor(Math.random() * this.users.length)];
      const venue = this.venues[Math.floor(Math.random() * this.venues.length)];
      const sport = sports[Math.floor(Math.random() * sports.length)];

      // Generate future dates
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + Math.floor(Math.random() * 30) + 1);
      baseDate.setHours(9 + Math.floor(Math.random() * 12), 0, 0, 0);

      const participantCount = Math.floor(Math.random() * 3) + 2; // 2-4 participants
      const participants = [createdBy._id];

      // Add random participants
      while (participants.length < participantCount) {
        const randomUser = this.users[Math.floor(Math.random() * this.users.length)];
        if (!participants.includes(randomUser._id)) {
          participants.push(randomUser._id);
        }
      }

      const match = new Match({
        type: Math.random() > 0.3 ? MatchType.PUBLIC : MatchType.PRIVATE,
        sport,
        schedule: {
          date: baseDate,
          time: baseDate.toTimeString().slice(0, 5),
          timezone: 'UTC',
          duration: 60 + Math.floor(Math.random() * 120), // 60-180 minutes
        },
        venue: venue._id,
        createdBy: createdBy._id,
        participants,
        status: i < 5 ? MatchStatus.COMPLETED : i < 10 ? MatchStatus.UPCOMING : MatchStatus.ONGOING,
        rules: {
          format: sport === 'Tennis' ? 'singles' : 'team',
          scoringSystem: 'standard',
        },
        maxParticipants: participantCount + Math.floor(Math.random() * 4),
      });

      // Add scores for completed matches
      if (match.status === MatchStatus.COMPLETED) {
        match.scores = participants.reduce((acc: any, participantId: any) => {
          acc[participantId.toString()] = Math.floor(Math.random() * 10) + 1;
          return acc;
        }, {});

        // Set winner
        const winnerIndex = Math.floor(Math.random() * participants.length);
        match.winner = participants[winnerIndex];
      }

      await match.save();
    }

    logger.info(`✅ Seeded ${matchCount} matches`);
  }

  async seedTournaments(): Promise<void> {
    logger.info('🏆 Seeding tournaments...');

    const tournamentData = [
      {
        name: 'Summer Tennis Championship',
        description: 'Annual summer tournament for all skill levels',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        maxParticipants: 16,
        entryFee: 50,
        prizes: {
          first: '$500',
          second: '$250',
          third: '$100',
        },
      },
      {
        name: 'Basketball League Playoffs',
        description: 'End-of-season basketball tournament',
        startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
        maxParticipants: 8,
        entryFee: 25,
        prizes: {
          first: 'Trophy + $300',
          second: '$150',
        },
      },
      {
        name: 'Friday Night Football',
        description: 'Weekly football competition',
        startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        maxParticipants: 32,
        entryFee: 0,
        prizes: {
          first: 'Championship Trophy',
        },
      },
    ];

    for (const data of tournamentData) {
      const createdBy = this.users[Math.floor(Math.random() * this.users.length)];
      const participantCount =
        Math.floor(Math.random() * Math.min(data.maxParticipants / 2, this.users.length)) + 2;

      const participants = [createdBy._id];
      while (participants.length < participantCount) {
        const randomUser = this.users[Math.floor(Math.random() * this.users.length)];
        if (!participants.includes(randomUser._id)) {
          participants.push(randomUser._id);
        }
      }

      const tournament = new Tournament({
        ...data,
        createdBy: createdBy._id,
        participants,
        status: TournamentStatus.UPCOMING,
        rules: {
          format: 'single-elimination',
          matchDuration: 90,
        },
        endDate: new Date(data.startDate.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days duration
        standings: [],
      });

      await tournament.save();
    }

    logger.info(`✅ Seeded ${tournamentData.length} tournaments`);
  }

  async seedNotifications(): Promise<void> {
    logger.info('🔔 Seeding notifications...');

    const notificationTypes = [
      NotificationType.MATCH,
      NotificationType.TOURNAMENT,
      NotificationType.SYSTEM,
      NotificationType.CHAT,
    ];

    const messages = [
      'Your match starts in 30 minutes!',
      'New tournament registration is now open',
      'Welcome to Sports Companion!',
      'You have a new message in your chat',
      'Your tournament bracket has been updated',
      'Match result recorded successfully',
      'New achievement unlocked!',
      'Your friend joined a match you might like',
    ];

    for (const user of this.users) {
      const notificationCount = Math.floor(Math.random() * 5) + 1;

      for (let i = 0; i < notificationCount; i++) {
        const notification = new Notification({
          user: user._id,
          type: notificationTypes[Math.floor(Math.random() * notificationTypes.length)],
          title: 'Sports Companion',
          message: messages[Math.floor(Math.random() * messages.length)],
          timestamp: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),
          read: Math.random() > 0.6,
          action: {
            type: 'navigate',
            path: '/matches',
          },
        });

        await notification.save();
      }
    }

    logger.info(`✅ Seeded notifications for all users`);
  }

  async seedAll(options: SeedOptions = {}): Promise<void> {
    if (options.clean) {
      await this.cleanDatabase();
    }

    if (options.users !== false) {
      await this.seedUsers();
    }

    if (options.venues !== false && this.users.length > 0) {
      await this.seedVenues();
    }

    if (options.matches !== false && this.users.length > 0 && this.venues.length > 0) {
      await this.seedMatches();
    }

    if (options.tournaments !== false && this.users.length > 0) {
      await this.seedTournaments();
    }

    if (options.notifications !== false && this.users.length > 0) {
      await this.seedNotifications();
    }
  }
}

async function runSeeding() {
  try {
    logger.info('🌱 Starting database seeding...');

    // Parse command line options
    const options: SeedOptions = {
      clean: process.argv.includes('--clean'),
      users: !process.argv.includes('--no-users'),
      venues: !process.argv.includes('--no-venues'),
      matches: !process.argv.includes('--no-matches'),
      tournaments: !process.argv.includes('--no-tournaments'),
      notifications: !process.argv.includes('--no-notifications'),
    };

    // Connect to database
    await mongoose.connect(config.database.uri);
    logger.info('📡 Connected to database');

    const seeder = new DatabaseSeeder();
    await seeder.seedAll(options);

    logger.info('🎉 Database seeding completed successfully!');
  } catch (error) {
    logger.error('💥 Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    logger.info('👋 Database connection closed');
  }
}

// Run seeding if this script is executed directly
if (require.main === module) {
  runSeeding();
}

export { DatabaseSeeder, runSeeding };
