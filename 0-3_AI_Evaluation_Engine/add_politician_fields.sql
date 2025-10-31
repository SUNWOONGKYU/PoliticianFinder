-- Politicians 테이블에 필드 추가

-- 1. 직종 (position_type)
ALTER TABLE politicians
ADD COLUMN IF NOT EXISTS position_type VARCHAR(20) CHECK (position_type IN (
    '국회의원',
    '광역단체장',
    '광역의원',
    '기초단체장',
    '기초의원',
    '교육감'
));

-- 2. 신분 (status)
ALTER TABLE politicians
ADD COLUMN IF NOT EXISTS status VARCHAR(20) CHECK (status IN (
    '현직',
    '후보자',
    '예비후보자',
    '출마자'
));

-- 3. 성별 (gender)
ALTER TABLE politicians
ADD COLUMN IF NOT EXISTS gender VARCHAR(10) CHECK (gender IN ('남성', '여성'));

-- 4. 나이 (age)
ALTER TABLE politicians
ADD COLUMN IF NOT EXISTS age INT CHECK (age >= 20 AND age <= 100);

-- 확인
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'politicians'
ORDER BY ordinal_position;
