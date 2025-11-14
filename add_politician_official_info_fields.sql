-- P3F4: Add Official Information Fields to politicians table
-- Run this SQL in Supabase Studio > SQL Editor

-- Step 1: Add 11 new columns
ALTER TABLE politicians
  ADD COLUMN IF NOT EXISTS name_kanji VARCHAR(200),
  ADD COLUMN IF NOT EXISTS career JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS election_history JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS military_service VARCHAR(500),
  ADD COLUMN IF NOT EXISTS assets JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS tax_arrears VARCHAR(500) DEFAULT '없음',
  ADD COLUMN IF NOT EXISTS criminal_record VARCHAR(500) DEFAULT '없음',
  ADD COLUMN IF NOT EXISTS military_service_issue VARCHAR(500) DEFAULT '없음',
  ADD COLUMN IF NOT EXISTS residency_fraud VARCHAR(500) DEFAULT '없음',
  ADD COLUMN IF NOT EXISTS pledges JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS legislative_activity JSONB DEFAULT '{}'::jsonb;

-- Step 2: Add column comments
COMMENT ON COLUMN politicians.name_kanji IS '한자 이름 (예: 金民俊)';
COMMENT ON COLUMN politicians.career IS '경력 (배열)';
COMMENT ON COLUMN politicians.election_history IS '당선 이력 (배열)';
COMMENT ON COLUMN politicians.military_service IS '병역';
COMMENT ON COLUMN politicians.assets IS '재산 공개 (객체)';
COMMENT ON COLUMN politicians.tax_arrears IS '세금 체납';
COMMENT ON COLUMN politicians.criminal_record IS '범죄 경력';
COMMENT ON COLUMN politicians.military_service_issue IS '병역 의혹';
COMMENT ON COLUMN politicians.residency_fraud IS '위장전입';
COMMENT ON COLUMN politicians.pledges IS '주요 공약 (배열)';
COMMENT ON COLUMN politicians.legislative_activity IS '의정 활동 (객체)';

-- Step 3: Update sample data for '김민준'
UPDATE politicians
SET
  name_kanji = '金民俊',
  career = '[
    "前 국회 법제사법위원회 위원 (2020~2024)",
    "前 더불어민주당 정책위원회 부의장 (2018~2020)",
    "前 법무법인 광장 변호사 (2008~2015)",
    "前 대통령비서실 행정관 (2006~2008)"
  ]'::jsonb,
  election_history = '[
    "제21대 국회의원 (2020년 당선, 서울 강남구)",
    "제20대 국회의원 (2016년 당선, 서울 강남구)"
  ]'::jsonb,
  military_service = '육군 만기 제대 (1999~2001)',
  assets = '{
    "total": "약 15억원 (2024년 기준)",
    "real_estate": "약 12억원 (서울 강남구 아파트)",
    "financial": "약 3억원"
  }'::jsonb,
  tax_arrears = '없음',
  criminal_record = '없음',
  military_service_issue = '없음',
  residency_fraud = '없음',
  pledges = '[
    "강남구 교통 혼잡 완화 (GTX-C 조기 개통)",
    "청년 주택 공급 확대 (연 1,000가구)",
    "노후 학교 시설 현대화 (10개교)"
  ]'::jsonb,
  legislative_activity = '{
    "attendance_rate": "95% (21대 국회 평균 92%)",
    "bills_proposed": 42,
    "bills_representative": 28,
    "bills_co_proposed": 14,
    "bills_passed": 18
  }'::jsonb
WHERE name = '김민준';
