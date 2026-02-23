-- 081: report_purchases 테이블에 buyer_type, user_id 컬럼 추가
-- 구매 대상 확장: 정치인 본인 → 정치인 + 일반 회원(member)

-- buyer_type: 구매자 유형 (politician: 정치인 본인, member: 일반 회원)
ALTER TABLE report_purchases
ADD COLUMN IF NOT EXISTS buyer_type VARCHAR(20) DEFAULT 'politician'
  CHECK (buyer_type IN ('politician', 'member'));

-- user_id: 일반 회원 구매 시 auth.users 참조
ALTER TABLE report_purchases
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 인덱스: buyer_email 기준 회차 카운트 조회 최적화
CREATE INDEX IF NOT EXISTS idx_report_purchases_buyer_email
ON report_purchases (buyer_email, payment_confirmed);

-- 인덱스: buyer_type 조회 최적화
CREATE INDEX IF NOT EXISTS idx_report_purchases_buyer_type
ON report_purchases (buyer_type);

COMMENT ON COLUMN report_purchases.buyer_type IS '구매자 유형: politician(정치인 본인), member(일반회원)';
COMMENT ON COLUMN report_purchases.user_id IS '일반 회원 구매 시 유저 ID (auth.users 참조)';
