import {Profile} from "../modules/users/domain/models/Profile";
import {User} from "../modules/users/domain/models/User";
import Database from "../shared/config/database";

// Setup test database connection
beforeAll(async () => {
  const database = Database.getInstance();
  await database.connect();
});

// Clean up after each test
afterEach(async () => {
  const database = Database.getInstance();
  await database.clearDatabase();
});

// Close database connection after all tests
afterAll(async () => {
  const database = Database.getInstance();
  await database.disconnect();
});

// Test utilities
export const createTestUser = async (overrides: any = {}) => {
  const userData = {
    email: "test@example.com",
    password: "TestPass123",
    firstName: "Test",
    lastName: "User",
    username: "testuser",
    ...overrides,
  };

  const profile = new Profile({
    firstName: userData.firstName,
    lastName: userData.lastName,
    username: userData.username.toLowerCase(),
    user: null,
  });

  const user = new User({
    email: userData.email.toLowerCase(),
    password: userData.password,
    profile: profile._id,
    preferences: {
      theme: "light",
      notifications: true,
      language: "en",
    },
    stats: {
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
    },
  });

  profile.user = user._id as any;

  await Promise.all([user.save(), profile.save()]);

  return {user, profile};
};
