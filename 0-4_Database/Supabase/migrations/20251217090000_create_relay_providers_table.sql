-- P3BA40: 중개 서비스 업체 관리 테이블
-- 중개 서비스 업체를 등록/관리하는 테이블

-- relay_providers 테이블 생성
CREATE TABLE IF NOT EXISTS relay_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 필수 정보
  name TEXT NOT NULL,                    -- 업체명
  service_type TEXT NOT NULL CHECK (char_length(service_type) <= 10),  -- 서비스 유형 (10자 이내)
  company_description TEXT NOT NULL,     -- 회사 소개
  service_description TEXT NOT NULL,     -- 서비스 소개
  phone TEXT NOT NULL,                   -- 대표 연락처
  email TEXT NOT NULL,                   -- 이메일

  -- 선택 정보
  website TEXT,                          -- 홈페이지 URL
  address TEXT,                          -- 주소
  logo_url TEXT,                         -- 로고 이미지 URL
  representative TEXT,                   -- 대표자명
  business_number TEXT,                  -- 사업자등록번호

  -- 관리용 필드
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'pending')),
  display_order INTEGER DEFAULT 0,       -- 노출 순서 (낮을수록 먼저)
  approved_at TIMESTAMP WITH TIME ZONE,  -- 승인일
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- 승인 관리자

  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_relay_providers_status ON relay_providers(status);
CREATE INDEX IF NOT EXISTS idx_relay_providers_display_order ON relay_providers(display_order);
CREATE INDEX IF NOT EXISTS idx_relay_providers_created_at ON relay_providers(created_at DESC);

-- RLS 활성화
ALTER TABLE relay_providers ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 활성 업체는 모두 조회 가능
CREATE POLICY "Anyone can view active relay providers"
  ON relay_providers FOR SELECT
  USING (status = 'active');

-- RLS 정책: 서비스 롤은 모든 작업 가능
CREATE POLICY "Service role can do all on relay_providers"
  ON relay_providers FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_relay_providers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_relay_providers_updated_at
  BEFORE UPDATE ON relay_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_relay_providers_updated_at();

-- 코멘트 추가
COMMENT ON TABLE relay_providers IS '중개 서비스 업체 관리 테이블';
COMMENT ON COLUMN relay_providers.service_type IS '서비스 유형 (10자 이내 자유 입력)';
COMMENT ON COLUMN relay_providers.status IS 'active: 활성, inactive: 비활성, pending: 심사중';
