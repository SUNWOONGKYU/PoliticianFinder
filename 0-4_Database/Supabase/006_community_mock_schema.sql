/**
 * Project Grid Task ID: P1BA3_MOCK_SCHEMA
 * 작업명: 커뮤니티 Mock 데이터 스키마
 * 생성시간: 2025-11-07
 * 생성자: Claude-Sonnet-4.5
 * 의존성: 001_auth_schema
 * 설명: Mock 데이터를 위한 커뮤니티 테이블 (posts, comments) 추가
 */

-- ================================================
-- 1. profiles 테이블에 Mock 데이터 컬럼 추가
-- ================================================

DO $$
BEGIN
    -- nickname 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='profiles' AND column_name='nickname') THEN
        ALTER TABLE public.profiles ADD COLUMN nickname VARCHAR(100);
    END IF;

    -- full_name 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='profiles' AND column_name='full_name') THEN
        ALTER TABLE public.profiles ADD COLUMN full_name VARCHAR(100);
    END IF;
END $$;

COMMENT ON COLUMN public.profiles.nickname IS '사용자 닉네임 (Mock 데이터용)';
COMMENT ON COLUMN public.profiles.full_name IS '사용자 실명 (Mock 데이터용)';

-- ================================================
-- 2. posts 테이블 (게시글)
-- ================================================

CREATE TABLE IF NOT EXISTS public.posts (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'general',
    author_id VARCHAR(100),
    author_type VARCHAR(50) DEFAULT 'user' CHECK (author_type IN ('user', 'politician')),
    politician_id VARCHAR(100),
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_hot BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.posts IS '커뮤니티 게시글 (Mock 데이터)';
COMMENT ON COLUMN public.posts.author_type IS 'user: 일반 사용자, politician: 정치인';
COMMENT ON COLUMN public.posts.politician_id IS '정치인이 작성한 경우 정치인 ID';

-- ================================================
-- 3. comments 테이블 (댓글)
-- ================================================

CREATE TABLE IF NOT EXISTS public.comments (
    id VARCHAR(50) PRIMARY KEY,
    post_id VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    author_id VARCHAR(100),
    author_type VARCHAR(50) DEFAULT 'user' CHECK (author_type IN ('user', 'politician')),
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    parent_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_comments_post_id FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_parent_id FOREIGN KEY (parent_id) REFERENCES public.comments(id) ON DELETE CASCADE
);

COMMENT ON TABLE public.comments IS '커뮤니티 댓글 (Mock 데이터)';
COMMENT ON COLUMN public.comments.parent_id IS '대댓글인 경우 부모 댓글 ID';

-- ================================================
-- 4. 인덱스 생성
-- ================================================

-- posts 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_category ON public.posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at);
CREATE INDEX IF NOT EXISTS idx_posts_politician_id ON public.posts(politician_id);
CREATE INDEX IF NOT EXISTS idx_posts_is_pinned ON public.posts(is_pinned);
CREATE INDEX IF NOT EXISTS idx_posts_is_hot ON public.posts(is_hot);

-- comments 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON public.comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at);

-- ================================================
-- 5. RLS (Row Level Security) 정책
-- ================================================

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽을 수 있음
CREATE POLICY IF NOT EXISTS select_all_posts ON public.posts FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS select_all_comments ON public.comments FOR SELECT USING (true);

-- INSERT/UPDATE/DELETE는 인증된 사용자만
CREATE POLICY IF NOT EXISTS insert_posts ON public.posts FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS update_posts ON public.posts FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS delete_posts ON public.posts FOR DELETE USING (true);

CREATE POLICY IF NOT EXISTS insert_comments ON public.comments FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS update_comments ON public.comments FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS delete_comments ON public.comments FOR DELETE USING (true);
