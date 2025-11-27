-- ai_evaluations 테이블 생성 (간단 버전)

DROP TABLE IF EXISTS ai_evaluations CASCADE;

CREATE TABLE ai_evaluations (
    politician_id TEXT PRIMARY KEY CHECK (length(politician_id) <= 10 AND length(politician_id) > 0),
    ai_count INT NOT NULL,
    avg_score INT NOT NULL,
    grade_code TEXT NOT NULL,
    grade_name TEXT NOT NULL,
    grade_emoji TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_evaluations_avg_score ON ai_evaluations(avg_score DESC);
