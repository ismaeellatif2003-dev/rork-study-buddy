import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔍 Checking database contents...\n');

    // Check users
    const usersResult = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log(`👤 Users: ${usersResult.rows[0].count}`);

    // Check subscription plans
    const plansResult = await pool.query('SELECT id, name, price FROM subscription_plans ORDER BY price');
    console.log(`\n📋 Subscription Plans:`);
    plansResult.rows.forEach(plan => {
      console.log(`  • ${plan.name} (${plan.id}) - $${plan.price}`);
    });

    // Check subscriptions
    const subsResult = await pool.query('SELECT COUNT(*) as count FROM subscriptions');
    console.log(`\n💳 Active Subscriptions: ${subsResult.rows[0].count}`);

    // Check user sessions
    const sessionsResult = await pool.query('SELECT COUNT(*) as count FROM user_sessions');
    console.log(`🔐 User Sessions: ${sessionsResult.rows[0].count}`);

    // Check usage stats
    const usageResult = await pool.query('SELECT COUNT(*) as count FROM user_usage');
    console.log(`📊 Usage Records: ${usageResult.rows[0].count}`);

    // Check notes
    const notesResult = await pool.query('SELECT COUNT(*) as count FROM notes');
    console.log(`📝 Notes: ${notesResult.rows[0].count}`);

    // Check flashcards
    const flashcardsResult = await pool.query('SELECT COUNT(*) as count FROM flashcards');
    console.log(`🃏 Flashcards: ${flashcardsResult.rows[0].count}`);

    // Check essays
    const essaysResult = await pool.query('SELECT COUNT(*) as count FROM essays');
    console.log(`📄 Essays: ${essaysResult.rows[0].count}`);

    console.log('\n✅ Database check completed!');

  } catch (error) {
    console.error('❌ Database check failed:', error);
  } finally {
    await pool.end();
  }
}

checkDatabase().catch(console.error);
