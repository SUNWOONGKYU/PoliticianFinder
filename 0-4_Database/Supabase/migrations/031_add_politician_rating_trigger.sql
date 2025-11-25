CREATE OR REPLACE FUNCTION update_politician_rating_stats()
RETURNS TRIGGER AS $function$
DECLARE
  avg_rating DECIMAL(3,2);
  total_count INTEGER;
BEGIN
  SELECT
    COALESCE(AVG(rating), 0.0)::DECIMAL(3,2),
    COUNT(*)::INTEGER
  INTO avg_rating, total_count
  FROM politician_ratings
  WHERE politician_id = COALESCE(NEW.politician_id, OLD.politician_id);

  UPDATE politician_details
  SET
    user_rating = avg_rating,
    rating_count = total_count,
    updated_at = NOW()
  WHERE politician_id = COALESCE(NEW.politician_id, OLD.politician_id);

  RETURN NULL;
END;
$function$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS politician_rating_stats_trigger ON politician_ratings;

CREATE TRIGGER politician_rating_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON politician_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_politician_rating_stats();
