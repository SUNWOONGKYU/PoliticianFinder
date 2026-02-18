# Naver Search API에게 직접 물어보기

**날짜**: 2026-02-01
**문제 예방**: Naver Search API 최적 활용 방법

---

## 📊 Naver Search API 개요

Naver Search API를 사용하여 정치인 관련 웹 데이터를 수집합니다.

**목표**:
```
총 100개 수집 (카테고리당):
- Naver 수집: 50개 (OFFICIAL 10개 + PUBLIC 40개)
- Gemini 수집: 50개 (OFFICIAL 30개 + PUBLIC 20개)
```

**사용할 API**:
```
Naver News Search API
- 뉴스 기사 검색
- 실시간 검색 지원
- 날짜 범위 필터
```

---

## 질문 1: Naver Search API 기본 설정

### API 인증

**질문**:
1. Client ID와 Client Secret은 어떻게 발급받나요?
2. 인증 헤더 형식은 무엇인가요?
3. Rate limit은 어떻게 되나요?

**예상 코드**:
```python
import requests

NAVER_CLIENT_ID = "YOUR_CLIENT_ID"
NAVER_CLIENT_SECRET = "YOUR_CLIENT_SECRET"

headers = {
    'X-Naver-Client-Id': NAVER_CLIENT_ID,
    'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
}
```

---

## 질문 2: News Search API 사용법

### 기본 검색

**목표**: 정치인 이름으로 뉴스 검색

**질문**:
1. News Search API 엔드포인트는?
2. 검색 파라미터는 무엇이 있나요?
3. 날짜 필터 형식은?
4. 정렬 옵션은?

**예상 코드**:
```python
import requests
from datetime import datetime, timedelta

def search_naver_news(politician_name, start_date, end_date, display=10):
    """
    Naver News Search

    Parameters:
    - politician_name: 검색할 정치인 이름
    - start_date: 검색 시작 날짜 (YYYY-MM-DD)
    - end_date: 검색 종료 날짜 (YYYY-MM-DD)
    - display: 결과 개수 (최대 100)
    """

    url = "https://openapi.naver.com/v1/search/news.json"

    params = {
        'query': politician_name,
        'display': display,
        'start': 1,
        'sort': 'date',  # 날짜순 정렬
        # 날짜 필터는 어떻게?
    }

    headers = {
        'X-Naver-Client-Id': NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
    }

    response = requests.get(url, params=params, headers=headers)
    return response.json()
```

**필요한 답변**:
- 정확한 엔드포인트
- 모든 파라미터 목록
- 날짜 필터 사용법
- 응답 구조

---

## 질문 3: 응답 데이터 구조

### 응답 JSON 형식

**질문**:
1. 응답 JSON의 정확한 구조는?
2. 각 뉴스 항목에 포함된 필드는?
3. 원문 URL은 어떤 필드에 있나요?
4. 날짜 형식은?

**예상 응답 구조**:
```json
{
  "lastBuildDate": "날짜",
  "total": 총개수,
  "start": 시작위치,
  "display": 반환개수,
  "items": [
    {
      "title": "기사 제목 (HTML 태그 포함?)",
      "originallink": "원본 URL",
      "link": "네이버 뉴스 URL",
      "description": "기사 요약 (HTML 태그 포함?)",
      "pubDate": "발행 날짜 (형식?)",
      // 다른 필드는?
    }
  ]
}
```

**필요한 답변**:
- 정확한 필드명
- HTML 태그 포함 여부
- 날짜 형식
- description 길이 제한

---

## 질문 4: 고급 검색 옵션

### 검색어 고급 문법

**목표**: 특정 주제의 뉴스만 검색

**질문**:
1. AND/OR/NOT 연산자 지원하나요?
2. 구문 검색("")은 가능한가요?
3. 특정 언론사 필터는?
4. 카테고리 필터는?

**예시**:
```python
# 전문성 관련 뉴스
query = "김민석 AND (법안 OR 정책 OR 의정활동)"

# 청렴성 관련 부정 뉴스
query = "김민석 AND (의혹 OR 논란 OR 비리)"

# 특정 언론사만
query = "김민석"
# 언론사 필터 파라미터가 있나요?
```

---

## 질문 5: 페이지네이션

### 100개 이상 수집

**목표**: 한 번에 100개씩, 여러 번 호출

**질문**:
1. 한 번에 최대 몇 개까지 가져올 수 있나요?
2. start 파라미터는 어떻게 사용하나요?
3. 전체 결과 개수는 어디서 확인하나요?
4. 페이지네이션 예시 코드는?

**예상 코드**:
```python
def get_all_news(politician_name, total_needed=50):
    """50개 뉴스 수집"""
    all_items = []

    # 100개씩 가져올 수 있다면
    display = 100
    start = 1

    while len(all_items) < total_needed:
        result = search_naver_news(
            politician_name,
            display=display,
            start=start
        )

        items = result['items']
        all_items.extend(items)

        # 다음 페이지로
        start += display

        # 더 이상 결과 없으면 중단
        if len(items) < display:
            break

    return all_items[:total_needed]
```

---

## 질문 6: 날짜 필터링

### 기간 제한 검색

**목표**: OFFICIAL 4년, PUBLIC 2년 필터

**질문**:
1. 날짜 필터 파라미터는?
2. 날짜 형식은?
3. 시작일/종료일 모두 지정 가능한가요?
4. 예시 코드는?

**예상 코드**:
```python
from datetime import datetime, timedelta

def search_with_date_filter(politician_name, days_back, count=50):
    """
    날짜 필터링 검색

    Parameters:
    - days_back: 며칠 전까지 (OFFICIAL=1460일, PUBLIC=730일)
    - count: 결과 개수
    """

    end_date = datetime.now()
    start_date = end_date - timedelta(days=days_back)

    params = {
        'query': politician_name,
        'display': count,
        # 날짜 필터 파라미터?
        'start_date': start_date.strftime('%Y%m%d'),  # 형식?
        'end_date': end_date.strftime('%Y%m%d'),  # 형식?
    }

    # ...
```

---

## 질문 7: 데이터 정제

### HTML 태그 제거

**질문**:
1. title과 description에 HTML 태그가 포함되나요?
2. 포함된다면 어떤 태그인가요? (`<b>`, `<em>` 등)
3. 제거 방법은?

**예상 코드**:
```python
import re
from html import unescape

def clean_naver_text(text):
    """Naver 검색 결과 텍스트 정제"""
    # HTML 태그 제거
    text = re.sub(r'<[^>]+>', '', text)
    # HTML 엔티티 디코딩
    text = unescape(text)
    # 공백 정리
    text = re.sub(r'\s+', ' ', text).strip()
    return text

# 사용
for item in result['items']:
    title = clean_naver_text(item['title'])
    description = clean_naver_text(item['description'])
```

이 방법이 맞나요?

---

## 질문 8: OFFICIAL vs PUBLIC 구분

### 출처별 수집 전략

**목표**:
```
OFFICIAL (10개):
- 국회의사록
- 정부 공식 발표
- 법제처 공보

PUBLIC (40개):
- 언론 뉴스 기사
- 연합뉴스, 한겨레, 경향신문 등
```

**질문**:
1. Naver News API로 공식 출처만 필터할 수 있나요?
2. 언론사 이름으로 필터 가능한가요?
3. 아니면 검색 후 필터링해야 하나요?

**예상 전략**:
```python
# 방법 1: 검색어에 출처 포함
official_query = "김민석 site:assembly.go.kr"
public_query = "김민석"

# 방법 2: 검색 후 필터링
def filter_by_source(items, source_type):
    if source_type == 'OFFICIAL':
        official_domains = [
            'assembly.go.kr',
            'moleg.go.kr',
            'korea.kr'
        ]
        return [item for item in items
                if any(domain in item['originallink']
                       for domain in official_domains)]
    else:
        # PUBLIC
        return items
```

어느 방법이 나은가요?

---

## 질문 9: 오류 처리

### API 오류 대응

**질문**:
1. 주요 오류 코드는?
2. Rate limit 초과 시 응답은?
3. 재시도 전략은?
4. 오류 처리 예시는?

**예상 코드**:
```python
import time

def search_with_retry(politician_name, max_retries=3):
    """재시도 로직 포함 검색"""

    for attempt in range(max_retries):
        try:
            response = search_naver_news(politician_name)

            if response.status_code == 200:
                return response.json()

            elif response.status_code == 429:  # Rate Limit
                wait_time = (attempt + 1) * 60
                print(f"Rate limit, waiting {wait_time}s...")
                time.sleep(wait_time)
                continue

            else:
                print(f"Error: {response.status_code}")
                return None

        except Exception as e:
            print(f"Exception: {e}")
            if attempt < max_retries - 1:
                time.sleep(10)
                continue
            return None

    return None
```

---

## 질문 10: V40 통합

### collect_v40.py 통합 방법

**목표**: Gemini + Naver 병렬 수집

**질문**:
1. Gemini와 Naver를 어떻게 병렬 실행하나요?
2. 결과를 어떻게 합치나요?
3. 중복 제거는 어떻게 하나요?

**예상 구조**:
```python
def collect_category_data(politician_id, politician_name, category):
    """
    카테고리별 100개 수집

    - Gemini: 50개 (OFFICIAL 30 + PUBLIC 20)
    - Naver: 50개 (OFFICIAL 10 + PUBLIC 40)
    """

    # Phase 1: Gemini 수집
    gemini_official = collect_gemini(
        politician_name,
        category,
        source_type='OFFICIAL',
        count=30
    )

    gemini_public = collect_gemini(
        politician_name,
        category,
        source_type='PUBLIC',
        count=20
    )

    # Phase 2: Naver 수집
    naver_official = collect_naver(
        politician_name,
        category,
        source_type='OFFICIAL',
        count=10,
        days_back=1460  # 4년
    )

    naver_public = collect_naver(
        politician_name,
        category,
        source_type='PUBLIC',
        count=40,
        days_back=730  # 2년
    )

    # 통합
    all_data = (
        gemini_official + gemini_public +
        naver_official + naver_public
    )

    # 중복 제거 (URL 기준)
    unique_data = remove_duplicates_by_url(all_data)

    return unique_data
```

이 구조가 맞나요?

---

## 🎯 최종 요청

**완전한 작동 예시를 제공해주세요**:

```python
# Naver News Search API 완전 가이드

import requests
import re
from html import unescape
from datetime import datetime, timedelta

# API 설정
NAVER_CLIENT_ID = "YOUR_CLIENT_ID"
NAVER_CLIENT_SECRET = "YOUR_CLIENT_SECRET"

def search_naver_news(
    politician_name,
    category_keywords,
    source_type='PUBLIC',
    count=50
):
    """
    Naver News Search 완전판

    Parameters:
    - politician_name: 정치인 이름
    - category_keywords: 카테고리별 키워드 (예: "법안 OR 정책")
    - source_type: 'OFFICIAL' or 'PUBLIC'
    - count: 결과 개수

    Returns:
    - list of dict: 정제된 뉴스 데이터
    """

    # 1. 검색 쿼리 생성
    query = f"{politician_name} {category_keywords}"

    # 2. 날짜 필터 설정
    if source_type == 'OFFICIAL':
        days_back = 1460  # 4년
    else:
        days_back = 730  # 2년

    end_date = datetime.now()
    start_date = end_date - timedelta(days=days_back)

    # 3. API 호출
    # [여기에 완전한 코드]

    # 4. 응답 파싱
    # [여기에 완전한 코드]

    # 5. 데이터 정제
    # [여기에 완전한 코드]

    # 6. 결과 반환
    return cleaned_data

# 실행 예시
results = search_naver_news(
    politician_name="김민석",
    category_keywords="법안 OR 의정활동 OR 정책",
    source_type='PUBLIC',
    count=40
)

for item in results:
    print(f"제목: {item['title']}")
    print(f"URL: {item['url']}")
    print(f"날짜: {item['date']}")
    print(f"출처: {item['source']}")
    print()
```

**이 코드를 복사-붙여넣기만 하면 작동하도록 해주세요.**

---

## 📚 참고 문서 요청

**필요한 공식 문서**:
1. Naver Search API 공식 문서 URL
2. News Search API 상세 가이드
3. 파라미터 전체 목록
4. 오류 코드 목록
5. Best practices 가이드

---

**최종 업데이트**: 2026-02-01
