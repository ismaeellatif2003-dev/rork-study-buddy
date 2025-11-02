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
      // Development mode bypass for testing
      if (process.env.NODE_ENV === 'development' && idToken === 'test') {
        console.log('🔧 Development mode: Using mock authentication');
        const mockUser = {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          picture: 'https://via.placeholder.com/150'
        };
        
        const token = this.jwtService.generateToken({
          userId: parseInt(mockUser.id),
          email: mockUser.email,
          platform: 'web'
        });
        
        return {
          token,
          user: mockUser
        };
      }
      
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
      // Accept both iOS and Web client IDs as valid audiences
      const validAudiences = [
        process.env.GOOGLE_IOS_CLIENT_ID,
        process.env.GOOGLE_WEB_CLIENT_ID,
        process.env.GOOGLE_CLIENT_ID
      ].filter(Boolean) as string[];
      
      console.log('🔍 Verifying token with audiences:', validAudiences.map(a => a.substring(0, 20) + '...'));
      
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: validAudiences,
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

      const subscription = await this.databaseService.getUserSubscriptionWithExpirationCheck(userId);
      const usage = await this.databaseService.getUserUsageStats(userId);

      // If no subscription found, return default free plan
      if (!subscription) {
        return {
          plan: {
            id: 'free',
            name: 'Free',
            price: 0,
            billingPeriod: 'monthly',
            features: ['5 notes', '25 flashcards', '10 AI questions', '1 essay', 'OCR text extraction'],
            limits: { notes: 5, flashcards: 25, messages: 10, essays: 1, ocrScans: 3 }
          },
          isActive: true,
          expiresAt: null,
          usage: usage || { notes: 0, flashcards: 0, messages: 0, essays: 0, ocrScans: 0 }
        };
      }

      // Return subscription in the format expected by frontend
      return {
        plan: {
          id: subscription.plan_id || 'free',
          name: subscription.plan_name || 'Free',
          price: subscription.plan_id === 'pro-monthly' ? 0.99 : subscription.plan_id === 'pro-yearly' ? 9.99 : 0,
          yearlyPrice: subscription.plan_id === 'pro-yearly' ? 9.99 : undefined,
          billingPeriod: subscription.plan_id === 'pro-yearly' ? 'yearly' : 'monthly',
          features: subscription.plan_id === 'free' 
            ? ['5 notes', '25 flashcards', '10 AI questions', '1 essay', 'OCR text extraction']
            : ['Unlimited notes', 'Unlimited flashcards', 'Unlimited AI questions', 'Unlimited essays', 'OCR text extraction'],
          limits: subscription.limits || { notes: -1, flashcards: -1, messages: -1, essays: -1, ocrScans: -1 }
        },
        isActive: subscription.is_active,
        expiresAt: subscription.expires_at,
        usage: usage || { notes: 0, flashcards: 0, messages: 0, essays: 0, ocrScans: 0 }
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
      const profile = await this.databaseService.getUserProfile(userId);

      return {
        subscription: subscription || { plan: 'free', isActive: true, expiresAt: null },
        usage: usage || { notes: 0, flashcards: 0, messages: 0, essays: 0, ocrScans: 0 },
        notes,
        flashcards,
        profile: profile || { age: null, educationLevel: null, isOnboardingComplete: false },
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
