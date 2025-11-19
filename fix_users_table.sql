-- Fix users table to add id column as alias for user_id
-- This will allow foreign keys that reference users(id) to work

-- Add id column if it doesn't exist (as a copy of user_id)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'users' AND column_name = 'id') THEN
        ALTER TABLE users ADD COLUMN id UUID;
        UPDATE users SET id = user_id;
        CREATE UNIQUE INDEX users_id_idx ON users(id);
    END IF;
END$$;

-- Update follows foreign keys if they exist
DO $$
BEGIN
    -- Drop existing constraints if they reference users.id
    ALTER TABLE IF EXISTS follows DROP CONSTRAINT IF EXISTS follows_follower_id_fkey;
    ALTER TABLE IF EXISTS follows DROP CONSTRAINT IF EXISTS follows_following_id_fkey;

    -- Add new constraints referencing users.user_id
    ALTER TABLE IF EXISTS follows
        ADD CONSTRAINT follows_follower_id_fkey
        FOREIGN KEY (follower_id) REFERENCES users(user_id) ON DELETE CASCADE;

    ALTER TABLE IF EXISTS follows
        ADD CONSTRAINT follows_following_id_fkey
        FOREIGN KEY (following_id) REFERENCES users(user_id) ON DELETE CASCADE;
END$$;

-- Update notifications foreign key
DO $$
BEGIN
    ALTER TABLE IF EXISTS notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
    ALTER TABLE IF EXISTS notifications
        ADD CONSTRAINT notifications_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
END$$;

-- Update payments foreign key
DO $$
BEGIN
    ALTER TABLE IF EXISTS payments DROP CONSTRAINT IF EXISTS payments_user_id_fkey;
    ALTER TABLE IF EXISTS payments
        ADD CONSTRAINT payments_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
END$$;

-- Update favorite_politicians foreign key
DO $$
BEGIN
    ALTER TABLE IF EXISTS favorite_politicians DROP CONSTRAINT IF EXISTS favorite_politicians_user_id_fkey;
    ALTER TABLE IF EXISTS favorite_politicians
        ADD CONSTRAINT favorite_politicians_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
END$$;

-- Update post_likes foreign key
DO $$
BEGIN
    ALTER TABLE IF EXISTS post_likes DROP CONSTRAINT IF EXISTS post_likes_user_id_fkey;
    ALTER TABLE IF EXISTS post_likes
        ADD CONSTRAINT post_likes_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
END$$;

-- Update comment_likes foreign key
DO $$
BEGIN
    ALTER TABLE IF EXISTS comment_likes DROP CONSTRAINT IF EXISTS comment_likes_user_id_fkey;
    ALTER TABLE IF EXISTS comment_likes
        ADD CONSTRAINT comment_likes_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
END$$;

-- Update shares foreign key if it exists
DO $$
BEGIN
    ALTER TABLE IF EXISTS shares DROP CONSTRAINT IF EXISTS shares_user_id_fkey;
    ALTER TABLE IF EXISTS shares
        ADD CONSTRAINT shares_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
END$$;

-- Update inquiries foreign key if it exists
DO $$
BEGIN
    ALTER TABLE IF EXISTS inquiries DROP CONSTRAINT IF EXISTS inquiries_user_id_fkey;
    -- inquiries.user_id can be NULL, so we use ON DELETE SET NULL
    ALTER TABLE IF EXISTS inquiries
        ADD CONSTRAINT inquiries_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL;
END$$;
