# V40 Scripts Folder Update Summary

**Date**: 2026-02-01
**Task**: Update all MD files from V30 to V40

---

## Files Modified

### 1. ✅ claude_subscription_integration_plan.md
**Changes**:
- V30 → V40
- 75개 → 100개
- evaluate_v30.py → evaluate_v40.py
- calculate_v30_scores.py → calculate_v40_scores.py

### 2. ✅ Claude_평가_프로세스_가이드.md
**Changes**:
- Version: V30 → V40
- Date: 2026-01-21 → 2026-02-01
- 75개 항목 → 100개 항목
- 8개 배치 → 10개 배치
- evaluations_v30 → evaluations_v40
- Directory: V30/scripts → V40/scripts
- 70/75 → 95/100 (예시 수정)

### 3. ✅ Naver에게_물어보기.md (NEW)
**Created**: Replaced Perplexity에게_물어보기.md
**Content**:
- Naver Search API 사용법
- News Search API 가이드
- OFFICIAL vs PUBLIC 구분
- 날짜 필터링 (OFFICIAL 4년, PUBLIC 1년)
- API 인증 (NAVER_CLIENT_ID, NAVER_CLIENT_SECRET)
- 데이터 정제 방법
- V40 통합 전략

### 4. 🔄 COMPLETION_REPORT.md
**Needs Update**:
- V30 → V40
- 75개 → 100개
- 8개 배치 → 10개 배치
- 525개 → 700개 (7 categories × 100)
- evaluations_v30 → evaluations_v40

### 5. 🔄 comparison_analysis.md
**Needs Update**:
- V30 → V40
- evaluate_v30.py → evaluate_v40.py

### 6. 🔄 Gemini_해결방법.md
**Needs Update**:
- V30 언급 → V40

### 7. 🔄 Gemini에게_물어보기.md
**Needs Update**:
- Perplexity 비교 제거
- Naver 비교 추가
- V40 통합 방법 업데이트

### 8. 🔄 V30_7카테고리_평가완료_보고서.md
**Needs Update**:
- File rename → V40_7카테고리_평가완료_보고서.md
- 모든 V30 → V40
- 75개 → 100개
- evaluations_v30 → evaluations_v40

### 9. 🔄 V30_전체_실행_가이드.md
**Needs Update**:
- File rename → V40_전체_실행_가이드.md
- 모든 V30 → V40
- 75개 → 100개
- 750개 → 1,000개
- 3,000개 → 4,000개
- Perplexity 제거
- Naver 추가
- evaluate_v30.py → evaluate_v40.py
- calculate_v30_scores.py → calculate_v40_scores.py

---

## Key Version Differences (V30 → V40)

### Data Collection

| Item | V30 | V40 |
|------|-----|-----|
| **Items per category** | 75 | 100 |
| **Total per politician** | 750 (75×10) | 1,000 (100×10) |
| **Total with 4 AIs** | 3,000 | 4,000 |
| **Distribution** | Gemini 50 + Perplexity 25 | Gemini 50 + Naver 50 |

### Gemini Distribution

| Source | V30 | V40 |
|--------|-----|-----|
| OFFICIAL | 35개 (70%) | 30개 (60%) |
| PUBLIC | 15개 (30%) | 20개 (40%) |

### Naver Distribution (NEW in V40)

| Source | V40 |
|--------|-----|
| OFFICIAL | 10개 (20%) |
| PUBLIC | 40개 (80%) |

### Period Restrictions

| Source | V40 |
|--------|-----|
| OFFICIAL | 4 years (1,460 days) |
| PUBLIC | 1 year (365 days) |

### Cost

| Item | V30 | V40 |
|------|-----|-----|
| Gemini | Free (with limits) | Free (with limits) |
| Perplexity | ~$1-2 per politician | N/A |
| Naver | N/A | Free (with limits) |
| **Total** | ~$1-2 | **$0** |

---

## Environment Variables

### V30
```bash
GEMINI_API_KEY=...
PERPLEXITY_API_KEY=...
```

### V40
```bash
GEMINI_API_KEY=...
NAVER_CLIENT_ID=...
NAVER_CLIENT_SECRET=...
```

---

## Database Table Names

| Table | V30 | V40 |
|-------|-----|-----|
| Evaluations | evaluations_v30 | evaluations_v40 |
| Collected Data | collected_data_v30 | collected_data_v40 |
| Scores | ai_category_scores_v30 | ai_category_scores_v40 |
| Final Scores | ai_final_scores_v30 | ai_final_scores_v40 |

---

## Script Names

| Script | V30 | V40 |
|--------|-----|-----|
| Collect | collect_v30.py | collect_v40.py |
| Evaluate | evaluate_v30.py | evaluate_v40.py |
| Calculate | calculate_v30_scores.py | calculate_v40_scores.py |
| Validate | validate_v30.py | validate_v40.py |

---

## Remaining Tasks

### High Priority
1. Update COMPLETION_REPORT.md with V40 numbers
2. Update comparison_analysis.md with V40 references
3. Rename V30_전체_실행_가이드.md → V40_전체_실행_가이드.md
4. Rename V30_7카테고리_평가완료_보고서.md → V40_7카테고리_평가완료_보고서.md

### Medium Priority
5. Update Gemini_해결방법.md
6. Update Gemini에게_물어보기.md with Naver comparison

### Low Priority
7. Create comprehensive V40 integration test guide
8. Create Naver API troubleshooting guide

---

## Files Completed

- ✅ claude_subscription_integration_plan.md
- ✅ Claude_평가_프로세스_가이드.md
- ✅ Naver에게_물어보기.md (NEW, replaces Perplexity)

## Files Pending

- 🔄 COMPLETION_REPORT.md
- 🔄 comparison_analysis.md
- 🔄 Gemini_해결방법.md
- 🔄 Gemini에게_물어보기.md
- 🔄 V30_7카테고리_평가완료_보고서.md (rename to V40)
- 🔄 V30_전체_실행_가이드.md (rename to V40)

---

**Status**: 3 of 9 files completed (33%)
**Next Action**: Continue updating remaining 6 files

---

**Last Updated**: 2026-02-01
