-- V24.5 Pooling System 데이터 삽입 (김동연, 오세훈만)
-- 생성일: 2025-12-02
-- 한동훈은 politicians 테이블에 없어서 제외


-- 김동연 (17270f25)
INSERT INTO ai_pooling_evaluation_scores
    (politician_id, category, chatgpt_score, grok_score, claude_score, final_score, prompt_version)
VALUES
    ('17270f25', 'Expertise', 81.4, 82.73333333333333, 77.4, 80.51111111111112, 'v24.5')
ON CONFLICT (politician_id, category, prompt_version)
DO UPDATE SET
    chatgpt_score = EXCLUDED.chatgpt_score,
    grok_score = EXCLUDED.grok_score,
    claude_score = EXCLUDED.claude_score,
    final_score = EXCLUDED.final_score,
    updated_at = NOW();

INSERT INTO ai_pooling_evaluation_scores
    (politician_id, category, chatgpt_score, grok_score, claude_score, final_score, prompt_version)
VALUES
    ('17270f25', 'Leadership', 83.53333333333333, 82.2, 79.46666666666667, 81.73333333333333, 'v24.5')
ON CONFLICT (politician_id, category, prompt_version)
DO UPDATE SET
    chatgpt_score = EXCLUDED.chatgpt_score,
    grok_score = EXCLUDED.grok_score,
    claude_score = EXCLUDED.claude_score,
    final_score = EXCLUDED.final_score,
    updated_at = NOW();

INSERT INTO ai_pooling_evaluation_scores
    (politician_id, category, chatgpt_score, grok_score, claude_score, final_score, prompt_version)
VALUES
    ('17270f25', 'Vision', 80.46666666666667, 81.73333333333333, 76.0, 79.39999999999999, 'v24.5')
ON CONFLICT (politician_id, category, prompt_version)
DO UPDATE SET
    chatgpt_score = EXCLUDED.chatgpt_score,
    grok_score = EXCLUDED.grok_score,
    claude_score = EXCLUDED.claude_score,
    final_score = EXCLUDED.final_score,
    updated_at = NOW();

INSERT INTO ai_pooling_evaluation_scores
    (politician_id, category, chatgpt_score, grok_score, claude_score, final_score, prompt_version)
VALUES
    ('17270f25', 'Integrity', 86.73333333333333, 84.46666666666667, 81.6, 84.26666666666667, 'v24.5')
ON CONFLICT (politician_id, category, prompt_version)
DO UPDATE SET
    chatgpt_score = EXCLUDED.chatgpt_score,
    grok_score = EXCLUDED.grok_score,
    claude_score = EXCLUDED.claude_score,
    final_score = EXCLUDED.final_score,
    updated_at = NOW();

INSERT INTO ai_pooling_evaluation_scores
    (politician_id, category, chatgpt_score, grok_score, claude_score, final_score, prompt_version)
VALUES
    ('17270f25', 'Ethics', 83.66666666666667, 81.8, 80.93333333333334, 82.13333333333334, 'v24.5')
ON CONFLICT (politician_id, category, prompt_version)
DO UPDATE SET
    chatgpt_score = EXCLUDED.chatgpt_score,
    grok_score = EXCLUDED.grok_score,
    claude_score = EXCLUDED.claude_score,
    final_score = EXCLUDED.final_score,
    updated_at = NOW();

INSERT INTO ai_pooling_evaluation_scores
    (politician_id, category, chatgpt_score, grok_score, claude_score, final_score, prompt_version)
VALUES
    ('17270f25', 'Accountability', 85.13333333333334, 82.53333333333333, 82.33333333333334, 83.33333333333333, 'v24.5')
ON CONFLICT (politician_id, category, prompt_version)
DO UPDATE SET
    chatgpt_score = EXCLUDED.chatgpt_score,
    grok_score = EXCLUDED.grok_score,
    claude_score = EXCLUDED.claude_score,
    final_score = EXCLUDED.final_score,
    updated_at = NOW();

INSERT INTO ai_pooling_evaluation_scores
    (politician_id, category, chatgpt_score, grok_score, claude_score, final_score, prompt_version)
VALUES
    ('17270f25', 'Transparency', 83.4, 81.13333333333333, 78.8, 81.1111111111111, 'v24.5')
ON CONFLICT (politician_id, category, prompt_version)
DO UPDATE SET
    chatgpt_score = EXCLUDED.chatgpt_score,
    grok_score = EXCLUDED.grok_score,
    claude_score = EXCLUDED.claude_score,
    final_score = EXCLUDED.final_score,
    updated_at = NOW();

INSERT INTO ai_pooling_evaluation_scores
    (politician_id, category, chatgpt_score, grok_score, claude_score, final_score, prompt_version)
VALUES
    ('17270f25', 'Communication', 81.53333333333333, 80.06666666666668, 78.4, 80.0, 'v24.5')
ON CONFLICT (politician_id, category, prompt_version)
DO UPDATE SET
    chatgpt_score = EXCLUDED.chatgpt_score,
    grok_score = EXCLUDED.grok_score,
    claude_score = EXCLUDED.claude_score,
    final_score = EXCLUDED.final_score,
    updated_at = NOW();

INSERT INTO ai_pooling_evaluation_scores
    (politician_id, category, chatgpt_score, grok_score, claude_score, final_score, prompt_version)
VALUES
    ('17270f25', 'Responsiveness', 85.0, 84.13333333333334, 79.86666666666666, 83.0, 'v24.5')
ON CONFLICT (politician_id, category, prompt_version)
DO UPDATE SET
    chatgpt_score = EXCLUDED.chatgpt_score,
    grok_score = EXCLUDED.grok_score,
    claude_score = EXCLUDED.claude_score,
    final_score = EXCLUDED.final_score,
    updated_at = NOW();

INSERT INTO ai_pooling_evaluation_scores
    (politician_id, category, chatgpt_score, grok_score, claude_score, final_score, prompt_version)
VALUES
    ('17270f25', 'PublicInterest', 78.60000000000001, 81.33333333333333, 79.33333333333334, 79.75555555555556, 'v24.5')
ON CONFLICT (politician_id, category, prompt_version)
DO UPDATE SET
    chatgpt_score = EXCLUDED.chatgpt_score,
    grok_score = EXCLUDED.grok_score,
    claude_score = EXCLUDED.claude_score,
    final_score = EXCLUDED.final_score,
    updated_at = NOW();


-- 오세훈 (62e7b453)
INSERT INTO ai_pooling_evaluation_scores
    (politician_id, category, chatgpt_score, grok_score, claude_score, final_score, prompt_version)
VALUES
    ('62e7b453', 'Expertise', 83.33333333333334, 78.13333333333334, 73.46666666666667, 78.31111111111112, 'v24.5')
ON CONFLICT (politician_id, category, prompt_version)
DO UPDATE SET
    chatgpt_score = EXCLUDED.chatgpt_score,
    grok_score = EXCLUDED.grok_score,
    claude_score = EXCLUDED.claude_score,
    final_score = EXCLUDED.final_score,
    updated_at = NOW();

INSERT INTO ai_pooling_evaluation_scores
    (politician_id, category, chatgpt_score, grok_score, claude_score, final_score, prompt_version)
VALUES
    ('62e7b453', 'Leadership', 80.19999999999999, 80.8, 75.4, 78.8, 'v24.5')
ON CONFLICT (politician_id, category, prompt_version)
DO UPDATE SET
    chatgpt_score = EXCLUDED.chatgpt_score,
    grok_score = EXCLUDED.grok_score,
    claude_score = EXCLUDED.claude_score,
    final_score = EXCLUDED.final_score,
    updated_at = NOW();

INSERT INTO ai_pooling_evaluation_scores
    (politician_id, category, chatgpt_score, grok_score, claude_score, final_score, prompt_version)
VALUES
    ('62e7b453', 'Vision', 80.93333333333334, 82.73333333333333, 80.53333333333333, 81.39999999999999, 'v24.5')
ON CONFLICT (politician_id, category, prompt_version)
DO UPDATE SET
    chatgpt_score = EXCLUDED.chatgpt_score,
    grok_score = EXCLUDED.grok_score,
    claude_score = EXCLUDED.claude_score,
    final_score = EXCLUDED.final_score,
    updated_at = NOW();

INSERT INTO ai_pooling_evaluation_scores
    (politician_id, category, chatgpt_score, grok_score, claude_score, final_score, prompt_version)
VALUES
    ('62e7b453', 'Integrity', 77.66666666666667, 75.86666666666667, 75.33333333333333, 76.28888888888889, 'v24.5')
ON CONFLICT (politician_id, category, prompt_version)
DO UPDATE SET
    chatgpt_score = EXCLUDED.chatgpt_score,
    grok_score = EXCLUDED.grok_score,
    claude_score = EXCLUDED.claude_score,
    final_score = EXCLUDED.final_score,
    updated_at = NOW();

INSERT INTO ai_pooling_evaluation_scores
    (politician_id, category, chatgpt_score, grok_score, claude_score, final_score, prompt_version)
VALUES
    ('62e7b453', 'Ethics', 77.8, 76.26666666666667, 75.66666666666666, 76.57777777777777, 'v24.5')
ON CONFLICT (politician_id, category, prompt_version)
DO UPDATE SET
    chatgpt_score = EXCLUDED.chatgpt_score,
    grok_score = EXCLUDED.grok_score,
    claude_score = EXCLUDED.claude_score,
    final_score = EXCLUDED.final_score,
    updated_at = NOW();

INSERT INTO ai_pooling_evaluation_scores
    (politician_id, category, chatgpt_score, grok_score, claude_score, final_score, prompt_version)
VALUES
    ('62e7b453', 'Accountability', 79.13333333333333, 75.33333333333333, 73.66666666666667, 76.04444444444444, 'v24.5')
ON CONFLICT (politician_id, category, prompt_version)
DO UPDATE SET
    chatgpt_score = EXCLUDED.chatgpt_score,
    grok_score = EXCLUDED.grok_score,
    claude_score = EXCLUDED.claude_score,
    final_score = EXCLUDED.final_score,
    updated_at = NOW();

INSERT INTO ai_pooling_evaluation_scores
    (politician_id, category, chatgpt_score, grok_score, claude_score, final_score, prompt_version)
VALUES
    ('62e7b453', 'Transparency', 71.0, 73.8, 70.93333333333334, 71.91111111111111, 'v24.5')
ON CONFLICT (politician_id, category, prompt_version)
DO UPDATE SET
    chatgpt_score = EXCLUDED.chatgpt_score,
    grok_score = EXCLUDED.grok_score,
    claude_score = EXCLUDED.claude_score,
    final_score = EXCLUDED.final_score,
    updated_at = NOW();

INSERT INTO ai_pooling_evaluation_scores
    (politician_id, category, chatgpt_score, grok_score, claude_score, final_score, prompt_version)
VALUES
    ('62e7b453', 'Communication', 81.0, 80.33333333333333, 78.60000000000001, 79.97777777777777, 'v24.5')
ON CONFLICT (politician_id, category, prompt_version)
DO UPDATE SET
    chatgpt_score = EXCLUDED.chatgpt_score,
    grok_score = EXCLUDED.grok_score,
    claude_score = EXCLUDED.claude_score,
    final_score = EXCLUDED.final_score,
    updated_at = NOW();

INSERT INTO ai_pooling_evaluation_scores
    (politician_id, category, chatgpt_score, grok_score, claude_score, final_score, prompt_version)
VALUES
    ('62e7b453', 'Responsiveness', 81.53333333333333, 82.73333333333333, 80.8, 81.68888888888888, 'v24.5')
ON CONFLICT (politician_id, category, prompt_version)
DO UPDATE SET
    chatgpt_score = EXCLUDED.chatgpt_score,
    grok_score = EXCLUDED.grok_score,
    claude_score = EXCLUDED.claude_score,
    final_score = EXCLUDED.final_score,
    updated_at = NOW();

INSERT INTO ai_pooling_evaluation_scores
    (politician_id, category, chatgpt_score, grok_score, claude_score, final_score, prompt_version)
VALUES
    ('62e7b453', 'PublicInterest', 80.93333333333334, 83.6, 80.86666666666666, 81.8, 'v24.5')
ON CONFLICT (politician_id, category, prompt_version)
DO UPDATE SET
    chatgpt_score = EXCLUDED.chatgpt_score,
    grok_score = EXCLUDED.grok_score,
    claude_score = EXCLUDED.claude_score,
    final_score = EXCLUDED.final_score,
    updated_at = NOW();


-- 검증 쿼리
SELECT politician_id, COUNT(*) as category_count, AVG(final_score) as avg_score
FROM ai_pooling_evaluation_scores
GROUP BY politician_id
ORDER BY politician_id;
