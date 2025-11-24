-- Migration: Populate politician_details for all existing politicians
-- Created: 2025-11-22
-- Description: Ensure all politicians have a corresponding politician_details record

-- Insert politician_details for all politicians that don't have one yet
INSERT INTO politician_details (politician_id, user_rating, rating_count, created_at, updated_at)
SELECT
  p.id,
  0.00,
  0,
  NOW(),
  NOW()
FROM politicians p
WHERE NOT EXISTS (
  SELECT 1
  FROM politician_details pd
  WHERE pd.politician_id = p.id
)
ON CONFLICT (politician_id) DO NOTHING;

-- Verify the insert
DO $$
DECLARE
  v_inserted_count INTEGER;
  v_total_politicians INTEGER;
  v_total_details INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_politicians FROM politicians;
  SELECT COUNT(*) INTO v_total_details FROM politician_details;

  RAISE NOTICE 'Total politicians: %', v_total_politicians;
  RAISE NOTICE 'Total politician_details: %', v_total_details;

  IF v_total_politicians = v_total_details THEN
    RAISE NOTICE '✅ All politicians have politician_details records';
  ELSE
    RAISE WARNING '⚠️  Mismatch: % politicians but % details', v_total_politicians, v_total_details;
  END IF;
END $$;
