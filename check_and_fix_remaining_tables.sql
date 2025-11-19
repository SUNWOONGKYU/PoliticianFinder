-- Check and fix comment_likes and shares tables schema

-- First, let's check the actual structure
SELECT 'comment_likes structure:' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'comment_likes'
ORDER BY ordinal_position;

SELECT '';
SELECT 'shares structure:' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'shares'
ORDER BY ordinal_position;

SELECT '';
SELECT 'comments.id structure:' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'comments' AND column_name = 'id';

-- If comment_likes.comment_id is INTEGER but should be UUID, we need to recreate
-- If it's already UUID, we're good

-- For shares, check if post_id or target_id exists
