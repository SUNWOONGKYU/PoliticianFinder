-- P2D1: AI 평점 시스템 확장
-- mockup-d4 디자인을 위한 AI 평점 시스템 완전 재구축

-- 1. 기존 ai_scores 테이블 구조 확인 및 확장
DO $$
BEGIN
  -- composite_score 컬럼 추가 (AI종합평점)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_scores' AND column_name = 'composite_score'
  ) THEN
    ALTER TABLE ai_scores ADD COLUMN composite_score DECIMAL(4,1);
  END IF;

  -- gpt_score 컬럼 추가 (추후 사용)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_scores' AND column_name = 'gpt_score'
  ) THEN
    ALTER TABLE ai_scores ADD COLUMN gpt_score DECIMAL(4,1);
  END IF;

  -- gemini_score 컬럼 추가 (추후 사용)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_scores' AND column_name = 'gemini_score'
  ) THEN
    ALTER TABLE ai_scores ADD COLUMN gemini_score DECIMAL(4,1);
  END IF;

  -- grok_score 컬럼 추가 (추후 사용)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_scores' AND column_name = 'grok_score'
  ) THEN
    ALTER TABLE ai_scores ADD COLUMN grok_score DECIMAL(4,1);
  END IF;

  -- perplexity_score 컬럼 추가 (추후 사용)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_scores' AND column_name = 'perplexity_score'
  ) THEN
    ALTER TABLE ai_scores ADD COLUMN perplexity_score DECIMAL(4,1);
  END IF;

  -- claude_score는 기존에 있다고 가정
END $$;

-- 2. composite_score 자동 계산 함수
CREATE OR REPLACE FUNCTION calculate_composite_score(
  claude DECIMAL,
  gpt DECIMAL DEFAULT NULL,
  gemini DECIMAL DEFAULT NULL,
  grok DECIMAL DEFAULT NULL,
  perp DECIMAL DEFAULT NULL
) RETURNS DECIMAL AS $$
DECLARE
  total DECIMAL := 0;
  count INTEGER := 0;
BEGIN
  -- 현재는 Claude만 사용
  IF claude IS NOT NULL THEN
    total := total + claude;
    count := count + 1;
  END IF;

  -- 추후 다른 AI 평점 추가 시
  IF gpt IS NOT NULL THEN
    total := total + gpt;
    count := count + 1;
  END IF;

  IF gemini IS NOT NULL THEN
    total := total + gemini;
    count := count + 1;
  END IF;

  IF grok IS NOT NULL THEN
    total := total + grok;
    count := count + 1;
  END IF;

  IF perp IS NOT NULL THEN
    total := total + perp;
    count := count + 1;
  END IF;

  IF count > 0 THEN
    RETURN ROUND(total / count, 1);
  ELSE
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. composite_score 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_composite_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.composite_score := calculate_composite_score(
    NEW.claude_score,
    NEW.gpt_score,
    NEW.gemini_score,
    NEW.grok_score,
    NEW.perplexity_score
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_composite_score ON ai_scores;
CREATE TRIGGER trigger_update_composite_score
  BEFORE INSERT OR UPDATE ON ai_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_composite_score();

-- 4. 필요한 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_ai_scores_composite_desc
  ON ai_scores(composite_score DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_ai_scores_politician_composite
  ON ai_scores(politician_id, composite_score DESC);

CREATE INDEX IF NOT EXISTS idx_ai_scores_claude_desc
  ON ai_scores(claude_score DESC NULLS LAST);

-- 5. AI 평점 랭킹 뷰 생성 (TOP 10용)
CREATE OR REPLACE VIEW v_ai_ranking_top10 AS
SELECT
  p.id,
  p.name,
  p.party,
  p.region,
  p.position,
  p.status,
  p.profile_image_url,
  a.claude_score,
  a.gpt_score,
  a.gemini_score,
  a.grok_score,
  a.perplexity_score,
  a.composite_score,
  COALESCE(r.avg_rating, 0) as member_rating,
  COALESCE(r.rating_count, 0) as member_rating_count
FROM politicians p
LEFT JOIN ai_scores a ON p.id = a.politician_id
LEFT JOIN (
  SELECT
    politician_id,
    AVG(score) as avg_rating,
    COUNT(*) as rating_count
  FROM ratings
  GROUP BY politician_id
) r ON p.id = r.politician_id
WHERE a.composite_score IS NOT NULL
ORDER BY a.composite_score DESC
LIMIT 10;

-- 6. 기존 데이터의 composite_score 업데이트
UPDATE ai_scores
SET composite_score = calculate_composite_score(
  claude_score,
  gpt_score,
  gemini_score,
  grok_score,
  perplexity_score
)
WHERE composite_score IS NULL;

-- 7. RLS 정책 (읽기는 모두 허용, 쓰기는 admin만)
ALTER TABLE ai_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "AI scores are viewable by everyone" ON ai_scores;
CREATE POLICY "AI scores are viewable by everyone"
  ON ai_scores FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Only admins can insert AI scores" ON ai_scores;
CREATE POLICY "Only admins can insert AI scores"
  ON ai_scores FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

DROP POLICY IF EXISTS "Only admins can update AI scores" ON ai_scores;
CREATE POLICY "Only admins can update AI scores"
  ON ai_scores FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- 완료
COMMENT ON TABLE ai_scores IS 'AI 평가 점수 (Claude, GPT, Gemini, Grok, Perplexity)';
COMMENT ON COLUMN ai_scores.composite_score IS 'AI 종합 평점 (평균)';
COMMENT ON VIEW v_ai_ranking_top10 IS '메인 페이지 AI 평점 랭킹 TOP 10';
