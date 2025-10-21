# AI 자기 평가 시스템 설계

**작성일**: 2025-10-15
**핵심 원칙**: 자기 평가는 자기가 한다 (Self-Evaluation by Self)
**문제**: 현재 P2A1이 ai-ml-engineer에 할당 → 잘못됨!

---

## 🔍 문제점 발견

### 현재 설계 (잘못됨) ❌
```csv
작업ID: P2A1
업무: AI 평가 점수 계산 로직
담당AI: ai-ml-engineer (Claude Code 서브에이전트)
```

**문제**:
- ai-ml-engineer가 **다른 AI들(GPT, Gemini 등)의 평가를 대신 계산**
- 각 AI가 자기 평가를 못함 → 공정성 문제
- GPT가 평가한 것처럼 보이지만 실제로는 Claude가 계산 → 신뢰성 문제

---

## ✅ 올바른 설계

### 원칙: 자기 평가는 자기가
```
GPT → GPT가 정치인 평가
Gemini → Gemini가 정치인 평가
Claude → Claude가 정치인 평가
Perplexity → Perplexity가 정치인 평가
Grok → Grok가 정치인 평가
```

**각 AI는**:
1. 자신의 기준으로 평가
2. 자신의 프롬프트 사용
3. 자신의 점수 계산 로직 적용

---

## 🎯 Phase 2: 단일 AI 평가 (GPT만)

### Phase 2 목표
- MVP 단계: GPT API만 사용
- 정치인 평가 시스템 검증
- 나중에 다중 AI로 확장

### P2A1 수정 필요

#### Before (현재) ❌
```csv
작업ID: P2A1
업무: AI 평가 점수 계산 로직
담당AI: ai-ml-engineer
외부AI: ChatGPT API (호출만)
```

#### After (수정 필요) ✅
```csv
작업ID: P2A1
업무: ChatGPT 평가 점수 계산 로직
담당AI: ai-ml-engineer (통합 코드만 작성)
외부AI: ChatGPT API (실제 평가 주체)
```

**역할 분리**:
- **ai-ml-engineer**: ChatGPT API 호출 코드 작성
- **ChatGPT API**: 실제 정치인 평가 수행

**코드 구조**:
```python
# ai-ml-engineer가 작성
def evaluate_politician_with_gpt(politician_data):
    """
    ChatGPT API를 호출하여 정치인 평가
    ai-ml-engineer는 호출 코드만 작성
    실제 평가는 ChatGPT가 수행
    """
    prompt = f"""
당신은 정치 전문가입니다.
다음 정치인을 평가해주세요:

이름: {politician_data['name']}
경력: {politician_data['career']}
공약: {politician_data['promises']}

다음 기준으로 0-100점 평가:
1. 신뢰도 (Credibility)
2. 실행력 (Effectiveness)
3. 공약 실현 가능성 (Feasibility)
4. 도덕성 (Integrity)

JSON 형식으로 응답:
{{
  "credibility": 85,
  "effectiveness": 90,
  "feasibility": 75,
  "integrity": 95,
  "overall": 86,
  "reasoning": "..."
}}
"""

    # ChatGPT API 호출 (실제 평가 주체)
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3  # 일관성을 위해 낮게
    )

    # ChatGPT의 평가 결과 반환
    return json.loads(response.choices[0].message.content)
```

---

## 🎯 Phase 6: 다중 AI 평가 (4개 AI)

### Phase 6 목표
- 4개 AI가 **각자 독립적으로** 평가
- 평가 결과 비교 분석
- 사용자는 4개 평가 모두 확인 가능

### Phase 6 Backend 작업 재설계

#### P6B1: GPT API 연동 ✅
```csv
작업ID: P6B1
업무: GPT API 연동 (정치인 평가)
담당AI: ai-ml-engineer (통합 코드 작성)
외부AI: ChatGPT API (실제 평가 주체)
설명: GPT가 자기 기준으로 평가
```

**구현**:
```python
def evaluate_with_gpt(politician_data):
    """GPT가 자기 기준으로 평가"""
    prompt = build_gpt_prompt(politician_data)  # GPT 전용 프롬프트
    response = call_openai_api(prompt)
    return parse_gpt_response(response)
```

#### P6B2: Gemini API 연동 ✅
```csv
작업ID: P6B2
업무: Gemini API 연동 (정치인 평가)
담당AI: ai-ml-engineer (통합 코드 작성)
외부AI: Gemini API (실제 평가 주체)
설명: Gemini가 자기 기준으로 평가
```

**구현**:
```python
def evaluate_with_gemini(politician_data):
    """Gemini가 자기 기준으로 평가"""
    prompt = build_gemini_prompt(politician_data)  # Gemini 전용 프롬프트
    response = call_gemini_api(prompt)
    return parse_gemini_response(response)
```

#### P6B3: Perplexity API 연동 ✅
```csv
작업ID: P6B3
업무: Perplexity API 연동 (정치인 평가)
담당AI: ai-ml-engineer (통합 코드 작성)
외부AI: Perplexity API (실제 평가 주체)
설명: Perplexity가 자기 기준으로 평가 (팩트 기반)
```

**구현**:
```python
def evaluate_with_perplexity(politician_data):
    """Perplexity가 팩트 기반으로 평가"""
    prompt = build_perplexity_prompt(politician_data)  # 팩트 체크 프롬프트
    response = call_perplexity_api(prompt)
    return parse_perplexity_response(response)
```

#### P6B4: Grok API 연동 ✅
```csv
작업ID: P6B4 (신규 추가 필요)
업무: Grok API 연동 (정치인 평가)
담당AI: ai-ml-engineer (통합 코드 작성)
외부AI: Grok API (실제 평가 주체)
설명: Grok이 자기 기준으로 평가
```

**구현**:
```python
def evaluate_with_grok(politician_data):
    """Grok이 자기 기준으로 평가"""
    prompt = build_grok_prompt(politician_data)  # Grok 전용 프롬프트
    response = call_grok_api(prompt)
    return parse_grok_response(response)
```

#### P6B5: 4개 AI 응답 집계 ✅
```csv
작업ID: P6B5
업무: 4개 AI 평가 결과 집계 및 비교
담당AI: ai-ml-engineer (집계 로직만 작성)
외부AI: 없음 (단순 통계 처리)
설명: 4개 평가의 평균, 편차, 합의도 계산
```

**구현**:
```python
def aggregate_multi_ai_scores(politician_id):
    """
    4개 AI의 평가 결과 집계
    ai-ml-engineer는 집계 코드만 작성
    각 AI는 이미 자기 평가 완료
    """
    # 각 AI에게 평가 요청 (병렬)
    gpt_score = evaluate_with_gpt(politician_data)
    gemini_score = evaluate_with_gemini(politician_data)
    perplexity_score = evaluate_with_perplexity(politician_data)
    grok_score = evaluate_with_grok(politician_data)

    # 집계
    scores = [gpt_score, gemini_score, perplexity_score, grok_score]

    return {
        "gpt": gpt_score,
        "gemini": gemini_score,
        "perplexity": perplexity_score,
        "grok": grok_score,
        "average": calculate_average(scores),
        "std_dev": calculate_std_dev(scores),
        "consensus": calculate_consensus(scores),  # 합의도
        "outliers": detect_outliers(scores)  # 이상치 감지
    }
```

---

## 📊 역할 매트릭스 (수정)

### Phase 2: 단일 AI 평가

| 작업 | 코드 작성 | 평가 주체 | 설명 |
|------|----------|----------|------|
| P2A1 | ai-ml-engineer | **ChatGPT API** | GPT가 자기 평가 |

### Phase 6: 다중 AI 평가

| 작업 | 코드 작성 | 평가 주체 | 설명 |
|------|----------|----------|------|
| P6B1 | ai-ml-engineer | **ChatGPT API** | GPT가 자기 평가 |
| P6B2 | ai-ml-engineer | **Gemini API** | Gemini가 자기 평가 |
| P6B3 | ai-ml-engineer | **Perplexity API** | Perplexity가 자기 평가 |
| P6B4 | ai-ml-engineer | **Grok API** | Grok이 자기 평가 |
| P6B5 | ai-ml-engineer | 없음 (통계) | 4개 평가 집계 |

---

## 🎯 핵심 원칙

### ✅ DO (해야 할 것)
1. **각 AI가 자기 평가 수행**
   - GPT → GPT 프롬프트, GPT 기준
   - Gemini → Gemini 프롬프트, Gemini 기준
   - 각자의 "성격"과 "관점" 반영

2. **ai-ml-engineer는 통합만**
   - API 호출 코드 작성
   - 결과 파싱
   - 집계 로직
   - **평가 자체는 하지 않음**

3. **평가 결과 투명성**
   - 어느 AI가 평가했는지 명시
   - 각 AI의 평가 이유 표시
   - 사용자가 4개 평가 모두 확인 가능

### ❌ DON'T (하지 말아야 할 것)
1. **다른 AI가 대신 평가 ❌**
   - ai-ml-engineer가 GPT 평가 계산 ❌
   - Claude가 Gemini 평가 대신 ❌

2. **평가 결과 조작 ❌**
   - 4개 평가 평균만 보여주고 개별 숨김 ❌
   - 특정 AI 평가 가중치 임의 조정 ❌

3. **프롬프트 공유 ❌**
   - 모든 AI에게 똑같은 프롬프트 ❌
   - 각 AI의 강점을 살리는 전용 프롬프트 필요

---

## 🔄 CSV 수정 필요 사항

### 1. P2A1 업무명 수정
```csv
Before: AI 평가 점수 계산 로직
After: ChatGPT 평가 점수 계산 로직
```

### 2. Phase 6 Backend 컬럼 추가 필요
현재 CSV에 "외부AI" 컬럼이 없음 → 추가 필요

**새 컬럼 구조**:
```csv
,작업ID,P6B1,P6B2,P6B3,P6B4,P6B5
,업무,GPT 평가 API,Gemini 평가 API,Perplexity 평가 API,Grok 평가 API,4개 AI 집계
,담당AI,ai-ml-engineer,ai-ml-engineer,ai-ml-engineer,ai-ml-engineer,ai-ml-engineer
,외부AI,ChatGPT API,Gemini API,Perplexity API,Grok API,없음
,평가주체,ChatGPT,Gemini,Perplexity,Grok,통계처리
```

### 3. P6B4 신규 작업 추가
현재 P6B1~P6B3만 있음 → P6B4 (Grok) 추가 필요

---

## 💡 프롬프트 차별화 전략

각 AI의 **강점**을 살리는 프롬프트 설계:

### GPT 프롬프트 (종합 평가)
```
당신은 정치 전문가입니다.
다음 정치인을 **종합적으로** 평가해주세요.
경력, 공약, 과거 실적을 모두 고려하여
신뢰도, 실행력, 공약 실현성, 도덕성을 평가하세요.
```

### Gemini 프롬프트 (다면 평가)
```
당신은 정치 분석가입니다.
다음 정치인을 **다각도로** 평가해주세요.
경제, 복지, 환경, 외교 등 여러 영역에서
균형잡힌 평가를 제공하세요.
```

### Perplexity 프롬프트 (팩트 기반)
```
당신은 팩트 체커입니다.
다음 정치인을 **검증된 사실 기반**으로 평가해주세요.
공약 실현율, 과거 발언 일관성, 검증된 실적만 고려하세요.
추측이나 의견은 배제하고 팩트만 반영하세요.
```

### Grok 프롬프트 (실시간 데이터)
```
당신은 최신 정보 전문가입니다.
다음 정치인을 **최근 동향 기반**으로 평가해주세요.
최근 6개월 활동, 최신 여론, 실시간 이슈 반응을 중심으로
평가하세요.
```

---

## 🎯 사용자 UI 표시 예시

### 정치인 상세 페이지
```
홍길동 의원

📊 AI 종합 평가 (4개 AI 평균: 82점)

┌─────────────────────────────────────────┐
│ ChatGPT 평가: 85점                      │
│ - 신뢰도: 90, 실행력: 85, 도덕성: 80   │
│ - 이유: "공약 이행률이 높고..."        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Gemini 평가: 78점                       │
│ - 경제: 80, 복지: 75, 환경: 80         │
│ - 이유: "경제 정책은 우수하나..."      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Perplexity 평가: 88점 (팩트 기반)     │
│ - 공약 실현율: 92%, 발언 일관성: 85%  │
│ - 이유: "검증된 실적이 우수..."        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Grok 평가: 77점 (최근 6개월)           │
│ - 최근 활동: 75, 여론: 80, 이슈 대응: 75│
│ - 이유: "최근 이슈 대응이..."          │
└─────────────────────────────────────────┘

📈 AI 간 합의도: 높음 (표준편차: 4.7)
⚠️ 주의: Grok 평가가 다른 AI보다 낮음 (최근 이슈 영향)
```

---

## 📁 다음 단계

### 즉시 실행 (v1.2.2)
1. ✅ 본 문서 작성 완료
2. ⏳ CSV 수정
   - P2A1 업무명: "ChatGPT 평가 점수 계산 로직"
   - "외부AI" 컬럼 추가
   - P6B4 (Grok) 작업 추가

### Phase 2 시작 전
3. ⏳ 작업지시서 작성
   - tasks/P2A1.md: ChatGPT 자기 평가 명시
   - tasks/P6B1.md ~ P6B5.md

### Phase 6 시작 전
4. ⏳ 프롬프트 설계
   - GPT 전용 프롬프트
   - Gemini 전용 프롬프트
   - Perplexity 전용 프롬프트
   - Grok 전용 프롬프트

---

## 🎓 핵심 교훈

### Before (잘못된 이해)
```
❌ ai-ml-engineer가 모든 AI 평가를 계산
❌ ChatGPT API는 그냥 호출만 당함
❌ 평가 주체가 불분명
```

### After (올바른 이해) ✅
```
✅ 각 AI가 자기 평가 수행
✅ ai-ml-engineer는 통합 코드만 작성
✅ 평가 주체 명확: ChatGPT, Gemini, Perplexity, Grok
✅ 각 AI의 강점을 살리는 프롬프트 설계
```

---

**결론**: "자기 평가는 자기가 한다" - 이 원칙을 철저히 지켜야 공정하고 신뢰할 수 있는 다중 AI 평가 시스템이 됩니다! 🎯

---

**작성일**: 2025-10-15
**버전**: v1.2.1
**다음 액션**: CSV 수정 및 "외부AI" 컬럼 추가
