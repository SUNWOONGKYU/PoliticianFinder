-- P2D6: Politician Triggers
-- 정치인 데이터 관련 자동 업데이트 트리거

-- 1. updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. politicians 테이블 updated_at 트리거
CREATE TRIGGER politicians_update_updated_at
BEFORE UPDATE ON politicians
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- 3. politician_details 테이블 updated_at 트리거
CREATE TRIGGER politician_details_update_updated_at
BEFORE UPDATE ON politician_details
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- 4. promises 테이블 updated_at 트리거
CREATE TRIGGER promises_update_updated_at
BEFORE UPDATE ON promises
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- 5. evaluation_cache 캐시 자동 갱신 트리거
CREATE OR REPLACE FUNCTION refresh_evaluation_cache()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE evaluation_cache
  SET 
    combined_overall_score = (
      SELECT AVG(overall_score) FROM ai_evaluations 
      WHERE politician_id = NEW.politician_id
    ),
    model_scores = (
      SELECT jsonb_object_agg(ai_model, overall_score) 
      FROM ai_evaluations 
      WHERE politician_id = NEW.politician_id
    ),
    last_updated = CURRENT_TIMESTAMP,
    cache_expiry = CURRENT_TIMESTAMP + INTERVAL '7 days'
  WHERE politician_id = NEW.politician_id;
  
  IF NOT FOUND THEN
    INSERT INTO evaluation_cache (
      politician_id, combined_overall_score, last_updated, 
      cache_expiry, model_scores
    ) VALUES (
      NEW.politician_id,
      NEW.overall_score,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP + INTERVAL '7 days',
      jsonb_build_object(NEW.ai_model, NEW.overall_score)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. ai_evaluations 삽입/업데이트 시 캐시 갱신 트리거
CREATE TRIGGER ai_evaluations_update_cache
AFTER INSERT OR UPDATE ON ai_evaluations
FOR EACH ROW
EXECUTE FUNCTION refresh_evaluation_cache();

-- 7. evaluation_history 자동 기록 트리거
CREATE OR REPLACE FUNCTION log_evaluation_history()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO evaluation_history (
      politician_id, ai_model, score_change, 
      old_score, new_score, evaluation_date
    ) VALUES (
      NEW.politician_id,
      NEW.ai_model,
      NEW.overall_score - OLD.overall_score,
      OLD.overall_score,
      NEW.overall_score,
      NEW.evaluation_date
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. ai_evaluations 업데이트 시 히스토리 기록 트리거
CREATE TRIGGER ai_evaluations_log_history
AFTER UPDATE ON ai_evaluations
FOR EACH ROW
WHEN (OLD.overall_score IS DISTINCT FROM NEW.overall_score)
EXECUTE FUNCTION log_evaluation_history();

-- 9. 정치인 삭제 시 관련 데이터 정리 함수
CREATE OR REPLACE FUNCTION cleanup_politician_data()
RETURNS TRIGGER AS $$
BEGIN
  -- 평가 캐시 정리
  DELETE FROM evaluation_cache WHERE politician_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 10. politicians 삭제 시 데이터 정리 트리거
CREATE TRIGGER politicians_cleanup
BEFORE DELETE ON politicians
FOR EACH ROW
EXECUTE FUNCTION cleanup_politician_data();

-- 11. 활동 로그 자동 생성 (politician 수정 시)
CREATE OR REPLACE FUNCTION log_politician_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.bio IS DISTINCT FROM NEW.bio OR 
     OLD.email IS DISTINCT FROM NEW.email OR
     OLD.website IS DISTINCT FROM NEW.website THEN
    INSERT INTO activity_logs (
      politician_id, activity_type, description, date
    ) VALUES (
      NEW.id,
      'profile_updated',
      'Politician profile information updated',
      CURRENT_DATE
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. politicians 업데이트 시 활동 로그 기록 트리거
CREATE TRIGGER politicians_log_update
AFTER UPDATE ON politicians
FOR EACH ROW
EXECUTE FUNCTION log_politician_update();
