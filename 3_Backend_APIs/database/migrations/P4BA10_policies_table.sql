/**
 * Project Grid Task ID: P4BA10
 * 작업명: 정책 관리 API - Database Migration
 * 생성시간: 2025-11-09
 * 생성자: Claude-Sonnet-4.5 (api-designer)
 * 의존성: P2D1 (Database 스키마)
 * 설명: 정책 관리 테이블 생성 및 인덱스
 */

-- ============================================================================
-- 1. 정책 테이블 생성
-- ============================================================================

CREATE TABLE IF NOT EXISTS policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL,
  version INTEGER NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  is_current BOOLEAN DEFAULT false,
  effective_date TIMESTAMPTZ NOT NULL,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. 인덱스 생성
-- ============================================================================

-- 정책 타입 인덱스 (자주 조회되는 컬럼)
CREATE INDEX IF NOT EXISTS idx_policies_type ON policies(type);

-- 현재 정책 조회를 위한 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_policies_current ON policies(type, is_current);

-- 정책 타입 + 버전 고유 인덱스 (중복 방지)
CREATE UNIQUE INDEX IF NOT EXISTS idx_policies_type_version ON policies(type, version);

-- 생성일 인덱스 (정렬용)
CREATE INDEX IF NOT EXISTS idx_policies_created_at ON policies(created_at DESC);

-- 효력 발생일 인덱스
CREATE INDEX IF NOT EXISTS idx_policies_effective_date ON policies(effective_date);

-- ============================================================================
-- 3. 제약 조건
-- ============================================================================

-- 정책 타입 검증
ALTER TABLE policies
ADD CONSTRAINT chk_policies_type
CHECK (type IN ('terms', 'privacy', 'marketing', 'community'));

-- 버전 번호는 양수
ALTER TABLE policies
ADD CONSTRAINT chk_policies_version
CHECK (version > 0);

-- 제목은 최소 1자 이상
ALTER TABLE policies
ADD CONSTRAINT chk_policies_title
CHECK (LENGTH(title) > 0);

-- 내용은 최소 1자 이상
ALTER TABLE policies
ADD CONSTRAINT chk_policies_content
CHECK (LENGTH(content) > 0);

-- ============================================================================
-- 4. 트리거 함수 생성 (updated_at 자동 업데이트)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_policies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. 트리거 생성
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_update_policies_updated_at ON policies;

CREATE TRIGGER trigger_update_policies_updated_at
BEFORE UPDATE ON policies
FOR EACH ROW
EXECUTE FUNCTION update_policies_updated_at();

-- ============================================================================
-- 6. Row Level Security (RLS) 설정
-- ============================================================================

-- RLS 활성화
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;

-- 모든 사용자는 현재 정책을 읽을 수 있음
CREATE POLICY "Anyone can read current policies"
ON policies
FOR SELECT
USING (is_current = true);

-- 인증된 사용자는 모든 정책 히스토리를 읽을 수 있음
CREATE POLICY "Authenticated users can read all policies"
ON policies
FOR SELECT
TO authenticated
USING (true);

-- 관리자만 정책을 생성할 수 있음
CREATE POLICY "Only admins can insert policies"
ON policies
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 관리자만 정책을 업데이트할 수 있음
CREATE POLICY "Only admins can update policies"
ON policies
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 관리자만 비현재 정책을 삭제할 수 있음
CREATE POLICY "Only admins can delete non-current policies"
ON policies
FOR DELETE
TO authenticated
USING (
  is_current = false
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ============================================================================
-- 7. 샘플 데이터 삽입 (개발/테스트용)
-- ============================================================================

-- 이용약관 v1
INSERT INTO policies (type, version, title, content, is_current, effective_date)
VALUES (
  'terms',
  1,
  '이용약관 v1.0',
  '본 약관은 PoliticianFinder(이하 "서비스")의 이용과 관련하여 필요한 사항을 규정합니다.

제1조 (목적)
본 약관은 서비스 이용자의 권리와 의무를 명확히 하고, 서비스 제공자와 이용자 간의 관계를 규정함을 목적으로 합니다.

제2조 (용어의 정의)
1. "서비스"란 PoliticianFinder가 제공하는 정치인 정보 조회 및 커뮤니티 서비스를 말합니다.
2. "회원"이란 본 약관에 동의하고 서비스에 가입한 이용자를 말합니다.

제3조 (약관의 효력)
본 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.',
  true,
  '2025-01-01T00:00:00Z'
);

-- 개인정보처리방침 v1
INSERT INTO policies (type, version, title, content, is_current, effective_date)
VALUES (
  'privacy',
  1,
  '개인정보처리방침 v1.0',
  'PoliticianFinder(이하 "회사")는 정보통신망 이용촉진 및 정보보호 등에 관한 법률, 개인정보보호법 등 관련 법령을 준수합니다.

1. 수집하는 개인정보 항목
회사는 회원가입, 서비스 제공을 위해 다음의 개인정보를 수집합니다:
- 필수항목: 이메일, 비밀번호, 닉네임
- 선택항목: 프로필 이미지, 생년월일

2. 개인정보의 수집 및 이용목적
- 회원 관리 및 본인 확인
- 서비스 제공 및 개선
- 신규 서비스 개발 및 맞춤 서비스 제공

3. 개인정보의 보유 및 이용기간
회원 탈퇴 시까지 보유하며, 관계 법령에 따라 일정 기간 보관할 수 있습니다.',
  true,
  '2025-01-01T00:00:00Z'
);

-- 마케팅 수신 동의 v1
INSERT INTO policies (type, version, title, content, is_current, effective_date)
VALUES (
  'marketing',
  1,
  '마케팅 수신 동의 v1.0',
  '마케팅 정보 수신에 동의하시면 다음과 같은 혜택을 받으실 수 있습니다:

1. 수신 동의 항목
- 이메일을 통한 서비스 소식 및 이벤트 정보
- SMS를 통한 중요 공지사항
- 푸시 알림을 통한 실시간 업데이트

2. 제공되는 정보
- 신규 기능 및 서비스 소개
- 정치인 평가 리포트 및 통계
- 이벤트 및 프로모션 정보

3. 수신 동의 철회
언제든지 설정에서 수신 동의를 철회할 수 있습니다.

본 동의는 선택사항이며, 동의하지 않아도 서비스 이용이 가능합니다.',
  true,
  '2025-01-01T00:00:00Z'
);

-- 커뮤니티 가이드라인 v1
INSERT INTO policies (type, version, title, content, is_current, effective_date)
VALUES (
  'community',
  1,
  '커뮤니티 가이드라인 v1.0',
  'PoliticianFinder 커뮤니티는 건전하고 건설적인 정치 토론 공간을 목표로 합니다.

1. 금지 행위
- 욕설, 비방, 혐오 표현
- 허위 사실 유포
- 개인정보 무단 공개
- 스팸 및 광고성 게시물
- 정치적 선동 및 극단적 발언

2. 권장 사항
- 근거 있는 의견 제시
- 상대방 의견 존중
- 사실과 의견의 구분
- 건설적인 토론 문화

3. 제재 조치
가이드라인 위반 시 다음과 같은 조치가 취해질 수 있습니다:
- 1차: 경고
- 2차: 일시 정지 (7일)
- 3차: 계정 정지 (30일)
- 중대한 위반: 영구 정지

커뮤니티의 건강한 토론 문화를 위해 협조해 주시기 바랍니다.',
  true,
  '2025-01-01T00:00:00Z'
);

-- ============================================================================
-- 8. 유용한 뷰 생성
-- ============================================================================

-- 현재 정책만 조회하는 뷰
CREATE OR REPLACE VIEW current_policies AS
SELECT
  id,
  type,
  version,
  title,
  content,
  effective_date,
  updated_by,
  created_at,
  CASE type
    WHEN 'terms' THEN '이용약관'
    WHEN 'privacy' THEN '개인정보처리방침'
    WHEN 'marketing' THEN '마케팅 수신 동의'
    WHEN 'community' THEN '커뮤니티 가이드라인'
  END AS type_name
FROM policies
WHERE is_current = true
ORDER BY type;

-- 정책 버전 히스토리 뷰
CREATE OR REPLACE VIEW policy_version_history AS
SELECT
  id,
  type,
  version,
  title,
  is_current,
  effective_date,
  created_at,
  updated_by,
  CASE type
    WHEN 'terms' THEN '이용약관'
    WHEN 'privacy' THEN '개인정보처리방침'
    WHEN 'marketing' THEN '마케팅 수신 동의'
    WHEN 'community' THEN '커뮤니티 가이드라인'
  END AS type_name
FROM policies
ORDER BY type, version DESC;

-- ============================================================================
-- 9. 정책 통계 함수
-- ============================================================================

-- 정책 타입별 버전 수 조회
CREATE OR REPLACE FUNCTION get_policy_version_count(policy_type VARCHAR)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM policies
    WHERE type = policy_type
  );
END;
$$ LANGUAGE plpgsql;

-- 가장 최근 업데이트된 정책 조회
CREATE OR REPLACE FUNCTION get_latest_updated_policy()
RETURNS TABLE (
  type VARCHAR,
  version INTEGER,
  title VARCHAR,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.type, p.version, p.title, p.updated_at
  FROM policies p
  WHERE p.is_current = true
  ORDER BY p.updated_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. 코멘트 추가
-- ============================================================================

COMMENT ON TABLE policies IS '서비스 정책 문서 (이용약관, 개인정보처리방침 등)';
COMMENT ON COLUMN policies.id IS '정책 고유 ID';
COMMENT ON COLUMN policies.type IS '정책 타입 (terms, privacy, marketing, community)';
COMMENT ON COLUMN policies.version IS '정책 버전 번호';
COMMENT ON COLUMN policies.title IS '정책 제목';
COMMENT ON COLUMN policies.content IS '정책 내용';
COMMENT ON COLUMN policies.is_current IS '현재 활성 버전 여부';
COMMENT ON COLUMN policies.effective_date IS '효력 발생일';
COMMENT ON COLUMN policies.updated_by IS '수정자 ID';
COMMENT ON COLUMN policies.created_at IS '생성일시';
COMMENT ON COLUMN policies.updated_at IS '수정일시';

-- ============================================================================
-- Migration 완료
-- ============================================================================
-- P4BA10: 정책 관리 API Database Migration 완료
-- 생성된 객체:
-- - policies 테이블
-- - 5개 인덱스
-- - 4개 제약조건
-- - 2개 트리거
-- - 5개 RLS 정책
-- - 4개 샘플 데이터
-- - 2개 뷰
-- - 2개 함수
