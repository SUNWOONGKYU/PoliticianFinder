-- P2D2: 관심 정치인 스키마 (Favorite Politicians Schema)
-- 사용자가 관심있는 정치인 관리 테이블

-- 1. 관심 정치인 테이블
CREATE TABLE IF NOT EXISTS favorite_politicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  politician_id UUID NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
  notes TEXT,
  notification_enabled BOOLEAN DEFAULT true,
  is_pinned BOOLEAN DEFAULT false,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, politician_id)
);

-- 2. 관심 정치인 카테고리 테이블
CREATE TABLE IF NOT EXISTS favorite_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  favorite_politician_id UUID NOT NULL REFERENCES favorite_politicians(id) ON DELETE CASCADE,
  category VARCHAR(50), -- 'watch_closely', 'potential_candidate', 'monitoring', 'unsure'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 관심 정치인 알림 설정 테이블
CREATE TABLE IF NOT EXISTS favorite_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  favorite_politician_id UUID NOT NULL REFERENCES favorite_politicians(id) ON DELETE CASCADE,
  notification_type VARCHAR(100), -- 'activity', 'voting', 'speech', 'bill_introduced', 'news'
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX idx_favorite_politicians_user ON favorite_politicians(user_id);
CREATE INDEX idx_favorite_politicians_politician ON favorite_politicians(politician_id);
CREATE INDEX idx_favorite_politicians_added ON favorite_politicians(added_at DESC);
CREATE INDEX idx_favorite_politicians_pinned ON favorite_politicians(is_pinned, added_at DESC);

CREATE INDEX idx_favorite_categories_user ON favorite_categories(user_id);
CREATE INDEX idx_favorite_categories_favorite ON favorite_categories(favorite_politician_id);

CREATE INDEX idx_favorite_notifications_favorite ON favorite_notifications(favorite_politician_id);
CREATE INDEX idx_favorite_notifications_type ON favorite_notifications(notification_type);

-- 복합 인덱스
CREATE INDEX idx_favorite_politicians_user_pinned ON favorite_politicians(user_id, is_pinned);

-- RLS (Row Level Security) 정책
ALTER TABLE favorite_politicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_notifications ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 관심 정치인만 조회 가능
CREATE POLICY select_own_favorites ON favorite_politicians
  FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 관심 정치인만 수정/삭제 가능
CREATE POLICY update_own_favorites ON favorite_politicians
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY delete_own_favorites ON favorite_politicians
  FOR DELETE USING (auth.uid() = user_id);

-- 사용자는 자신의 관심 정치인만 추가 가능
CREATE POLICY insert_own_favorites ON favorite_politicians
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 카테고리도 동일하게 적용
CREATE POLICY select_own_categories ON favorite_categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY insert_own_categories ON favorite_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 알림 설정도 동일하게 적용
CREATE POLICY select_own_notifications ON favorite_notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM favorite_politicians fp
      WHERE fp.id = favorite_notifications.favorite_politician_id
      AND fp.user_id = auth.uid()
    )
  );

CREATE POLICY update_own_notifications ON favorite_notifications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM favorite_politicians fp
      WHERE fp.id = favorite_notifications.favorite_politician_id
      AND fp.user_id = auth.uid()
    )
  );
