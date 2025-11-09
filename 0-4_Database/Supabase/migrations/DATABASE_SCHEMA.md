# PoliticianFinder Database Schema

## Task: P2D1 - Complete Database Schema

## Overview

This document provides a comprehensive overview of the PoliticianFinder database schema, including all tables, relationships, indexes, and security policies.

## Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────┐
│    users    │◄────────│  politicians │
└──────┬──────┘         └──────┬───────┘
       │                       │
       │                       │
       │         ┌─────────────┼─────────────┐
       │         │             │             │
       │    ┌────▼────┐   ┌───▼────┐   ┌───▼────────┐
       │    │ careers │   │pledges │   │ai_evaluations│
       │    └─────────┘   └────────┘   └────────────┘
       │
       ├────────┬────────┬─────────┬──────────┐
       │        │        │         │          │
  ┌────▼───┐┌──▼───┐┌───▼────┐┌──▼─────┐┌──▼────────┐
  │ posts  ││follows││favorites││ reports││notifications│
  └────┬───┘└──────┘└─────────┘└─────────┘└────────────┘
       │
       ├──────────────┬─────────────┐
       │              │             │
  ┌────▼────┐  ┌─────▼──────┐ ┌───▼────┐
  │comments │  │ post_likes │ │ shares │
  └────┬────┘  └────────────┘ └────────┘
       │
  ┌────▼────────┐
  │comment_likes│
  └─────────────┘

Admin Tables:
┌──────────────┐  ┌───────────────┐  ┌──────────────┐
│  audit_logs  │  │admin_actions  │  │advertisements│
└──────────────┘  └───────────────┘  └──────────────┘

┌──────────────┐  ┌────────────────────┐  ┌───────────────┐
│   policies   │  │notification_templates│  │system_settings│
└──────────────┘  └────────────────────┘  └───────────────┘
```

## Table Details

### Core Tables

#### users
User accounts and profiles

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | TEXT | Unique email address |
| name | TEXT | Display name |
| avatar_url | TEXT | Profile picture URL |
| role | TEXT | user/admin/moderator |
| points | INTEGER | Activity points |
| level | INTEGER | User level (calculated from points) |
| bio | TEXT | User biography |
| location | TEXT | User location |
| is_banned | BOOLEAN | Ban status |
| banned_at | TIMESTAMPTZ | Ban timestamp |
| banned_reason | TEXT | Reason for ban |
| banned_by | UUID | Admin who banned |

**Indexes:**
- email (unique)
- role
- points (desc)
- level (desc)
- is_banned
- created_at (desc)

#### politicians
Politician profiles and information

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Korean name |
| name_en | TEXT | English name |
| party | TEXT | Political party |
| position | TEXT | Current position |
| region | TEXT | Electoral region |
| district | TEXT | District |
| profile_image_url | TEXT | Profile photo |
| birth_date | DATE | Date of birth |
| education | TEXT[] | Education history |
| website_url | TEXT | Official website |
| social media URLs | TEXT | Facebook, Twitter, Instagram, YouTube |
| contact info | TEXT | Phone, email, office address |
| is_verified | BOOLEAN | Verified by owner |
| verification_token | TEXT | Verification token |
| verified_at | TIMESTAMPTZ | Verification timestamp |
| view_count | INTEGER | Profile views |
| favorite_count | INTEGER | Favorite count |
| evaluation_score | INTEGER | AI evaluation score (0-100) |
| evaluation_grade | TEXT | Letter grade |

**Indexes:**
- name
- party
- position
- region
- district
- is_verified
- evaluation_score (desc)
- view_count (desc)
- favorite_count (desc)
- Full-text search (GIN) - Korean

#### posts
Community posts and discussions

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Author (FK to users) |
| politician_id | UUID | Related politician (FK, nullable) |
| title | TEXT | Post title |
| content | TEXT | Post content |
| category | TEXT | general/question/debate/news |
| tags | TEXT[] | Post tags |
| is_pinned | BOOLEAN | Pinned to top |
| is_locked | BOOLEAN | Locked from comments |
| view_count | INTEGER | View count |
| like_count | INTEGER | Like count (auto-updated) |
| comment_count | INTEGER | Comment count (auto-updated) |
| share_count | INTEGER | Share count (auto-updated) |
| moderation_status | TEXT | pending/approved/rejected/flagged |
| moderation_reason | TEXT | Moderation notes |
| moderated_at | TIMESTAMPTZ | Moderation timestamp |
| moderated_by | UUID | Moderator (FK to users) |

**Indexes:**
- user_id
- politician_id
- category
- is_pinned
- moderation_status
- view_count (desc)
- like_count (desc)
- created_at (desc)
- tags (GIN array)
- Full-text search (GIN) - Korean

### Community Tables

#### comments
Comments with nested reply support

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| post_id | UUID | Parent post (FK) |
| user_id | UUID | Author (FK) |
| parent_comment_id | UUID | Parent comment (FK, nullable) |
| content | TEXT | Comment text |
| like_count | INTEGER | Like count (auto-updated) |
| reply_count | INTEGER | Reply count (auto-updated) |
| is_deleted | BOOLEAN | Soft delete flag |
| moderation_status | TEXT | pending/approved/rejected/flagged |

#### post_likes, comment_likes
Like tracking with unique constraint (user + target)

#### follows
User-to-user following relationships

#### notifications
User notifications with types: comment, like, follow, mention, reply, system

#### user_favorites
User's favorite politicians

#### shares
Social media share tracking (Facebook, Twitter, Kakao, link)

#### reports
Content reporting system with reasons: spam, harassment, hate_speech, misinformation, inappropriate, other

### Politician Data Tables

#### careers
Politician career history

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| politician_id | UUID | Related politician (FK) |
| title | TEXT | Position title |
| organization | TEXT | Organization name |
| start_date | DATE | Start date |
| end_date | DATE | End date (nullable if current) |
| is_current | BOOLEAN | Current position flag |
| description | TEXT | Position description |
| order_index | INTEGER | Display order |

#### pledges
Campaign pledges and promises

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| politician_id | UUID | Related politician (FK) |
| title | TEXT | Pledge title |
| description | TEXT | Pledge details |
| category | TEXT | Pledge category |
| status | TEXT | pending/in_progress/completed/broken/postponed |
| progress_percentage | INTEGER | 0-100 |
| target_date | DATE | Target completion date |
| completion_date | DATE | Actual completion date |
| evidence_url | TEXT | Evidence link |
| verification_source | TEXT | Verification source |

#### ai_evaluations
AI-generated politician evaluations

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| politician_id | UUID | Related politician (FK) |
| evaluation_date | DATE | Evaluation date |
| overall_score | INTEGER | Overall score (0-100) |
| overall_grade | TEXT | Letter grade (A+, A, B+, etc.) |
| pledge_completion_rate | INTEGER | 0-100 |
| activity_score | INTEGER | 0-100 |
| controversy_score | INTEGER | 0-100 |
| public_sentiment_score | INTEGER | 0-100 |
| strengths | TEXT[] | Key strengths |
| weaknesses | TEXT[] | Key weaknesses |
| summary | TEXT | Evaluation summary |
| detailed_analysis | JSONB | Detailed metrics (JSON) |
| sources | TEXT[] | Reference URLs |
| ai_model_version | TEXT | AI model version used |

#### politician_verification
Politician identity verification

| Column | Type | Description |
|--------|------|-------------|
| verification_method | TEXT | email/document/phone/in_person/official_channel |
| verification_token | TEXT | Email verification token |
| token_expires_at | TIMESTAMPTZ | Token expiration |
| submitted_documents | TEXT[] | Document URLs |
| status | TEXT | pending/reviewing/approved/rejected |
| reviewed_by | UUID | Reviewer (FK to users) |
| rejection_reason | TEXT | Rejection notes |

### Admin Tables

#### audit_logs
Complete audit trail for admin actions

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| admin_id | UUID | Admin user (FK) |
| action_type | TEXT | Type of action |
| target_type | TEXT | Type of target |
| target_id | UUID | Target object ID |
| details | JSONB | Action details (JSON) |
| ip_address | INET | IP address |
| user_agent | TEXT | User agent string |

#### admin_actions
Admin activity tracking and statistics

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| admin_id | UUID | Admin user (FK) |
| action_type | TEXT | Action type |
| target_type | TEXT | Target type |
| target_id | UUID | Target ID |
| result | TEXT | success/failure |
| duration_ms | INTEGER | Execution time |
| metadata | JSONB | Additional data |

#### advertisements
Advertisement management

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| title | TEXT | Ad title |
| image_url | TEXT | Ad image |
| link_url | TEXT | Click destination |
| placement | TEXT | main/sidebar/post_top/post_bottom |
| start_date | TIMESTAMPTZ | Campaign start |
| end_date | TIMESTAMPTZ | Campaign end |
| impressions | INTEGER | View count |
| clicks | INTEGER | Click count |
| is_active | BOOLEAN | Active status |
| priority | INTEGER | Display priority |
| target_audience | JSONB | Targeting criteria (JSON) |

#### policies
Service policies with version management

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| type | TEXT | terms/privacy/marketing/community |
| version | INTEGER | Version number |
| title | TEXT | Policy title |
| content | TEXT | Policy content |
| is_current | BOOLEAN | Current version flag |
| effective_date | TIMESTAMPTZ | Effective date |
| updated_by | UUID | Editor (FK to users) |

**Unique constraint:** (type, version)

#### notification_templates
Customizable notification templates

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| type | TEXT | comment/like/follow/mention/reply/system |
| title_template | TEXT | Title template |
| body_template | TEXT | Body template |
| is_enabled | BOOLEAN | Enabled flag |
| variables | TEXT[] | Available variables |

**Default templates:**
- comment: "{actor_name}님이 댓글을 남겼습니다"
- like: "{actor_name}님이 공감했습니다"
- follow: "{actor_name}님이 팔로우했습니다"
- mention: "{actor_name}님이 회원님을 언급했습니다"
- reply: "{actor_name}님이 답글을 남겼습니다"
- system: "시스템 알림"

#### system_settings
Global system configuration (key-value store)

| Column | Type | Description |
|--------|------|-------------|
| key | TEXT | Setting key (PK) |
| value | JSONB | Setting value (JSON) |
| description | TEXT | Setting description |
| category | TEXT | Setting category |

**Categories:**
- points.* - Point awards (post, comment, like, follow, daily_login, share)
- features.* - Feature toggles (community, ai_evaluation, etc.)
- maintenance.* - Maintenance mode settings
- limits.* - Size and rate limits

## Database Functions

### Utility Functions

1. **get_top_politicians(limit, offset)** - Get top-ranked politicians
2. **search_politicians(query, limit)** - Full-text search with ranking
3. **get_user_stats(user_id)** - Comprehensive user statistics
4. **get_trending_posts(hours, limit)** - Trending posts algorithm
5. **calculate_user_level(points)** - Level calculation formula
6. **award_points(user_id, points, reason)** - Award points and update level
7. **get_politician_pledge_stats(politician_id)** - Pledge statistics
8. **get_unread_notification_count(user_id)** - Unread count
9. **mark_all_notifications_read(user_id)** - Mark all as read
10. **get_admin_action_stats(start_date, end_date)** - Admin statistics
11. **get_active_ads(placement)** - Get active advertisement
12. **increment_politician_view_count(politician_id)** - Safe view increment
13. **increment_post_view_count(post_id)** - Safe view increment

### Helper Functions

1. **is_admin()** - Check if current user is admin
2. **is_moderator()** - Check if current user is admin or moderator

## Triggers

### Auto-update Triggers

All tables with `updated_at` column:
- users
- politicians
- careers
- pledges
- posts
- comments
- ai_evaluations
- reports
- politician_verification
- advertisements
- notification_templates

### Counter Maintenance Triggers

1. **post_like_count_trigger** - Maintains posts.like_count
2. **comment_like_count_trigger** - Maintains comments.like_count
3. **post_comment_count_trigger** - Maintains posts.comment_count
4. **comment_reply_count_trigger** - Maintains comments.reply_count
5. **politician_favorite_count_trigger** - Maintains politicians.favorite_count
6. **share_count_trigger** - Maintains posts.share_count

## Storage Buckets

1. **avatars** (public, 5MB limit)
   - User profile pictures
   - Allowed: PNG, JPEG, JPG, GIF, WebP

2. **attachments** (private, 10MB limit)
   - Post/comment attachments
   - Allowed: Images, PDF, text files

3. **politician-images** (public, 5MB limit)
   - Politician profile photos
   - Allowed: PNG, JPEG, JPG, WebP

4. **advertisement-images** (public, 5MB limit)
   - Advertisement images
   - Allowed: PNG, JPEG, JPG, WebP, GIF

## Row Level Security (RLS)

All tables have RLS enabled with comprehensive policies:

### User Access Patterns

- **Public Read**: politicians, careers, pledges, ai_evaluations, policies (current), system_settings
- **Authenticated Read**: Own data (posts, comments, notifications, favorites)
- **Moderator Access**: All posts, comments, reports, politician_verification
- **Admin Access**: All data, audit_logs, admin_actions, advertisements

### Key Policies

- Users can only modify their own content
- Moderators can moderate posts and comments
- Admins have full access to admin tables
- Banned users cannot create new content
- Only approved content visible to public

## Indexes Strategy

### Primary Indexes
- Foreign key columns for JOIN performance
- created_at (DESC) for chronological queries
- Unique constraints (email, composite keys)

### Performance Indexes
- view_count, like_count (DESC) for rankings
- moderation_status for filtering
- Composite indexes for common query patterns

### Search Indexes
- GIN indexes for full-text search (Korean)
- GIN indexes for array columns (tags, education)

### Partial Indexes
- Filtered indexes for common WHERE conditions
- Example: WHERE is_active = TRUE, WHERE moderation_status = 'approved'

## Performance Optimizations

1. **Automatic Counters**: Denormalized counts updated via triggers
2. **Strategic Indexes**: Covering indexes for frequent queries
3. **Full-text Search**: GIN indexes with Korean dictionary
4. **Partial Indexes**: Reduce index size for filtered queries
5. **Composite Indexes**: Multi-column indexes for complex queries
6. **JSONB Columns**: Flexible schema for varying data (ai_evaluations.detailed_analysis)

## Korean Language Support

- Full-text search using PostgreSQL's Korean dictionary
- to_tsvector('korean', content) for indexing
- plainto_tsquery('korean', query) for searching
- Applied to: politicians, posts, pledges, comments

## Security Considerations

1. **RLS Policies**: Every table protected by Row Level Security
2. **Role-based Access**: user/admin/moderator roles
3. **Storage Policies**: File upload restrictions per bucket
4. **Audit Trail**: Complete logging of admin actions
5. **Soft Deletes**: Comments use soft delete to preserve structure
6. **Token Security**: Verification tokens with expiration
7. **Ban System**: User banning with reason tracking

## Data Integrity

1. **Foreign Keys**: All relationships enforced with FK constraints
2. **Check Constraints**: Valid enum values enforced
3. **Unique Constraints**: Prevent duplicate likes, follows, favorites
4. **NOT NULL**: Required fields enforced at DB level
5. **Cascading Deletes**: Appropriate CASCADE vs SET NULL
6. **Self-reference Prevention**: follows table prevents self-following

## Backup & Recovery

Recommendations:
1. Enable Supabase automatic backups
2. Regular point-in-time recovery testing
3. Export migration files to version control
4. Document schema changes in migrations
5. Test rollback procedures

## Next Steps

1. Execute migrations in Supabase
2. Verify all tables created successfully
3. Test RLS policies with different user roles
4. Populate initial data (system_settings, notification_templates)
5. Generate TypeScript types from schema
6. Create database indexes monitoring
7. Set up query performance monitoring

## Related Tasks

- P4BA8: Audit Logs API (uses audit_logs table)
- P4BA9: Advertisement Management (uses advertisements table)
- P4BA10: Policy Management (uses policies table)
- P4BA11: Notification Settings (uses notification_templates table)
- P4BA12: System Settings (uses system_settings table)
- P4BA13: Admin Actions (uses admin_actions table)
