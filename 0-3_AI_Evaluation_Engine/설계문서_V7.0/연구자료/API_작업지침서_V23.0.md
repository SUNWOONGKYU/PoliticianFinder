# API 작업 지침서 - V23.0

**작성일**: 2025-11-19
**버전**: V23.0
**대상**: Claude API를 사용하는 모든 데이터 수집 작업

---

## 🎯 Claude API 설정

### 모델 정보
```python
MODEL = "claude-3-5-haiku-4-5-20250514"  # Haiku 4.5 (최신)
TEMPERATURE = 1.0  # 창의성 최대
MAX_TOKENS = 8000  # 충분한 응답 길이
```

### API Rate Limits (Anthropic)
```
- 분당 요청 수: 50 requests/min
- 분당 토큰 수: 50,000 tokens/min
- 일일 한도: 제한 없음 (유료 플랜)
```

---

## 🚀 병렬 처리 정책

### 병렬 처리 구조

```python
정치인 1명 = 10개 카테고리 = 40번 API 호출
│
├── [그룹 1] 카테고리 1~5 (병렬)
│   ├── 카테고리 1: 4번 API 호출 (순차)
│   ├── 카테고리 2: 4번 API 호출 (순차)
│   ├── 카테고리 3: 4번 API 호출 (순차)
│   ├── 카테고리 4: 4번 API 호출 (순차)
│   └── 카테고리 5: 4번 API 호출 (순차)
│
└── [그룹 2] 카테고리 6~10 (병렬)
    ├── 카테고리 6: 4번 API 호출 (순차)
    ├── 카테고리 7: 4번 API 호출 (순차)
    ├── 카테고리 8: 4번 API 호출 (순차)
    ├── 카테고리 9: 4번 API 호출 (순차)
    └── 카테고리 10: 4번 API 호출 (순차)
```

### 카테고리별 API 호출 순서 (순차)

```python
카테고리 1개 = 4번 API 호출 (순차 처리)
│
├── 1️⃣ 부정 주제 5개 - OFFICIAL (최대 5회 재시도)
│
├── 2️⃣ 부정 주제 5개 - PUBLIC (최대 5회 재시도)
│
├── 3️⃣ 자유 평가 20개 - OFFICIAL (최대 5회 재시도)
│
└── 4️⃣ 자유 평가 20개 - PUBLIC (최대 5회 재시도)
```

### 왜 이렇게 설계했는가?

#### ✅ 카테고리 5개씩 병렬
- **이유**: Rate Limit 준수 (50 requests/min)
- **계산**: 5개 카테고리 × 4번 호출 = 20번/그룹 (안전)
- **효과**: 7분 → 1.5분 (5배 빠름)

#### ✅ 각 카테고리 내에서는 순차
- **이유 1**: 재시도 로직 구현 용이
- **이유 2**: 데이터 일관성 보장
- **이유 3**: API 부담 분산

---

## 🔄 재시도 로직 (최대 5회)

### 재시도 시나리오

```python
목표: 20개 수집

# 시나리오 1: 1차 성공
시도 1: 20개 수집 → ✅ 성공

# 시나리오 2: 3차 성공
시도 1: 8개 수집 → 목표 미달
시도 2: 7개 수집 → 누적 15개, 목표 미달
시도 3: 5개 수집 → 누적 20개 ✅ 성공

# 시나리오 3: 5차 후에도 미달
시도 1: 5개 수집
시도 2: 4개 수집
시도 3: 3개 수집
시도 4: 2개 수집
시도 5: 2개 수집
→ 총 16개 (목표 미달이지만 그대로 사용)
```

### 재시도 코드 예시

```python
def collect_batch(count=20, max_attempts=5):
    all_items = []

    for attempt in range(1, max_attempts + 1):
        remaining = count - len(all_items)
        if remaining <= 0:
            break

        # API 호출
        response = client.messages.create(
            model="claude-3-5-haiku-4-5-20250514",
            max_tokens=8000,
            temperature=1.0,
            messages=[{"role": "user", "content": prompt}]
        )

        # 응답 파싱
        items = parse_response(response)
        valid_items = [item for item in items if validate(item)]

        all_items.extend(valid_items)

        print(f"시도 {attempt}/{max_attempts}: {len(valid_items)}개 수집 (누적: {len(all_items)}개)")

        if len(all_items) >= count:
            print(f"✅ 목표 달성: {len(all_items)}개")
            break

    return all_items[:count]  # 초과분 제거
```

---

## 📊 소요 시간 계산

### 1개 API 호출
```
평균 응답 시간: 8-12초
예상 시간: 10초
```

### 1개 카테고리 (4번 API 호출, 순차)
```
4번 × 10초 = 40초
재시도 포함: 40~60초
```

### 1명 정치인 (10개 카테고리)

#### 순차 처리
```
10개 카테고리 × 40초 = 400초 (약 7분)
```

#### 병렬 처리 (5개씩)
```
그룹 1 (카테고리 1~5): 40초
그룹 2 (카테고리 6~10): 40초
총 소요 시간: 80초 (약 1.5분)
```

### 전체 11명 정치인

| 처리 방식 | 소요 시간 | 속도 |
|----------|----------|------|
| 순차 | 77분 (11 × 7분) | 1배 |
| 병렬 (5개씩) | 16분 (11 × 1.5분) | **5배 ⚡** |

---

## 🔐 API 보안 및 에러 처리

### 환경 변수 설정
```python
# .env 파일
ANTHROPIC_API_KEY=sk-ant-xxxxx
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxx
```

### 에러 처리

```python
import time

def api_call_with_retry(prompt, max_retries=3):
    """API 호출 with 재시도 및 에러 처리"""

    for retry in range(max_retries):
        try:
            response = client.messages.create(
                model="claude-3-5-haiku-4-5-20250514",
                max_tokens=8000,
                temperature=1.0,
                messages=[{"role": "user", "content": prompt}]
            )
            return response

        except anthropic.RateLimitError as e:
            # Rate Limit 초과
            print(f"⚠️  Rate Limit 초과, 60초 대기...")
            time.sleep(60)
            continue

        except anthropic.APIError as e:
            # API 에러
            print(f"❌ API 에러: {e}")
            if retry < max_retries - 1:
                time.sleep(5)
                continue
            else:
                raise

        except Exception as e:
            # 기타 에러
            print(f"❌ 예상치 못한 에러: {e}")
            raise

    return None
```

---

## 📋 API 호출 체크리스트

### 호출 전
- [ ] API Key 설정 확인
- [ ] Rate Limit 여유 확인 (50 req/min)
- [ ] Instructions 파일 존재 확인
- [ ] DB 연결 확인

### 호출 중
- [ ] 응답 시간 모니터링 (평균 10초)
- [ ] 에러 로깅
- [ ] 진행 상황 출력

### 호출 후
- [ ] 응답 JSON 파싱 확인
- [ ] 등급 유효성 검증 (A~-A 8개만)
- [ ] DB 저장 성공 확인
- [ ] 개수 확인 (목표 50개, 허용 45~60개)

---

## 🛠️ 사용 예시

### 순차 처리 (테스트용)
```bash
# 1개 카테고리만 수집
python collect_v23_final.py \
  --politician_id=1 \
  --politician_name="오세훈" \
  --category=1
```

### 병렬 처리 (운영용)
```bash
# 전체 10개 카테고리 병렬 수집 (권장)
python collect_v23_parallel.py \
  --politician_id=1 \
  --politician_name="오세훈"
```

---

## 📈 성능 최적화 팁

### 1. 병렬 처리 활용
```python
# ✅ 권장: 카테고리 5개씩 병렬
with ThreadPoolExecutor(max_workers=5) as executor:
    futures = [executor.submit(collect_category, i) for i in range(1, 6)]

# ❌ 비권장: 모든 카테고리 동시 (Rate Limit 초과 위험)
with ThreadPoolExecutor(max_workers=10) as executor:
    ...
```

### 2. 재시도 횟수 조정
```python
# 현재: max_attempts=5 (권장)
# 너무 낮으면: 데이터 부족
# 너무 높으면: 시간 낭비
```

### 3. Temperature 조정
```python
# 창의성 필요: temperature=1.0 (현재)
# 일관성 필요: temperature=0.3
```

---

## 🔍 트러블슈팅

### Q1: Rate Limit 초과
```
Error: Rate Limit exceeded
```
**해결**: 60초 대기 후 재시도, max_workers 5→3으로 감소

### Q2: 타임아웃 발생
```
Error: Timeout
```
**해결**: max_tokens 8000→5000으로 감소, 네트워크 확인

### Q3: 잘못된 등급 생성 (B+, C+)
```
⚠️  알 수 없는 등급 'B+', 건너뛰기
```
**해결**: Instructions 파일 등급 강화 섹션 확인 (이미 완료)

---

**최종 업데이트**: 2025-11-19
**버전**: V23.0
**작성자**: Claude Code
