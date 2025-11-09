# Database Migrations - PoliticianFinder

This directory contains all Supabase migration files for the PoliticianFinder project.

## Migration Order

Migrations are executed in numerical order:

### Core Tables (001-020)
1. **001_create_users_table.sql** - User accounts and profiles
2. **002_create_politicians_table.sql** - Politician profiles and information
3. **003_create_careers_table.sql** - Politician career history
4. **004_create_pledges_table.sql** - Campaign pledges and promises
5. **005_create_posts_table.sql** - Community posts and discussions
6. **006_create_comments_table.sql** - Comments with nested replies
7. **007_create_likes_tables.sql** - Post and comment likes
8. **008_create_follows_table.sql** - User following relationships
9. **009_create_notifications_table.sql** - User notifications
10. **010_create_user_favorites_table.sql** - User favorite politicians
11. **011_create_ai_evaluations_table.sql** - AI-generated evaluations
12. **012_create_reports_table.sql** - Content reports
13. **013_create_shares_table.sql** - Social media shares tracking
14. **014_create_politician_verification_table.sql** - Politician verification

### Admin Tables (015-020)
15. **015_create_audit_logs_table.sql** - Audit trail for admin actions (P4BA8)
16. **016_create_advertisements_table.sql** - Advertisement management (P4BA9)
17. **017_create_policies_table.sql** - Service policies with versioning (P4BA10)
18. **018_create_notification_templates_table.sql** - Notification templates (P4BA11)
19. **019_create_system_settings_table.sql** - Global system settings (P4BA12)
20. **020_create_admin_actions_table.sql** - Admin activity tracking (P4BA13)

### Database Functions & Triggers (030-031)
30. **030_create_triggers.sql** - Automatic triggers for counters and timestamps
31. **031_create_functions.sql** - Utility functions for analytics and aggregations

### Storage & Security (040-041)
40. **040_create_storage_buckets.sql** - Storage buckets and policies
41. **041_create_rls_policies.sql** - Row Level Security policies

## Features

### Full-Text Search
- Korean language support using PostgreSQL's `to_tsvector('korean', ...)`
- Search indexes on politicians, posts, pledges, and comments

### Automatic Counters
- `like_count` automatically updated via triggers
- `comment_count` automatically updated via triggers
- `view_count` via explicit function calls
- `favorite_count` automatically updated via triggers

### Timestamp Management
- `created_at` automatically set on insert
- `updated_at` automatically updated on every update via triggers

### Security
- Row Level Security (RLS) enabled on all tables
- Comprehensive policies for users, admins, and moderators
- Storage bucket policies for file uploads

### Performance
- Strategic indexes on frequently queried columns
- Composite indexes for common query patterns
- Full-text search indexes with GIN
- Partial indexes for filtered queries

## Database Schema Overview

### User Management
- **users** - User accounts with roles (user/admin/moderator)
- **follows** - User-to-user following
- **notifications** - User notifications

### Politician Data
- **politicians** - Politician profiles
- **careers** - Career history
- **pledges** - Campaign promises
- **ai_evaluations** - AI-generated evaluations
- **politician_verification** - Identity verification

### Community
- **posts** - Community posts with moderation
- **comments** - Nested comments with replies
- **post_likes** / **comment_likes** - Like tracking
- **reports** - Content reporting
- **shares** - Social sharing tracking
- **user_favorites** - Favorite politicians

### Admin Features
- **audit_logs** - Complete audit trail
- **admin_actions** - Admin activity tracking
- **advertisements** - Ad management
- **policies** - Terms/privacy with versioning
- **notification_templates** - Customizable notifications
- **system_settings** - Global configuration

## Running Migrations

### Using Supabase CLI

```bash
# Navigate to database directory
cd C:\Development_PoliticianFinder_copy\Developement_Real_PoliticianFinder\0-4_Database\Supabase

# Link to your Supabase project
supabase link --project-ref ooddlafwdpzgxfefgsrx

# Run all migrations
supabase db push

# Or run a specific migration
supabase db push --file migrations/001_create_users_table.sql
```

### Manual Execution

You can also execute migrations manually in the Supabase SQL Editor:
1. Go to https://supabase.com/dashboard/project/ooddlafwdpzgxfefgsrx
2. Navigate to SQL Editor
3. Copy and paste each migration file in order
4. Execute each migration

## Verification

After running migrations, verify:

```sql
-- Check all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Check triggers
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;

-- Check functions
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- Check storage buckets
SELECT * FROM storage.buckets;
```

## Notes

- All tables use UUID primary keys with `gen_random_uuid()`
- All timestamps use `TIMESTAMPTZ` for timezone awareness
- Korean full-text search requires PostgreSQL with Korean dictionary
- Storage policies require Supabase storage to be enabled
- Some functions use `SECURITY DEFINER` for RLS helper functions

## Task Information

- **Task ID**: P2D1
- **Phase**: Phase 2
- **Area**: Database (D)
- **Generated**: 2025-11-07
- **Supabase Project**: ooddlafwdpzgxfefgsrx
