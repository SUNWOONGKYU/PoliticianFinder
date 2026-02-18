# V40 Gemini에게 직접 물어보기

**날짜**: 2026-01-28
**문제**: dummy URL과 redirect URL 대량 발생 (58.7%)
**버전**: V40

---

## 📊 현재 상황 설명

당신(Gemini API)을 사용하여 정치인 관련 웹 데이터를 수집했습니다.

**수집 결과 분석:**
```
총 888개 수집:
- dummy.gemini.com: 180개 (20.3%)
- vertexaisearch.cloud.google.com/grounding-api-redirect: 341개 (38.4%)
- 실제 정상 URL: 367개 (41.3%)

→ 가짜 URL 합계: 521개 (58.7%)
```

**사용한 API 코드:**
```python
from google import genai
from google.genai import types

client = genai.Client(api_key=GEMINI_API_KEY)

response = client.models.generate_content(
    model='gemini-2.0-flash-exp',
    contents=prompt,
    config=types.GenerateContentConfig(
        tools=[types.Tool(google_search=types.GoogleSearch())]
    )
)

# 응답에서 grounding_metadata 추출 시도
if hasattr(response, 'grounding_metadata'):
    grounding = response.grounding_metadata
    if hasattr(grounding, 'grounding_chunks'):
        for chunk in grounding.grounding_chunks:
            if hasattr(chunk, 'web') and hasattr(chunk.web, 'uri'):
                actual_url = chunk.web.uri
                # 하지만 여기서 redirect URL이 나옴
```

---

## 질문 1: dummy.gemini.com은 무엇인가?

당신이 생성한 JSON 응답에서 180개의 URL이 `dummy.gemini.com`으로 되어있습니다.

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

위 예시에서 `source_url`이 실제 URL이 아닌 `dummy.gemini.com`인 경우가 180개입니다.

**질문:**
1. `dummy.gemini.com`은 무엇입니까?
2. 왜 이런 가짜 URL을 생성했습니까?
3. 웹검색을 실제로 수행했습니까?
4. 검색 결과가 없어서 임시 URL을 만든 것입니까?

---

## 질문 2: redirect URL 문제

`grounding_metadata`에서 추출한 URL이 다음과 같은 형식입니다:

```
https://vertexaisearch.cloud.google.com/grounding-api-redirect/auziyqgqdyybp99wqtmdwkxu5fynkphkkknvjlvcsyahzmg5rh5qnwgayzmut5msnfbpgofcmsbs3n5slcpgxiqtbh4evhorb3pecuyvzim56tos7dgi6hhksto1lkduklitlcth6m6tbseax2rfpz3l7zdtapilig5itnm0qnlm9adiyicesylbmnz7stokhhe=
```

이런 URL이 341개(38.4%)입니다.

**질문:**
1. 이것은 무엇입니까?
2. 실제 원본 URL은 어디에 있습니까?
3. `grounding_metadata`의 정확한 구조는 무엇입니까?
4. 원본 URL을 얻는 올바른 방법은 무엇입니까?

**응답 구조 예시를 보여주세요:**
```json
{
  "grounding_metadata": {
    "grounding_chunks": [
      {
        "web": {
          "uri": "어떤 값?",
          "title": "...",
          // 실제 원본 URL은 어느 필드?
        }
      }
    ]
  }
}
```

---

## 질문 3: 프롬프트 개선 방법

**현재 사용한 프롬프트 예시:**
```
조은희 정치인의 전문성 카테고리에 대한 OFFICIAL 데이터를 수집하세요.

수집 대상 (공식 활동):
- 국회 의정활동: 법안 발의, 국정감사, 위원회 활동
- 공식 발표: 기자회견, 성명서, 공약, 정책 발표
- 공적 기록: 경력, 학력, 수상, 임명

검색 조건:
- 기간: 2022년 1월 ~ 2026년 1월
- 개수: 50개
- 반드시 Google Search 사용

⚠️ 중요:
- 실제 웹검색 필수
- source_url에 실제 접속 가능한 URL만 넣으세요
- 가짜 URL 금지

다음 JSON 형식으로 응답:
[
  {
    "data_title": "기사 제목",
    "data_content": "내용 요약 (200자)",
    "data_source": "출처명",
    "source_url": "실제 URL",
    "data_date": "YYYY-MM-DD",
    "sentiment": "negative"
  }
]
```

**질문:**
1. 이 프롬프트의 문제점은 무엇입니까?
2. dummy URL 생성을 방지하려면 어떤 지시문을 추가해야 합니까?
3. grounding 결과와 JSON 출력을 확실히 연결하려면?
4. 검색 결과가 부족할 때 빈 배열을 반환하게 하려면?

**개선된 프롬프트 예시를 제공해주세요.**

---

## 질문 4: API 설정 개선

**현재 설정:**
```python
config = types.GenerateContentConfig(
    tools=[types.Tool(google_search=types.GoogleSearch())]
)
```

**질문:**
1. 이 설정이 올바릅니까?
2. `GoogleSearch()` 옵션이 더 있습니까?
3. URL 품질을 보장하는 파라미터가 있습니까?
4. 검색 결과를 강제로 포함시키는 방법은?

**올바른 API 사용 예시를 코드로 보여주세요.**

---

## 질문 5: JSON Schema 강제

**목표:**
- `source_url` 필드가 반드시 실제 URL이어야 함
- dummy URL, redirect URL 금지
- URL 형식 검증

**질문:**
1. JSON Schema를 강제하는 방법이 있습니까?
2. `source_url` 필드 검증 방법은?
3. Gemini가 URL을 날조하지 못하게 하는 방법은?

**코드 예시:**
```python
# JSON Schema 정의?
schema = {
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "source_url": {
        "type": "string",
        "pattern": "^https?://.*",
        // URL 검증?
      }
    }
  }
}

# Schema를 어떻게 적용?
```

---

## 질문 6: 부정적 주제 검색 문제

**관찰:**
- 긍정적/중립적 주제: URL 품질 좋음
- 부정적 주제 (논란, 스캔들): dummy URL 많음

**프롬프트 예시:**
```
🚨 부정적 주제만 수집 🚨
다음과 같은 부정적인 내용만 검색하세요:
- 논란, 비판, 의혹, 스캔들
- 실패, 실정, 무능
- 위법 행위, 윤리 위반
```

**질문:**
1. 부정적 주제 검색이 어려운 이유는?
2. 검색 결과가 없을 때 dummy URL을 생성합니까?
3. 부정적 주제 검색 시 특별한 설정이 필요합니까?
4. 검색 결과 없음을 명시적으로 반환하게 하려면?

---

## 질문 7: 우리가 원하는 것

**최종 목표:**
```python
# 입력
prompt = "조은희 정치인의 전문성 관련 OFFICIAL 데이터 50개 수집"

# 기대 출력
[
  {
    "data_title": "실제 기사 제목",
    "source_url": "https://www.assembly.go.kr/..."  # ← 100% 실제 URL
  },
  {
    "data_title": "실제 기사 제목2",
    "source_url": "https://www.yna.co.kr/..."  # ← 100% 실제 URL
  }
  // ... 50개
]

# 조건
✅ 모든 URL이 실제 접속 가능
❌ dummy URL 0개
❌ redirect URL 0개
❌ 검색 결과 부족 시 빈 배열 반환
```

**질문:**
이를 구현하기 위해 필요한:
1. API 파라미터
2. 프롬프트 지시문
3. 응답 후처리 방법
4. 검증 로직

**단계별로 구체적인 코드와 함께 설명해주세요.**

---

## 질문 8: grounding_metadata 완전 가이드

**현재 코드:**
```python
if hasattr(response, 'grounding_metadata'):
    grounding = response.grounding_metadata
    if hasattr(grounding, 'grounding_chunks'):
        for chunk in grounding.grounding_chunks:
            if hasattr(chunk, 'web'):
                print(chunk.web.uri)  # redirect URL 나옴
                print(chunk.web.title)
                # 실제 URL은?
```

**질문:**
1. `grounding_metadata`의 전체 구조를 JSON으로 보여주세요
2. `chunk.web`에 어떤 필드들이 있습니까?
3. 실제 원본 URL은 정확히 어느 필드입니까?
4. 공식 API 문서 링크를 알려주세요

**예시 응답 구조:**
```json
{
  "text": "...",
  "grounding_metadata": {
    "grounding_chunks": [
      {
        "web": {
          // 모든 필드를 보여주세요
        }
      }
    ],
    // 다른 필드가 있습니까?
  }
}
```

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

위 8개 질문에 답변한 후, 다음을 제공해주세요:

**완전한 작동 예시:**
```python
# Gemini API로 웹검색 기반 데이터 수집
# dummy URL 0%, redirect URL 0%, 실제 URL 100%

from google import genai
from google.genai import types
import json

client = genai.Client(api_key=API_KEY)

# 1. 프롬프트 (실제 사용 가능한 전체 텍스트)
prompt = """
[여기에 완전한 프롬프트]
"""

# 2. API 호출 (모든 파라미터 포함)
response = client.models.generate_content(
    model='gemini-2.0-flash-exp',
    contents=prompt,
    config=types.GenerateContentConfig(
        # 모든 설정 포함
    )
)

# 3. 응답 처리 (실제 URL 추출)
# [완전한 코드]

# 4. 검증
# [URL 검증 코드]

# 5. 결과 반환
# [최종 결과]
```

**이 코드를 복사-붙여넣기만 하면 작동하도록 해주세요.**
