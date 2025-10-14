import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database migration utility
class DatabaseMigrator {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
  }

  async migrate(): Promise<void> {
    try {
      console.log('Starting database migration...');
      
      // Read schema file
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      // Execute schema
      await this.pool.query(schema);
      
      console.log('✅ Database migration completed successfully!');
      
      // Verify tables were created
      await this.verifyTables();
      
    } catch (error) {
      console.error('❌ Database migration failed:', error);
      throw error;
    } finally {
      await this.pool.end();
    }
  }

  private async verifyTables(): Promise<void> {
    const expectedTables = [
      'users',
      'subscription_plans',
      'subscriptions',
      'user_sessions',
      'user_usage',
      'notes',
      'flashcards',
      'essays',
      'sync_events',
      'mobile_subscriptions'
    ];

    const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `;
    
    const result = await this.pool.query(query);
    const existingTables = result.rows.map(row => row.table_name);
    
    console.log('\n📊 Database Tables:');
    for (const table of expectedTables) {
      const exists = existingTables.includes(table);
      console.log(`  ${exists ? '✅' : '❌'} ${table}`);
    }
    
    // Check subscription plans
    const plansQuery = 'SELECT id, name, price FROM subscription_plans';
    const plansResult = await this.pool.query(plansQuery);
    console.log('\n📋 Subscription Plans:');
    plansResult.rows.forEach(plan => {
      console.log(`  • ${plan.name} (${plan.id}) - $${plan.price}`);
    });
  }

  async reset(): Promise<void> {
    try {
      console.log('⚠️  Resetting database...');
      
      // Drop all tables in reverse order (to handle foreign key constraints)
      const dropTables = [
        'mobile_subscriptions',
        'sync_events',
        'essays',
        'flashcards',
        'notes',
        'user_usage',
        'user_sessions',
        'subscriptions',
        'subscription_plans',
        'users'
      ];

      for (const table of dropTables) {
        try {
          await this.pool.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
          console.log(`  Dropped table: ${table}`);
        } catch (error) {
          console.log(`  Table ${table} doesn't exist or couldn't be dropped`);
        }
      }

      // Drop functions
      try {
        await this.pool.query('DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE');
        console.log('  Dropped function: update_updated_at_column');
      } catch (error) {
        console.log('  Function update_updated_at_column doesn\'t exist');
      }

      console.log('✅ Database reset completed!');
      
    } catch (error) {
      console.error('❌ Database reset failed:', error);
      throw error;
    } finally {
      await this.pool.end();
    }
  }

  async seed(): Promise<void> {
    try {
      console.log('🌱 Seeding database with sample data...');
      
      // Create a test user
      const userQuery = `
        INSERT INTO users (google_id, email, name, picture, created_at, updated_at, last_login_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW(), NOW())
        ON CONFLICT (google_id) DO NOTHING
        RETURNING id
      `;
      
      const userResult = await this.pool.query(userQuery, [
        'test-google-id-123',
        'test@example.com',
        'Test User',
        'https://example.com/avatar.jpg'
      ]);
      
      if (userResult.rows.length > 0) {
        const userId = userResult.rows[0].id;
        console.log(`  Created test user with ID: ${userId}`);
        
        // Create free subscription
        await this.pool.query(
          'INSERT INTO subscriptions (user_id, plan_id, is_active, created_at) VALUES ($1, $2, true, NOW())',
          [userId, 'free']
        );
        console.log('  Created free subscription for test user');
        
        // Create sample note
        await this.pool.query(`
          INSERT INTO notes (user_id, title, content, summary, created_at, updated_at)
          VALUES ($1, $2, $3, $4, NOW(), NOW())
        `, [
          userId,
          'Sample Note',
          'This is a sample note for testing purposes.',
          'A test note summary'
        ]);
        console.log('  Created sample note');
        
        // Create sample flashcards
        await this.pool.query(`
          INSERT INTO flashcards (user_id, set_id, set_name, set_description, front, back, difficulty, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        `, [
          userId,
          'sample-set-1',
          'Sample Flashcard Set',
          'A set of sample flashcards for testing',
          'What is the capital of France?',
          'Paris',
          'easy'
        ]);
        console.log('  Created sample flashcard');
      }
      
      console.log('✅ Database seeding completed!');
      
    } catch (error) {
      console.error('❌ Database seeding failed:', error);
      throw error;
    } finally {
      await this.pool.end();
    }
  }
}

// CLI interface
async function main() {
  const command = process.argv[2];
  const migrator = new DatabaseMigrator();
  
  switch (command) {
    case 'migrate':
      await migrator.migrate();
      break;
    case 'reset':
      await migrator.reset();
      break;
    case 'seed':
      await migrator.seed();
      break;
    case 'reset-and-migrate':
      await migrator.reset();
      await migrator.migrate();
      break;
    case 'full-setup':
      await migrator.reset();
      await migrator.migrate();
      await migrator.seed();
      break;
    default:
      console.log(`
🗄️  Study Buddy Database Migrator

Usage: npm run db:<command>

Commands:
  migrate          - Run database migration
  reset            - Reset database (drop all tables)
  seed             - Seed database with sample data
  reset-and-migrate - Reset and migrate database
  full-setup       - Reset, migrate, and seed database

Examples:
  npm run db:migrate
  npm run db:full-setup
      `);
      break;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { DatabaseMigrator };
