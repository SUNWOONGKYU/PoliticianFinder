# X/Twitter 데이터 수집 방법 조사

**작성일**: 2026-01-20
**목적**: Grok이 실제 X 검색을 못 한다는 것이 밝혀진 후, 실제로 X 데이터를 수집할 수 있는 방법 조사

---

## 결론: Grok의 한계

Grok-3에게 직접 물어본 결과:
- ❌ X/Twitter 실시간 검색 기능 없음
- ❌ X API 접근 권한 없음
- ❌ 2023년까지 학습 데이터만 사용
- ❌ 프롬프트로도 실제 검색 강제 불가능

**Grok이 생성한 데이터 = 100% Hallucination (가상 데이터)**

---

## 실제 X 데이터 수집 방법

### 1. X API (Twitter API v2) - 공식 방법 ✅

**장점**:
- 공식 지원
- 안정적
- 메타데이터 풍부 (좋아요, 리트윗, 계정 정보 등)

**단점**:
- 비용 발생
- 신청/승인 필요

**가격**:
```
Free Tier:
- 월 500개 트윗 검색
- Read-only
- 1 App 환경

Basic Tier: $100/월
- 월 10,000개 트윗
- 3 App 환경

Pro Tier: $5,000/월
- 월 1,000,000개 트윗
- 전체 히스토리 검색
```

**사용 예시 (Python)**:
```python
import tweepy

# 인증
client = tweepy.Client(bearer_token="YOUR_BEARER_TOKEN")

# 검색
tweets = client.search_recent_tweets(
    query="조은희 -is:retweet",
    max_results=100,
    tweet_fields=["created_at", "author_id", "public_metrics"]
)

for tweet in tweets.data:
    print(f"{tweet.created_at}: {tweet.text}")
```

**신청 방법**:
1. https://developer.twitter.com 접속
2. 개발자 계정 생성
3. 프로젝트 및 앱 생성
4. API 키 발급

---

### 2. snscrape (무료, API 키 불필요) ✅

**장점**:
- 완전 무료
- API 키 불필요
- 설치 간단

**단점**:
- 비공식 도구 (X에서 차단 가능)
- 메타데이터 제한적
- 속도 제한 있음
- 안정성 낮음 (X 구조 변경 시 작동 중단)

**사용 예시 (Python)**:
```python
import snscrape.modules.twitter as sntwitter
import pandas as pd

# 검색
tweets = []
query = "조은희 since:2024-01-01 until:2026-01-20"

for i, tweet in enumerate(sntwitter.TwitterSearchScraper(query).get_items()):
    if i > 100:
        break
    tweets.append({
        "date": tweet.date,
        "user": tweet.user.username,
        "content": tweet.content,
        "url": tweet.url
    })

df = pd.DataFrame(tweets)
print(df)
```

**설치**:
```bash
pip install snscrape
```

**주의**:
- X 이용약관 위반 가능성
- 언제든 차단될 수 있음

---

### 3. Selenium/Playwright (웹 스크래핑) ⚠️

**장점**:
- 브라우저처럼 동작
- API 키 불필요

**단점**:
- 느림
- X 로그인 필요
- 차단 위험 높음
- 복잡한 구현

**사용 예시 (Python + Selenium)**:
```python
from selenium import webdriver
from selenium.webdriver.common.by import By
import time

driver = webdriver.Chrome()
driver.get("https://x.com/search?q=조은희&src=typed_query")

# 로그인 필요...
# 스크롤 및 데이터 추출...
```

**비추천 이유**:
- 너무 복잡
- 안정성 낮음
- X에서 봇 감지 시 차단

---

### 4. 타사 서비스 (유료) 💰

#### Apify Twitter Scraper
- 가격: 사용량에 따라 $49~$499/월
- https://apify.com/apify/twitter-scraper

#### RapidAPI Twitter API
- 가격: $0~$1,000/월
- https://rapidapi.com/search/twitter

**장점**:
- 구현 불필요
- 안정적

**단점**:
- 비용 발생
- 공식 API보다 비쌈

---

### 5. 수동 수집 (직접 복사) ✋

**방법**:
1. X 웹사이트 접속
2. "조은희" 검색
3. 트윗 하나씩 복사/붙여넣기

**장점**:
- 완전 무료
- 확실히 실제 데이터

**단점**:
- 시간 소모 심함 (50개면 1~2시간)
- 자동화 불가

---

## V30에 적용 가능한 방법

### 현실적 옵션

#### Option 1: snscrape (무료, 비공식)
```python
# 장점: 완전 무료, 빠름
# 단점: X에서 차단 가능, 불안정

# 구현 예시
import snscrape.modules.twitter as sntwitter

def collect_tweets_snscrape(politician_name, category_keywords, count=7):
    """snscrape로 실제 트윗 수집"""
    query = f"{politician_name} {category_keywords} since:2024-01-01 until:2026-01-20"
    tweets = []

    for i, tweet in enumerate(sntwitter.TwitterSearchScraper(query).get_items()):
        if i >= count:
            break
        tweets.append({
            "title": tweet.content[:100],
            "content": tweet.content,
            "source": "X",
            "source_url": f"X/@{tweet.user.username}",
            "date": tweet.date.strftime("%Y-%m-%d")
        })

    return tweets
```

**비용**: $0
**시간**: 50개 수집 약 5분
**위험**: X 차단 가능성

---

#### Option 2: X API Free Tier (공식, 제한적)
```python
# 장점: 공식, 안정적
# 단점: 월 500개 제한

import tweepy

def collect_tweets_api(politician_name, category_keywords, count=7):
    """X API로 실제 트윗 수집"""
    client = tweepy.Client(bearer_token=os.getenv("TWITTER_BEARER_TOKEN"))

    query = f"{politician_name} {category_keywords} -is:retweet"
    tweets = client.search_recent_tweets(
        query=query,
        max_results=min(count, 100),
        tweet_fields=["created_at", "author_id"]
    )

    result = []
    for tweet in tweets.data:
        result.append({
            "title": tweet.text[:100],
            "content": tweet.text,
            "source": "X",
            "source_url": f"X/@{tweet.author_id}",
            "date": tweet.created_at.strftime("%Y-%m-%d")
        })

    return result
```

**비용**: $0 (Free Tier)
**제한**: 월 500개 (V30은 50개만 필요하므로 충분!)
**시간**: 50개 수집 약 2분

---

#### Option 3: X API Basic Tier (공식, 충분)
**비용**: $100/월
**제한**: 월 10,000개
**안정성**: ✅ 최고

---

#### Option 4: Grok 완전 제거
- Gemini 100% 사용
- X 데이터 포기
- 뉴스/웹사이트 데이터만 사용

---

## 추천 방안

### 🥇 1순위: X API Free Tier (월 500개)

**이유**:
- ✅ 완전 무료
- ✅ 공식 지원 (안정적)
- ✅ V30은 50개만 필요 (10배 여유)
- ✅ 실제 데이터 보장

**단점**:
- 개발자 계정 신청 필요 (5~10분 소요)

**구현 난이도**: ⭐⭐☆☆☆ (쉬움)

---

### 🥈 2순위: snscrape (무료, 비공식)

**이유**:
- ✅ 완전 무료
- ✅ API 신청 불필요
- ✅ 빠름

**단점**:
- ⚠️ 비공식 (차단 가능)
- ⚠️ 불안정

**구현 난이도**: ⭐☆☆☆☆ (매우 쉬움)

---

### 🥉 3순위: Grok 제거, Gemini 100%

**이유**:
- ✅ 현재 시스템 그대로
- ✅ 추가 작업 불필요

**단점**:
- ❌ X 데이터 포기
- ❌ 95-5 비율 상실

---

## 결론

**Grok은 X 데이터를 수집할 수 없습니다.**

실제 X 데이터 수집을 원한다면:
1. **X API Free Tier** 사용 (추천)
2. **snscrape** 사용 (대안)
3. Grok 제거 후 Gemini 100%

어떤 방법을 선택하시겠습니까?
