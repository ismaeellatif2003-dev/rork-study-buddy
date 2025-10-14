import { OAuth2Client } from 'google-auth-library';
import { DatabaseService } from './database';
import { JWTService } from './jwt';

export class AuthService {
  private googleClient: OAuth2Client;
  private databaseService: DatabaseService;
  private jwtService: JWTService;

  constructor(googleClient: OAuth2Client, databaseService: DatabaseService, jwtService: JWTService) {
    this.googleClient = googleClient;
    this.databaseService = databaseService;
    this.jwtService = jwtService;
  }

  async authenticateUser(idToken: string, platform: string, deviceInfo?: any) {
    try {
      // Verify Google ID token
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('Invalid Google token');
      }

      const { sub: googleId, email, name, picture } = payload;

      // Get or create user
      let user = await this.databaseService.getUserByGoogleId(googleId);
      
      if (!user) {
        user = await this.databaseService.createUser({
          googleId,
          email: email!,
          name: name!,
          picture,
          platform,
          deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : null,
        });
      } else {
        // Update last login
        await this.databaseService.updateUserLastLogin(user.id);
      }

      // Generate JWT token
      const token = this.jwtService.generateToken({
        userId: user.id,
        email: user.email,
        platform,
      });

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          picture: user.picture,
        },
      };
    } catch (error) {
      console.error('Authentication error:', error);
      throw new Error('Authentication failed');
    }
  }

  async linkMobileSubscription(userId: string, mobileSubscription: any) {
    try {
      await this.databaseService.createSubscription({
        userId,
        planId: mobileSubscription.planId,
        isActive: true,
        expiresAt: mobileSubscription.expiresAt,
        platform: 'mobile',
        subscriptionData: JSON.stringify(mobileSubscription),
      });

      return { success: true };
    } catch (error) {
      console.error('Mobile subscription link error:', error);
      throw new Error('Failed to link mobile subscription');
    }
  }

  async getSubscriptionStatus(token: string) {
    try {
      const decoded = this.jwtService.verifyToken(token);
      const userId = decoded.userId;

      const subscription = await this.databaseService.getUserSubscription(userId);
      const usage = await this.databaseService.getUserUsageStats(userId);

      return {
        subscription: subscription || { plan: 'free', isActive: true, expiresAt: null },
        usage: usage || { notes: 0, flashcards: 0, messages: 0, essays: 0, ocrScans: 0 },
      };
    } catch (error) {
      console.error('Subscription status error:', error);
      throw new Error('Failed to get subscription status');
    }
  }

  async syncUserData(token: string) {
    try {
      const decoded = this.jwtService.verifyToken(token);
      const userId = decoded.userId;

      const subscription = await this.databaseService.getUserSubscription(userId);
      const usage = await this.databaseService.getUserUsageStats(userId);
      const notes = await this.databaseService.getUserNotes(userId);
      const flashcards = await this.databaseService.getUserFlashcards(userId);

      return {
        subscription: subscription || { plan: 'free', isActive: true, expiresAt: null },
        usage: usage || { notes: 0, flashcards: 0, messages: 0, essays: 0, ocrScans: 0 },
        notes,
        flashcards,
      };
    } catch (error) {
      console.error('Sync error:', error);
      throw new Error('Failed to sync user data');
    }
  }

  async updateUsage(token: string, type: string, increment: number = 1) {
    try {
      const decoded = this.jwtService.verifyToken(token);
      const userId = decoded.userId;

      await this.databaseService.updateUsageStats(userId, type, increment);
      
      // Create sync event
      await this.databaseService.createSyncEvent(userId, 'usage_update', {
        type,
        increment,
        timestamp: new Date().toISOString(),
      });

      return { success: true };
    } catch (error) {
      console.error('Usage update error:', error);
      throw new Error('Failed to update usage');
    }
  }
}
