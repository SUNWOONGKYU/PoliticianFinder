-- P3D3: likes 테이블 생성
-- 좋아요 시스템 구현
-- 작성일: 2025-01-17
-- 작성자: AI-only
-- Phase: 3

-- ============================================
-- 1. likes 테이블 생성
-- ============================================

CREATE TABLE IF NOT EXISTS likes (
  id BIGSERIAL PRIMARY KEY,

  -- 사용자 정보
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 좋아요 대상 (다형성 지원)
  target_type VARCHAR(50) NOT NULL CHECK (target_type IN (
    'post',           -- 게시글 좋아요
    'comment',        -- 댓글 좋아요
    'politician',     -- 정치인 좋아요
    'rating'          -- 평가 좋아요
  )),
  target_id BIGINT NOT NULL,

  -- 좋아요 타입 (추후 확장 가능)
  like_type VARCHAR(20) DEFAULT 'like' CHECK (like_type IN (
    'like',           -- 일반 좋아요
    'love',           -- 하트
    'support',        -- 지지
    'agree',          -- 동의
    'helpful'         -- 도움됨
  )),

  -- 메타데이터
  metadata JSONB DEFAULT '{}',

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- 복합 유니크 제약 (1인 1좋아요)
  CONSTRAINT unique_user_target_like UNIQUE(user_id, target_type, target_id)
);

-- ============================================
-- 2. 테이블 설명 추가
-- ============================================

COMMENT ON TABLE likes IS '좋아요 시스템 테이블';
COMMENT ON COLUMN likes.id IS '좋아요 고유 식별자';
COMMENT ON COLUMN likes.user_id IS '좋아요를 한 사용자 ID';
COMMENT ON COLUMN likes.target_type IS '좋아요 대상 타입 (post, comment, politician, rating)';
COMMENT ON COLUMN likes.target_id IS '좋아요 대상 ID';
COMMENT ON COLUMN likes.like_type IS '좋아요 유형';
COMMENT ON COLUMN likes.metadata IS '추가 메타데이터';
COMMENT ON COLUMN likes.created_at IS '좋아요 시간';

-- ============================================
-- 3. 인덱스 생성 (성능 최적화)
-- ============================================

-- 대상별 좋아요 조회 최적화
CREATE INDEX idx_likes_target
ON likes(target_type, target_id);

-- 사용자별 좋아요 조회 최적화
CREATE INDEX idx_likes_user_id
ON likes(user_id);

-- 대상 + 사용자 복합 인덱스 (중복 체크 최적화)
CREATE INDEX idx_likes_user_target
ON likes(user_id, target_type, target_id);

-- 최신 좋아요 조회 최적화
CREATE INDEX idx_likes_created_at
ON likes(created_at DESC);

-- 좋아요 타입별 조회 최적화
CREATE INDEX idx_likes_type
ON likes(target_type, like_type);

-- ============================================
-- 4. 좋아요 카운트 캐시 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS like_counts (
  id BIGSERIAL PRIMARY KEY,
  target_type VARCHAR(50) NOT NULL,
  target_id BIGINT NOT NULL,
  total_likes BIGINT DEFAULT 0,
  like_count BIGINT DEFAULT 0,      -- 일반 좋아요
  love_count BIGINT DEFAULT 0,      -- 하트
  support_count BIGINT DEFAULT 0,   -- 지지
  agree_count BIGINT DEFAULT 0,     -- 동의
  helpful_count BIGINT DEFAULT 0,   -- 도움됨
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_target_count UNIQUE(target_type, target_id)
);

CREATE INDEX idx_like_counts_target
ON like_counts(target_type, target_id);

COMMENT ON TABLE like_counts IS '좋아요 카운트 캐시 테이블';
COMMENT ON COLUMN like_counts.total_likes IS '전체 좋아요 수';

-- ============================================
-- 5. 좋아요 추가/삭제 시 카운트 업데이트 트리거
-- ============================================

-- 5.1. 좋아요 추가 시 카운트 증가
CREATE OR REPLACE FUNCTION increment_like_count()
RETURNS TRIGGER AS $$
BEGIN
  -- like_counts 테이블 업데이트
  INSERT INTO like_counts (target_type, target_id, total_likes)
  VALUES (NEW.target_type, NEW.target_id, 1)
  ON CONFLICT (target_type, target_id)
  DO UPDATE SET
    total_likes = like_counts.total_likes + 1,
    updated_at = NOW();

  -- like_type별 카운트 업데이트
  IF NEW.like_type = 'like' THEN
    UPDATE like_counts
    SET like_count = like_count + 1
    WHERE target_type = NEW.target_type AND target_id = NEW.target_id;
  ELSIF NEW.like_type = 'love' THEN
    UPDATE like_counts
    SET love_count = love_count + 1
    WHERE target_type = NEW.target_type AND target_id = NEW.target_id;
  ELSIF NEW.like_type = 'support' THEN
    UPDATE like_counts
    SET support_count = support_count + 1
    WHERE target_type = NEW.target_type AND target_id = NEW.target_id;
  ELSIF NEW.like_type = 'agree' THEN
    UPDATE like_counts
    SET agree_count = agree_count + 1
    WHERE target_type = NEW.target_type AND target_id = NEW.target_id;
  ELSIF NEW.like_type = 'helpful' THEN
    UPDATE like_counts
    SET helpful_count = helpful_count + 1
    WHERE target_type = NEW.target_type AND target_id = NEW.target_id;
  END IF;

  -- 대상 테이블의 좋아요 수 직접 업데이트
  IF NEW.target_type = 'post' THEN
    UPDATE posts SET upvotes = upvotes + 1 WHERE id = NEW.target_id;
  ELSIF NEW.target_type = 'comment' THEN
    UPDATE comments SET upvotes = upvotes + 1 WHERE id = NEW.target_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_like_count_trigger
AFTER INSERT ON likes
FOR EACH ROW
EXECUTE FUNCTION increment_like_count();

-- 5.2. 좋아요 삭제 시 카운트 감소
CREATE OR REPLACE FUNCTION decrement_like_count()
RETURNS TRIGGER AS $$
BEGIN
  -- like_counts 테이블 업데이트
  UPDATE like_counts
  SET
    total_likes = GREATEST(0, total_likes - 1),
    updated_at = NOW()
  WHERE target_type = OLD.target_type AND target_id = OLD.target_id;

  -- like_type별 카운트 업데이트
  IF OLD.like_type = 'like' THEN
    UPDATE like_counts
    SET like_count = GREATEST(0, like_count - 1)
    WHERE target_type = OLD.target_type AND target_id = OLD.target_id;
  ELSIF OLD.like_type = 'love' THEN
    UPDATE like_counts
    SET love_count = GREATEST(0, love_count - 1)
    WHERE target_type = OLD.target_type AND target_id = OLD.target_id;
  ELSIF OLD.like_type = 'support' THEN
    UPDATE like_counts
    SET support_count = GREATEST(0, support_count - 1)
    WHERE target_type = OLD.target_type AND target_id = OLD.target_id;
  ELSIF OLD.like_type = 'agree' THEN
    UPDATE like_counts
    SET agree_count = GREATEST(0, agree_count - 1)
    WHERE target_type = OLD.target_type AND target_id = OLD.target_id;
  ELSIF OLD.like_type = 'helpful' THEN
    UPDATE like_counts
    SET helpful_count = GREATEST(0, helpful_count - 1)
    WHERE target_type = OLD.target_type AND target_id = OLD.target_id;
  END IF;

  -- 대상 테이블의 좋아요 수 직접 업데이트
  IF OLD.target_type = 'post' THEN
    UPDATE posts SET upvotes = GREATEST(0, upvotes - 1) WHERE id = OLD.target_id;
  ELSIF OLD.target_type = 'comment' THEN
    UPDATE comments SET upvotes = GREATEST(0, upvotes - 1) WHERE id = OLD.target_id;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER decrement_like_count_trigger
AFTER DELETE ON likes
FOR EACH ROW
EXECUTE FUNCTION decrement_like_count();

-- ============================================
-- 6. 좋아요 알림 트리거
-- ============================================

CREATE OR REPLACE FUNCTION notify_like_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_target_user_id UUID;
  v_target_title TEXT;
  v_notification_type VARCHAR(50);
  v_message TEXT;
BEGIN
  -- 알림 타입 결정
  v_notification_type := 'like';

  -- 대상에 따라 알림 수신자와 메시지 설정
  IF NEW.target_type = 'post' THEN
    SELECT user_id, title INTO v_target_user_id, v_target_title
    FROM posts WHERE id = NEW.target_id;
    v_message := '회원님의 게시글 "' || substring(v_target_title, 1, 30) || '"를 좋아합니다.';

  ELSIF NEW.target_type = 'comment' THEN
    SELECT user_id, substring(content, 1, 30) INTO v_target_user_id, v_target_title
    FROM comments WHERE id = NEW.target_id;
    v_message := '회원님의 댓글을 좋아합니다.';

  ELSIF NEW.target_type = 'rating' THEN
    SELECT user_id INTO v_target_user_id
    FROM ratings WHERE id = NEW.target_id;
    v_message := '회원님의 평가가 도움이 되었습니다.';

  ELSE
    -- politician 타입은 알림 불필요
    RETURN NEW;
  END IF;

  -- 본인이 본인 콘텐츠에 좋아요한 경우 알림 생략
  IF v_target_user_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- 알림 생성
  INSERT INTO notifications (
    recipient_id,
    sender_id,
    type,
    title,
    message,
    entity_type,
    entity_id,
    action_url,
    priority,
    metadata
  ) VALUES (
    v_target_user_id,
    NEW.user_id,
    v_notification_type,
    '좋아요 알림',
    v_message,
    NEW.target_type,
    NEW.target_id,
    CASE
      WHEN NEW.target_type = 'post' THEN '/posts/' || NEW.target_id
      WHEN NEW.target_type = 'comment' THEN '/posts/' || (SELECT post_id FROM comments WHERE id = NEW.target_id) || '#comment-' || NEW.target_id
      ELSE NULL
    END,
    'low',
    jsonb_build_object('like_type', NEW.like_type)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_like_activity_trigger
AFTER INSERT ON likes
FOR EACH ROW
EXECUTE FUNCTION notify_like_activity();

-- ============================================
-- 7. Row Level Security 정책
-- ============================================

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 좋아요 목록 조회 가능
CREATE POLICY "Anyone can view likes"
ON likes FOR SELECT
USING (true);

-- 로그인 사용자만 좋아요 추가
CREATE POLICY "Authenticated users can add likes"
ON likes FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND auth.uid() = user_id
);

-- 본인 좋아요만 삭제
CREATE POLICY "Users can delete own likes"
ON likes FOR DELETE
USING (auth.uid() = user_id);

-- 좋아요 카운트는 읽기 전용
ALTER TABLE like_counts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view like counts"
ON like_counts FOR SELECT
USING (true);

-- ============================================
-- 8. 헬퍼 함수들
-- ============================================

-- 8.1. 좋아요 토글 함수
CREATE OR REPLACE FUNCTION toggle_like(
  p_user_id UUID,
  p_target_type VARCHAR(50),
  p_target_id BIGINT,
  p_like_type VARCHAR(20) DEFAULT 'like'
)
RETURNS JSONB AS $$
DECLARE
  v_like_id BIGINT;
  v_is_liked BOOLEAN;
BEGIN
  -- 기존 좋아요 확인
  SELECT id INTO v_like_id
  FROM likes
  WHERE user_id = p_user_id
    AND target_type = p_target_type
    AND target_id = p_target_id;

  IF v_like_id IS NOT NULL THEN
    -- 좋아요 취소
    DELETE FROM likes WHERE id = v_like_id;
    v_is_liked := FALSE;
  ELSE
    -- 좋아요 추가
    INSERT INTO likes (user_id, target_type, target_id, like_type)
    VALUES (p_user_id, p_target_type, p_target_id, p_like_type)
    RETURNING id INTO v_like_id;
    v_is_liked := TRUE;
  END IF;

  -- 결과 반환
  RETURN jsonb_build_object(
    'success', TRUE,
    'is_liked', v_is_liked,
    'like_id', v_like_id,
    'message', CASE
      WHEN v_is_liked THEN '좋아요를 추가했습니다.'
      ELSE '좋아요를 취소했습니다.'
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8.2. 좋아요 상태 확인 함수
CREATE OR REPLACE FUNCTION check_like_status(
  p_user_id UUID,
  p_target_type VARCHAR(50),
  p_target_ids BIGINT[]
)
RETURNS TABLE (
  target_id BIGINT,
  is_liked BOOLEAN,
  like_type VARCHAR(20)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.target_id,
    l.id IS NOT NULL as is_liked,
    l.like_type
  FROM unnest(p_target_ids) t(target_id)
  LEFT JOIN likes l ON
    l.user_id = p_user_id
    AND l.target_type = p_target_type
    AND l.target_id = t.target_id;
END;
$$ LANGUAGE plpgsql;

-- 8.3. 좋아요 통계 조회 함수
CREATE OR REPLACE FUNCTION get_like_stats(
  p_target_type VARCHAR(50),
  p_target_id BIGINT
)
RETURNS JSONB AS $$
DECLARE
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_likes', COALESCE(total_likes, 0),
    'like_count', COALESCE(like_count, 0),
    'love_count', COALESCE(love_count, 0),
    'support_count', COALESCE(support_count, 0),
    'agree_count', COALESCE(agree_count, 0),
    'helpful_count', COALESCE(helpful_count, 0),
    'top_likers', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'user_id', l.user_id,
          'like_type', l.like_type,
          'created_at', l.created_at
        )
      )
      FROM (
        SELECT user_id, like_type, created_at
        FROM likes
        WHERE target_type = p_target_type AND target_id = p_target_id
        ORDER BY created_at DESC
        LIMIT 10
      ) l
    )
  ) INTO v_stats
  FROM like_counts
  WHERE target_type = p_target_type AND target_id = p_target_id;

  RETURN COALESCE(v_stats, jsonb_build_object(
    'total_likes', 0,
    'like_count', 0,
    'love_count', 0,
    'support_count', 0,
    'agree_count', 0,
    'helpful_count', 0,
    'top_likers', '[]'::jsonb
  ));
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. 좋아요 관련 뷰
-- ============================================

-- 9.1. 인기 게시글 뷰
CREATE OR REPLACE VIEW popular_posts AS
SELECT
  p.id,
  p.title,
  p.user_id,
  p.created_at,
  COALESCE(lc.total_likes, 0) as like_count,
  p.view_count,
  p.category
FROM posts p
LEFT JOIN like_counts lc ON lc.target_type = 'post' AND lc.target_id = p.id
WHERE p.created_at > NOW() - INTERVAL '7 days'
ORDER BY COALESCE(lc.total_likes, 0) DESC, p.view_count DESC
LIMIT 100;

COMMENT ON VIEW popular_posts IS '최근 7일간 인기 게시글';

-- 9.2. 사용자 좋아요 활동 뷰
CREATE OR REPLACE VIEW user_like_activity AS
SELECT
  user_id,
  COUNT(*) as total_likes_given,
  COUNT(*) FILTER (WHERE target_type = 'post') as post_likes,
  COUNT(*) FILTER (WHERE target_type = 'comment') as comment_likes,
  COUNT(*) FILTER (WHERE target_type = 'politician') as politician_likes,
  COUNT(*) FILTER (WHERE target_type = 'rating') as rating_likes,
  MAX(created_at) as last_like_at
FROM likes
GROUP BY user_id;

COMMENT ON VIEW user_like_activity IS '사용자별 좋아요 활동 통계';

-- ============================================
-- 10. 테이블 생성 확인
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'likes'
  ) THEN
    RAISE NOTICE 'likes 테이블이 성공적으로 생성되었습니다.';

    -- 테이블 정보
    RAISE NOTICE '테이블 정보:';
    FOR r IN (
      SELECT
        COUNT(*) as column_count,
        COUNT(*) FILTER (WHERE is_nullable = 'NO') as required_columns
      FROM information_schema.columns
      WHERE table_name = 'likes'
    ) LOOP
      RAISE NOTICE '  - 전체 컬럼: %개', r.column_count;
      RAISE NOTICE '  - 필수 컬럼: %개', r.required_columns;
    END LOOP;

    -- 인덱스 정보
    RAISE NOTICE '인덱스 목록:';
    FOR r IN (
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'likes'
      ORDER BY indexname
    ) LOOP
      RAISE NOTICE '  - %', r.indexname;
    END LOOP;

    -- 트리거 정보
    RAISE NOTICE '트리거 목록:';
    FOR r IN (
      SELECT trigger_name
      FROM information_schema.triggers
      WHERE event_object_table = 'likes'
      ORDER BY trigger_name
    ) LOOP
      RAISE NOTICE '  - %', r.trigger_name;
    END LOOP;
  ELSE
    RAISE EXCEPTION 'likes 테이블 생성에 실패했습니다.';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 11. 샘플 데이터 (개발 환경용 - 프로덕션에서는 제거)
-- ============================================

-- 개발/테스트용 샘플 데이터 (주석 처리됨)
-- INSERT INTO likes (user_id, target_type, target_id, like_type) VALUES
-- ('550e8400-e29b-41d4-a716-446655440000'::UUID, 'post', 1, 'like'),
-- ('550e8400-e29b-41d4-a716-446655440001'::UUID, 'post', 1, 'love'),
-- ('550e8400-e29b-41d4-a716-446655440002'::UUID, 'comment', 1, 'helpful'),
-- ('550e8400-e29b-41d4-a716-446655440000'::UUID, 'politician', 1, 'support');

-- ============================================
-- 완료 메시지
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'P3D3: likes 테이블이 성공적으로 생성되었습니다.';
  RAISE NOTICE '- 다형성 좋아요 시스템 (게시글, 댓글, 정치인, 평가)';
  RAISE NOTICE '- 다양한 좋아요 타입 지원 (like, love, support, agree, helpful)';
  RAISE NOTICE '- 좋아요 카운트 캐싱으로 성능 최적화';
  RAISE NOTICE '- 좋아요 알림 자동화';
  RAISE NOTICE '- 토글 및 통계 조회 헬퍼 함수';
  RAISE NOTICE '- RLS 정책 적용 완료';
  RAISE NOTICE '==============================================';
END;
$$ LANGUAGE plpgsql;