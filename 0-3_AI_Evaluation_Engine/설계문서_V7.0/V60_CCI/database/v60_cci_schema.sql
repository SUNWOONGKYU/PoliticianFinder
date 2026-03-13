-- ============================================================
-- V60 CCI (Candidate Relative Competitive Index) DB Schema
-- 작성일: 2026-03-11
-- 용도: GPI(V40→V60 전환) + Alpha 1/Alpha 2 + CCI 통합
-- ============================================================
-- CRITICAL RULES:
--   politician_id = TEXT 8자리 hex (INTEGER 절대 금지)
--   rating = TEXT '+4'~'-4', 'X' (숫자 변환 금지)
--   evaluator_ai = 'Claude' / 'Gemini' / 'ChatGPT' / 'Grok'
--   Supabase 1000행 제한 → .range() pagination 필수
-- ============================================================

-- ═══════════════════════════════════════════
-- 1. competitor_groups_v60 — 경쟁자 그룹
-- ═══════════════════════════════════════════
-- 같은 선거구 출마 예상 후보를 그룹핑
-- CCI 상대평가의 기반 단위
-- 예: 서울시장 그룹 = {정원오, 오세훈, 김문수, ...}

CREATE TABLE IF NOT EXISTS competitor_groups_v60 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_name TEXT NOT NULL,                          -- '2026 서울시장'
  election_type TEXT NOT NULL,                       -- 'mayor' / 'governor' / 'assembly'
  region TEXT NOT NULL,                              -- '서울특별시'
  district TEXT,                                     -- 선거구 (국회의원용)
  politician_ids TEXT[] NOT NULL,                    -- '{17270f25,62e7b453,...}'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cg_v60_region
  ON competitor_groups_v60(region);

COMMENT ON TABLE competitor_groups_v60
  IS '경쟁자 그룹: 같은 선거구 출마 예상 후보 그룹핑 (CCI 상대평가 기반)';


-- ═══════════════════════════════════════════
-- 2. collected_data_v60 — GPI 수집 데이터
-- ═══════════════════════════════════════════
-- V40 → V60 전환 (CLI→API, 구조 동일)

CREATE TABLE IF NOT EXISTS collected_data_v60 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  politician_id TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'expertise','leadership','vision',
    'integrity','ethics','accountability','transparency',
    'communication','responsiveness','publicinterest'
  )),
  title TEXT,
  content TEXT,
  source_url TEXT,
  source_name TEXT,
  source_type TEXT CHECK (source_type IN ('OFFICIAL','PUBLIC')),
  published_date DATE,
  sentiment TEXT CHECK (sentiment IN ('negative','positive','free')),
  collector_ai TEXT NOT NULL,                        -- 수집 채널 이름
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cd_v60_pol_cat
  ON collected_data_v60(politician_id, category);

CREATE INDEX IF NOT EXISTS idx_cd_v60_collector
  ON collected_data_v60(collector_ai);

COMMENT ON TABLE collected_data_v60
  IS 'GPI 수집 데이터 (V40→V60 API 전환, 10카테고리 × 100개/인)';


-- ═══════════════════════════════════════════
-- 3. evaluations_v60 — GPI 평가 결과
-- ═══════════════════════════════════════════
-- 4개 AI 독립 평가 (다수결 객관성)

CREATE TABLE IF NOT EXISTS evaluations_v60 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  politician_id TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'expertise','leadership','vision',
    'integrity','ethics','accountability','transparency',
    'communication','responsiveness','publicinterest'
  )),
  evaluator_ai TEXT NOT NULL CHECK (evaluator_ai IN (
    'Claude','ChatGPT','Gemini','Grok'
  )),
  collected_data_id UUID REFERENCES collected_data_v60(id),
  rating TEXT CHECK (rating IN ('+4','+3','+2','+1','-1','-2','-3','-4','X')),
  reasoning TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ev_v60_pol_cat
  ON evaluations_v60(politician_id, category);

CREATE INDEX IF NOT EXISTS idx_ev_v60_evaluator
  ON evaluations_v60(evaluator_ai);

COMMENT ON TABLE evaluations_v60
  IS 'GPI 평가 결과: 4개 AI 독립 판정 (+4~-4, X=제외)';


-- ═══════════════════════════════════════════
-- 4. ai_final_scores_v60 — GPI 최종 점수
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS ai_final_scores_v60 (
  politician_id TEXT PRIMARY KEY,
  final_score INTEGER,                               -- 200~1000
  grade TEXT,                                        -- 'S','A','B','C','D','E','F','P'
  grade_name TEXT,
  category_scores JSONB,                             -- {expertise:82, leadership:75, ...}
  total_evaluations INTEGER,
  give_up_categories JSONB,                          -- ['integrity','transparency'] or null
  calculated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE ai_final_scores_v60
  IS 'GPI 최종 점수: (PRIOR + avg_score × COEFF) × 10, 합산 200~1000';


-- ═══════════════════════════════════════════
-- 5. collected_alpha_v60 — Alpha 수집 데이터
-- ═══════════════════════════════════════════
-- Alpha 1 (민심·여론) + Alpha 2 (선거구조) 통합 테이블
-- 6개 소분류 카테고리

CREATE TABLE IF NOT EXISTS collected_alpha_v60 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  politician_id TEXT NOT NULL,
  alpha_type TEXT NOT NULL CHECK (alpha_type IN ('alpha1','alpha2')),
  category TEXT NOT NULL CHECK (category IN (
    'opinion','media','risk',                        -- Alpha 1: 여론동향, 이미지·내러티브, 리스크
    'party','candidate','regional'                   -- Alpha 2: 정당경쟁력, 후보자경쟁력, 지역기반
  )),
  title TEXT,
  content TEXT,
  source_url TEXT,
  source_name TEXT,
  source_type TEXT CHECK (source_type IN ('OFFICIAL','PUBLIC','API')),
  data_date DATE,                                    -- 데이터 기준일
  collector TEXT NOT NULL,                           -- 수집 방법: 'api_naver', 'api_bigkinds', 'api_nesdc', 'manual', etc.
  raw_data JSONB,                                    -- API 원본 응답 (선택)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ca_v60_pol_alpha_cat
  ON collected_alpha_v60(politician_id, alpha_type, category);

COMMENT ON TABLE collected_alpha_v60
  IS 'Alpha 수집 데이터: Alpha 1(민심·여론 3개) + Alpha 2(선거구조 3개) 통합';


-- ═══════════════════════════════════════════
-- 6. evaluations_alpha_v60 — Alpha 평가 결과
-- ═══════════════════════════════════════════
-- Claude 단독 평가 (플래툰 포메이션)
-- 소대장 조율로 상대평가 일관성 보장

CREATE TABLE IF NOT EXISTS evaluations_alpha_v60 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  politician_id TEXT NOT NULL,
  alpha_type TEXT NOT NULL CHECK (alpha_type IN ('alpha1','alpha2')),
  category TEXT NOT NULL CHECK (category IN (
    'opinion','media','risk',
    'party','candidate','regional'
  )),
  evaluator_ai TEXT NOT NULL DEFAULT 'Claude',       -- Alpha는 Claude 단독
  collected_alpha_id UUID REFERENCES collected_alpha_v60(id),
  rating TEXT CHECK (rating IN ('+4','+3','+2','+1','-1','-2','-3','-4','X')),
  reasoning TEXT,
  competitor_group_id UUID REFERENCES competitor_groups_v60(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ea_v60_pol_cat
  ON evaluations_alpha_v60(politician_id, alpha_type, category);

COMMENT ON TABLE evaluations_alpha_v60
  IS 'Alpha 평가 결과: Claude 단독 (플래툰 포메이션, +4~-4 상대평가)';


-- ═══════════════════════════════════════════
-- 7. alpha_scores_v60 — Alpha 소분류 점수
-- ═══════════════════════════════════════════

CREATE TABLE IF NOT EXISTS alpha_scores_v60 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  politician_id TEXT NOT NULL,
  alpha_type TEXT NOT NULL CHECK (alpha_type IN ('alpha1','alpha2')),
  category TEXT NOT NULL CHECK (category IN (
    'opinion','media','risk',
    'party','candidate','regional'
  )),
  avg_rating NUMERIC(4,2),                           -- 평균 레이팅 (소수점)
  category_score NUMERIC(5,1),                       -- (PRIOR + avg × COEFF) × 10
  total_evaluations INTEGER,
  competitor_group_id UUID REFERENCES competitor_groups_v60(id),
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(politician_id, alpha_type, category, competitor_group_id)
);

CREATE INDEX IF NOT EXISTS idx_as_v60_pol
  ON alpha_scores_v60(politician_id);

COMMENT ON TABLE alpha_scores_v60
  IS 'Alpha 소분류 점수: 카테고리별 평균 레이팅 → 점수 변환';


-- ═══════════════════════════════════════════
-- 8. cci_scores_v60 — CCI 최종 통합 점수
-- ═══════════════════════════════════════════
-- CCI = GPI(40%) + Alpha 1(30%) + Alpha 2(30%)

CREATE TABLE IF NOT EXISTS cci_scores_v60 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  politician_id TEXT NOT NULL,
  competitor_group_id UUID REFERENCES competitor_groups_v60(id),

  -- GPI (V60)
  gpi_score INTEGER,                                 -- ai_final_scores_v60.final_score
  gpi_grade TEXT,

  -- Alpha 1: 민심·여론
  alpha1_opinion_score NUMERIC(5,1),
  alpha1_media_score NUMERIC(5,1),
  alpha1_risk_score NUMERIC(5,1),
  alpha1_total NUMERIC(5,1),                         -- Alpha 1 합계

  -- Alpha 2: 선거구조
  alpha2_party_score NUMERIC(5,1),
  alpha2_candidate_score NUMERIC(5,1),
  alpha2_regional_score NUMERIC(5,1),
  alpha2_total NUMERIC(5,1),                         -- Alpha 2 합계

  -- CCI 통합
  cci_score NUMERIC(6,1),                            -- GPI×0.4 + A1×0.3 + A2×0.3
  cci_rank INTEGER,                                  -- 그룹 내 순위
  cci_grade TEXT,                                    -- 종합 등급

  -- 메타
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(politician_id, competitor_group_id)
);

CREATE INDEX IF NOT EXISTS idx_cci_v60_group
  ON cci_scores_v60(competitor_group_id);

COMMENT ON TABLE cci_scores_v60
  IS 'CCI 최종 점수: GPI(40%) + Alpha1(30%) + Alpha2(30%) 통합';


-- ═══════════════════════════════════════════
-- VIEW: 경쟁자 그룹별 CCI 순위
-- ═══════════════════════════════════════════

CREATE OR REPLACE VIEW cci_rankings_v60 AS
SELECT
  cg.group_name,
  cg.election_type,
  cg.region,
  p.name AS politician_name,
  p.party,
  cs.gpi_score,
  cs.alpha1_total,
  cs.alpha2_total,
  cs.cci_score,
  cs.cci_rank,
  cs.cci_grade
FROM cci_scores_v60 cs
JOIN competitor_groups_v60 cg ON cs.competitor_group_id = cg.id
JOIN politicians p ON cs.politician_id = p.id
ORDER BY cg.group_name, cs.cci_rank;

COMMENT ON VIEW cci_rankings_v60
  IS '경쟁자 그룹별 CCI 순위 뷰: 그룹명, 후보명, GPI/Alpha/CCI 점수';
