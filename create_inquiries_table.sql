-- 문의하기 테이블 생성
-- Connection 페이지의 "문의하기" 데이터 저장

CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 문의자 정보
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL,

  -- 문의 대상 정치인 (선택사항)
  politician_id UUID REFERENCES politicians(id) ON DELETE SET NULL,
  politician_name VARCHAR(100),  -- 정치인 이름 (참조용)

  -- 문의 내용
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,

  -- 상태 관리
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

  -- 답변
  admin_response TEXT,
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  responded_at TIMESTAMPTZ,

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 인덱스
CREATE INDEX idx_inquiries_user_id ON inquiries(user_id);
CREATE INDEX idx_inquiries_politician_id ON inquiries(politician_id);
CREATE INDEX idx_inquiries_status ON inquiries(status);
CREATE INDEX idx_inquiries_created_at ON inquiries(created_at DESC);
CREATE INDEX idx_inquiries_email ON inquiries(email);

-- RLS 정책
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- 정책 1: 모든 사용자가 문의 생성 가능
CREATE POLICY "Anyone can create inquiries"
  ON inquiries
  FOR INSERT
  TO public
  WITH CHECK (true);

-- 정책 2: 본인 문의만 조회 가능
CREATE POLICY "Users can view own inquiries"
  ON inquiries
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR email = auth.jwt()->>'email');

-- 정책 3: 관리자는 모든 문의 조회 가능 (service role)
-- Service Role Key 사용 시 RLS 우회됨

-- 트리거: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_inquiries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_inquiries_updated_at
  BEFORE UPDATE ON inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_inquiries_updated_at();

-- 코멘트
COMMENT ON TABLE inquiries IS '고객 문의하기 데이터';
COMMENT ON COLUMN inquiries.status IS 'pending: 대기중, in_progress: 처리중, resolved: 해결됨, closed: 종료됨';
COMMENT ON COLUMN inquiries.priority IS 'low: 낮음, normal: 보통, high: 높음, urgent: 긴급';

-- 확인
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'inquiries'
ORDER BY ordinal_position;
