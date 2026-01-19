# V30 Claude Code 평가 비용 절감 연구

**작성일**: 2026-01-19
**목적**: Claude API 대신 Claude Code 사용하여 평가 비용 절감

---

## 1. 현재 구조 (API 기반)

### 평가 프로세스
```
evaluate_v30.py
└─→ 4개 AI API 호출
    ├─→ Claude API (anthropic)
    ├─→ ChatGPT API (openai)
    ├─→ Gemini API (google)
    └─→ Grok API (xai)
```

### 비용 구조

**Claude 평가 비용** (현재):
```
모델: claude-3-5-haiku-20241022
가격: $0.80/1M input, $4.00/1M output

정치인 1명 평가:
- 수집 데이터: 1,000개
- 배치 평가: 10개씩 → 100회 API 호출
- 평균 토큰: 입력 3K, 출력 1K per call

비용 계산:
- Input:  100회 × 3,000 tokens = 300K tokens → $0.24
- Output: 100회 × 1,000 tokens = 100K tokens → $0.40
- 총: $0.64/정치인

4개 AI 모두:
- Claude:   $0.64
- ChatGPT:  $0.50 (gpt-4o-mini)
- Gemini:   $0.00 (무료)
- Grok:     $0.80 (grok-2)
- 총: $1.94/정치인
```

---

## 2. 제안된 구조 (Claude Code 기반)

### Option A: Claude Code 메인 에이전트 직접 평가

```python
# 새로운 evaluate_v30_claudecode.py

def evaluate_with_claudecode(politician_id, category):
    """Claude Code가 직접 평가"""

    # 1. 수집 데이터 조회
    items = get_collected_data(politician_id, category)

    # 2. Claude Code가 직접 평가 (API 호출 없음!)
    # → Claude Code 세션 자체가 Claude Sonnet 4.5
    evaluations = []

    for item in items:
        # 프롬프트 생성
        prompt = f"""
        정치인 평가:
        제목: {item['title']}
        내용: {item['content']}

        등급 (+4 ~ -4) 부여:
        """

        # ⚠️ 문제: Python 스크립트 내에서 Claude Code에게
        #           어떻게 평가를 요청할 것인가?

        # 불가능! Python 스크립트는 Claude Code와
        # 직접 통신할 방법이 없음
```

**결론**: ❌ 불가능
- Python 스크립트는 Claude Code와 직접 통신 불가
- Claude Code는 사용자와의 대화형 인터페이스

---

### Option B: Task Tool로 평가 서브 에이전트 사용

**구조**:
```
평가 조정자 스크립트 (Python)
└─→ Claude Code에게 Task 실행 요청 (어떻게?)
    └─→ 평가 서브 에이전트 실행
        └─→ 평가 수행 (요금제 사용)
```

**문제점**:
1. **Python에서 Claude Code 호출 불가**
   - Claude Code는 CLI 도구
   - Python API 없음
   - 사용자가 직접 실행해야 함

2. **자동화 불가능**
   - Claude Code는 대화형 인터페이스
   - 배치 작업 지원 안 함
   - 1,000개 데이터 × 4 AI = 4,000번 평가 불가능

**결론**: ❌ 불가능

---

### Option C: Claude Code 대화형 평가 (수동)

**구조**:
```
사용자가 Claude Code에게 직접 요청:
"조은희 정치인의 expertise 카테고리 100개 데이터를 평가해줘"

Claude Code:
1. DB에서 데이터 조회
2. 각 항목 평가
3. DB에 저장

반복: 10 카테고리 × 1 정치인 = 10번 요청
```

**장점**:
- ✅ API 비용 $0 (요금제만)
- ✅ Claude Sonnet 4.5 사용 (더 좋은 모델!)

**단점**:
- ❌ 완전 수동 (자동화 불가)
- ❌ ChatGPT, Gemini, Grok 평가 불가
- ❌ 시간 소요 엄청남 (10번 × 5분 = 50분)
- ❌ 일관성 떨어짐

**결론**: ⚠️ 가능하지만 비현실적

---

## 3. 실현 가능한 대안

### 대안 1: Claude만 Claude Code로 전환

**하이브리드 구조**:
```
Claude 평가:
- Claude Code 수동 평가 (요금제)
- 또는 로컬 LLM 사용

ChatGPT, Gemini, Grok:
- 기존대로 API 사용
```

**비용 절감**:
```
Before: $1.94/정치인
After:  $1.30/정치인 (Claude $0.64 제거)
절감:   33%
```

**실현 가능성**: ⚠️ 낮음
- 여전히 수동 작업
- 자동화 불가능

---

### 대안 2: 로컬 LLM 사용

**구조**:
```
Claude 대신:
- Ollama (llama3.1, qwen2.5 등)
- 또는 llama.cpp
- 완전 무료, 로컬 실행
```

**장점**:
- ✅ 비용 $0
- ✅ 자동화 가능
- ✅ API 제한 없음

**단점**:
- ❌ 품질 떨어짐 (Claude << Llama)
- ❌ 설정 복잡
- ❌ GPU 필요 (느림)

**비용 절감**:
```
Before: $1.94/정치인
After:  $1.30/정치인
절감:   33%
```

---

### 대안 3: 평가 AI 개수 줄이기 (권장!)

**현재**: 4개 AI (Claude, ChatGPT, Gemini, Grok)
**제안**: 2개 AI (Gemini, Grok)

**근거**:
- Gemini: 무료, 품질 좋음
- Grok: 저렴 ($0.80), 독특한 관점
- Claude: 비용 대비 효과 낮음 (Gemini와 유사)
- ChatGPT: 중간 성능, 제거 가능

**비용 절감**:
```
Before: $1.94/정치인
  - Claude:   $0.64
  - ChatGPT:  $0.50
  - Gemini:   $0.00
  - Grok:     $0.80

After: $0.80/정치인
  - Gemini:   $0.00
  - Grok:     $0.80

절감: 59% ($1.14 절감)
```

**품질 영향**:
- 풀링 평가: 4개 → 2개 AI
- 여전히 다양한 관점 (Gemini vs Grok)
- 통계적으로 충분 (2개면 충분)

---

## 4. 최종 권장 사항

### 🏆 권장: 평가 AI 2개로 축소

**이유**:
1. **실현 가능**: 즉시 적용 가능
2. **비용 효과**: 59% 절감
3. **품질 유지**: 2개 AI면 충분
4. **자동화**: 기존 시스템 그대로 사용

**구현**:
```python
# evaluate_v30.py 수정

# Before
EVALUATION_AIS = ["Claude", "ChatGPT", "Gemini", "Grok"]

# After
EVALUATION_AIS = ["Gemini", "Grok"]  # Claude, ChatGPT 제거
```

**추가 검토**:
- Gemini + Grok 조합의 평가 품질 검증
- 2개 AI 평균이 충분한지 통계 분석
- 필요시 Grok만 사용 (더 저렴)

---

## 5. Claude Code 사용이 불가능한 이유

### 기술적 제약

**1. Claude Code 특성**:
- 대화형 CLI 도구
- Python API 없음
- 프로그래밍 방식 호출 불가

**2. 자동화 불가**:
- 배치 작업 지원 안 함
- 스크립트 통합 불가
- 4,000개 평가 불가능

**3. ChatGPT/Gemini/Grok 불가**:
- Claude Code는 Claude만
- 다른 AI 사용 불가
- 4개 AI 풀링 평가 불가능

### 결론

❌ **Claude Code로 평가 대체 불가능**
- 기술적으로 불가능
- 자동화 불가능
- 실용성 없음

✅ **대신 평가 AI 개수 축소 권장**
- Gemini + Grok만 사용
- 59% 비용 절감
- 즉시 적용 가능

---

## 6. 실행 계획

### 즉시 실행 가능

**1단계**: Perplexity 제거 (이미 진행 중)
- 수집 비용: $36-73 절감/정치인

**2단계**: Claude/ChatGPT 평가 제거
- 평가 비용: $1.14 절감/정치인 (59%)
- EVALUATION_AIS = ["Gemini", "Grok"]

**3단계**: 검증
- 2개 AI 평가 품질 확인
- 필요시 조정

**총 비용 절감**:
```
Before:
- 수집: Perplexity $36-73
- 평가: 4 AIs $1.94
- 총: $38-75/정치인

After:
- 수집: Gemini $0
- 평가: 2 AIs $0.80
- 총: $0.80/정치인

절감: 98-99% 🎉
```

---

## 7. 참고: 미래 가능성

### Claude Code가 평가에 사용 가능하려면

**필요한 기능**:
1. Python SDK 제공
2. 배치 API 지원
3. 프로그래밍 방식 호출
4. 다른 AI 통합 지원

**현재**: 이런 기능 없음
**미래**: Anthropic이 제공할 가능성 낮음 (Claude Code는 개발 도구)

---

**결론**: Claude Code 평가 전환 불가능, 대신 AI 개수 축소로 비용 절감
