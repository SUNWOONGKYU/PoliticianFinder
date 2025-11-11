-- Add nickname column if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname TEXT;

-- Update existing sample users with nicknames
UPDATE users SET nickname = name WHERE email LIKE 'user%@example.com' AND (nickname IS NULL OR nickname = '');

-- Verify
SELECT user_id, email, name, nickname FROM users WHERE email LIKE 'user%@example.com' ORDER BY email;
