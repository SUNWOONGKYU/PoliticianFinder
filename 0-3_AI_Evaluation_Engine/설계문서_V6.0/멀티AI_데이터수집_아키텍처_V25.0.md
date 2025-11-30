# V25.0 멀티-AI 데이터 수집 아키텍처

**작성일**: 2025-11-22
**버전**: V25.0
**목적**: ChatGPT, Claude, Grok, Gemini 등 다양한 AI를 활용한 데이터 수집 시스템

---

## 🎯 핵심 개념

### 현재 시스템 (V24.0)
```
정치인 평가 → Claude API 호출 → 500개 데이터 수집
비용: $2~5 / 정치인
```

### 멀티-AI 시스템 (V25.0)
```
정치인 평가 → 5개 AI 동시 호출 → 각각 100개씩 수집 → 총 500개
- Claude API: 100개
- ChatGPT API: 100개
- Gemini API: 100개
- Grok API: 100개
- Perplexity API: 100개

결과: AI별 평가 비교 가능 + 편향 감소
```

---

## 📊 V25.0 데이터 구조

### DB 스키마 변경 (collected_data_v7)

```sql
CREATE TABLE collected_data_v7 (
    collected_data_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    politician_id VARCHAR(8) NOT NULL,

    -- 기존: ai_name VARCHAR(50) (하나의 값만)
    -- V25.0: ai_provider로 변경
    ai_provider VARCHAR(20) NOT NULL,  -- 'claude', 'chatgpt', 'gemini', 'grok', 'perplexity'
    ai_model VARCHAR(50) NOT NULL,     -- 'claude-3-5-haiku-20241022', 'gpt-4o', 'gemini-1.5-pro', 'grok-2', 'pplx-api'

    category_name VARCHAR(50) NOT NULL,
    item_num INTEGER NOT NULL,

    data_title TEXT,
    data_content TEXT,
    data_source TEXT,
    source_url TEXT,
    collection_date TIMESTAMP DEFAULT NOW(),

    rating VARCHAR(10),  -- A, B, C, D, E, F, G, H
    rating_rationale TEXT,
    source_type VARCHAR(20),  -- OFFICIAL, PUBLIC

    -- V25.0 신규 컬럼
    ai_confidence DECIMAL(3,2),  -- AI의 평가 확신도 (0.00 ~ 1.00)
    cross_validation_status VARCHAR(20),  -- 'pending', 'validated', 'conflicted'

    UNIQUE(politician_id, ai_provider, category_name, item_num)
);
```

### 평가 집계 테이블 (ai_evaluation_summary_v25)

```sql
CREATE TABLE ai_evaluation_summary_v25 (
    summary_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    politician_id VARCHAR(8) NOT NULL,
    category_name VARCHAR(50) NOT NULL,

    -- AI별 평균 점수
    claude_avg_rating DECIMAL(4,2),
    chatgpt_avg_rating DECIMAL(4,2),
    gemini_avg_rating DECIMAL(4,2),
    grok_avg_rating DECIMAL(4,2),
    perplexity_avg_rating DECIMAL(4,2),

    -- 종합 점수 (5개 AI 평균)
    aggregated_rating DECIMAL(4,2),

    -- 편차 분석
    rating_std_dev DECIMAL(4,2),  -- 표준편차
    rating_agreement VARCHAR(20),  -- 'high', 'medium', 'low'

    UNIQUE(politician_id, category_name)
);
```

---

## 🔧 구현 방법

### 1단계: AI API 통합 클라이언트 작성

```python
# src/multi_ai_client.py

from typing import List, Dict
import os
from anthropic import Anthropic
from openai import OpenAI
import google.generativeai as genai

class MultiAIClient:
    """5개 AI API를 통합 관리하는 클라이언트"""

    def __init__(self):
        # Claude
        self.claude_client = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

        # ChatGPT
        self.chatgpt_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

        # Gemini
        genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))
        self.gemini_model = genai.GenerativeModel('gemini-1.5-pro')

        # Grok (X.AI)
        self.grok_client = OpenAI(
            api_key=os.getenv('XAI_API_KEY'),
            base_url="https://api.x.ai/v1"
        )

        # Perplexity
        self.perplexity_client = OpenAI(
            api_key=os.getenv('PERPLEXITY_API_KEY'),
            base_url="https://api.perplexity.ai"
        )

    def call_claude(self, prompt: str) -> str:
        """Claude API 호출"""
        response = self.claude_client.messages.create(
            model="claude-3-5-haiku-20241022",
            max_tokens=4000,
            temperature=0.7,
            messages=[{"role": "user", "content": prompt}]
        )
        return response.content[0].text

    def call_chatgpt(self, prompt: str) -> str:
        """ChatGPT API 호출"""
        response = self.chatgpt_client.chat.completions.create(
            model="gpt-4o-mini",  # 경량 모델 (비용 효율)
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=4000
        )
        return response.choices[0].message.content

    def call_gemini(self, prompt: str) -> str:
        """Gemini API 호출"""
        response = self.gemini_model.generate_content(prompt)
        return response.text

    def call_grok(self, prompt: str) -> str:
        """Grok API 호출"""
        response = self.grok_client.chat.completions.create(
            model="grok-2-1212",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=4000
        )
        return response.choices[0].message.content

    def call_perplexity(self, prompt: str) -> str:
        """Perplexity API 호출"""
        response = self.perplexity_client.chat.completions.create(
            model="llama-3.1-sonar-large-128k-online",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=4000
        )
        return response.choices[0].message.content

    def call_all_ais(self, prompt: str) -> Dict[str, str]:
        """5개 AI 동시 호출 (병렬)"""
        from concurrent.futures import ThreadPoolExecutor

        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = {
                'claude': executor.submit(self.call_claude, prompt),
                'chatgpt': executor.submit(self.call_chatgpt, prompt),
                'gemini': executor.submit(self.call_gemini, prompt),
                'grok': executor.submit(self.call_grok, prompt),
                'perplexity': executor.submit(self.call_perplexity, prompt)
            }

            results = {}
            for ai_name, future in futures.items():
                try:
                    results[ai_name] = future.result(timeout=60)
                except Exception as e:
                    results[ai_name] = f"ERROR: {str(e)}"

            return results
```

### 2단계: 멀티-AI 데이터 수집기

```python
# collect_v25_multi_ai.py

from multi_ai_client import MultiAIClient
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

client = MultiAIClient()

def collect_with_multiple_ais(politician_id, politician_name, category_num):
    """
    5개 AI를 사용하여 데이터 수집
    - 각 AI당 10개씩 수집
    - 총 50개 (5 AI × 10개)
    """

    # 프롬프트 생성 (V24.0과 동일)
    prompt = f"""당신은 정치인 평가 데이터 수집 AI입니다.

**대상 정치인**: {politician_name}
**평가 카테고리**: {CATEGORIES[category_num-1][1]}

10개의 평가 항목을 JSON 형식으로 수집하세요.
각 항목은 A~H 등급으로 평가하세요.

출력 형식:
[
  {{
    "item_num": 1,
    "data_title": "...",
    "data_content": "...",
    "data_source": "...",
    "source_url": "...",
    "rating": "B",
    "rating_rationale": "...",
    "source_type": "OFFICIAL" or "PUBLIC",
    "confidence": 0.85
  }},
  ...
]
"""

    # 5개 AI 동시 호출
    print(f"5개 AI 동시 호출 중...")
    ai_responses = client.call_all_ais(prompt)

    # 각 AI 응답 파싱 및 DB 저장
    ai_models = {
        'claude': 'claude-3-5-haiku-20241022',
        'chatgpt': 'gpt-4o',
        'gemini': 'gemini-1.5-pro',
        'grok': 'grok-2-1212',
        'perplexity': 'llama-3.1-sonar-large-128k-online'
    }

    total_saved = 0

    for ai_provider, response_text in ai_responses.items():
        try:
            # JSON 파싱
            items = json.loads(response_text)

            for item in items:
                data = {
                    'politician_id': politician_id,
                    'ai_provider': ai_provider,
                    'ai_model': ai_models[ai_provider],
                    'category_name': CATEGORIES[category_num-1][0],
                    'item_num': item['item_num'],
                    'data_title': item['data_title'],
                    'data_content': item['data_content'],
                    'data_source': item['data_source'],
                    'source_url': item.get('source_url', ''),
                    'rating': item['rating'],
                    'rating_rationale': item['rating_rationale'],
                    'source_type': item['source_type'],
                    'ai_confidence': item.get('confidence', 0.8)
                }

                # DB 저장
                supabase.table('collected_data_v7').insert(data).execute()
                total_saved += 1

                print(f"  ✅ {ai_provider}: 항목 {item['item_num']} 저장")

        except Exception as e:
            print(f"  ❌ {ai_provider} 파싱 실패: {e}")

    print(f"\n총 {total_saved}개 항목 저장 완료")
    return total_saved
```

### 3단계: AI 간 비교 분석기

```python
# analyze_multi_ai_v25.py

def analyze_ai_agreement(politician_id, category_name):
    """
    5개 AI의 평가 일치도 분석
    """

    # AI별 평균 점수 조회
    result = supabase.rpc('calculate_ai_ratings', {
        'p_politician_id': politician_id,
        'p_category': category_name
    }).execute()

    ratings = result.data[0]

    # 표준편차 계산
    import numpy as np
    rating_values = [
        ratings['claude_avg'],
        ratings['chatgpt_avg'],
        ratings['gemini_avg'],
        ratings['grok_avg'],
        ratings['perplexity_avg']
    ]

    std_dev = np.std(rating_values)

    # 일치도 판정
    if std_dev < 1.0:
        agreement = 'high'  # 높은 일치도
    elif std_dev < 2.0:
        agreement = 'medium'
    else:
        agreement = 'low'  # AI 간 의견 충돌

    print(f"""
AI 평가 비교 분석 - {category_name}
{'='*80}
Claude:      {ratings['claude_avg']:.2f}
ChatGPT:     {ratings['chatgpt_avg']:.2f}
Gemini:      {ratings['gemini_avg']:.2f}
Grok:        {ratings['grok_avg']:.2f}
Perplexity:  {ratings['perplexity_avg']:.2f}

평균:        {np.mean(rating_values):.2f}
표준편차:    {std_dev:.2f}
일치도:      {agreement}
""")

    return {
        'aggregated_rating': np.mean(rating_values),
        'std_dev': std_dev,
        'agreement': agreement
    }
```

---

## 💰 비용 비교

### 현재 시스템 (V24.0 - Claude만)
```
정치인 1명 평가:
- Claude API 호출: 500~1,500회
- 비용: $2~5 / 정치인
- 6명 평가 시: $12~30
```

### 멀티-AI 시스템 (V25.0)
```
정치인 1명 평가 (5개 AI):
- Claude API: 100~300회
- ChatGPT API: 100~300회
- Gemini API: 100~300회 (상대적으로 저렴)
- Grok API: 100~300회
- Perplexity API: 100~300회 (검색 기능 포함)

총 비용: $5~15 / 정치인
6명 평가 시: $30~90

⚠️ 비용 2~3배 증가하지만:
- AI별 비교 분석 가능
- 편향 대폭 감소
- 신뢰도 향상
```

---

## 📊 장점

### 1. 편향 감소
```
Claude만 사용 시: Claude의 고유 편향 반영
멀티-AI 사용 시: 5개 AI 평균 → 편향 상쇄
```

### 2. 신뢰도 향상
```
AI 간 일치도가 높으면 → 객관적 평가
AI 간 차이가 크면 → 추가 검증 필요 신호
```

### 3. PT 자료 강화
```
"5개 주요 AI (Claude, ChatGPT, Gemini, Grok, Perplexity)가
모두 동일한 평가를 내렸습니다"
→ 투자자/이해관계자 설득력 증가
```

### 4. 학술적 가치
```
"멀티-AI 앙상블 평가 시스템"
→ 논문 발표 가능
→ 기술 차별화
```

---

## 🚀 단계별 실행 계획

### Phase 1: API 키 발급 (1일)
```bash
1. OpenAI API 키 발급 (ChatGPT)
2. Google AI Studio 키 발급 (Gemini)
3. X.AI API 키 발급 (Grok)
4. Perplexity API 키 발급
```

### Phase 2: 멀티-AI 클라이언트 개발 (2일)
```bash
1. multi_ai_client.py 작성
2. 각 AI API 연동 테스트
3. 병렬 호출 성능 테스트
```

### Phase 3: DB 스키마 업그레이드 (1일)
```sql
1. collected_data_v7 테이블 생성
2. ai_evaluation_summary_v25 테이블 생성
3. 기존 데이터 마이그레이션
```

### Phase 4: 수집 스크립트 개발 (2일)
```bash
1. collect_v25_multi_ai.py 작성
2. 에러 핸들링 강화
3. 재시도 로직 추가
```

### Phase 5: 분석 도구 개발 (1일)
```bash
1. analyze_multi_ai_v25.py 작성
2. AI 간 비교 리포트 생성
3. 시각화 대시보드 연동
```

### Phase 6: 테스트 (1일)
```bash
1. 정치인 1명으로 전체 프로세스 테스트
2. 비용 모니터링
3. 성능 최적화
```

---

## ⚠️ 주의사항

### 1. API 비용 관리
```
- 각 AI마다 과금 체계 다름
- 일일 사용량 모니터링 필수
- 예산 초과 시 자동 중단 로직 필요
```

### 2. Rate Limit 대응
```python
# 각 AI마다 호출 제한 존재
- Claude: 10,000 RPM
- ChatGPT: 10,000 RPM
- Gemini: 60 RPM (주의!)
- Grok: 제한 확인 필요
- Perplexity: 제한 확인 필요

→ 병렬 처리 시 Rate Limit 고려
```

### 3. 응답 형식 통일
```
각 AI마다 JSON 생성 품질 다름
→ 파싱 에러 처리 강화 필요
```

---

## 📈 예상 결과

### PT/PoC용 비교 리포트 예시
```
정치인: 오세훈 (서울시장)
카테고리: 청렴성 (Integrity)

AI 평가 비교
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Claude:      +4.2 (B등급)
ChatGPT:     +3.8 (C등급)
Gemini:      +4.5 (B등급)
Grok:        +4.0 (B등급)
Perplexity:  +4.1 (B등급)

종합 평가:   +4.12 (B등급) ⭐
표준편차:    0.25 (높은 일치도)
신뢰도:      ★★★★★ (5/5)

결론: 5개 AI 모두 유사한 평가
→ 객관적이고 신뢰할 수 있는 결과
```

---

**최종 업데이트**: 2025-11-22
**버전**: V25.0
**상태**: 설계 완료, 구현 대기
**예상 개발 기간**: 8일
**예상 추가 비용**: $30~90 (6명 평가 시)
**ROI**: 신뢰도 향상 + 학술적 가치 + PT 설득력 증가
