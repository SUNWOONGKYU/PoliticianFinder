-- PoliticianFinder Database Schema for Supabase
-- 커뮤니티 작업지시서 기반 테이블 생성

-- ============================================
-- 1. profiles 테이블 (auth.users 확장)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT false,
  user_type TEXT DEFAULT 'normal' CHECK (user_type IN ('normal', 'politician')),
  user_level INTEGER DEFAULT 1,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "프로필 읽기 공개"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "본인 프로필만 수정"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "회원가입시 프로필 생성"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. politicians 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS public.politicians (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  party TEXT NOT NULL,
  region TEXT NOT NULL,
  position TEXT NOT NULL,
  profile_image_url TEXT,
  biography TEXT,
  avg_rating REAL DEFAULT 0,
  avatar_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.politicians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "정치인 목록 공개"
  ON public.politicians FOR SELECT
  USING (true);

CREATE POLICY "관리자만 정치인 수정"
  ON public.politicians FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- ============================================
-- 3. ai_scores 테이블 (AI 평가 점수)
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_scores (
  id SERIAL PRIMARY KEY,
  politician_id INTEGER REFERENCES public.politicians(id) ON DELETE CASCADE NOT NULL,
  ai_name TEXT NOT NULL CHECK (ai_name IN ('claude', 'gpt', 'gemini', 'perplexity', 'grok')),
  score REAL NOT NULL CHECK (score >= 0 AND score <= 100),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "AI 점수 공개"
  ON public.ai_scores FOR SELECT
  USING (true);

CREATE POLICY "관리자만 AI 점수 관리"
  ON public.ai_scores FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- ============================================
-- 4. posts 테이블 (게시글)
-- ============================================
CREATE TABLE IF NOT EXISTS public.posts (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  politician_id INTEGER REFERENCES public.politicians(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('general', 'politician_post', 'region', 'issue', 'policy')),
  title TEXT NOT NULL CHECK (char_length(title) >= 2 AND char_length(title) <= 200),
  content TEXT NOT NULL CHECK (char_length(content) >= 10),
  view_count INTEGER DEFAULT 0,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  is_best BOOLEAN DEFAULT false,
  is_concept BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "게시글 읽기 공개"
  ON public.posts FOR SELECT
  USING (true);

CREATE POLICY "로그인 사용자만 작성"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "본인 게시글만 수정/삭제"
  ON public.posts FOR UPDATE
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  ));

CREATE POLICY "본인 게시글만 삭제"
  ON public.posts FOR DELETE
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  ));

-- ============================================
-- 5. comments 테이블 (댓글)
-- ============================================
CREATE TABLE IF NOT EXISTS public.comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) >= 1),
  parent_id INTEGER REFERENCES public.comments(id) ON DELETE CASCADE,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "댓글 읽기 공개"
  ON public.comments FOR SELECT
  USING (true);

CREATE POLICY "로그인 사용자만 댓글 작성"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "본인 댓글만 수정/삭제"
  ON public.comments FOR UPDATE
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  ));

CREATE POLICY "본인 댓글만 삭제"
  ON public.comments FOR DELETE
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  ));

-- ============================================
-- 6. ratings 테이블 (별점 평가)
-- ============================================
CREATE TABLE IF NOT EXISTS public.ratings (
  id SERIAL PRIMARY KEY,
  politician_id INTEGER REFERENCES public.politicians(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(politician_id, user_id)
);

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "평가 읽기 공개"
  ON public.ratings FOR SELECT
  USING (true);

CREATE POLICY "로그인 사용자만 평가"
  ON public.ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "본인 평가만 수정"
  ON public.ratings FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- 7. votes 테이블 (추천/비추천)
-- ============================================
CREATE TABLE IF NOT EXISTS public.votes (
  id SERIAL PRIMARY KEY,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment')),
  target_id INTEGER NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(target_type, target_id, user_id)
);

ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "투표 읽기 공개"
  ON public.votes FOR SELECT
  USING (true);

CREATE POLICY "로그인 사용자만 투표"
  ON public.votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "본인 투표만 수정/삭제"
  ON public.votes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 8. bookmarks 테이블 (북마크/스크랩)
-- ============================================
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  post_id INTEGER REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "본인 북마크만 조회"
  ON public.bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "본인 북마크만 추가/삭제"
  ON public.bookmarks FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- 9. notifications 테이블 (알림)
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('comment', 'reply', 'mention', 'system')),
  content TEXT NOT NULL,
  target_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "본인 알림만 조회"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "본인 알림만 수정"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- 10. reports 테이블 (신고)
-- ============================================
CREATE TABLE IF NOT EXISTS public.reports (
  id SERIAL PRIMARY KEY,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'user')),
  target_id INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "관리자만 신고 조회"
  ON public.reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "로그인 사용자만 신고"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- ============================================
-- Realtime 구독 활성화
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============================================
-- 완료!
-- ============================================
