-- V6.2 평가 엔진 스키마 (테이블만, politicians 제외)
-- 기존 politicians 테이블은 유지

-- ============================================================================
-- 1. collected_data 테이블 (데이터 수집 + Rating)
-- ============================================================================
CREATE TABLE IF NOT EXISTS collected_data (
    id BIGSERIAL PRIMARY KEY,
    politician_id INT NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
    ai_name VARCHAR(50) NOT NULL,
    category_num INT NOT NULL CHECK (category_num BETWEEN 1 AND 10),
    item_num INT NOT NULL CHECK (item_num BETWEEN 1 AND 7),
    data_title VARCHAR(500),
    data_content TEXT,
    data_source VARCHAR(200),
    source_url TEXT,
    collection_date DATE,
    rating INT NOT NULL CHECK (rating BETWEEN -5 AND 5),
    rating_rationale TEXT,
    reliability DECIMAL(3,2) CHECK (reliability BETWEEN 0 AND 1),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_data_politician_ai ON collected_data(politician_id, ai_name);
CREATE INDEX IF NOT EXISTS idx_data_category_item ON collected_data(category_num, item_num);

-- ============================================================================
-- 2. ai_item_scores 테이블 (항목 점수: 4.0~10.0)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_item_scores (
    id BIGSERIAL PRIMARY KEY,
    politician_id INT NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
    ai_name VARCHAR(50) NOT NULL,
    category_num INT NOT NULL CHECK (category_num BETWEEN 1 AND 10),
    item_num INT NOT NULL CHECK (item_num BETWEEN 1 AND 7),
    item_score DECIMAL(4,2) CHECK (item_score BETWEEN 4.0 AND 10.0),
    data_count INT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(politician_id, ai_name, category_num, item_num)
);

CREATE INDEX IF NOT EXISTS idx_ai_item_politician ON ai_item_scores(politician_id, ai_name);

-- ============================================================================
-- 3. ai_category_scores 테이블 (분야 점수: 40~100)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_category_scores (
    id BIGSERIAL PRIMARY KEY,
    politician_id INT NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
    ai_name VARCHAR(50) NOT NULL,
    category_num INT NOT NULL CHECK (category_num BETWEEN 1 AND 10),
    category_score DECIMAL(5,2) CHECK (category_score BETWEEN 40.0 AND 100.0),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(politician_id, ai_name, category_num)
);

CREATE INDEX IF NOT EXISTS idx_ai_category_politician ON ai_category_scores(politician_id, ai_name);

-- ============================================================================
-- 4. ai_final_scores 테이블 (최종 점수: 400~1,000 + 등급)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_final_scores (
    id BIGSERIAL PRIMARY KEY,
    politician_id INT NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
    ai_name VARCHAR(50) NOT NULL,
    final_score DECIMAL(6,2) CHECK (final_score BETWEEN 400.0 AND 1000.0),
    grade_code VARCHAR(1) CHECK (grade_code IN ('M', 'D', 'E', 'P', 'G', 'S', 'B', 'I')),
    grade_name VARCHAR(20),
    grade_emoji VARCHAR(10),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(politician_id, ai_name)
);

CREATE INDEX IF NOT EXISTS idx_ai_final_politician ON ai_final_scores(politician_id, ai_name);
CREATE INDEX IF NOT EXISTS idx_ai_final_score ON ai_final_scores(final_score DESC);

-- ============================================================================
-- 5. combined_final_scores 테이블 (AI 통합 점수)
-- ============================================================================
CREATE TABLE IF NOT EXISTS combined_final_scores (
    id BIGSERIAL PRIMARY KEY,
    politician_id INT NOT NULL UNIQUE REFERENCES politicians(id) ON DELETE CASCADE,
    combined_score DECIMAL(6,2),
    combined_grade_code VARCHAR(1),
    combined_grade_name VARCHAR(20),
    combined_grade_emoji VARCHAR(10),
    ai_count INT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_combined_score ON combined_final_scores(combined_score DESC);

-- ============================================================================
-- 트리거 함수들
-- ============================================================================

-- 1. 항목 점수 자동 계산 (collected_data → ai_item_scores)
CREATE OR REPLACE FUNCTION calculate_ai_item_score()
RETURNS TRIGGER AS $$
DECLARE
    v_item_score DECIMAL(4,2);
    v_data_count INT;
BEGIN
    SELECT
        7.0 + (AVG(rating) * 0.6),
        COUNT(*)
    INTO v_item_score, v_data_count
    FROM collected_data
    WHERE politician_id = NEW.politician_id
      AND ai_name = NEW.ai_name
      AND category_num = NEW.category_num
      AND item_num = NEW.item_num;

    IF v_item_score < 4.0 THEN v_item_score := 4.0;
    ELSIF v_item_score > 10.0 THEN v_item_score := 10.0;
    END IF;

    INSERT INTO ai_item_scores (politician_id, ai_name, category_num, item_num, item_score, data_count)
    VALUES (NEW.politician_id, NEW.ai_name, NEW.category_num, NEW.item_num, v_item_score, v_data_count)
    ON CONFLICT (politician_id, ai_name, category_num, item_num)
    DO UPDATE SET
        item_score = v_item_score,
        data_count = v_data_count,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_ai_item_score ON collected_data;
CREATE TRIGGER trg_calculate_ai_item_score
AFTER INSERT OR UPDATE ON collected_data
FOR EACH ROW EXECUTE FUNCTION calculate_ai_item_score();

-- 2. 분야 점수 자동 계산 (ai_item_scores → ai_category_scores)
CREATE OR REPLACE FUNCTION calculate_ai_category_score()
RETURNS TRIGGER AS $$
DECLARE
    v_category_score DECIMAL(5,2);
    v_items_count INT;
BEGIN
    SELECT AVG(item_score) * 10, COUNT(*)
    INTO v_category_score, v_items_count
    FROM ai_item_scores
    WHERE politician_id = NEW.politician_id
      AND ai_name = NEW.ai_name
      AND category_num = NEW.category_num;

    IF v_items_count = 7 THEN
        INSERT INTO ai_category_scores (politician_id, ai_name, category_num, category_score)
        VALUES (NEW.politician_id, NEW.ai_name, NEW.category_num, v_category_score)
        ON CONFLICT (politician_id, ai_name, category_num)
        DO UPDATE SET
            category_score = v_category_score,
            updated_at = NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_ai_category_score ON ai_item_scores;
CREATE TRIGGER trg_calculate_ai_category_score
AFTER INSERT OR UPDATE ON ai_item_scores
FOR EACH ROW EXECUTE FUNCTION calculate_ai_category_score();

-- 3. 최종 점수 자동 계산 (ai_category_scores → ai_final_scores)
CREATE OR REPLACE FUNCTION calculate_ai_final_score()
RETURNS TRIGGER AS $$
DECLARE
    v_final_score DECIMAL(6,2);
    v_grade_code VARCHAR(1);
    v_grade_name VARCHAR(20);
    v_grade_emoji VARCHAR(10);
    v_categories_completed INT;
BEGIN
    SELECT SUM(category_score), COUNT(*)
    INTO v_final_score, v_categories_completed
    FROM ai_category_scores
    WHERE politician_id = NEW.politician_id
      AND ai_name = NEW.ai_name;

    IF v_categories_completed = 10 THEN
        IF v_final_score >= 925 THEN
            v_grade_code := 'M'; v_grade_name := 'Mugunghwa'; v_grade_emoji := '🌺';
        ELSIF v_final_score >= 850 THEN
            v_grade_code := 'D'; v_grade_name := 'Diamond'; v_grade_emoji := '💎';
        ELSIF v_final_score >= 775 THEN
            v_grade_code := 'E'; v_grade_name := 'Emerald'; v_grade_emoji := '💚';
        ELSIF v_final_score >= 700 THEN
            v_grade_code := 'P'; v_grade_name := 'Platinum'; v_grade_emoji := '🥇';
        ELSIF v_final_score >= 625 THEN
            v_grade_code := 'G'; v_grade_name := 'Gold'; v_grade_emoji := '🥇';
        ELSIF v_final_score >= 550 THEN
            v_grade_code := 'S'; v_grade_name := 'Silver'; v_grade_emoji := '🥈';
        ELSIF v_final_score >= 475 THEN
            v_grade_code := 'B'; v_grade_name := 'Bronze'; v_grade_emoji := '🥉';
        ELSE
            v_grade_code := 'I'; v_grade_name := 'Iron'; v_grade_emoji := '⚫';
        END IF;

        INSERT INTO ai_final_scores (politician_id, ai_name, final_score, grade_code, grade_name, grade_emoji)
        VALUES (NEW.politician_id, NEW.ai_name, v_final_score, v_grade_code, v_grade_name, v_grade_emoji)
        ON CONFLICT (politician_id, ai_name)
        DO UPDATE SET
            final_score = v_final_score,
            grade_code = v_grade_code,
            grade_name = v_grade_name,
            grade_emoji = v_grade_emoji,
            updated_at = NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_ai_final_score ON ai_category_scores;
CREATE TRIGGER trg_calculate_ai_final_score
AFTER INSERT OR UPDATE ON ai_category_scores
FOR EACH ROW EXECUTE FUNCTION calculate_ai_final_score();

-- 4. 통합 점수 계산 (ai_final_scores → combined_final_scores)
CREATE OR REPLACE FUNCTION update_combined_score()
RETURNS TRIGGER AS $$
DECLARE
    v_combined_score DECIMAL(6,2);
    v_ai_count INT;
    v_grade_code VARCHAR(1);
    v_grade_name VARCHAR(20);
    v_grade_emoji VARCHAR(10);
BEGIN
    SELECT AVG(final_score), COUNT(*)
    INTO v_combined_score, v_ai_count
    FROM ai_final_scores
    WHERE politician_id = NEW.politician_id;

    IF v_combined_score >= 925 THEN
        v_grade_code := 'M'; v_grade_name := 'Mugunghwa'; v_grade_emoji := '🌺';
    ELSIF v_combined_score >= 850 THEN
        v_grade_code := 'D'; v_grade_name := 'Diamond'; v_grade_emoji := '💎';
    ELSIF v_combined_score >= 775 THEN
        v_grade_code := 'E'; v_grade_name := 'Emerald'; v_grade_emoji := '💚';
    ELSIF v_combined_score >= 700 THEN
        v_grade_code := 'P'; v_grade_name := 'Platinum'; v_grade_emoji := '🥇';
    ELSIF v_combined_score >= 625 THEN
        v_grade_code := 'G'; v_grade_name := 'Gold'; v_grade_emoji := '🥇';
    ELSIF v_combined_score >= 550 THEN
        v_grade_code := 'S'; v_grade_name := 'Silver'; v_grade_emoji := '🥈';
    ELSIF v_combined_score >= 475 THEN
        v_grade_code := 'B'; v_grade_name := 'Bronze'; v_grade_emoji := '🥉';
    ELSE
        v_grade_code := 'I'; v_grade_name := 'Iron'; v_grade_emoji := '⚫';
    END IF;

    INSERT INTO combined_final_scores (politician_id, combined_score, combined_grade_code, combined_grade_name, combined_grade_emoji, ai_count)
    VALUES (NEW.politician_id, v_combined_score, v_grade_code, v_grade_name, v_grade_emoji, v_ai_count)
    ON CONFLICT (politician_id)
    DO UPDATE SET
        combined_score = v_combined_score,
        combined_grade_code = v_grade_code,
        combined_grade_name = v_grade_name,
        combined_grade_emoji = v_grade_emoji,
        ai_count = v_ai_count,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_combined_score ON ai_final_scores;
CREATE TRIGGER trg_update_combined_score
AFTER INSERT OR UPDATE ON ai_final_scores
FOR EACH ROW EXECUTE FUNCTION update_combined_score();

-- 완료!
SELECT 'V6.2 Schema (tables only) installed successfully!' AS message;
