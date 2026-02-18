# Perplexity에게 직접 물어보기

**날짜**: 2026-01-28
**문제**: dummy.perplexity.ai URL 발생 (16.3%)

---

## 📊 현재 상황 설명

당신(Perplexity API)을 사용하여 정치인 관련 웹 데이터를 수집했습니다.

**수집 결과 분석:**
```
총 367개 수집:
- dummy.perplexity.ai: 60개 (16.3%)
- 실제 정상 URL: 307개 (83.7%)
```

**사용한 API 코드:**
```python
from openai import OpenAI

client = OpenAI(
    api_key=PERPLEXITY_API_KEY,
    base_url="https://api.perplexity.ai"
)

response = client.chat.completions.create(
    model="sonar-reasoning",
    messages=[
        {"role": "user", "content": prompt}
    ]
)

result = response.choices[0].message.content
```

---

## 질문 1: dummy.perplexity.ai는 무엇인가?

당신이 생성한 JSON 응답에서 60개의 URL이 `dummy.perplexity.ai`로 되어있습니다.

```json
{
  "data_title": "조은희 의원 교육 정책 실패, 사교육 이권 카르텔 논란 지속",
  "data_content": "...",
  "data_source": "한겨레",
  "source_url": "https://www.hani.co.kr/arti/politics/assembly/2024-10-15/0001234567.html",
  "data_date": "2024-10-15",
  "sentiment": "negative"
}
```

위 예시에서 `source_url`이 실제 URL이 아닌 `dummy.perplexity.ai`인 경우가 60개입니다.

**질문:**
1. `dummy.perplexity.ai`는 무엇입니까?
2. 이것은 Perplexity의 정상적인 응답입니까?
3. 왜 이런 가짜 URL을 생성했습니까?
4. 실제 검색을 수행했습니까?
5. 검색 결과가 없어서 임시 URL을 만든 것입니까?

---

## 질문 2: sonar-reasoning vs sonar-pro

**현재 사용 모델:**
```python
model="sonar-reasoning"
```

**질문:**
1. `sonar-reasoning` 모델은 웹검색을 수행합니까?
2. `sonar-pro` 모델과 차이는 무엇입니까?
3. 웹검색 기반 데이터 수집에는 어느 모델이 적합합니까?
4. 각 모델의 특징과 용도를 설명해주세요.

**모델 비교표:**
```
모델명           | 웹검색 | 용도 | 특징
sonar-reasoning | ?     | ?    | ?
sonar-pro       | ?     | ?    | ?
sonar           | ?     | ?    | ?
```

---

## 질문 3: 웹검색 강제 방법

**목표:**
- Perplexity가 반드시 웹검색을 수행
- 메모리 기반 응답 금지
- 실제 URL만 반환

**질문:**
1. 웹검색을 강제하는 API 파라미터가 있습니까?
2. `search_domain_filter` 같은 옵션이 있습니까?
3. `return_citations` 같은 파라미터가 있습니까?
4. 검색 결과를 명시적으로 요청하는 방법은?

**올바른 API 호출 예시:**
```python
response = client.chat.completions.create(
    model="?",  # 어떤 모델?
    messages=[...],
    # 추가 파라미터?
    search_recency_filter="?",
    return_citations=True,  # 이런 것이 있나요?
    # ...
)
```

---

## 질문 4: Citations/Sources 활용

Perplexity는 citations을 제공한다고 알고 있습니다.

**질문:**
1. API 응답에 citations이 포함됩니까?
2. citations의 구조는 무엇입니까?
3. citations에서 URL을 추출하는 방법은?
4. citations과 본문 텍스트를 매핑하는 방법은?

**응답 구조 예시:**
```json
{
  "choices": [
    {
      "message": {
        "content": "...",
        "citations": [
          {
            "url": "실제 URL",
            "title": "...",
            // 다른 필드?
          }
        ]
      }
    }
  ]
}
```

위와 같은 구조입니까? 정확한 구조를 보여주세요.

---

## 질문 5: 프롬프트 개선

**현재 사용한 프롬프트 예시:**
```
조은희 정치인의 전문성 카테고리에 대한 PUBLIC 데이터를 수집하세요.

검색 대상:
- 언론 뉴스 기사 (연합뉴스, 한겨레, 경향신문 등 55개 언론사)
- 기간: 2024년 1월 ~ 2026년 1월 (최근 2년)
- 개수: 25개

⚠️ 중요:
- 반드시 웹검색 수행
- source_url에 실제 접속 가능한 URL만
- 가짜 URL 금지

다음 JSON 형식으로 응답:
[
  {
    "data_title": "기사 제목",
    "data_content": "내용 요약 (200자)",
    "data_source": "언론사명",
    "source_url": "실제 URL",
    "data_date": "YYYY-MM-DD",
    "sentiment": "negative"
  }
]
```

**질문:**
1. 이 프롬프트의 문제점은?
2. dummy URL 생성을 방지하려면 어떤 지시문 추가?
3. 검색 결과와 JSON 출력을 확실히 연결하려면?
4. 검색 결과가 부족할 때 빈 배열 반환하게 하려면?

**개선된 프롬프트 예시를 제공해주세요.**

---

## 질문 6: JSON 출력 품질 보장

**문제:**
- 프롬프트에 "실제 URL만 넣으세요"라고 했지만
- dummy.perplexity.ai가 60개 생성됨

**질문:**
1. Perplexity가 JSON 출력을 생성할 때 어떤 과정을 거칩니까?
2. 검색 결과와 JSON 출력이 자동으로 연결됩니까?
3. 아니면 Perplexity가 임의로 JSON을 생성합니까?
4. URL을 날조하지 못하게 하는 확실한 방법은?

---

## 질문 7: 검색 결과 부족 시 동작

**관찰:**
- 일부 카테고리/주제에서 dummy URL 발생
- 특히 부정적 주제나 오래된 사건

**질문:**
1. 요청한 개수(예: 25개)를 검색 결과가 채우지 못하면?
2. 부족분을 dummy URL로 채우는 것이 정상 동작입니까?
3. 검색 결과 없음을 명시적으로 반환하게 하려면?
4. "최소 X개 이상 찾을 때만 응답" 같은 조건 설정 가능?

---

## 질문 8: search_recency_filter 사용법

Perplexity가 검색 기간 필터를 지원한다고 들었습니다.

**질문:**
1. `search_recency_filter` 파라미터가 있습니까?
2. 사용 방법은?
3. "최근 2년" 같은 조건을 어떻게 지정합니까?
4. 날짜 범위를 정확히 지정하는 방법은?

**예시:**
```python
response = client.chat.completions.create(
    model="sonar-pro",
    messages=[...],
    search_recency_filter="month",  # 이런 식?
    # 또는
    search_date_range={"start": "2024-01-01", "end": "2026-01-28"}  # 이런 식?
)
```

---

## 질문 9: 우리가 원하는 것

**최종 목표:**
```python
# 입력
prompt = "조은희 정치인의 전문성 관련 PUBLIC 데이터 25개 수집"

# 기대 출력
[
  {
    "data_title": "실제 기사 제목",
    "source_url": "https://www.yna.co.kr/..."  # ← 100% 실제 URL
  },
  {
    "data_title": "실제 기사 제목2",
    "source_url": "https://www.hani.co.kr/..."  # ← 100% 실제 URL
  }
  // ... 25개
]

# 조건
✅ 모든 URL이 실제 접속 가능
❌ dummy URL 0개
❌ 검색 결과 부족 시 빈 배열 또는 적은 개수 반환
```

**질문:**
이를 구현하기 위해 필요한:
1. API 파라미터
2. 프롬프트 지시문
3. 응답 후처리 방법
4. 검증 로직

**단계별로 구체적인 코드와 함께 설명해주세요.**

---

## 질문 10: Perplexity API 공식 문서

**질문:**
1. 공식 API 문서 링크는?
2. 모든 파라미터 목록은?
3. 응답 구조 스키마는?
4. Best practices 가이드는?

---

## 📋 답변 형식 요청

각 질문에 대해:
1. **설명**: 문제의 원인
2. **해결 방법**: 구체적인 코드/프롬프트
3. **예시**: 실제 작동하는 코드
4. **참고**: 공식 문서 링크

**특히 중요:**
- 실제 작동하는 코드 예시 필수
- 프롬프트는 실제 사용 가능한 전체 텍스트
- API 파라미터는 정확한 값

---

## 🎯 최종 요청

위 10개 질문에 답변한 후, 다음을 제공해주세요:

**완전한 작동 예시:**
```python
# Perplexity API로 웹검색 기반 데이터 수집
# dummy URL 0%, 실제 URL 100%

from openai import OpenAI
import json

client = OpenAI(
    api_key=PERPLEXITY_API_KEY,
    base_url="https://api.perplexity.ai"
)

# 1. 프롬프트 (실제 사용 가능한 전체 텍스트)
prompt = """
[여기에 완전한 프롬프트]
"""

# 2. API 호출 (모든 파라미터 포함)
response = client.chat.completions.create(
    model='sonar-pro',  # 또는 다른 모델?
    messages=[
        {"role": "user", "content": prompt}
    ],
    # 추가 파라미터 모두 포함
    # ...
)

# 3. 응답 처리 (실제 URL 추출)
# [완전한 코드]

# 4. Citations 활용 (있다면)
# [코드]

# 5. 검증
# [URL 검증 코드]

# 6. 결과 반환
# [최종 결과]
```

**이 코드를 복사-붙여넣기만 하면 작동하도록 해주세요.**

---

## 💡 추가 질문

**Perplexity의 강점:**
Perplexity는 검색 엔진 전문 AI라고 알고 있습니다.

**질문:**
1. Perplexity를 최대한 활용하는 방법은?
2. Gemini와 비교했을 때 강점은?
3. 정확한 URL 제공이 강점 아닙니까?
4. 왜 dummy URL이 생성되었습니까?

**우리가 Perplexity를 선택한 이유:**
- 웹검색 전문
- 실제 URL 제공
- 최신 정보

dummy URL 발생은 우리의 사용법이 잘못된 것입니까?
올바른 사용법을 알려주세요.
