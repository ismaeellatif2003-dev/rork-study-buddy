import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

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

export class DatabaseService {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  // Connection management
  async connect(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  async close(): Promise<void> {
    await this.pool.end();
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
    const result = await this.pool.query(query, [
      userData.googleId,
      userData.email,
      userData.name,
      userData.picture
    ]);
    return result.rows[0];
  }

  async getUserByGoogleId(googleId: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE google_id = $1';
    const result = await this.pool.query(query, [googleId]);
    return result.rows[0] || null;
  }

  async getUserById(userId: number): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await this.pool.query(query, [userId]);
    return result.rows[0] || null;
  }

  async updateUserLastLogin(userId: number): Promise<void> {
    const query = 'UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1';
    await this.pool.query(query, [userId]);
  }

  async updateUserMobileDevice(userId: number, deviceId: string): Promise<void> {
    const query = 'UPDATE users SET mobile_device_id = $1, updated_at = NOW() WHERE id = $2';
    await this.pool.query(query, [deviceId, userId]);
  }

  async updateUserWebSession(userId: number, sessionId: string): Promise<void> {
    const query = 'UPDATE users SET web_session_id = $1, updated_at = NOW() WHERE id = $2';
    await this.pool.query(query, [sessionId, userId]);
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

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getUserProfile(userId: number): Promise<{
    age?: number;
    educationLevel?: string;
    isOnboardingComplete: boolean;
  } | null> {
    const query = 'SELECT age, education_level, is_onboarding_complete FROM users WHERE id = $1';
    const result = await this.pool.query(query, [userId]);
    
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
  async createSubscription(userId: number, planId: string): Promise<UserSubscription> {
    const query = `
      INSERT INTO subscriptions (user_id, plan_id, is_active, created_at, expires_at)
      VALUES ($1, $2, true, NOW(), $3)
      RETURNING *
    `;
    const expiresAt = planId === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const result = await this.pool.query(query, [userId, planId, expiresAt]);
    return result.rows[0];
  }

  async getUserSubscription(userId: number): Promise<UserSubscription | null> {
    const query = `
      SELECT s.*, p.name as plan_name, p.limits
      FROM subscriptions s
      JOIN subscription_plans p ON s.plan_id = p.id
      WHERE s.user_id = $1 AND s.is_active = true
      ORDER BY s.created_at DESC
      LIMIT 1
    `;
    const result = await this.pool.query(query, [userId]);
    return result.rows[0] || null;
  }

  async updateUserSubscription(userId: number, planId: string): Promise<UserSubscription> {
    // Deactivate current subscription
    await this.pool.query(
      'UPDATE subscriptions SET is_active = false, updated_at = NOW() WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    // Create new subscription
    return await this.createSubscription(userId, planId);
  }

  async getSubscriptionPlan(planId: string): Promise<SubscriptionPlan | null> {
    const query = 'SELECT * FROM subscription_plans WHERE id = $1';
    const result = await this.pool.query(query, [planId]);
    return result.rows[0] || null;
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
    const result = await this.pool.query(query, [
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
    const result = await this.pool.query(query, [sessionToken]);
    return result.rows[0] || null;
  }

  async deleteUserSession(sessionToken: string): Promise<void> {
    const query = 'DELETE FROM user_sessions WHERE session_token = $1';
    await this.pool.query(query, [sessionToken]);
  }

  async cleanupExpiredSessions(): Promise<void> {
    const query = 'DELETE FROM user_sessions WHERE expires_at <= NOW()';
    await this.pool.query(query);
  }

  // Usage tracking
  async getUserUsageStats(userId: number): Promise<UserUsage> {
    const query = 'SELECT * FROM user_usage WHERE user_id = $1';
    const result = await this.pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
      // Create default usage record
      const insertQuery = `
        INSERT INTO user_usage (user_id, notes, flashcards, messages, essays, ocr_scans, updated_at)
        VALUES ($1, 0, 0, 0, 0, 0, NOW())
        RETURNING *
      `;
      const insertResult = await this.pool.query(insertQuery, [userId]);
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
    const result = await this.pool.query(query, [userId, increment]);
    return result.rows[0];
  }

  // Notes management
  async getUserNotes(userId: number): Promise<Note[]> {
    const query = 'SELECT * FROM notes WHERE user_id = $1 ORDER BY created_at DESC';
    const result = await this.pool.query(query, [userId]);
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
    const result = await this.pool.query(query, [
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
    const result = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async deleteNote(noteId: number, userId: number): Promise<boolean> {
    const query = 'DELETE FROM notes WHERE id = $1 AND user_id = $2';
    const result = await this.pool.query(query, [noteId, userId]);
    return (result.rowCount || 0) > 0;
  }

  // Flashcards management
  async getUserFlashcards(userId: number): Promise<Flashcard[]> {
    const query = 'SELECT * FROM flashcards WHERE user_id = $1 ORDER BY created_at DESC';
    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  async createFlashcards(userId: number, flashcards: Array<{
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
      const result = await this.pool.query(query, [
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

  // Essays management
  async getUserEssays(userId: number): Promise<Essay[]> {
    const query = 'SELECT * FROM essays WHERE user_id = $1 ORDER BY created_at DESC';
    const result = await this.pool.query(query, [userId]);
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
    const result = await this.pool.query(query, [
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
    const result = await this.pool.query(query, [
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
    const result = await this.pool.query(query, [userId, platform, limit]);
    return result.rows;
  }

  async markSyncEventProcessed(eventId: number): Promise<void> {
    const query = 'UPDATE sync_events SET processed = true WHERE id = $1';
    await this.pool.query(query, [eventId]);
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
    const result = await this.pool.query(query, [
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
    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  // Utility methods
  private generateSessionToken(): string {
    return require('crypto').randomBytes(32).toString('hex');
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const db = new DatabaseService();
