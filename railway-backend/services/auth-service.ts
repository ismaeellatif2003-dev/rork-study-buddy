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

  private getClientIdForPlatform(platform: string): string {
    // Return the appropriate client ID based on platform
    if (platform === 'mobile' || platform === 'ios') {
      return process.env.GOOGLE_IOS_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '';
    } else {
      // Default to web client ID for web platform
      return process.env.GOOGLE_WEB_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '';
    }
  }

  async authenticateUser(idToken: string, platform: string, deviceInfo?: any) {
    try {
      // Get the appropriate client ID based on platform
      const clientId = this.getClientIdForPlatform(platform);
      
      console.log('🔐 Authenticating user:', {
        platform,
        clientId: clientId ? clientId.substring(0, 20) + '...' : 'MISSING',
        hasIdToken: !!idToken
      });
      
      if (!clientId) {
        throw new Error(`No client ID configured for platform: ${platform}. Please set GOOGLE_IOS_CLIENT_ID or GOOGLE_WEB_CLIENT_ID in environment variables.`);
      }
      
      // Verify Google ID token
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: clientId,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('Invalid Google token');
      }

      const { sub: googleId, email, name, picture } = payload;
      
      console.log('✅ Token verified for user:', email);

      // Get or create user
      let user = await this.databaseService.getUserByGoogleId(googleId);
      
      if (!user) {
        user = await this.databaseService.createUser({
          googleId,
          email: email!,
          name: name!,
          picture,
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
      await this.databaseService.createSubscription(parseInt(userId), mobileSubscription.planId);

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
      await this.databaseService.createSyncEvent({
        userId,
        eventType: 'usage_update',
        data: {
          type,
          increment,
          timestamp: new Date().toISOString(),
        },
        platform: 'web',
      });

      return { success: true };
    } catch (error) {
      console.error('Usage update error:', error);
      throw new Error('Failed to update usage');
    }
  }
}
