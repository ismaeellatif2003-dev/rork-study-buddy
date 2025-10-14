import { DatabaseService } from '../services/database';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database connection test utility
class DatabaseTester {
  private db: DatabaseService;

  constructor() {
    this.db = new DatabaseService();
  }

  async testConnection(): Promise<void> {
    try {
      console.log('🔍 Testing database connection...');
      
      // Test basic connection
      const isHealthy = await this.db.healthCheck();
      if (!isHealthy) {
        throw new Error('Database health check failed');
      }
      console.log('✅ Database connection successful');

      // Test user operations
      await this.testUserOperations();
      
      // Test subscription operations
      await this.testSubscriptionOperations();
      
      // Test session operations
      await this.testSessionOperations();
      
      // Test usage operations
      await this.testUsageOperations();
      
      console.log('\n🎉 All database tests passed!');
      
    } catch (error) {
      console.error('❌ Database test failed:', error);
      throw error;
    }
  }

  private async testUserOperations(): Promise<void> {
    console.log('\n👤 Testing user operations...');
    
    // Test creating a user
    const testUser = await this.db.createUser({
      googleId: 'test-google-id-' + Date.now(),
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/avatar.jpg'
    });
    console.log('  ✅ User created:', testUser.id);

    // Test getting user by Google ID
    const foundUser = await this.db.getUserByGoogleId(testUser.google_id);
    if (!foundUser) {
      throw new Error('Failed to find user by Google ID');
    }
    console.log('  ✅ User found by Google ID');

    // Test updating user
    await this.db.updateUserLastLogin(testUser.id);
    console.log('  ✅ User last login updated');

    // Clean up
    // Note: In a real test, you might want to clean up test data
    console.log('  ✅ User operations test completed');
  }

  private async testSubscriptionOperations(): Promise<void> {
    console.log('\n💳 Testing subscription operations...');
    
    // Create a test user first
    const testUser = await this.db.createUser({
      googleId: 'test-sub-user-' + Date.now(),
      email: 'subtest@example.com',
      name: 'Subscription Test User'
    });

    // Test creating subscription
    const subscription = await this.db.createSubscription(testUser.id, 'free');
    console.log('  ✅ Subscription created:', subscription.id);

    // Test getting user subscription
    const userSub = await this.db.getUserSubscription(testUser.id);
    if (!userSub) {
      throw new Error('Failed to get user subscription');
    }
    console.log('  ✅ User subscription retrieved');

    // Test getting subscription plan
    const plan = await this.db.getSubscriptionPlan('free');
    if (!plan) {
      throw new Error('Failed to get subscription plan');
    }
    console.log('  ✅ Subscription plan retrieved:', plan.name);

    // Test updating subscription
    const newSub = await this.db.updateUserSubscription(testUser.id, 'pro-monthly');
    console.log('  ✅ Subscription updated to:', newSub.plan_id);

    console.log('  ✅ Subscription operations test completed');
  }

  private async testSessionOperations(): Promise<void> {
    console.log('\n🔐 Testing session operations...');
    
    // Create a test user first
    const testUser = await this.db.createUser({
      googleId: 'test-session-user-' + Date.now(),
      email: 'sessiontest@example.com',
      name: 'Session Test User'
    });

    // Test creating session
    const session = await this.db.createUserSession({
      userId: testUser.id,
      platform: 'web',
      deviceInfo: { browser: 'Chrome', os: 'Windows' },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });
    console.log('  ✅ Session created:', session.id);

    // Test getting session
    const foundSession = await this.db.getUserSession(session.session_token);
    if (!foundSession) {
      throw new Error('Failed to find session');
    }
    console.log('  ✅ Session retrieved');

    // Test deleting session
    await this.db.deleteUserSession(session.session_token);
    console.log('  ✅ Session deleted');

    console.log('  ✅ Session operations test completed');
  }

  private async testUsageOperations(): Promise<void> {
    console.log('\n📊 Testing usage operations...');
    
    // Create a test user first
    const testUser = await this.db.createUser({
      googleId: 'test-usage-user-' + Date.now(),
      email: 'usagetest@example.com',
      name: 'Usage Test User'
    });

    // Test getting usage stats (should create default)
    const usage = await this.db.getUserUsageStats(testUser.id);
    console.log('  ✅ Usage stats retrieved:', usage);

    // Test updating usage
    const updatedUsage = await this.db.updateUsageStats(testUser.id, 'notes', 1);
    console.log('  ✅ Usage updated:', updatedUsage.notes);

    // Test updating usage again
    const finalUsage = await this.db.updateUsageStats(testUser.id, 'notes', 2);
    console.log('  ✅ Usage updated again:', finalUsage.notes);

    console.log('  ✅ Usage operations test completed');
  }

  async cleanup(): Promise<void> {
    try {
      console.log('\n🧹 Cleaning up test data...');
      // In a real implementation, you might want to clean up test data
      // For now, we'll just log that cleanup would happen
      console.log('  ℹ️  Test data cleanup would happen here');
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }
}

// CLI interface
async function main() {
  const tester = new DatabaseTester();
  
  try {
    await tester.testConnection();
  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  } finally {
    await tester.cleanup();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { DatabaseTester };
