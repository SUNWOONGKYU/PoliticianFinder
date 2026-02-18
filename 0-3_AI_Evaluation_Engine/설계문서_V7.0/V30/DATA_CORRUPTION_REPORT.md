# 🚨 V30 Data Corruption Report - 조은희

**작성일**: 2026-01-20
**문제 발견**: 전체 10개 카테고리 Claude CLI 평가 실행 중

---

## 1. 문제 요약

**collected_data_v30 테이블의 조은희 데이터에 Perplexity 데이터가 포함되어 있음**

- **V30 기대값**: Gemini 90% (900개) + Grok 10% (100개) = 1,000개
- **V30 규칙**: Perplexity = 0% (V30에서 제거됨)
- **실제 데이터**: Gemini 75.1% (751개) + Grok 6.1% (61개) + **Perplexity 18.8% (188개)** = 1,000개

---

## 2. 데이터 분석 결과

### 2.1 AI 분포

```
🤖 AI 분포 (현재):
- Gemini: 751개 (75.1%)  ← 기대값 900개 (90%)
- Perplexity: 188개 (18.8%)  ← 🚨 기대값 0개 (0%)
- Grok: 61개 (6.1%)  ← 기대값 100개 (10%)

총 데이터: 1,000개 ✅
```

### 2.2 타임스탬프 분석

```
🤖 AI별 수집 시간 범위:

Gemini:
  - 수집 개수: 754개
  - 최초 수집: 2026-01-18 16:10:14
  - 최근 수집: 2026-01-18 17:12:53

Grok:
  - 수집 개수: 62개
  - 최초 수집: 2026-01-18 16:09:52
  - 최근 수집: 2026-01-18 17:10:23

Perplexity:
  - 수집 개수: 184개
  - 최초 수집: 2026-01-18 16:37:14  ← 🚨 Perplexity 수집 시작!
  - 최근 수집: 2026-01-18 17:10:41

📅 전체 수집 기간:
  - 최초: 2026-01-18 16:09:52
  - 최근: 2026-01-18 17:12:53
  - 기간: 0일 (약 1시간)
```

### 2.3 카테고리별 분포

```
📁 카테고리별 분포 (총 1,000개):
- accountability: 113개
- communication: 118개
- ethics: 118개
- expertise: 76개
- integrity: 90개
- leadership: 74개
- publicinterest: 54개
- responsiveness: 120개
- transparency: 162개
- vision: 75개
```

---

## 3. 원인 분석

### 3.1 Work Log 기록 검토

**2026-01-18 작업 내역** (`.claude/work_logs/current.md`):

1. **첫 번째 수집** (2026-01-18 16:09-17:12):
   - 결과: 336개 수집
   - 문제 발견: Gemini 76개 전부 data_type='public'
   - **AI 분포**: Gemini 60개, **Perplexity 39개**, Grok 10개

2. **데이터 삭제**:
   - collected_data_v30: 336개 삭제 (주장)
   - evaluations_v30: 3,703개 삭제 (주장)

3. **재수집 시도**:
   - 첫 시도 (parallel): 200개에서 멈춤 ❌
   - 두 번째 시도 (parallel): 진행 없음 ❌
   - 세 번째 시도 (순차): 1,000개 완료 ✅ (주장)

4. **재수집 검증** (주장):
   - Gemini 657개: OFFICIAL 571, PUBLIC 86 ✅
   - Perplexity: 0개 ✅ (주장)

### 3.2 데이터 불일치

**Work Log 주장 vs 실제 데이터**:

| 항목 | Work Log 주장 | 실제 데이터 (2026-01-20 확인) | 차이 |
|------|---------------|-------------------------------|------|
| Gemini | 657개 | 751개 | +94개 |
| Grok | ~343개 | 61개 | -282개 |
| **Perplexity** | **0개** | **188개** | **+188개** 🚨 |
| 총합 | 1,000개 | 1,000개 | 일치 |

**결론**: Work log에서 "재수집 성공"이라고 기록했지만, 실제로는 Perplexity 데이터가 여전히 존재함.

### 3.3 가능한 원인

1. **삭제 실패**:
   - 첫 번째 수집의 336개 데이터가 완전히 삭제되지 않음
   - Perplexity 39개 → 188개로 증가 (추가 수집 발생?)

2. **재수집 실패**:
   - "순차 실행 성공" 주장이 부정확함
   - 실제로는 일부만 수집되고 중단됨

3. **동시 실행**:
   - 여러 수집 프로세스가 동시에 실행됨
   - 일부는 V30 스크립트, 일부는 V28 또는 오래된 스크립트

4. **검증 오류**:
   - 재수집 후 검증 과정에서 잘못된 데이터를 확인함
   - Work log에 부정확한 정보 기록

---

## 4. V30 수집 규칙 확인

### 4.1 V30 collect_v30.py 스크립트

```python
"""
V30 2개 AI 분담 웹검색 수집 스크립트 (비용 최적화 버전)

핵심 변경 (V30):
1. 2개 AI 분담 수집 (90-10) - 비용 최적화
   - Gemini 90%: 공식 50개 + 공개 40개 (Google Search 무료)
   - Grok 10%: 공개 10개 (X/트위터 전담)

   ⚠️ Perplexity = 제거 (401 에러 + 비용 폭탄 $1,050+/100명)
   ⚠️ Claude/ChatGPT = 수집 제외 (웹검색 비용 문제)
"""
```

**명확한 규칙**: V30은 **Perplexity를 절대 사용하지 않음**

### 4.2 V28 수집 규칙

V28 스크립트 확인 결과: Perplexity 언급 없음 (확인 필요)

---

## 5. 영향 분석

### 5.1 평가에 미치는 영향

**현재 상황**:
- expertise 카테고리 1개만 Claude CLI로 평가 완료 (88개 평가)
- 나머지 9개 카테고리 Claude 평가 삭제 완료 (1,293개 삭제)
- **전체 10개 카테고리 Claude CLI 평가 대기 중**

**문제**:
- **잘못된 데이터로 평가 진행 불가**
- Perplexity 188개 (18.8%)가 포함된 데이터는 V30 기준에 맞지 않음
- 평가를 진행해도 결과가 부정확함

### 5.2 데이터 품질 문제

1. **AI 비율 불일치**:
   - Gemini: 75.1% (기대 90%) → -14.9%p
   - Grok: 6.1% (기대 10%) → -3.9%p
   - Perplexity: 18.8% (기대 0%) → +18.8%p 🚨

2. **V30 표준 위반**:
   - V30은 Perplexity 제거가 핵심 변경사항
   - Perplexity 포함 데이터는 V30 표준에 부합하지 않음

3. **평가 일관성 문제**:
   - 다른 정치인(V30 기준)과 비교 불가
   - 점수 해석의 신뢰성 저하

---

## 6. 해결 방안

### 6.1 Option A: 전체 데이터 삭제 및 재수집 (권장)

**장점**:
- V30 기준에 완전히 부합하는 깨끗한 데이터
- 다른 정치인과 일관된 비교 가능
- 향후 문제 없음

**단점**:
- 재수집 시간 소요 (약 30분)
- 기존 평가 결과 삭제 필요

**절차**:
1. collected_data_v30에서 조은희 데이터 1,000개 삭제
2. evaluations_v30에서 조은희 평가 삭제
3. V30 collect_v30.py로 재수집 (--parallel 사용 주의)
4. 데이터 검증 (Perplexity 0개 확인)
5. Claude CLI로 평가 진행

### 6.2 Option B: Perplexity 데이터만 삭제 및 Gemini/Grok 추가 수집

**장점**:
- 일부 데이터 재사용 가능
- 수집 시간 절약

**단점**:
- 복잡한 데이터 조작 필요
- 여전히 비율 불일치 (Gemini 75% vs 90%)
- 데이터 일관성 보장 어려움
- 추가 오류 발생 가능성

**절차**:
1. Perplexity 데이터 188개 삭제
2. Gemini 149개 추가 수집 (751 → 900)
3. Grok 39개 추가 수집 (61 → 100)
4. 데이터 검증
5. Claude CLI로 평가 진행

### 6.3 Option C: 현재 데이터로 평가 진행 (비권장)

**장점**:
- 즉시 평가 가능
- 추가 작업 없음

**단점**:
- V30 기준 위반
- 다른 정치인과 비교 불가
- 결과 신뢰성 저하
- 나중에 재작업 필요

---

## 7. 권장 조치

**🎯 권장: Option A (전체 재수집)**

1. **데이터 완전 삭제**:
   ```python
   # collected_data_v30 삭제
   supabase.table('collected_data_v30') \
       .delete() \
       .eq('politician_id', 'd0a5d6e1') \
       .execute()

   # evaluations_v30 삭제
   supabase.table('evaluations_v30') \
       .delete() \
       .eq('politician_id', 'd0a5d6e1') \
       .execute()
   ```

2. **V30 재수집 (순차 실행 권장)**:
   ```bash
   python collect_v30.py \
       --politician_id=d0a5d6e1 \
       --politician_name="조은희"
   # --parallel 사용 시 주의 (이전에 200개에서 멈춤)
   ```

3. **데이터 검증**:
   ```python
   python check_data_status.py
   # 확인 항목:
   # - Gemini: ~900개 (90%)
   # - Grok: ~100개 (10%)
   # - Perplexity: 0개 ✅
   ```

4. **Claude CLI 평가 진행**:
   ```bash
   cd V30/scripts
   python evaluate_v30.py \
       --politician_id=d0a5d6e1 \
       --politician_name="조은희" \
       --ai=Claude
   ```

5. **점수 계산**:
   ```bash
   python calculate_v30_scores.py \
       --politician_id=d0a5d6e1 \
       --politician_name="조은희"
   ```

---

## 8. 예방 조치

### 8.1 수집 후 자동 검증

**check_data_status.py를 수집 스크립트에 통합**:
```python
# collect_v30.py 마지막에 추가
def verify_collection(politician_id):
    """수집 후 자동 검증"""
    response = supabase.table('collected_data_v30') \
        .select('collector_ai') \
        .eq('politician_id', politician_id) \
        .execute()

    ai_counter = Counter([item['collector_ai'] for item in response.data])

    # Perplexity 체크
    if ai_counter.get('Perplexity', 0) > 0:
        raise ValueError(f"🚨 V30 위반: Perplexity 데이터 {ai_counter['Perplexity']}개 발견!")

    # 비율 체크
    total = len(response.data)
    gemini_ratio = ai_counter.get('Gemini', 0) / total
    if gemini_ratio < 0.85 or gemini_ratio > 0.95:
        raise ValueError(f"🚨 Gemini 비율 이상: {gemini_ratio:.1%} (기대: 90%)")

    print("✅ 데이터 검증 통과")
```

### 8.2 Work Log 정확성 개선

**검증된 데이터만 기록**:
- 주장이 아닌 실제 쿼리 결과 기록
- 타임스탬프 포함
- 자동 검증 결과 포함

---

## 9. 결론

**문제 요약**:
- collected_data_v30에 V30 기준에 맞지 않는 Perplexity 데이터 188개 (18.8%) 존재
- 2026-01-18 수집 과정에서 발생한 문제로 추정
- Work log의 "재수집 성공" 기록이 부정확함

**권장 조치**:
- **전체 데이터 삭제 및 V30 재수집** (Option A)
- 재수집 후 자동 검증 실시
- 검증 통과 후 Claude CLI 평가 진행

**다음 단계**:
1. 사용자 승인 대기 (Option A, B, C 중 선택)
2. 선택된 방안 실행
3. 데이터 검증
4. 평가 진행

---

**작성**: Claude Code
**검증 스크립트**: check_data_status.py, check_timestamps.py, check_fields.py
**위치**: `0-3_AI_Evaluation_Engine/설계문서_V7.0/V30/DATA_CORRUPTION_REPORT.md`
