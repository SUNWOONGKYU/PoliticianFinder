-- ============================================================
-- journalist_contacts 테이블 생성
-- 언론사 정치부 기자 연락처 관리 테이블
-- ============================================================
-- 실행 방법: Supabase Dashboard > SQL Editor에서 실행
-- ============================================================

CREATE TABLE IF NOT EXISTS journalist_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_type TEXT NOT NULL,           -- '광역' / '기초'
  region TEXT NOT NULL,                -- 지역명 (서울특별시, 종로구 등)
  parent_region TEXT,                  -- 기초: 소속 시도 (서울특별시 등)
  media_outlet TEXT NOT NULL,          -- 언론사명
  journalist_name TEXT NOT NULL,       -- 기자 이름
  email TEXT,                          -- 이메일 주소
  verified BOOLEAN DEFAULT FALSE,      -- 이메일 검증 여부
  last_contacted_at TIMESTAMPTZ,       -- 마지막 연락일
  notes TEXT,                          -- 비고
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_journalist_contacts_region ON journalist_contacts(region);
CREATE INDEX IF NOT EXISTS idx_journalist_contacts_region_type ON journalist_contacts(region_type);
CREATE INDEX IF NOT EXISTS idx_journalist_contacts_email ON journalist_contacts(email);
CREATE INDEX IF NOT EXISTS idx_journalist_contacts_media_outlet ON journalist_contacts(media_outlet);

-- RLS (Row Level Security) 비활성화 (서비스 키로만 접근)
ALTER TABLE journalist_contacts ENABLE ROW LEVEL SECURITY;

-- 서비스 키로 모든 작업 허용
CREATE POLICY "service_role_all" ON journalist_contacts
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 확인
SELECT 'journalist_contacts table created successfully' AS result;
