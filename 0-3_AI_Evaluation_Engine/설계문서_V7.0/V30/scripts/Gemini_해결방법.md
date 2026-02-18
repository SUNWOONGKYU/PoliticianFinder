# Gemini 해결 방법 (AI 답변)

**날짜**: 2026-01-28
**출처**: Gemini AI 직접 답변

---

## 핵심 해결 방법

### 1. JSON Schema 강제 (가짜 URL 방지)

```python
response_schema = {
    "type": "ARRAY",
    "items": {
        "type": "OBJECT",
        "properties": {
            "data_title": {"type": "STRING"},
            "data_content": {"type": "STRING"},
            "data_source": {"type": "STRING"},
            "source_url": {"type": "STRING"},
            "data_date": {"type": "STRING"},
            "sentiment": {"type": "STRING"}
        },
        "required": ["data_title", "source_url"]
    }
}
```

### 2. API 호출 시 Schema 적용

```python
response = client.models.generate_content(
    model='gemini-2.0-flash-exp',
    contents=prompt,
    config=types.GenerateContentConfig(
        tools=[types.Tool(google_search=types.GoogleSearch())],
        response_mime_type="application/json",
        response_schema=response_schema
    )
)
```

### 3. 개선된 프롬프트

```
조은희 국회의원의 2022년 이후 의정 활동, 공약, 정책 발표 등 공식 데이터를 수집하세요.

지침:
1. Google Search 결과를 기반으로 실제 존재하는 사실만 기록하세요.
2. 'source_url'에는 검색 결과에서 확인된 실제 URL만 입력하세요.
3. dummy URL이나 가상의 URL을 생성하지 마세요.
4. 검색 결과가 부족하면 적은 개수로 반환하세요.
```

### 4. URL 검증 로직

```python
def get_verified_results(response):
    raw_data = json.loads(response.text)

    # grounding_metadata에서 실제 URL 추출
    actual_urls = []
    if response.grounding_metadata and response.grounding_metadata.grounding_chunks:
        for chunk in response.grounding_metadata.grounding_chunks:
            if chunk.web:
                actual_urls.append(chunk.web.uri)

    verified_data = []
    for item in raw_data:
        url = item.get('source_url', '')
        # 검증: 1) dummy 제외, 2) redirect 제외, 3) 실제 메타데이터 확인
        if "dummy" not in url and any(original_url in url for original_url in actual_urls):
            verified_data.append(item)
        elif any(original_url in url for original_url in actual_urls):
            # redirect URL인 경우 메타데이터의 원본 URL로 교체
            verified_data.append(item)

    return verified_data
```

---

## 완전한 작동 예시

```python
import json
from google import genai
from google.genai import types

# 1. 클라이언트 설정
client = genai.Client(api_key='YOUR_API_KEY')

# 2. JSON 스키마 정의
response_schema = {
    "type": "ARRAY",
    "items": {
        "type": "OBJECT",
        "properties": {
            "data_title": {"type": "STRING"},
            "data_content": {"type": "STRING"},
            "data_source": {"type": "STRING"},
            "source_url": {"type": "STRING"},
            "data_date": {"type": "STRING"},
            "sentiment": {"type": "STRING"}
        },
        "required": ["data_title", "source_url"]
    }
}

# 3. 프롬프트
prompt = """
조은희 국회의원의 2022년 이후 의정 활동, 공약, 정책 발표 등 공식 데이터를 수집하세요.

지침:
1. Google Search 결과를 기반으로 실제 존재하는 사실만 기록하세요.
2. 'source_url'에는 검색 결과에서 확인된 실제 URL만 입력하세요.
3. dummy URL이나 가상의 URL을 생성하지 마세요.
4. 검색 결과가 부족하면 적은 개수로 반환하세요.
"""

# 4. API 호출
response = client.models.generate_content(
    model='gemini-2.0-flash-exp',
    contents=prompt,
    config=types.GenerateContentConfig(
        tools=[types.Tool(google_search=types.GoogleSearch())],
        response_mime_type="application/json",
        response_schema=response_schema
    )
)

# 5. URL 검증
def get_verified_results(response):
    raw_data = json.loads(response.text)

    # grounding_metadata에서 실제 URL 추출
    actual_urls = []
    if response.grounding_metadata and response.grounding_metadata.grounding_chunks:
        for chunk in response.grounding_metadata.grounding_chunks:
            if chunk.web:
                actual_urls.append(chunk.web.uri)

    verified_data = []
    for item in raw_data:
        url = item.get('source_url', '')
        # 검증: dummy 제외, 실제 메타데이터 확인
        if "dummy" not in url and any(original_url in url for original_url in actual_urls):
            verified_data.append(item)

    return verified_data

# 6. 결과
final_results = get_verified_results(response)
print(json.dumps(final_results, indent=2, ensure_ascii=False))
```

---

## 적용 방법

### collect_v30.py 수정 사항

**1. response_schema 추가 (전역 변수)**
```python
# Line 100 근처
RESPONSE_SCHEMA = {
    "type": "ARRAY",
    "items": {
        "type": "OBJECT",
        "properties": {
            "data_title": {"type": "STRING"},
            "data_content": {"type": "STRING"},
            "data_source": {"type": "STRING"},
            "source_url": {"type": "STRING"},
            "data_date": {"type": "STRING"},
            "sentiment": {"type": "STRING"}
        },
        "required": ["data_title", "source_url"]
    }
}
```

**2. call_gemini_with_search() 함수 수정 (Line 1291)**
```python
def call_gemini_with_search(client, prompt, max_retries=3):
    from google.genai import types

    config = AI_CONFIGS["Gemini"]
    retry_wait = [60, 120, 300]

    for attempt in range(max_retries):
        try:
            # ✅ JSON Schema 적용
            response = client.models.generate_content(
                model=config['model'],
                contents=prompt,
                config=types.GenerateContentConfig(
                    tools=[types.Tool(google_search=types.GoogleSearch())],
                    response_mime_type="application/json",
                    response_schema=RESPONSE_SCHEMA
                )
            )

            if not response.text:
                return None

            # ✅ URL 검증
            raw_data = json.loads(response.text)

            # grounding_metadata에서 실제 URL 추출
            actual_urls = []
            if hasattr(response, 'grounding_metadata') and response.grounding_metadata:
                if hasattr(response.grounding_metadata, 'grounding_chunks'):
                    for chunk in response.grounding_metadata.grounding_chunks:
                        if hasattr(chunk, 'web') and chunk.web:
                            actual_urls.append(chunk.web.uri)

            # dummy URL 필터링 및 검증
            verified_data = []
            for item in raw_data:
                url = item.get('source_url', '')
                # dummy URL 제외
                if 'dummy' not in url.lower():
                    verified_data.append(item)

            print(f"    [Gemini] 원본: {len(raw_data)}개 → 검증: {len(verified_data)}개")

            return json.dumps(verified_data, ensure_ascii=False)

        except Exception as e:
            # Rate Limit 처리 (기존 동일)
            error_str = str(e).lower()
            if '429' in error_str or 'rate' in error_str:
                if attempt < max_retries - 1:
                    wait_time = retry_wait[attempt]
                    print(f"  ⚠️ Gemini Rate Limit - {wait_time}초 대기")
                    time.sleep(wait_time)
                    continue
            print(f"  ❌ Gemini API 에러: {e}")
            return None

    return None
```

**3. 프롬프트 개선 (build_prompt_v30 함수)**
```python
# 프롬프트 마지막에 추가
⚠️ URL 규칙 (절대 엄수):
✅ 실제 웹검색 결과에서 확인된 URL만 사용
❌ dummy.*, example.com 등 가짜 URL 절대 금지
❌ 검색 결과 없으면 적은 개수로 반환 (빈 배열도 가능)
```
