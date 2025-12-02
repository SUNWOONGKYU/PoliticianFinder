-- Migration 055: Create ai_pooling_evaluation_scores table
-- Purpose: V24.5 Pooling System 평가 결과 저장
-- Date: 2025-12-02
-- Description: 3개 AI가 150개 뉴스를 교차 평가한 결과 (카테고리별 점수)

-- 테이블 생성
CREATE TABLE ai_pooling_evaluation_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 정치인
  politician_id TEXT NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,

  -- 카테고리
  category TEXT NOT NULL,
  -- 'Expertise', 'Leadership', 'Vision', 'Integrity', 'Ethics',
  -- 'Accountability', 'Transparency', 'Communication', 'Responsiveness', 'PublicInterest'

  -- 3개 AI의 카테고리별 점수
  chatgpt_score FLOAT NOT NULL CHECK (chatgpt_score >= 0 AND chatgpt_score <= 100),
  grok_score FLOAT NOT NULL CHECK (grok_score >= 0 AND grok_score <= 100),
  claude_score FLOAT NOT NULL CHECK (claude_score >= 0 AND claude_score <= 100),

  -- 최종 평균 점수 (3개 AI 평균)
  final_score FLOAT NOT NULL CHECK (final_score >= 0 AND final_score <= 100),

  -- 메타데이터
  prompt_version TEXT DEFAULT 'v24.5',
  evaluated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- 중복 방지 (같은 정치인 + 카테고리 + 프롬프트 버전은 1개만)
  UNIQUE(politician_id, category, prompt_version)
);

-- 인덱스 생성
CREATE INDEX idx_ai_pooling_eval_scores_politician
ON ai_pooling_evaluation_scores(politician_id);

CREATE INDEX idx_ai_pooling_eval_scores_category
ON ai_pooling_evaluation_scores(category);

CREATE INDEX idx_ai_pooling_eval_scores_prompt_version
ON ai_pooling_evaluation_scores(prompt_version);

-- 복합 인덱스 (정치인 + 카테고리 조회 최적화)
CREATE INDEX idx_ai_pooling_eval_scores_politician_category
ON ai_pooling_evaluation_scores(politician_id, category);

-- RLS (Row Level Security) 활성화
ALTER TABLE ai_pooling_evaluation_scores ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 모든 사용자가 읽기 가능
CREATE POLICY "Anyone can read ai_pooling_evaluation_scores"
ON ai_pooling_evaluation_scores
FOR SELECT
USING (true);

-- RLS 정책: 인증된 사용자만 쓰기 가능 (관리자용)
CREATE POLICY "Authenticated users can insert ai_pooling_evaluation_scores"
ON ai_pooling_evaluation_scores
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update ai_pooling_evaluation_scores"
ON ai_pooling_evaluation_scores
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 테이블 설명
COMMENT ON TABLE ai_pooling_evaluation_scores IS
'V24.5 Pooling System: 3개 AI가 150개 뉴스를 교차 평가한 결과 (카테고리별)';

COMMENT ON COLUMN ai_pooling_evaluation_scores.politician_id IS
'정치인 ID (politicians.id 참조)';

COMMENT ON COLUMN ai_pooling_evaluation_scores.category IS
'평가 카테고리 (10개 중 1개)';

COMMENT ON COLUMN ai_pooling_evaluation_scores.chatgpt_score IS
'ChatGPT의 카테고리별 점수 (0-100)';

COMMENT ON COLUMN ai_pooling_evaluation_scores.grok_score IS
'Grok의 카테고리별 점수 (0-100)';

COMMENT ON COLUMN ai_pooling_evaluation_scores.claude_score IS
'Claude의 카테고리별 점수 (0-100)';

COMMENT ON COLUMN ai_pooling_evaluation_scores.final_score IS
'최종 평균 점수 = (chatgpt_score + grok_score + claude_score) / 3';

COMMENT ON COLUMN ai_pooling_evaluation_scores.prompt_version IS
'프롬프트 버전 (기본값: v24.5)';
