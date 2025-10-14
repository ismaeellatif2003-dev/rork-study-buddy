# Study Buddy Database Setup

This directory contains the database schema, migration scripts, and utilities for the Study Buddy backend.

## 📁 Files

- `schema.sql` - Complete database schema with all tables, indexes, and triggers
- `migrate.ts` - Database migration utility for setting up and managing the database
- `test-connection.ts` - Database connection and operation testing utility
- `README.md` - This documentation file

## 🗄️ Database Schema

The database includes the following tables:

### Core Tables
- **users** - User accounts with Google SSO integration
- **subscription_plans** - Available subscription plans (Free, Pro Monthly, Pro Yearly)
- **subscriptions** - User subscription records
- **user_sessions** - Cross-platform session management
- **user_usage** - Usage tracking for limits enforcement

### Content Tables
- **notes** - User-created study notes
- **flashcards** - User-created flashcards
- **essays** - AI-generated essays
- **sync_events** - Cross-platform data synchronization events

### Mobile Integration
- **mobile_subscriptions** - Mobile app subscription linking

## 🚀 Quick Start

### 1. Set up Environment Variables

Copy the example environment file and configure your database:

```bash
cp env.example .env
```

Edit `.env` and set your `DATABASE_URL`:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/study_buddy
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Database Migration

```bash
# Full setup (reset, migrate, and seed with sample data)
npm run db:full-setup

# Or step by step:
npm run db:migrate    # Create tables
npm run db:seed       # Add sample data
```

### 4. Test Database Connection

```bash
npm run db:test
```

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `npm run db:migrate` | Run database migration (create tables) |
| `npm run db:reset` | Reset database (drop all tables) |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:reset-and-migrate` | Reset and migrate database |
| `npm run db:full-setup` | Reset, migrate, and seed database |
| `npm run db:test` | Test database connection and operations |

## 🔧 Database Configuration

### PostgreSQL Setup

1. **Install PostgreSQL** (if not already installed)
2. **Create database**:
   ```sql
   CREATE DATABASE study_buddy;
   ```
3. **Set connection string** in your `.env` file

### Railway PostgreSQL (Production)

1. **Add PostgreSQL addon** to your Railway project
2. **Copy connection string** from Railway dashboard
3. **Set DATABASE_URL** in Railway environment variables

## 📊 Database Features

### Cross-Platform Sync
- **User sessions** track active sessions across mobile and web
- **Sync events** log changes for real-time synchronization
- **Device tracking** links mobile devices to user accounts

### Subscription Management
- **Plan definitions** with usage limits and features
- **User subscriptions** with expiration tracking
- **Mobile subscription linking** for cross-platform billing

### Usage Tracking
- **Real-time limits** enforcement
- **Usage statistics** for analytics
- **Cross-platform sync** of usage data

### Data Integrity
- **Foreign key constraints** ensure data consistency
- **Automatic timestamps** with triggers
- **Indexes** for optimal query performance

## 🔍 Testing

The database test utility (`test-connection.ts`) performs comprehensive testing:

- ✅ **Connection health check**
- ✅ **User operations** (create, read, update)
- ✅ **Subscription operations** (create, update, retrieve)
- ✅ **Session management** (create, retrieve, delete)
- ✅ **Usage tracking** (create, update, increment)

Run tests with:
```bash
npm run db:test
```

## 🚨 Troubleshooting

### Common Issues

1. **Connection refused**
   - Check if PostgreSQL is running
   - Verify DATABASE_URL format
   - Ensure database exists

2. **Permission denied**
   - Check database user permissions
   - Verify password in connection string

3. **SSL errors**
   - Add `?sslmode=require` to DATABASE_URL for production
   - Use `sslmode=disable` for local development

### Debug Mode

Enable debug logging by setting:
```env
LOG_LEVEL=debug
```

## 📈 Performance

### Indexes
The schema includes optimized indexes for:
- User lookups by Google ID and email
- Active subscription queries
- Session token lookups
- Usage tracking queries
- Content queries by user ID

### Connection Pooling
- **Max connections**: 20
- **Idle timeout**: 30 seconds
- **Connection timeout**: 2 seconds

## 🔒 Security

### Data Protection
- **Password hashing** with bcryptjs
- **JWT tokens** for session management
- **SQL injection protection** with parameterized queries
- **SSL connections** in production

### Access Control
- **User isolation** with user_id foreign keys
- **Session validation** with expiration checks
- **Platform-specific** device tracking

## 📝 Schema Changes

When modifying the database schema:

1. **Update schema.sql** with new tables/columns
2. **Create migration script** for existing data
3. **Test migration** on development database
4. **Update database service** with new operations
5. **Run tests** to verify changes

## 🎯 Next Steps

After setting up the database:

1. **Configure Google OAuth** for SSO
2. **Set up JWT authentication**
3. **Implement API endpoints**
4. **Add mobile app integration**
5. **Set up cross-platform sync**

---

For more information, see the main project README or contact the development team.
