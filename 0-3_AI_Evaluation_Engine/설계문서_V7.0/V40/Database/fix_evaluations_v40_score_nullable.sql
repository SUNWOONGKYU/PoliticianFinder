-- V40 evaluations_v40 테이블 수정: score 필드 삭제
-- evaluations_v40에는 rating만 저장
-- score는 calculate_v40_scores.py에서 계산하여 ai_category_scores_v40 테이블에 저장

ALTER TABLE evaluations_v40
DROP COLUMN score;

-- 확인
\d evaluations_v40
