import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database connection pool
let pool: Pool | null = null;

// Initialize database connection only if DATABASE_URL is available
if (process.env.DATABASE_URL) {
  console.log('🔗 Initializing database connection with DATABASE_URL');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  console.log('✅ Database connection pool initialized');
} else {
  console.log('🔧 Running in development mode with mock database - no DATABASE_URL found');
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
    return await this.pool!.query(query, params);
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

  // Health check
  async healthCheck(): Promise<boolean> {
    if (this.isDevelopmentMode()) {
      return true; // Mock database is always "healthy"
    }
    
    try {
      await this.pool!.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
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
}

// Export singleton instance
export const db = new DatabaseService();
