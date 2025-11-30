# V25.0 멀티-AI 구현 계획 (ChatGPT + Grok)

**작성일**: 2025-11-27
**버전**: V25.0
**목적**: Claude 외에 ChatGPT, Grok을 추가하여 3개 AI 멀티-평가 시스템 구현

---

## 1. 현황 분석

### 현재 시스템 (V24.0)
```
정치인 1명 평가:
├── Claude API (Haiku 3.5) 단독 사용
├── 500개 데이터 수집 (10개 카테고리 × 50개)
├── 비용: 약 $2~5 / 정치인
└── 완료: 30명 (서울시장 10명 + 경기도지사 10명 + 부산시장 10명)
```

### 목표 시스템 (V25.0)
```
정치인 1명 평가:
├── Claude API: 500개 (현재 방식 유지)
├── ChatGPT API: 500개 (동일 프롬프트)
├── Grok API: 500개 (동일 프롬프트)
└── 결과: AI별 점수 비교 분석 가능
```

---

## 2. API 연동 방안

### 2.1 ChatGPT (OpenAI)

**API 정보**:
- 모델: `gpt-4o-mini` (경량 모델 - 필수)
- 엔드포인트: `https://api.openai.com/v1/chat/completions`
- 인증: Bearer Token (API Key)

**연동 코드**:
```python
from openai import OpenAI

chatgpt_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

def call_chatgpt(prompt: str) -> str:
    response = chatgpt_client.chat.completions.create(
        model="gpt-4o-mini",  # 경량 모델 필수 (비용 효율)
        messages=[{"role": "user", "content": prompt}],
        temperature=1.0,  # Claude와 동일하게 설정
        max_tokens=8000
    )
    return response.choices[0].message.content
```

**비용 (gpt-4o-mini)** - 필수:
- Input: $0.15 / 1M tokens
- Output: $0.60 / 1M tokens
- 예상: $0.3~0.8 / 정치인

**주의**: Claude Haiku와 동급 경량 모델 사용 필수 (공정한 비교)

### 2.2 Grok (X.AI)

**API 정보**:
- 모델: `grok-3-mini` (경량 모델 - 필수)
- 엔드포인트: `https://api.x.ai/v1/chat/completions`
- 인증: Bearer Token (API Key)
- 특징: OpenAI 호환 인터페이스

**연동 코드**:
```python
from openai import OpenAI

grok_client = OpenAI(
    api_key=os.getenv('XAI_API_KEY'),
    base_url="https://api.x.ai/v1"
)

def call_grok(prompt: str) -> str:
    response = grok_client.chat.completions.create(
        model="grok-3-mini",  # 경량 모델 필수 (비용 효율)
        messages=[{"role": "user", "content": prompt}],
        temperature=1.0,
        max_tokens=8000
    )
    return response.choices[0].message.content
```

**비용 (grok-3-mini)** - 필수:
- Input: $0.30 / 1M tokens
- Output: $0.50 / 1M tokens
- 예상: $0.3~0.8 / 정치인

**주의**: Claude Haiku, GPT-4o-mini와 동급 경량 모델 사용 필수 (공정한 비교)

---

## 3. 구현 전략

### 옵션 A: 병렬 실행 (동시 3개 AI)
```
장점: 시간 절약, 동시 비교 가능
단점: 비용 3배, Rate Limit 관리 복잡

실행 방식:
├── Claude: 카테고리 1~10 병렬 수집
├── ChatGPT: 카테고리 1~10 병렬 수집 (동시)
└── Grok: 카테고리 1~10 병렬 수집 (동시)

소요 시간: 약 2~3분 / 정치인 (병렬)
```

### 옵션 B: 순차 실행 (AI별로 순차) - 권장
```
장점: 안정적, Rate Limit 관리 용이, 비용 조절 가능
단점: 시간 소요

실행 방식:
├── Step 1: Claude 전체 수집 (30명 완료)
├── Step 2: ChatGPT 전체 수집 (새로 진행)
└── Step 3: Grok 전체 수집 (새로 진행)

소요 시간: 약 5분 / 정치인 / AI
```

### 옵션 C: 하이브리드 (카테고리별 AI 분담)
```
장점: 비용 절약, 다양성 확보
단점: AI별 비교 불가

실행 방식 (카테고리별 분담):
├── Claude: 카테고리 1, 2, 3, 4 (200개)
├── ChatGPT: 카테고리 5, 6, 7 (150개)
└── Grok: 카테고리 8, 9, 10 (150개)

비용: 기존 대비 비슷 (AI당 1/3 수집)
```

**권장**: 옵션 B (순차 실행)
- Claude 데이터 이미 완료, ChatGPT/Grok만 추가 수집
- AI별 전체 비교 분석 가능

---

## 4. DB 스키마 확장

### 현재 스키마 (collected_data)
```sql
-- 기존 ai_name 컬럼으로 AI 구분
ai_name VARCHAR(50)  -- 'Claude', 'ChatGPT', 'Grok'
```

### 추가 필요 없음
- 기존 `ai_name` 컬럼으로 충분
- Claude/ChatGPT/Grok 값으로 구분

### 점수 집계 테이블 (신규)
```sql
CREATE TABLE ai_score_comparison (
    comparison_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    politician_id VARCHAR(8) NOT NULL,
    category_name VARCHAR(50) NOT NULL,

    -- AI별 평균 점수
    claude_avg DECIMAL(4,2),
    chatgpt_avg DECIMAL(4,2),
    grok_avg DECIMAL(4,2),

    -- 종합 분석
    combined_avg DECIMAL(4,2),
    std_deviation DECIMAL(4,2),
    agreement_level VARCHAR(20),  -- 'high', 'medium', 'low'

    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(politician_id, category_name)
);
```

---

## 5. 구현 파일 목록

### 새로 작성할 파일
```
실행스크립트/
├── collect_v25_chatgpt.py      # ChatGPT 수집 스크립트
├── collect_v25_grok.py         # Grok 수집 스크립트
├── multi_ai_client.py          # 멀티-AI 클라이언트 (공통)
├── compare_ai_scores.py        # AI별 점수 비교 분석
└── generate_comparison_report.py  # 비교 리포트 생성
```

### 수정할 파일
```
├── .env (API 키 추가)
│   OPENAI_API_KEY=sk-xxx
│   XAI_API_KEY=xai-xxx
│
└── calculate_v24_scores_correct.py
    - ai_name별 점수 계산 분리
    - AI별 최종 점수 산출
```

---

## 6. 비용 분석

### 단일 AI (Claude) - 현재
```
30명 × $3 = $90
이미 완료, 추가 비용 없음
```

### 추가 AI (ChatGPT + Grok)
```
ChatGPT (gpt-4o-mini 권장):
30명 × $0.5 = $15

Grok (grok-2):
30명 × $5 = $150

총 추가 비용: $165
```

### 전체 비용 요약
```
Claude (완료): $90 (이미 지출)
ChatGPT (추가): $15~30
Grok (추가): $150~210

V25.0 총 비용: $165~240 추가
```

---

## 7. 일정 계획

### Day 1 (내일)
```
[오전]
□ OpenAI API 키 발급 (ChatGPT)
□ X.AI API 키 발급 (Grok)
□ .env 파일 업데이트

[오후]
□ multi_ai_client.py 작성
□ collect_v25_chatgpt.py 작성
□ 테스트: 정치인 1명으로 ChatGPT 수집 테스트
```

### Day 2
```
[오전]
□ collect_v25_grok.py 작성
□ 테스트: 정치인 1명으로 Grok 수집 테스트

[오후]
□ compare_ai_scores.py 작성
□ 3개 AI 점수 비교 분석
```

### Day 3
```
[전체]
□ ChatGPT로 30명 전체 수집 (~2.5시간)
□ 수집 데이터 검증
```

### Day 4
```
[전체]
□ Grok으로 30명 전체 수집 (~2.5시간)
□ 수집 데이터 검증
```

### Day 5
```
[오전]
□ 3개 AI 점수 비교 분석
□ 비교 리포트 생성

[오후]
□ 프론트엔드 AI 선택 UI 추가 (선택적)
□ 문서화
```

---

## 8. 예상 결과물

### 8.1 AI별 점수 비교표
```
정치인: 오세훈
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
카테고리      Claude  ChatGPT  Grok   평균
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
전문성         78.2    76.5    79.1   77.9
리더십         79.8    77.2    80.3   79.1
비전           78.8    75.9    78.5   77.7
청렴성         73.2    71.8    74.0   73.0
윤리성         65.4    63.2    66.8   65.1
책임성         75.6    73.4    76.2   75.1
투명성         76.8    74.5    77.1   76.1
소통능력       73.0    71.2    74.3   72.8
대응성         78.2    76.8    79.0   78.0
공익성         76.8    74.9    77.5   76.4
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
총점           755     735     763    751
등급           B       B       B      B
일치도                  HIGH (표준편차: 14.3)
```

### 8.2 신뢰도 분석
```
AI 간 일치도가 HIGH:
→ "3개 AI (Claude, ChatGPT, Grok) 모두 유사한 평가"
→ 객관적이고 신뢰할 수 있는 결과

AI 간 일치도가 LOW:
→ 해당 정치인/카테고리에 대해 AI별 해석 차이 존재
→ 추가 검증 또는 전문가 리뷰 필요 신호
```

---

## 9. 주의사항

### 9.1 프롬프트 일관성
```
⚠️ 3개 AI에 동일한 프롬프트 사용 필수
- instructions/ 폴더의 동일한 파일 사용
- Temperature, Max Tokens 동일하게 설정
- 결과 비교의 공정성 확보
```

### 9.2 Rate Limit 관리
```
Claude: 50 req/min, 50K tokens/min
ChatGPT: 10,000 req/min (Tier 1)
Grok: 60 req/min (추정, 확인 필요)

→ 가장 낮은 Grok 기준으로 속도 조절
```

### 9.3 에러 처리
```
각 AI별 재시도 로직 독립적 운영
- Claude 실패 시 → Claude만 재시도
- ChatGPT 실패 시 → ChatGPT만 재시도
- 한 AI 완전 실패해도 나머지 2개로 진행 가능
```

---

## 10. 다음 단계 (선택적)

### Phase 2: 추가 AI 확장
```
Gemini (Google): 무료 티어 있음, 비용 효율적
Perplexity: 실시간 웹 검색 기능 포함

5개 AI 앙상블:
- Claude + ChatGPT + Grok + Gemini + Perplexity
- 편향 대폭 감소
- 학술적 가치 증가
```

### Phase 3: 프론트엔드 통합
```
- AI 선택 드롭다운 (Claude / ChatGPT / Grok / 평균)
- AI별 점수 차트 시각화
- AI 간 편차가 큰 항목 하이라이트
```

---

**최종 업데이트**: 2025-11-27
**버전**: V25.0
**상태**: 계획 수립 완료, 구현 대기
**예상 추가 비용**: $165~240
**예상 소요 기간**: 5일
