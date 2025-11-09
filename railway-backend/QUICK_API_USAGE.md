# Quick Guide: Using Backend API to View Database

## ✅ Currently Available

### List All Tables
```bash
curl https://rork-study-buddy-production-eeeb.up.railway.app/db/tables
```

Or open in browser:
https://rork-study-buddy-production-eeeb.up.railway.app/db/tables

## 🚀 After Deployment (Coming Soon)

Once the new endpoints are deployed, you'll be able to:

### View Specific Table
```bash
# View users table
curl https://rork-study-buddy-production-eeeb.up.railway.app/db/table/users

# View notes table (20 rows)
curl "https://rork-study-buddy-production-eeeb.up.railway.app/db/table/notes?limit=20"
```

### View Overview of All Tables
```bash
curl https://rork-study-buddy-production-eeeb.up.railway.app/db/overview
```

## 📋 Your 14 Tables

You can query these tables (once endpoints are deployed):

1. `users`
2. `notes`
3. `flashcards`
4. `essays`
5. `subscriptions`
6. `subscription_plans`
7. `user_sessions`
8. `user_usage`
9. `sync_events`
10. `mobile_subscriptions`
11. `video_analyses`
12. `user_questions`
13. `user_knowledge_profiles`
14. `note_embeddings`

## 💡 For Now: Use Database GUI Tool

Since the table viewing endpoints aren't deployed yet, use **DBeaver**:

1. Get `DATABASE_PUBLIC_URL` from Railway → PostgreSQL → Variables
2. Install DBeaver: https://dbeaver.io/download/
3. Connect and browse tables visually

This is actually the best way to view your database!

