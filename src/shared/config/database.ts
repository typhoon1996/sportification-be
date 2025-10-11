import mongoose from 'mongoose';
import config from './index';
import logger from '../utils/logger';

class Database {
  private static instance: Database;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<void> {
    try {
      const options = {
        maxPoolSize: config.database.options.maxPoolSize,
        minPoolSize: config.database.options.minPoolSize,
        socketTimeoutMS: config.database.options.socketTimeoutMS,
        serverSelectionTimeoutMS: config.database.options.serverSelectionTimeoutMS,
        heartbeatFrequencyMS: config.database.options.heartbeatFrequencyMS,
      };

      const conn = await mongoose.connect(config.database.uri, options);

      logger.info(`✅ MongoDB connected: ${conn.connection.host}`);
      logger.info(`📊 Database: ${conn.connection.name}`);
      logger.info(`🔧 Environment: ${config.app.env}`);

      // Handle connection events
      mongoose.connection.on('error', (err) => {
        logger.error('❌ MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('⚠️  MongoDB disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('🔄 MongoDB reconnected');
      });

      // Graceful shutdown
      process.on('SIGINT', async () => {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed through app termination');
        process.exit(0);
      });
    } catch (error) {
      logger.error('❌ Error connecting to MongoDB:', error);
      if (config.app.env !== 'test') {
        process.exit(1);
      } else {
        throw error;
      }
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
    } catch (error) {
      logger.error('Error closing MongoDB connection:', error);
    }
  }

  public async clearDatabase(): Promise<void> {
    if (config.app.env === 'test') {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        const collection = collections[key];
        if (collection) {
          await collection.deleteMany({});
        }
      }
    }
  }
}

export default Database;
