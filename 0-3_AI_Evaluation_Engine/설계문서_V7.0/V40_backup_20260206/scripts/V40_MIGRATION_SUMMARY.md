# V40 Migration Summary

**Date**: 2026-02-01
**Migration**: V30 → V40

---

## Changes Applied

### 1. Version Update (V30 → V40)

All evaluation scripts have been updated from V30 to V40:

**Table Names:**
- `collected_data_v30` → `collected_data_v40`
- `evaluations_v30` → `evaluations_v40`

**References Updated:**
- Script headers and descriptions
- Database table references
- Console output messages
- Documentation strings

**Files Modified:**
1. `evaluate_claude_auto.py`
2. `evaluate_claude_auto_batch.py`
3. `evaluate_claude_real_ai.py`
4. `evaluate_claude_subscription.py`
5. `evaluate_claude_task_auto.py`
6. `evaluate_manual.py`
7. `evaluation_summary_7categories.py`
8. `explain_score_calculation.py`
9. `calculate_final_score.py`
10. `show_scores.py`
11. `update_to_75_25.py`
12. `validate_event_date.py`
13. `claude_subscription_fix.py`
14. `test_both_solutions.py`
15. `test_redirect_url.py`
16. `test_url_validation.py`

---

### 2. AI Change (Perplexity → Naver)

**Collection Distribution:**
- **V30**: Gemini 75% + Perplexity 25%
- **V40**: Gemini 50개 (OFFICIAL 30 + PUBLIC 20) + Naver 50개 (OFFICIAL 10 + PUBLIC 40)

**Total Pool Size:**
- **V30**: 60 items per category (from previous version)
- **V40**: 100 items per category (50 from Gemini + 50 from Naver)

**Key Changes:**
- All "Perplexity" references → "Naver"
- Distribution model updated to reflect new 50:50 split
- OFFICIAL/PUBLIC breakdown adjusted:
  - Gemini: OFFICIAL-focused (30 OFFICIAL, 20 PUBLIC)
  - Naver: PUBLIC-focused (10 OFFICIAL, 40 PUBLIC)

**Files with Perplexity→Naver Changes:**
- `update_to_75_25.py`
- `test_both_solutions.py`

---

### 3. Evaluation AIs (Unchanged)

The 4 evaluation AIs remain the same:
- Claude
- ChatGPT
- Gemini
- Grok

Each AI evaluates the entire pool of 100 items independently.

---

## Database Schema

### V40 Tables

```sql
-- Collected data
CREATE TABLE collected_data_v40 (
    id UUID PRIMARY KEY,
    politician_id TEXT NOT NULL,
    category TEXT NOT NULL,
    collector_ai TEXT NOT NULL,  -- 'Gemini' or 'Naver'
    data_type TEXT NOT NULL,      -- 'OFFICIAL' or 'PUBLIC'
    title TEXT,
    content TEXT,
    source_url TEXT,
    published_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Evaluations
CREATE TABLE evaluations_v40 (
    id UUID PRIMARY KEY,
    politician_id TEXT NOT NULL,
    category TEXT NOT NULL,
    evaluator_ai TEXT NOT NULL,   -- 'Claude', 'ChatGPT', 'Gemini', 'Grok'
    collected_data_id UUID REFERENCES collected_data_v40(id),
    rating TEXT NOT NULL,          -- '+4', '+3', '+2', '+1', '-1', '-2', '-3', '-4'
    score INTEGER NOT NULL,        -- 8, 6, 4, 2, -2, -4, -6, -8
    reasoning TEXT,
    evaluated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Updated Scripts Functionality

### Collection Scripts (Not Modified in This Batch)

These scripts collect data and should be updated separately:
- `collect_v40_gemini.py` - Collects 50 items (30 OFFICIAL + 20 PUBLIC)
- `collect_v40_naver.py` - Collects 50 items (10 OFFICIAL + 40 PUBLIC)

### Evaluation Scripts (Modified)

**1. evaluate_claude_auto.py**
- Generates evaluation tasks for Claude Code subscription mode
- Queries `collected_data_v40` for unevaluated items
- Creates markdown task files
- Saves results to `evaluations_v40`

**2. evaluate_claude_auto_batch.py**
- Batch evaluation with configurable batch size
- Interactive mode (manual JSON input)
- Saves to `evaluations_v40`

**3. evaluate_claude_real_ai.py**
- Uses Task tool for real AI evaluation
- Generates evaluation prompts
- Saves results to `evaluations_v40`

**4. evaluate_claude_subscription.py**
- Interactive evaluation mode
- Direct prompt display and JSON input
- Supports file-based evaluation
- Saves to `evaluations_v40`

**5. evaluate_claude_task_auto.py**
- Fully automated keyword-based evaluation
- No user input required
- Direct evaluation logic in Python
- Saves to `evaluations_v40`

**6. evaluate_manual.py**
- Manual evaluation script for specific categories
- Hardcoded evaluation logic example
- Uses `evaluations_v40` (implied)

### Analysis Scripts (Modified)

**7. evaluation_summary_7categories.py**
- Summarizes evaluation results for 7 categories
- Updated to V40 references

**8. explain_score_calculation.py**
- Detailed score calculation explanation
- Updated formulas to V40
- Queries `evaluations_v40`

**9. calculate_final_score.py**
- Calculates final scores using V40 formula
- Queries `evaluations_v40`
- Computes per-category and final scores

**10. show_scores.py**
- Displays AI×Category score matrix
- Shows distribution and statistics
- Queries `evaluations_v40`

### Utility Scripts (Modified)

**11. update_to_75_25.py**
- Document update script
- Updated to reflect Gemini+Naver 50:50 distribution
- Updates collection and evaluation instruction files

**12. validate_event_date.py**
- Event date validation module
- Ensures data within acceptable time range
- Updated to V40 references

**13. claude_subscription_fix.py**
- Claude subscription mode helper
- Keyword-based evaluation logic
- API-free evaluation

**14. test_both_solutions.py**
- Tests both Gemini and Naver collection
- URL validation and quality checks
- Updated from Perplexity to Naver

**15. test_redirect_url.py**
- Tests redirect URL resolution
- Gemini grounding API redirect handling
- No V30→V40 changes (utility)

**16. test_url_validation.py**
- Compares URL validation methods
- HEAD vs GET requests
- No V30→V40 changes (utility)

---

## Scoring Formula (Unchanged from V28)

```
PRIOR = 6.0
COEFFICIENT = 0.5

Category Score = (PRIOR + avg_rating × COEFFICIENT) × 10
Range: 20~100 points per category

Final Score = SUM(10 category scores)
Range: 200~1000 points
```

**Grade Mapping:**
- S: 900~1000 (Excellent)
- A: 800~899 (Superior)
- B: 700~799 (Good)
- C: 600~699 (Average)
- D: 500~599 (Below Average)
- F: 200~499 (Poor)

---

## Migration Checklist

### Completed
- [x] V30 → V40 table references updated in all scripts
- [x] Perplexity → Naver in collection references
- [x] Distribution model updated (75-25 → 50-50)
- [x] Pool size updated (60 → 100 per category)
- [x] Documentation strings updated
- [x] Console output messages updated

### Pending (Separate Tasks)
- [ ] Create `collected_data_v40` and `evaluations_v40` tables in Supabase
- [ ] Update collection scripts (`collect_v40_gemini.py`, `collect_v40_naver.py`)
- [ ] Update category instruction files (2_collect/*.md, 3_evaluate/*.md)
- [ ] Test evaluation pipeline with V40 tables
- [ ] Migrate or archive V30 data if needed

---

## Usage Examples

### Evaluate with Claude (Subscription Mode)

```bash
# Generate evaluation task
python evaluate_claude_auto.py \
  --politician_id=f9e00370 \
  --politician_name=김민석 \
  --category=responsiveness \
  --output=eval_task.md

# After Claude Code completes evaluation
python evaluate_claude_auto.py \
  --politician_id=f9e00370 \
  --politician_name=김민석 \
  --category=responsiveness \
  --import_results=eval_task_result.json
```

### Calculate Scores

```bash
# Detailed explanation
python explain_score_calculation.py

# Calculate final scores
python calculate_final_score.py

# View score matrix
python show_scores.py
```

### Test Collection

```bash
# Test both Gemini and Naver
python test_both_solutions.py
```

---

## Notes

1. **Original filenames preserved**: All scripts keep their original names despite version change
2. **Backward compatibility**: V30 tables remain accessible; no data deletion
3. **Gradual migration**: Can run V30 and V40 in parallel for testing
4. **Collection scripts separate**: Actual collection logic (`collect_v40_*.py`) not modified in this batch

---

**Migration Status**: ✅ Complete - All evaluation scripts updated to V40

**Next Steps**:
1. Create V40 database tables
2. Update collection scripts
3. Update instruction documents
4. Test end-to-end pipeline
