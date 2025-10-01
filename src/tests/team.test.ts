import { Team } from '../models/Team';
import { User } from '../models/User';
import { Profile } from '../models/Profile';
import { Chat } from '../models/Chat';
import { TeamRole } from '../types';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('Team Model', () => {
  let mongoServer: MongoMemoryServer;
  let testUser1: any;
  let testUser2: any;
  let testUser3: any;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Create test users
    const profile1 = await Profile.create({
      firstName: 'Test',
      lastName: 'User1',
      username: 'testuser1',
      user: new mongoose.Types.ObjectId()
    });

    const profile2 = await Profile.create({
      firstName: 'Test',
      lastName: 'User2',
      username: 'testuser2',
      user: new mongoose.Types.ObjectId()
    });

    const profile3 = await Profile.create({
      firstName: 'Test',
      lastName: 'User3',
      username: 'testuser3',
      user: new mongoose.Types.ObjectId()
    });

    testUser1 = await User.create({
      email: 'test1@example.com',
      password: 'Password123!',
      profile: profile1._id,
      isEmailVerified: true,
      isActive: true
    });

    testUser2 = await User.create({
      email: 'test2@example.com',
      password: 'Password123!',
      profile: profile2._id,
      isEmailVerified: true,
      isActive: true
    });

    testUser3 = await User.create({
      email: 'test3@example.com',
      password: 'Password123!',
      profile: profile3._id,
      isEmailVerified: true,
      isActive: true
    });

    profile1.user = testUser1._id;
    profile2.user = testUser2._id;
    profile3.user = testUser3._id;
    await profile1.save();
    await profile2.save();
    await profile3.save();
  });

  afterEach(async () => {
    await Team.deleteMany({});
    await User.deleteMany({});
    await Profile.deleteMany({});
    await Chat.deleteMany({});
  });

  describe('Team Creation', () => {
    it('should create a team with valid data', async () => {
      const chat = await Chat.create({
        type: 'team',
        name: 'Test Team Chat',
        participants: [testUser1._id],
        isActive: true
      });

      const team = await Team.create({
        name: 'Test Team',
        description: 'A test team',
        sport: 'Basketball',
        captain: testUser1._id,
        createdBy: testUser1._id,
        chat: chat._id,
        members: [
          {
            user: testUser1._id,
            role: TeamRole.CAPTAIN,
            joinedAt: new Date()
          }
        ]
      });

      expect(team).toBeDefined();
      expect(team.name).toBe('Test Team');
      expect(team.sport).toBe('Basketball');
      expect(team.captain.toString()).toBe(testUser1._id.toString());
      expect(team.members).toHaveLength(1);
    });

    it('should fail to create team without required fields', async () => {
      let error;
      try {
        await Team.create({
          description: 'A test team'
        });
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
    });

    it('should fail if captain is not a member', async () => {
      const chat = await Chat.create({
        type: 'team',
        name: 'Test Team Chat',
        participants: [testUser1._id],
        isActive: true
      });

      let error;
      try {
        await Team.create({
          name: 'Test Team',
          captain: testUser1._id,
          createdBy: testUser1._id,
          chat: chat._id,
          members: [
            {
              user: testUser2._id,
              role: TeamRole.PLAYER,
              joinedAt: new Date()
            }
          ]
        });
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect((error as any).message).toContain('Captain must be a member');
    });
  });

  describe('Team Member Management', () => {
    let team: any;
    let teamChat: any;

    beforeEach(async () => {
      teamChat = await Chat.create({
        type: 'team',
        name: 'Test Team Chat',
        participants: [testUser1._id],
        isActive: true
      });

      team = await Team.create({
        name: 'Test Team',
        captain: testUser1._id,
        createdBy: testUser1._id,
        chat: teamChat._id,
        members: [
          {
            user: testUser1._id,
            role: TeamRole.CAPTAIN,
            joinedAt: new Date()
          }
        ]
      });
    });

    it('should add a member to the team', async () => {
      team.addMember(testUser2._id, TeamRole.PLAYER);
      await team.save();

      expect(team.members).toHaveLength(2);
      expect(team.isMember(testUser2._id.toString())).toBe(true);
    });

    it('should not add duplicate members', async () => {
      let error;
      try {
        team.addMember(testUser1._id, TeamRole.PLAYER);
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect((error as any).message).toContain('already a member');
    });

    it('should remove a member from the team', async () => {
      team.addMember(testUser2._id, TeamRole.PLAYER);
      await team.save();

      team.removeMember(testUser2._id.toString());
      await team.save();

      expect(team.members).toHaveLength(1);
      expect(team.isMember(testUser2._id.toString())).toBe(false);
    });

    it('should not allow removing captain', async () => {
      let error;
      try {
        team.removeMember(testUser1._id.toString());
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect((error as any).message).toContain('Cannot remove captain');
    });

    it('should check if user is a member', async () => {
      expect(team.isMember(testUser1._id.toString())).toBe(true);
      expect(team.isMember(testUser2._id.toString())).toBe(false);
    });

    it('should check if user is captain', async () => {
      expect(team.isCaptain(testUser1._id.toString())).toBe(true);
      expect(team.isCaptain(testUser2._id.toString())).toBe(false);
    });
  });

  describe('Team Role Management', () => {
    let team: any;

    beforeEach(async () => {
      const teamChat = await Chat.create({
        type: 'team',
        name: 'Test Team Chat',
        participants: [testUser1._id, testUser2._id],
        isActive: true
      });

      team = await Team.create({
        name: 'Test Team',
        captain: testUser1._id,
        createdBy: testUser1._id,
        chat: teamChat._id,
        members: [
          {
            user: testUser1._id,
            role: TeamRole.CAPTAIN,
            joinedAt: new Date()
          },
          {
            user: testUser2._id,
            role: TeamRole.PLAYER,
            joinedAt: new Date()
          }
        ]
      });
    });

    it('should update member role', async () => {
      team.updateMemberRole(testUser2._id.toString(), TeamRole.CAPTAIN);
      await team.save();

      const member = team.members.find((m: any) => m.user.toString() === testUser2._id.toString());
      expect(member.role).toBe(TeamRole.CAPTAIN);
    });

    it('should fail to update role for non-member', async () => {
      let error;
      try {
        team.updateMemberRole(testUser3._id.toString(), TeamRole.CAPTAIN);
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect((error as any).message).toContain('not a member');
    });

    it('should transfer captaincy', async () => {
      team.transferCaptaincy(testUser2._id.toString());
      await team.save();

      expect(team.captain.toString()).toBe(testUser2._id.toString());
      
      const newCaptain = team.members.find((m: any) => m.user.toString() === testUser2._id.toString());
      expect(newCaptain.role).toBe(TeamRole.CAPTAIN);

      const oldCaptain = team.members.find((m: any) => m.user.toString() === testUser1._id.toString());
      expect(oldCaptain.role).toBe(TeamRole.PLAYER);
    });

    it('should fail to transfer captaincy to non-member', async () => {
      let error;
      try {
        team.transferCaptaincy(testUser3._id.toString());
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect((error as any).message).toContain('must be a member');
    });
  });

  describe('Team Virtuals', () => {
    it('should calculate member count', async () => {
      const teamChat = await Chat.create({
        type: 'team',
        name: 'Test Team Chat',
        participants: [testUser1._id, testUser2._id],
        isActive: true
      });

      const team = await Team.create({
        name: 'Test Team',
        captain: testUser1._id,
        createdBy: testUser1._id,
        chat: teamChat._id,
        maxMembers: 5,
        members: [
          {
            user: testUser1._id,
            role: TeamRole.CAPTAIN,
            joinedAt: new Date()
          },
          {
            user: testUser2._id,
            role: TeamRole.PLAYER,
            joinedAt: new Date()
          }
        ]
      });

      expect(team.memberCount).toBe(2);
    });

    it('should check if team is full', async () => {
      const teamChat = await Chat.create({
        type: 'team',
        name: 'Test Team Chat',
        participants: [testUser1._id, testUser2._id],
        isActive: true
      });

      const team = await Team.create({
        name: 'Test Team',
        captain: testUser1._id,
        createdBy: testUser1._id,
        chat: teamChat._id,
        maxMembers: 2,
        members: [
          {
            user: testUser1._id,
            role: TeamRole.CAPTAIN,
            joinedAt: new Date()
          },
          {
            user: testUser2._id,
            role: TeamRole.PLAYER,
            joinedAt: new Date()
          }
        ]
      });

      expect(team.isFull).toBe(true);
    });
  });

  describe('Team Static Methods', () => {
    beforeEach(async () => {
      const chat1 = await Chat.create({
        type: 'team',
        name: 'Team 1 Chat',
        participants: [testUser1._id],
        isActive: true
      });

      const chat2 = await Chat.create({
        type: 'team',
        name: 'Team 2 Chat',
        participants: [testUser1._id, testUser2._id],
        isActive: true
      });

      await Team.create({
        name: 'Team 1',
        sport: 'Basketball',
        captain: testUser1._id,
        createdBy: testUser1._id,
        chat: chat1._id,
        members: [
          {
            user: testUser1._id,
            role: TeamRole.CAPTAIN,
            joinedAt: new Date()
          }
        ]
      });

      await Team.create({
        name: 'Team 2',
        sport: 'Soccer',
        captain: testUser2._id,
        createdBy: testUser2._id,
        chat: chat2._id,
        members: [
          {
            user: testUser1._id,
            role: TeamRole.PLAYER,
            joinedAt: new Date()
          },
          {
            user: testUser2._id,
            role: TeamRole.CAPTAIN,
            joinedAt: new Date()
          }
        ]
      });
    });

    it('should find teams by user', async () => {
      const teams = await Team.findByUser(testUser1._id.toString());
      expect(teams).toHaveLength(2);
    });

    it('should find teams by sport', async () => {
      const teams = await Team.findBySport('Basketball');
      expect(teams).toHaveLength(1);
      expect(teams.length).toBeGreaterThan(0);
      if (teams[0]) {
        expect(teams[0].sport).toBe('Basketball');
      }
    });
  });
});
