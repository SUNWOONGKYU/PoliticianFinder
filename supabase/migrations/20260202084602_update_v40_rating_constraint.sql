-- evaluations_v40: X 판정 및 score 0 허용
-- X = 평가 제외 판정 (10년+과거/동명이인/무관/날조 → 모수 제외)

ALTER TABLE evaluations_v40
  DROP CONSTRAINT IF EXISTS evaluations_v40_rating_check;

ALTER TABLE evaluations_v40
  ADD CONSTRAINT evaluations_v40_rating_check
  CHECK (rating IN ('+4', '+3', '+2', '+1', '-1', '-2', '-3', '-4', 'X'));

ALTER TABLE evaluations_v40
  DROP CONSTRAINT IF EXISTS evaluations_v40_score_check;

ALTER TABLE evaluations_v40
  ADD CONSTRAINT evaluations_v40_score_check
  CHECK (score IN (8, 6, 4, 2, 0, -2, -4, -6, -8));
