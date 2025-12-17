-- P3BA39: 연결 서비스 관리 테이블
-- 정치인-시민 연결 요청을 관리하는 테이블

-- connections 테이블 생성
CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 요청자 정보
  requester_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  requester_name TEXT,
  requester_email TEXT NOT NULL,
  requester_phone TEXT,

  -- 정치인 정보
  politician_id TEXT REFERENCES politicians(id) ON DELETE SET NULL,

  -- 연결 요청 내용
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  purpose TEXT, -- 연결 목적 (면담, 민원, 제안 등)
  preferred_date TEXT, -- 희망 일시

  -- 상태 관리
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),

  -- 관리자 처리 정보
  admin_notes TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_connections_status ON connections(status);
CREATE INDEX IF NOT EXISTS idx_connections_requester_id ON connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_connections_politician_id ON connections(politician_id);
CREATE INDEX IF NOT EXISTS idx_connections_created_at ON connections(created_at DESC);

-- RLS 활성화
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 본인 요청 조회 가능
CREATE POLICY "Users can view own connection requests"
  ON connections FOR SELECT
  USING (auth.uid() = requester_id);

-- RLS 정책: 본인 요청 생성 가능
CREATE POLICY "Users can create own connection requests"
  ON connections FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- RLS 정책: 본인 요청 취소 가능
CREATE POLICY "Users can cancel own pending requests"
  ON connections FOR UPDATE
  USING (auth.uid() = requester_id AND status = 'pending')
  WITH CHECK (status = 'cancelled');

-- RLS 정책: 서비스 롤은 모든 작업 가능
CREATE POLICY "Service role can do all"
  ON connections FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_connections_updated_at
  BEFORE UPDATE ON connections
  FOR EACH ROW
  EXECUTE FUNCTION update_connections_updated_at();

-- 코멘트 추가
COMMENT ON TABLE connections IS '정치인-시민 연결 요청 관리 테이블';
COMMENT ON COLUMN connections.status IS 'pending: 대기중, approved: 승인됨, rejected: 거부됨, completed: 완료됨, cancelled: 취소됨';
