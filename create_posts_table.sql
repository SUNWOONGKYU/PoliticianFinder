-- posts 테이블 생성 (커뮤니티 게시글)
CREATE TABLE IF NOT EXISTS posts (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('general', 'politician_post')),
    author TEXT NOT NULL,
    politician_id BIGINT REFERENCES politicians(id) ON DELETE SET NULL,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    tags TEXT[],
    is_hot BOOLEAN DEFAULT FALSE,
    is_best BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_politician_id ON posts(politician_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_is_hot ON posts(is_hot) WHERE is_hot = TRUE;
CREATE INDEX IF NOT EXISTS idx_posts_is_best ON posts(is_best) WHERE is_best = TRUE;

-- RLS (Row Level Security) 활성화
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 게시글을 읽을 수 있도록 허용
CREATE POLICY "Anyone can read posts" ON posts
    FOR SELECT USING (true);

-- 인증된 사용자만 게시글 작성 가능
CREATE POLICY "Authenticated users can insert posts" ON posts
    FOR INSERT WITH CHECK (true);

-- 작성자만 자신의 게시글 수정 가능 (추후 auth 연동 시)
CREATE POLICY "Authors can update their posts" ON posts
    FOR UPDATE USING (true);

-- 작성자만 자신의 게시글 삭제 가능 (추후 auth 연동 시)
CREATE POLICY "Authors can delete their posts" ON posts
    FOR DELETE USING (true);
