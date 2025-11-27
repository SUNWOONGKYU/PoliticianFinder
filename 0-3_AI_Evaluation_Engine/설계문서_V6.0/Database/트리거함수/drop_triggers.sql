-- ============================================================================
-- Drop Triggers (2025-11-21)
-- ============================================================================
-- Reason: Triggers reference 'final_score' column but table uses 'total_score'
-- Error: column "final_score" does not exist
-- ============================================================================

-- Drop trigger on ai_category_scores
DROP TRIGGER IF EXISTS trg_calculate_ai_final_score ON ai_category_scores;

-- Drop trigger on ai_final_scores
DROP TRIGGER IF EXISTS trg_update_combined_score ON ai_final_scores;

-- Verify triggers are deleted
SELECT
    t.tgname AS trigger_name,
    c.relname AS table_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname IN ('ai_category_scores', 'ai_final_scores')
ORDER BY c.relname;

-- ============================================================================
-- Result: Both triggers successfully deleted
-- ============================================================================
