import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database connection pool
let pool: Pool | null = null;

// Initialize database connection only if DATABASE_URL is available
if (process.env.DATABASE_URL) {
  console.log('🔗 Initializing database connection with DATABASE_URL');
  console.log('📝 DATABASE_URL present:', process.env.DATABASE_URL.substring(0, 20) + '...');
  
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // Increased timeout for Railway
  });
  
  // Test connection immediately
  pool.query('SELECT NOW()')
    .then(() => {
      console.log('✅ Database connection pool initialized and tested successfully');
    })
    .catch((error) => {
      console.error('❌ Database connection test failed:', {
        message: error.message,
        code: error.code,
        detail: error.detail
      });
      console.error('⚠️  Database operations may fail. Check DATABASE_URL and Railway PostgreSQL service.');
    });
  
  // Handle connection errors
  pool.on('error', (err) => {
    console.error('❌ Unexpected database pool error:', {
      message: err.message,
      code: err.code
    });
  });
  
  pool.on('connect', () => {
    console.log('✅ New database client connected');
  });
} else {
  console.log('🔧 Running in development mode with mock database - no DATABASE_URL found');
  console.log('⚠️  Set DATABASE_URL environment variable to connect to a real database');
}

// Types for database operations
export interface User {
  id: number;
  google_id: string;
  email: string;
  name: string;
  picture?: string;
  mobile_device_id?: string;
  web_session_id?: string;
  age?: number;
  education_level?: string;
  is_onboarding_complete: boolean;
  created_at: Date;
  updated_at: Date;
  last_login_at: Date;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  yearly_price?: number;
  billing_period: string;
  limits: Record<string, any>;
  features: string[];
  created_at: Date;
}

export interface UserSubscription {
  id: number;
  user_id: number;
  plan_id: string;
  is_active: boolean;
  created_at: Date;
  expires_at?: Date;
  updated_at: Date;
  plan_name?: string;
  limits?: Record<string, any>;
}

export interface UserSession {
  id: number;
  user_id: number;
  session_token: string;
  platform: string;
  device_info?: Record<string, any>;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface UserUsage {
  user_id: number;
  notes: number;
  flashcards: number;
  messages: number;
  essays: number;
  ocr_scans: number;
  updated_at: Date;
}

export interface Note {
  id: number;
  user_id: number;
  title: string;
  content: string;
  summary?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Flashcard {
  id: number;
  user_id: number;
  set_id: string;
  set_name: string;
  set_description?: string;
  front: string;
  back: string;
  difficulty: string;
  created_at: Date;
  updated_at: Date;
}

export interface Essay {
  id: number;
  user_id: number;
  title: string;
  prompt: string;
  content: string;
  word_count: number;
  citations?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface SyncEvent {
  id: number;
  user_id: number;
  event_type: string;
  data: Record<string, any>;
  platform: string;
  processed: boolean;
  created_at: Date;
}

export interface MobileSubscription {
  id: number;
  user_id: number;
  platform: string;
  product_id: string;
  transaction_id: string;
  purchase_token?: string;
  is_active: boolean;
  expires_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface NoteEmbedding {
  id: number;
  note_id: number;
  user_id: number;
  content_type: string;
  content_text: string;
  embedding: number[]; // Vector as array
  created_at: Date;
  updated_at: Date;
  title?: string; // Optional, added in search results
  similarity?: number; // Optional, added in search results
}

export interface UserQuestion {
  id: number;
  user_id: number;
  question: string;
  answer: string;
  context_note_ids: number[];
  topic_tags: string[];
  difficulty: string;
  feedback_score?: number;
  created_at: Date;
  updated_at: Date;
}

export interface UserKnowledgeProfile {
  id: number;
  user_id: number;
  topics_studied: any[];
  weak_areas: any[];
  strong_areas: any[];
  study_preferences: Record<string, any>;
  question_patterns: Record<string, any>;
  last_updated: Date;
  created_at: Date;
}

export class DatabaseService {
  private pool: Pool | null;

  constructor() {
    this.pool = pool;
  }

  // Check if we're in development mode (no database connection)
  private isDevelopmentMode(): boolean {
    return !this.pool;
  }

  // Public method to check if database is available
  public hasDatabase(): boolean {
    return !!this.pool;
  }

  private async executeQuery(query: string, params: any[] = []): Promise<any> {
    if (this.isDevelopmentMode()) {
      throw new Error('Database queries not available in development mode');
    }
    
    if (!this.pool) {
      throw new Error('Database pool not initialized. DATABASE_URL may be missing.');
    }
    
    try {
      return await this.pool.query(query, params);
    } catch (error: any) {
      console.error('❌ Database query error:', {
        message: error.message,
        code: error.code,
        query: query.substring(0, 100) + '...',
        paramsCount: params.length
      });
      throw error;
    }
  }

  // Mock data for development
  private getMockUser(email: string): User {
    return {
      id: 1,
      google_id: 'mock-google-id',
      email: email,
      name: 'Test User',
      picture: 'https://via.placeholder.com/150',
      age: 25,
      education_level: 'bachelors',
      is_onboarding_complete: true,
      created_at: new Date(),
      updated_at: new Date(),
      last_login_at: new Date(),
    };
  }

  private getMockSubscription(): UserSubscription {
    return {
      id: 1,
      user_id: 1,
      plan_id: 'free',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      expires_at: undefined,
    };
  }

  private getMockUsage(): UserUsage {
    return {
      user_id: 1,
      notes: 0,
      flashcards: 0,
      messages: 0,
      essays: 0,
      ocr_scans: 0,
      updated_at: new Date(),
    };
  }

  // Connection management
  async connect(): Promise<PoolClient> {
    if (this.isDevelopmentMode()) {
      throw new Error('Database connection not available in development mode');
    }
    return await this.pool!.connect();
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
    }
  }

  // User management
  async createUser(userData: {
    googleId: string;
    email: string;
    name: string;
    picture?: string;
  }): Promise<User> {
    const query = `
      INSERT INTO users (google_id, email, name, picture, created_at, updated_at, last_login_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW(), NOW())
      RETURNING *
    `;
    const result = await this.executeQuery(query, [
      userData.googleId,
      userData.email,
      userData.name,
      userData.picture
    ]);
    
    const user = result.rows[0];
    
    // Create default free subscription for new user
    await this.createSubscription(user.id, 'free');
    
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE google_id = $1';
    const result = await this.executeQuery(query, [googleId]);
    return result.rows[0] || null;
  }

  async getUserById(userId: number): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await this.executeQuery(query, [userId]);
    return result.rows[0] || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await this.executeQuery(query, [email]);
    return result.rows[0] || null;
  }

  async updateUserLastLogin(userId: number): Promise<void> {
    const query = 'UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1';
    await this.executeQuery(query, [userId]);
  }

  async updateUserMobileDevice(userId: number, deviceId: string): Promise<void> {
    const query = 'UPDATE users SET mobile_device_id = $1, updated_at = NOW() WHERE id = $2';
    await this.executeQuery(query, [deviceId, userId]);
  }

  async updateUserWebSession(userId: number, sessionId: string): Promise<void> {
    const query = 'UPDATE users SET web_session_id = $1, updated_at = NOW() WHERE id = $2';
    await this.executeQuery(query, [sessionId, userId]);
  }

  // User profile management
  async updateUserProfile(userId: number, profileData: {
    age?: number;
    educationLevel?: string;
    isOnboardingComplete?: boolean;
  }): Promise<User> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (profileData.age !== undefined) {
      updates.push(`age = $${paramCount}`);
      values.push(profileData.age);
      paramCount++;
    }

    if (profileData.educationLevel !== undefined) {
      updates.push(`education_level = $${paramCount}`);
      values.push(profileData.educationLevel);
      paramCount++;
    }

    if (profileData.isOnboardingComplete !== undefined) {
      updates.push(`is_onboarding_complete = $${paramCount}`);
      values.push(profileData.isOnboardingComplete);
      paramCount++;
    }

    if (updates.length === 0) {
      throw new Error('No profile data provided for update');
    }

    updates.push(`updated_at = NOW()`);
    values.push(userId);

    const query = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await this.executeQuery(query, values);
    return result.rows[0];
  }

  async getUserProfile(userId: number): Promise<{
    age?: number;
    educationLevel?: string;
    isOnboardingComplete: boolean;
  } | null> {
    if (this.isDevelopmentMode()) {
      return {
        age: 25,
        educationLevel: 'bachelors',
        isOnboardingComplete: true
      };
    }

    const query = 'SELECT age, education_level, is_onboarding_complete FROM users WHERE id = $1';
    const result = await this.pool!.query(query, [userId]);
    
    if (!result.rows[0]) {
      return null;
    }

    const row = result.rows[0];
    return {
      age: row.age,
      educationLevel: row.education_level,
      isOnboardingComplete: row.is_onboarding_complete
    };
  }

  // Subscription management
  async createSubscription(userId: number, planId: string, purchasePlatform: string = 'web'): Promise<UserSubscription> {
    const query = `
      INSERT INTO subscriptions (user_id, plan_id, is_active, purchase_platform, created_at, expires_at)
      VALUES ($1, $2, true, $3, NOW(), $4)
      RETURNING *
    `;
    const expiresAt = planId === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const result = await this.executeQuery(query, [userId, planId, purchasePlatform, expiresAt]);
    return result.rows[0];
  }

  async getUserSubscription(userId: number): Promise<UserSubscription | null> {
    if (this.isDevelopmentMode()) {
      return this.getMockSubscription();
    }

    const query = `
      SELECT s.*, p.name as plan_name, p.limits
      FROM subscriptions s
      JOIN subscription_plans p ON s.plan_id = p.id
      WHERE s.user_id = $1 AND s.is_active = true
      ORDER BY s.created_at DESC
      LIMIT 1
    `;
    const result = await this.pool!.query(query, [userId]);
    return result.rows[0] || null;
  }

  async updateUserSubscription(userId: number, planId: string, purchasePlatform: string = 'web'): Promise<UserSubscription> {
    // Deactivate current subscription
    await this.executeQuery(
      'UPDATE subscriptions SET is_active = false, updated_at = NOW() WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    // Create new subscription
    return await this.createSubscription(userId, planId, purchasePlatform);
  }

  async getSubscriptionPlan(planId: string): Promise<SubscriptionPlan | null> {
    const query = 'SELECT * FROM subscription_plans WHERE id = $1';
    const result = await this.executeQuery(query, [planId]);
    return result.rows[0] || null;
  }

  // Cancel subscription (set auto_renew to false but keep active until expiry)
  async cancelSubscription(userId: number): Promise<UserSubscription | null> {
    const query = `
      UPDATE subscriptions 
      SET auto_renew = false, updated_at = NOW()
      WHERE user_id = $1 AND is_active = true AND plan_id != 'free'
      RETURNING *
    `;
    const result = await this.executeQuery(query, [userId]);
    return result.rows[0] || null;
  }

  // Check and handle expired subscriptions
  async checkExpiredSubscriptions(): Promise<void> {
    const query = `
      UPDATE subscriptions 
      SET is_active = false, updated_at = NOW()
      WHERE is_active = true 
        AND expires_at IS NOT NULL 
        AND expires_at < NOW()
        AND plan_id != 'free'
    `;
    await this.executeQuery(query, []);
    console.log('🕐 Checked for expired subscriptions');
  }

  // Get subscription with expiration check
  async getUserSubscriptionWithExpirationCheck(userId: number): Promise<UserSubscription | null> {
    // First check for expired subscriptions
    await this.checkExpiredSubscriptions();
    
    // Then get the user's subscription
    return await this.getUserSubscription(userId);
  }

  // Session management
  async createUserSession(sessionData: {
    userId: number;
    platform: string;
    deviceInfo?: Record<string, any>;
    expiresAt: Date;
  }): Promise<UserSession> {
    const sessionToken = this.generateSessionToken();
    const query = `
      INSERT INTO user_sessions (user_id, session_token, platform, device_info, expires_at, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `;
    const result = await this.executeQuery(query, [
      sessionData.userId,
      sessionToken,
      sessionData.platform,
      JSON.stringify(sessionData.deviceInfo),
      sessionData.expiresAt
    ]);
    return result.rows[0];
  }

  async getUserSession(sessionToken: string): Promise<UserSession | null> {
    const query = 'SELECT * FROM user_sessions WHERE session_token = $1 AND expires_at > NOW()';
    const result = await this.executeQuery(query, [sessionToken]);
    return result.rows[0] || null;
  }

  async deleteUserSession(sessionToken: string): Promise<void> {
    const query = 'DELETE FROM user_sessions WHERE session_token = $1';
    await this.executeQuery(query, [sessionToken]);
  }

  async cleanupExpiredSessions(): Promise<void> {
    const query = 'DELETE FROM user_sessions WHERE expires_at <= NOW()';
    await this.executeQuery(query);
  }

  // Usage tracking
  async getUserUsageStats(userId: number): Promise<UserUsage> {
    if (this.isDevelopmentMode()) {
      return this.getMockUsage();
    }

    const query = 'SELECT * FROM user_usage WHERE user_id = $1';
    const result = await this.pool!.query(query, [userId]);
    
    if (result.rows.length === 0) {
      // Create default usage record
      const insertQuery = `
        INSERT INTO user_usage (user_id, notes, flashcards, messages, essays, ocr_scans, updated_at)
        VALUES ($1, 0, 0, 0, 0, 0, NOW())
        RETURNING *
      `;
      const insertResult = await this.pool!.query(insertQuery, [userId]);
      return insertResult.rows[0];
    }
    
    return result.rows[0];
  }

  async updateUsageStats(userId: number, type: string, increment: number = 1): Promise<UserUsage> {
    const query = `
      INSERT INTO user_usage (user_id, ${type})
      VALUES ($1, $2)
      ON CONFLICT (user_id)
      DO UPDATE SET ${type} = user_usage.${type} + $2, updated_at = NOW()
      RETURNING *
    `;
    const result = await this.executeQuery(query, [userId, increment]);
    return result.rows[0];
  }

  // Notes management
  async getUserNotes(userId: number): Promise<Note[]> {
    if (this.isDevelopmentMode()) {
      return []; // Return empty array for development
    }

    const query = 'SELECT * FROM notes WHERE user_id = $1 ORDER BY created_at DESC';
    const result = await this.pool!.query(query, [userId]);
    return result.rows;
  }

  async createNote(userId: number, noteData: {
    title: string;
    content: string;
    summary?: string;
  }): Promise<Note> {
    const query = `
      INSERT INTO notes (user_id, title, content, summary, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `;
    const result = await this.executeQuery(query, [
      userId,
      noteData.title,
      noteData.content,
      noteData.summary
    ]);
    return result.rows[0];
  }

  async updateNote(noteId: number, userId: number, noteData: {
    title?: string;
    content?: string;
    summary?: string;
  }): Promise<Note | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (noteData.title !== undefined) {
      fields.push(`title = $${paramCount++}`);
      values.push(noteData.title);
    }
    if (noteData.content !== undefined) {
      fields.push(`content = $${paramCount++}`);
      values.push(noteData.content);
    }
    if (noteData.summary !== undefined) {
      fields.push(`summary = $${paramCount++}`);
      values.push(noteData.summary);
    }

    if (fields.length === 0) return null;

    fields.push(`updated_at = NOW()`);
    values.push(noteId, userId);

    const query = `
      UPDATE notes 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount++} AND user_id = $${paramCount++}
      RETURNING *
    `;
    const result = await this.executeQuery(query, values);
    return result.rows[0] || null;
  }

  async deleteNote(noteId: number, userId: number): Promise<boolean> {
    const query = 'DELETE FROM notes WHERE id = $1 AND user_id = $2';
    const result = await this.executeQuery(query, [noteId, userId]);
    return (result.rowCount || 0) > 0;
  }

  // Flashcards management
  async getUserFlashcards(userId: number): Promise<Flashcard[]> {
    if (this.isDevelopmentMode()) {
      return []; // Return empty array for development
    }

    const query = 'SELECT * FROM flashcards WHERE user_id = $1 ORDER BY created_at DESC';
    const result = await this.pool!.query(query, [userId]);
    return result.rows;
  }

  async createFlashcards(userId: string | number, flashcards: Array<{
    set_id: string;
    set_name: string;
    set_description?: string;
    front: string;
    back: string;
    difficulty?: string;
  }>): Promise<Flashcard[]> {
    const query = `
      INSERT INTO flashcards (user_id, set_id, set_name, set_description, front, back, difficulty, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `;
    
    const results = [];
    for (const flashcard of flashcards) {
      const result = await this.executeQuery(query, [
        userId,
        flashcard.set_id,
        flashcard.set_name,
        flashcard.set_description,
        flashcard.front,
        flashcard.back,
        flashcard.difficulty || 'medium'
      ]);
      results.push(result.rows[0]);
    }
    
    return results;
  }

  async deleteFlashcardSet(userId: string | number, setId: string): Promise<{ deletedCount: number }> {
    if (!this.pool) {
      throw new Error('Database not available');
    }

    const query = 'DELETE FROM flashcards WHERE user_id = $1 AND set_id = $2';
    const result = await this.executeQuery(query, [userId, setId]);
    
    return { deletedCount: result.rowCount || 0 };
  }

  // Essays management
  async getUserEssays(userId: number): Promise<Essay[]> {
    const query = 'SELECT * FROM essays WHERE user_id = $1 ORDER BY created_at DESC';
    const result = await this.executeQuery(query, [userId]);
    return result.rows;
  }

  async createEssay(userId: number, essayData: {
    title: string;
    prompt: string;
    content: string;
    word_count: number;
    citations?: Record<string, any>;
  }): Promise<Essay> {
    const query = `
      INSERT INTO essays (user_id, title, prompt, content, word_count, citations, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `;
    const result = await this.executeQuery(query, [
      userId,
      essayData.title,
      essayData.prompt,
      essayData.content,
      essayData.word_count,
      JSON.stringify(essayData.citations)
    ]);
    return result.rows[0];
  }

  // Sync events management
  async createSyncEvent(eventData: {
    userId: number;
    eventType: string;
    data: Record<string, any>;
    platform: string;
  }): Promise<SyncEvent> {
    const query = `
      INSERT INTO sync_events (user_id, event_type, data, platform, processed, created_at)
      VALUES ($1, $2, $3, $4, false, NOW())
      RETURNING *
    `;
    const result = await this.executeQuery(query, [
      eventData.userId,
      eventData.eventType,
      JSON.stringify(eventData.data),
      eventData.platform
    ]);
    return result.rows[0];
  }

  async getRecentSyncEvents(userId: number, platform: string, limit: number = 50): Promise<SyncEvent[]> {
    const query = `
      SELECT * FROM sync_events 
      WHERE user_id = $1 AND platform != $2 AND processed = false
      ORDER BY created_at DESC
      LIMIT $3
    `;
    const result = await this.executeQuery(query, [userId, platform, limit]);
    return result.rows;
  }

  async markSyncEventProcessed(eventId: number): Promise<void> {
    const query = 'UPDATE sync_events SET processed = true WHERE id = $1';
    await this.executeQuery(query, [eventId]);
  }

  // Mobile subscription management
  async createMobileSubscription(subscriptionData: {
    userId: number;
    platform: string;
    productId: string;
    transactionId: string;
    purchaseToken?: string;
    expiresAt?: Date;
  }): Promise<MobileSubscription> {
    const query = `
      INSERT INTO mobile_subscriptions (user_id, platform, product_id, transaction_id, purchase_token, is_active, expires_at, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, true, $6, NOW(), NOW())
      RETURNING *
    `;
    const result = await this.executeQuery(query, [
      subscriptionData.userId,
      subscriptionData.platform,
      subscriptionData.productId,
      subscriptionData.transactionId,
      subscriptionData.purchaseToken,
      subscriptionData.expiresAt
    ]);
    return result.rows[0];
  }

  async getUserMobileSubscriptions(userId: number): Promise<MobileSubscription[]> {
    const query = 'SELECT * FROM mobile_subscriptions WHERE user_id = $1 ORDER BY created_at DESC';
    const result = await this.executeQuery(query, [userId]);
    return result.rows;
  }

  // Utility methods
  private generateSessionToken(): string {
    return require('crypto').randomBytes(32).toString('hex');
  }

  // Public query method for platform stats
  async query(sql: string, params: any[] = []): Promise<any> {
    return await this.executeQuery(sql, params);
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    if (this.isDevelopmentMode()) {
      console.log('⚠️  Health check: Development mode (no database)');
      return false;
    }
    
    if (!this.pool) {
      console.error('❌ Health check: Database pool not initialized');
      return false;
    }
    
    try {
      const result = await this.pool.query('SELECT NOW() as current_time, version() as pg_version');
      console.log('✅ Database health check passed:', {
        currentTime: result.rows[0].current_time,
        pgVersion: result.rows[0].pg_version.substring(0, 50) + '...'
      });
      return true;
    } catch (error: any) {
      console.error('❌ Database health check failed:', {
        message: error.message,
        code: error.code,
        detail: error.detail
      });
      return false;
    }
  }
  
  // Get database connection status and info
  async getConnectionInfo(): Promise<{
    connected: boolean;
    hasPool: boolean;
    hasDatabaseUrl: boolean;
    error?: string;
    details?: any;
  }> {
    const hasDatabaseUrl = !!process.env.DATABASE_URL;
    const hasPool = !!this.pool;
    
    if (!hasDatabaseUrl) {
      return {
        connected: false,
        hasPool: false,
        hasDatabaseUrl: false,
        error: 'DATABASE_URL environment variable not set'
      };
    }
    
    if (!hasPool) {
      return {
        connected: false,
        hasPool: false,
        hasDatabaseUrl: true,
        error: 'Database pool not initialized despite DATABASE_URL being set'
      };
    }
    
    try {
      const result = await this.pool.query(`
        SELECT 
          NOW() as current_time,
          version() as pg_version,
          current_database() as database_name,
          current_user as database_user
      `);
      
      const isHealthy = await this.healthCheck();
      
      return {
        connected: isHealthy,
        hasPool: true,
        hasDatabaseUrl: true,
        details: {
          currentTime: result.rows[0].current_time,
          databaseName: result.rows[0].database_name,
          databaseUser: result.rows[0].database_user,
          pgVersion: result.rows[0].pg_version.substring(0, 100)
        }
      };
    } catch (error: any) {
      return {
        connected: false,
        hasPool: true,
        hasDatabaseUrl: true,
        error: error.message,
        details: {
          code: error.code,
          detail: error.detail
        }
      };
    }
  }


  // Create notes from video analysis
  async createNotes(notes: Array<{
    title: string;
    content: string;
    userId: string;
    source: string;
    sourceId: string;
  }>): Promise<void> {
    if (!this.pool) {
      throw new Error('Database not available');
    }

    const query = `
      INSERT INTO notes (title, content, user_id, source, source_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
    `;

    for (const note of notes) {
      await this.executeQuery(query, [
        note.title,
        note.content,
        note.userId,
        note.source,
        note.sourceId
      ]);
    }
  }

  // Video Analysis Methods
  async createVideoAnalysis(analysis: {
    id: string;
    userId: string;
    title: string;
    source: string;
    sourceUrl?: string;
    status: string;
    progress: number;
  }): Promise<void> {
    if (this.isDevelopmentMode()) {
      console.log('Mock: Creating video analysis:', analysis);
      return;
    }

    const query = `
      INSERT INTO video_analyses (id, user_id, title, source, source_url, status, progress, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
    `;
    await this.executeQuery(query, [
      analysis.id,
      analysis.userId,
      analysis.title,
      analysis.source,
      analysis.sourceUrl,
      analysis.status,
      analysis.progress
    ]);
  }

  async getVideoAnalysis(analysisId: string): Promise<any> {
    if (this.isDevelopmentMode()) {
      // Return mock data for development
      return {
        id: analysisId,
        userId: 'test@example.com',
        title: 'Mock Video Analysis',
        source: 'youtube',
        sourceUrl: 'https://youtube.com/watch?v=test',
        status: 'completed',
        progress: 100,
        transcript: 'This is a mock transcript for testing purposes.',
        topics: [
          {
            id: 'topic-1',
            title: 'Introduction',
            startTime: 0,
            endTime: 60,
            content: 'This is the introduction section of the video.'
          },
          {
            id: 'topic-2',
            title: 'Main Content',
            startTime: 60,
            endTime: 300,
            content: 'This is the main content section of the video.'
          }
        ],
        overallSummary: 'This is a mock summary of the video content.',
        flashcards: [
          { id: 'card-1', front: 'What is the main topic?', back: 'The main topic covers key concepts.' },
          { id: 'card-2', front: 'What are the key points?', back: 'The key points include important details.' }
        ]
      };
    }

    const query = 'SELECT * FROM video_analyses WHERE id = $1';
    const result = await this.executeQuery(query, [analysisId]);
    const analysis = result.rows[0] || null;
    
    if (analysis) {
      console.log(`📊 Retrieved video analysis from database:`, {
        id: analysis.id,
        status: analysis.status,
        progress: analysis.progress,
        hasTranscript: !!analysis.transcript,
        transcriptLength: analysis.transcript ? analysis.transcript.length : 0,
        hasTopics: !!analysis.topics,
        hasSummary: !!analysis.overall_summary
      });
    } else {
      console.log(`❌ No video analysis found for ID: ${analysisId}`);
    }
    
    return analysis;
  }

  async updateVideoAnalysis(analysisId: string, updates: any): Promise<void> {
    if (this.isDevelopmentMode()) {
      console.log('Mock: Updating video analysis:', analysisId, updates);
      return;
    }

    console.log(`📝 Updating video analysis ${analysisId}:`, {
      updateFields: Object.keys(updates),
      hasTranscript: 'transcript' in updates,
      transcriptLength: updates.transcript ? updates.transcript.length : 0,
      progress: updates.progress,
      status: updates.status
    });

    // Convert arrays/objects to JSON strings for JSONB fields
    const processedUpdates = { ...updates };
    if (processedUpdates.topics && Array.isArray(processedUpdates.topics)) {
      processedUpdates.topics = JSON.stringify(processedUpdates.topics);
      console.log(`📝 Converting topics to JSON string: ${processedUpdates.topics.length} characters`);
    }
    if (processedUpdates.notes && Array.isArray(processedUpdates.notes)) {
      processedUpdates.notes = JSON.stringify(processedUpdates.notes);
    }
    if (processedUpdates.flashcards && Array.isArray(processedUpdates.flashcards)) {
      processedUpdates.flashcards = JSON.stringify(processedUpdates.flashcards);
    }

    const fields = Object.keys(processedUpdates);
    const values = Object.values(processedUpdates);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const query = `
      UPDATE video_analyses 
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
    `;
    await this.executeQuery(query, [analysisId, ...values]);
    
    console.log(`✅ Video analysis ${analysisId} updated successfully`);
  }

  async updateVideoAnalysisTopic(analysisId: string, topicId: string, updates: any): Promise<void> {
    if (this.isDevelopmentMode()) {
      console.log('Mock: Updating video analysis topic:', analysisId, topicId, updates);
      return;
    }

    // This would require updating the JSONB topics field
    // For now, just log in development mode
    console.log('Topic update not implemented in database yet');
  }

  async addVideoAnalysisFlashcards(analysisId: string, flashcards: any[]): Promise<void> {
    if (this.isDevelopmentMode()) {
      console.log('Mock: Adding video analysis flashcards:', analysisId, flashcards);
      return;
    }

    // This would require updating the JSONB flashcards field
    // For now, just log in development mode
    console.log('Flashcards update not implemented in database yet');
  }

  // ==================== AI LEARNING METHODS ====================

  // Check if note_embeddings table uses vector type or JSONB
  private async checkEmbeddingColumnType(): Promise<'vector' | 'jsonb' | null> {
    if (this.isDevelopmentMode() || !pool) {
      return null;
    }

    try {
      const result = await pool.query(`
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = 'note_embeddings' 
        AND column_name = 'embedding'
      `);
      
      if (result.rows.length === 0) {
        return null; // Table doesn't exist
      }
      
      const dataType = result.rows[0].data_type;
      if (dataType === 'USER-DEFINED') {
        // Check if it's the vector type by trying to query pg_type
        const typeCheck = await pool.query(`
          SELECT t.typname 
          FROM pg_type t
          JOIN pg_attribute a ON a.atttypid = t.oid
          JOIN pg_class c ON c.oid = a.attrelid
          WHERE c.relname = 'note_embeddings' 
          AND a.attname = 'embedding'
        `);
        if (typeCheck.rows.length > 0 && typeCheck.rows[0].typname === 'vector') {
          return 'vector';
        }
      } else if (dataType === 'jsonb') {
        return 'jsonb';
      }
      
      return null;
    } catch (error) {
      console.warn('⚠️  Could not check embedding column type:', error);
      return null;
    }
  }

  // Store or update note embedding
  async storeNoteEmbedding(noteId: number, userId: number, contentType: string, contentText: string, embedding: number[]): Promise<void> {
    if (this.isDevelopmentMode()) {
      console.log('Mock: Storing note embedding:', { noteId, userId, contentType });
      return;
    }

    const columnType = await this.checkEmbeddingColumnType();
    
    if (!columnType) {
      console.warn('⚠️  note_embeddings table not found or embedding column type unknown');
      return;
    }

    let query: string;
    let params: any[];

    if (columnType === 'vector') {
      // Store as vector type
      const embeddingStr = `[${embedding.join(',')}]`;
      query = `
        INSERT INTO note_embeddings (note_id, user_id, content_type, content_text, embedding)
        VALUES ($1, $2, $3, $4, $5::vector)
        ON CONFLICT (note_id, content_type) 
        DO UPDATE SET 
          content_text = EXCLUDED.content_text,
          embedding = EXCLUDED.embedding,
          updated_at = NOW()
      `;
      params = [noteId, userId, contentType, contentText, embeddingStr];
    } else {
      // Store as JSONB
      query = `
        INSERT INTO note_embeddings (note_id, user_id, content_type, content_text, embedding)
        VALUES ($1, $2, $3, $4, $5::jsonb)
        ON CONFLICT (note_id, content_type) 
        DO UPDATE SET 
          content_text = EXCLUDED.content_text,
          embedding = EXCLUDED.embedding,
          updated_at = NOW()
      `;
      params = [noteId, userId, contentType, contentText, JSON.stringify(embedding)];
    }
    
    await this.executeQuery(query, params);
    console.log(`✅ Stored embedding for note ${noteId}, type: ${contentType} (${columnType})`);
  }

  // Calculate cosine similarity between two vectors (for JSONB fallback)
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }
    
    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  // Vector similarity search - find most relevant notes for a question
  async searchSimilarNotes(userId: number, queryEmbedding: number[], limit: number = 5): Promise<NoteEmbedding[]> {
    if (this.isDevelopmentMode()) {
      console.log('Mock: Searching similar notes for user:', userId);
      return [];
    }

    const columnType = await this.checkEmbeddingColumnType();
    
    if (!columnType) {
      console.warn('⚠️  note_embeddings table not found or embedding column type unknown');
      return [];
    }

    if (columnType === 'vector') {
      // Use vector similarity search (fast and efficient)
      const embeddingStr = `[${queryEmbedding.join(',')}]`;
      
      const query = `
        SELECT 
          ne.id,
          ne.note_id,
          ne.user_id,
          ne.content_type,
          ne.content_text,
          n.title,
          1 - (ne.embedding <=> $1::vector) as similarity
        FROM note_embeddings ne
        JOIN notes n ON ne.note_id = n.id
        WHERE ne.user_id = $2
        ORDER BY ne.embedding <=> $1::vector
        LIMIT $3
      `;
      
      try {
        const result = await this.executeQuery(query, [embeddingStr, userId, limit]);
        return result.rows.map((row: any) => ({
          id: row.id,
          note_id: row.note_id,
          user_id: row.user_id,
          content_type: row.content_type,
          content_text: row.content_text,
          embedding: [], // Don't return the full embedding to save bandwidth
          created_at: row.created_at,
          updated_at: row.updated_at,
          title: row.title,
          similarity: row.similarity
        })) as NoteEmbedding[];
      } catch (error: any) {
        console.warn('⚠️  Vector similarity search failed:', error.message);
        return [];
      }
    } else {
      // Fallback: Load all embeddings and calculate similarity in JavaScript
      // This is less efficient but works without pgvector
      console.log('⚠️  Using JSONB fallback for similarity search (slower, but works without pgvector)');
      
      const query = `
        SELECT 
          ne.id,
          ne.note_id,
          ne.user_id,
          ne.content_type,
          ne.content_text,
          ne.embedding,
          n.title
        FROM note_embeddings ne
        JOIN notes n ON ne.note_id = n.id
        WHERE ne.user_id = $1
      `;
      
      try {
        const result = await this.executeQuery(query, [userId]);
        
        // Calculate similarity for each embedding
        const notesWithSimilarity = result.rows.map((row: any) => {
          let storedEmbedding: number[] = [];
          try {
            storedEmbedding = typeof row.embedding === 'string' 
              ? JSON.parse(row.embedding) 
              : row.embedding;
          } catch (e) {
            console.warn('⚠️  Could not parse embedding for note', row.note_id);
            return null;
          }
          
          const similarity = this.cosineSimilarity(queryEmbedding, storedEmbedding);
          
          return {
            id: row.id,
            note_id: row.note_id,
            user_id: row.user_id,
            content_type: row.content_type,
            content_text: row.content_text,
            embedding: [],
            created_at: row.created_at,
            updated_at: row.updated_at,
            title: row.title,
            similarity
          };
        }).filter((note: any) => note !== null) as NoteEmbedding[];
        
        // Sort by similarity and limit
        notesWithSimilarity.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
        return notesWithSimilarity.slice(0, limit);
      } catch (error: any) {
        console.warn('⚠️  JSONB similarity search failed:', error.message);
        return [];
      }
    }
  }

  // Store user question and answer for learning
  async storeUserQuestion(userId: number, question: string, answer: string, contextNoteIds: number[], topicTags: string[], difficulty: string = 'medium'): Promise<UserQuestion> {
    if (this.isDevelopmentMode()) {
      console.log('Mock: Storing user question:', { userId, question });
      return {
        id: 1,
        user_id: userId,
        question,
        answer,
        context_note_ids: contextNoteIds,
        topic_tags: topicTags,
        difficulty,
        created_at: new Date(),
        updated_at: new Date()
      };
    }

    const query = `
      INSERT INTO user_questions (user_id, question, answer, context_note_ids, topic_tags, difficulty)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const result = await this.executeQuery(query, [userId, question, answer, contextNoteIds, topicTags, difficulty]);
    return result.rows[0];
  }

  // Get user's knowledge profile
  async getUserKnowledgeProfile(userId: number): Promise<UserKnowledgeProfile | null> {
    if (this.isDevelopmentMode()) {
      return {
        id: 1,
        user_id: userId,
        topics_studied: [],
        weak_areas: [],
        strong_areas: [],
        study_preferences: {},
        question_patterns: {},
        last_updated: new Date(),
        created_at: new Date()
      };
    }

    const query = 'SELECT * FROM user_knowledge_profiles WHERE user_id = $1';
    const result = await this.executeQuery(query, [userId]);
    
    if (result.rows.length === 0) {
      // Create default profile if doesn't exist
      const insertQuery = `
        INSERT INTO user_knowledge_profiles (user_id)
        VALUES ($1)
        RETURNING *
      `;
      const insertResult = await this.executeQuery(insertQuery, [userId]);
      return insertResult.rows[0];
    }
    
    return result.rows[0];
  }

  // Update user knowledge profile
  async updateUserKnowledgeProfile(userId: number, updates: Partial<UserKnowledgeProfile>): Promise<UserKnowledgeProfile> {
    if (this.isDevelopmentMode()) {
      console.log('Mock: Updating knowledge profile:', userId, updates);
      return this.getUserKnowledgeProfile(userId) as Promise<UserKnowledgeProfile>;
    }

    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => {
      // Handle JSONB fields
      if (field === 'topics_studied' || field === 'weak_areas' || field === 'strong_areas' || 
          field === 'study_preferences' || field === 'question_patterns') {
        return `${field} = $${index + 2}::jsonb`;
      }
      return `${field} = $${index + 2}`;
    }).join(', ');
    
    const processedValues = values.map(v => 
      typeof v === 'object' ? JSON.stringify(v) : v
    );
    
    const query = `
      UPDATE user_knowledge_profiles 
      SET ${setClause}, last_updated = NOW()
      WHERE user_id = $1
      RETURNING *
    `;
    
    const result = await this.executeQuery(query, [userId, ...processedValues]);
    return result.rows[0];
  }

  // Get user's recent questions
  async getUserQuestions(userId: number, limit: number = 20): Promise<UserQuestion[]> {
    if (this.isDevelopmentMode()) {
      return [];
    }

    const query = `
      SELECT * FROM user_questions 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `;
    const result = await this.executeQuery(query, [userId, limit]);
    return result.rows;
  }

  // Delete embeddings when note is deleted (handled by CASCADE, but useful for cleanup)
  async deleteNoteEmbeddings(noteId: number): Promise<void> {
    if (this.isDevelopmentMode()) {
      console.log('Mock: Deleting embeddings for note:', noteId);
      return;
    }

    const query = 'DELETE FROM note_embeddings WHERE note_id = $1';
    await this.executeQuery(query, [noteId]);
    console.log(`✅ Deleted embeddings for note ${noteId}`);
  }

  // Delete specific embedding type for a note
  async deleteNoteEmbeddingByType(noteId: number, contentType: string): Promise<void> {
    if (this.isDevelopmentMode()) {
      console.log('Mock: Deleting embedding for note:', noteId, contentType);
      return;
    }

    const query = 'DELETE FROM note_embeddings WHERE note_id = $1 AND content_type = $2';
    await this.executeQuery(query, [noteId, contentType]);
    console.log(`✅ Deleted ${contentType} embedding for note ${noteId}`);
  }
}

// Export singleton instance
export const db = new DatabaseService();
