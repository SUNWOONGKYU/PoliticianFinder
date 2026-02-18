# Naver API 수집 가이드 (V40)

**Naver Search API 방식**
Python 스크립트가 Naver Search API를 호출하여 자동 수집합니다.

---

## 1. 개요

### 수집 방식: Naver Search API

V40 Naver 수집은 **Naver Search API 직접 호출** 방식입니다.

**정의:**
- Python `requests` 라이브러리로 Naver Search API 호출
- 6개 Search API 엔드포인트 활용 (news, blog, cafearticle, kin, webkr, doc, encyc)
- API 응답 JSON에서 title, link, description, postdate 추출
- collected_data_v40 테이블에 자동 저장

**스크립트:**
- `collect_naver_v40_final.py --ai=Naver` (AI 엔진 루트 폴더에 위치)

**장점:**
- Naver 플랫폼 최적화 (한국어 검색)
- 다양한 소스 (뉴스, 블로그, 카페, 지식iN, 웹문서, 백과사전)
- 무료 API (일일 25,000 requests)
- 설정 간단 (Client ID + Client Secret만)

### 역할 분담

| 역할 | 수행자 | 내용 |
|------|--------|------|
| 전체 프로세스 | collect_naver_v40_final.py | API 호출, 응답 파싱, DB 저장 |
| 검색 실행 | Naver Search API | 6개 엔드포인트 검색 (news, blog, cafearticle, kin, webkr, doc, encyc) |
| 사용자 | 스크립트 실행 | `python collect_naver_v40_final.py --ai=Naver --politician_id=ID --politician_name="이름"` |

### 카테고리당 Naver 수집 목표

| 타입 | 기본 | 버퍼 포함 | sentiment 배분 (neg/pos/free) |
|------|------|----------|-------------------------------|
| OFFICIAL | 10개 | 12개 | 1 / 1 / 8~10 |
| PUBLIC | 40개 | 48개 | 8 / 8 / 24~32 |
| **합계** | **50개** | **60개** | |

**배분 규칙 (V40 확정):**
```
Naver OFFICIAL: 10개 (버퍼 12개) - .go.kr 도메인, 정부/공공기관
Naver PUBLIC:   40개 (버퍼 48개) - 뉴스, 블로그, 카페, 지식iN 등

Gemini와 함께:
- Gemini OFFICIAL 30개 + Naver OFFICIAL 10개 = 40개
- Gemini PUBLIC 20개 + Naver PUBLIC 40개 = 60개
→ 총 100개/카테고리 (버퍼 20% 포함 최대 120개)
```

---

## 2. 사전 준비

### 2.1 Naver Search API 설정

**.env 파일 설정:**
```bash
# Naver Search API (무료, 일일 25,000 requests)
NAVER_CLIENT_ID=your_client_id_here
NAVER_CLIENT_SECRET=your_client_secret_here
```

**API 키 발급 방법:**
1. [Naver Developers](https://developers.naver.com) 접속
2. 로그인 → "Application" → "애플리케이션 등록"
3. 애플리케이션 이름 입력, API 선택:
   - **검색** (필수 체크)
   - Web 동적 URL: `http://localhost` (개발용)
4. 등록 완료 → **Client ID**, **Client Secret** 복사
5. `.env` 파일에 붙여넣기

**Quota 확인:**
- 일일 호출 한도: 25,000 requests
- 초당 호출 한도: 10 requests
- V40 기준: 정치인 1명 = 약 50-60 API calls
  - 카테고리 10개 × 5-6 calls = 50-60 calls
  - 25,000 / 60 = **약 400명 처리 가능/일**

### 2.2 작업 디렉토리

```bash
# collect_naver_v40_final.py는 AI 엔진 루트에 위치
cd C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine
```

### 2.3 필요 파일

| 파일 | 경로 | 용도 |
|------|------|------|
| 정치인 정보 | `설계문서_V7.0/V40/instructions/1_politicians/{이름}.md` | 이름, 정당, 직책, 지역구 |
| 수집 프롬프트 | `설계문서_V7.0/V40/instructions/2_collect/prompts/naver_official.md` | OFFICIAL 수집 템플릿 |
| 수집 프롬프트 | `설계문서_V7.0/V40/instructions/2_collect/prompts/naver_public.md` | PUBLIC 수집 템플릿 |
| 카테고리 지침 | `설계문서_V7.0/V40/instructions/2_collect/cat01~10_*.md` | 카테고리별 수집 기준 |

---

## 3. 수집 프로세스

### 3.1 전체 수집 (Gemini + Naver)

```bash
cd C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine

python collect_naver_v40_final.py \
  --politician_id={POLITICIAN_ID} \
  --politician_name="{POLITICIAN_NAME}"
```

**예시:**
```bash
python collect_naver_v40_final.py \
  --politician_id=d0a5d6e1 \
  --politician_name="조은희"
```

**결과:**
- Gemini: 50개/카테고리 (OFFICIAL 30 + PUBLIC 20)
- Naver: 50개/카테고리 (OFFICIAL 10 + PUBLIC 40)
- 총 100개/카테고리 × 10개 카테고리 = 1,000개

### 3.2 Naver만 수집

```bash
python collect_naver_v40_final.py \
  --politician_id={POLITICIAN_ID} \
  --politician_name="{POLITICIAN_NAME}" \
  --ai=Naver
```

**결과:**
- Naver만 50개/카테고리 수집
- 10개 카테고리 = 500개

### 3.3 특정 카테고리만

```bash
python collect_naver_v40_final.py \
  --politician_id={POLITICIAN_ID} \
  --politician_name="{POLITICIAN_NAME}" \
  --ai=Naver \
  --category=1
```

**카테고리 번호:**
- 1: expertise (전문성)
- 2: leadership (리더십)
- 3: vision (비전)
- 4: integrity (청렴성)
- 5: ethics (윤리성)
- 6: accountability (책임감)
- 7: transparency (투명성)
- 8: communication (소통능력)
- 9: responsiveness (대응성)
- 10: publicinterest (공익성)

### 3.4 미니 테스트 (개발용)

```bash
python collect_naver_v40_final.py \
  --politician_id={POLITICIAN_ID} \
  --politician_name="{POLITICIAN_NAME}" \
  --ai=Naver \
  --test
```

**결과:**
- 카테고리당 10개만 수집 (빠른 테스트용)

---

## 4. Naver Search API 상세

### 4.1 사용 엔드포인트 (6개)

| 엔드포인트 | 용도 | data_type | 우선순위 |
|------------|------|-----------|----------|
| **webkr** | 한국 웹문서 | OFFICIAL | 1순위 (OFFICIAL) |
| **doc** | 전문자료 | OFFICIAL | 2순위 |
| **encyc** | 백과사전 | OFFICIAL | 3순위 |
| **news** | 뉴스 | PUBLIC | 1순위 (PUBLIC) |
| **blog** | 블로그 | PUBLIC | 2순위 |
| **cafearticle** | 카페 | PUBLIC | 3순위 |
| **kin** | 지식iN | PUBLIC | 4순위 |

**OFFICIAL 수집 흐름:**
```
webkr 검색 (site:go.kr 필터)
  → 결과 부족하면 doc 검색
  → 여전히 부족하면 encyc 검색
  → 10개 확보 시 종료
```

**PUBLIC 수집 흐름:**
```
news 검색 (.go.kr 제외)
  → 결과 부족하면 blog 검색
  → 여전히 부족하면 cafearticle, kin 검색
  → 40개 확보 시 종료
```

### 4.2 API 호출 파라미터

**실제 구현 (collect_naver_v40_final.py:843-848):**
```python
params = {
    'query': query,           # 검색어 (정치인명 + 키워드 + 센티멘트)
    'display': 100,           # 결과 개수 (최대 100)
    'start': 1,               # 시작 위치
    'sort': 'date'            # 최신순 정렬
}
```

**검색어 생성 로직 (실제 코드):**
```python
# collect_naver_v40_final.py:799-806
query_variants = [
    f'"{actual_name}" {keywords}',                              # 정확한 이름 매칭
    f'{actual_name} {" ".join(id_keywords)} {keywords}',       # 이름+당명+직책+키워드
    f'"{actual_name} 의원" {keywords}',                         # "조은희 의원" + 키워드
    f'{actual_name} {keywords} 국회',                           # 이름+키워드+국회
    f'{actual_name} {keywords} 정책',                           # 이름+키워드+정책
]
query = random.choice(query_variants)

# Sentiment 키워드 추가 (collect_naver_v40_final.py:809-815)
if topic_mode == 'negative':
    query += random.choice([" 논란", " 의혹", " 비판", " 문제", " 지적"])
elif topic_mode == 'positive':
    query += random.choice([" 성과", " 업적", " 추진", " 발의", " 통과"])

# OFFICIAL은 site 필터 추가 (collect_naver_v40_final.py:818-819)
if data_type == 'official':
    query += " site:go.kr"
```

### 4.3 응답 처리

**API 응답 구조:**
```json
{
  "items": [
    {
      "title": "<b>조은희</b> 의원, 교육 예산 증액 법안 발의",
      "link": "https://assembly.go.kr/...",
      "description": "국회의원 <b>조은희</b>는 교육 예산 증액을...",
      "postdate": "20240115"
    }
  ]
}
```

**처리 로직 (collect_naver_v40_final.py:862-904):**
```python
for item in items:
    # 1. HTML 태그 제거
    title = strip_html_tags(item.get('title', ''))
    description = strip_html_tags(item.get('description', ''))
    link = item.get('link', '')
    postdate = item.get('postdate', '')  # yyyyMMdd

    # 2. URL 중복 체크 (normalize_url 사용)
    url_norm = normalize_url(link)
    if url_norm in local_seen:
        continue
    local_seen.add(url_norm)

    # 3. 관련성 필터: 정치인 이름이 제목/설명에 있어야 함
    if actual_name not in title and actual_name not in description:
        continue

    # 4. 무의미 문서 제외 (.xlsx, .pdf, .hwp 등)
    skip_extensions = ['.xlsx', '.xls', '.csv', '.hwp', '.pdf', '.zip']
    if any(link.lower().endswith(ext) for ext in skip_extensions):
        continue

    # 5. 날짜 정규화 (yyyyMMdd → yyyy-MM-dd)
    date_normalized = normalize_date(postdate) if postdate else None

    # 6. 항목 저장
    collected_item = {
        'title': title,
        'content': description,
        'source': endpoint_key.upper(),  # NEWS, BLOG, WEBKR 등
        'source_url': link,
        'date': date_normalized or ''
    }
    all_items.append(collected_item)
```

---

## 5. 데이터 타입별 수집 전략

### 5.1 OFFICIAL 수집 (10개)

**대상 도메인 (.go.kr):**
- `assembly.go.kr` - 국회
- `korea.kr` - 정부24
- `moleg.go.kr` - 법제처
- `mois.go.kr` - 행정안전부
- 기타 정부/공공기관 .go.kr

**수집 내용:**
- 법안 발의 기록
- 국정감사 질의
- 위원회 활동 보고
- 정부/국회 공식 성명
- 공공기관 보도자료

**센티멘트 배분:**
- negative 1개: 국정감사 질타, 법안 반대 논란, 윤리위 징계 등
- positive 1개: 법안 통과, 정책 성과, 표창 등
- free 8개: 일반 법안 발의, 위원회 참석, 중립적 활동

**기간 제한:**
- **최근 4년 이내** (OFFICIAL 기준)

### 5.2 PUBLIC 수집 (40개)

**대상 소스:**
- 뉴스 (news API): 언론사 기사, 인터뷰
- 블로그 (blog API): 정치 블로그, 시민 의견
- 카페 (cafearticle API): 정치 카페 게시물
- 지식iN (kin API): 정치 관련 Q&A
- 웹문서 (webkr API): 위키, 커뮤니티
- 백과사전 (encyc API): 나무위키, 위키백과

**수집 내용:**
- 뉴스 보도 (논평, 분석, 인터뷰)
- 블로그 의견 (지지, 비판, 분석)
- 커뮤니티 토론
- 시민 평가

**센티멘트 배분:**
- negative 8개: 비판 기사, 논란 보도, 커뮤니티 비판글
- positive 8개: 긍정 보도, 지지글, 성과 분석
- free 24개: 중립적 뉴스, 사실 전달, 일반 활동 소개

**기간 제한:**
- **최근 2년 이내** (PUBLIC 기준)

**소스 다양성:**
- 같은 소스 반복 수집 금지
- 예시: 뉴스 15개 → 블로그 10개 → 카페 8개 → 웹문서 5개 → 백과 2개

---

## 6. 중복 방지 전략

### 6.1 URL 중복 체크

**normalize_url() 사용 (duplicate_check_utils.py):**
```python
from duplicate_check_utils import normalize_url

# URL 정규화 (파라미터, 앵커 제거)
url_norm = normalize_url(link)
# 예: https://news.com/art?id=123#comment → https://news.com/art

if url_norm in local_seen:
    continue  # 중복 제외
local_seen.add(url_norm)
```

**중복 판단 기준:**
- 같은 AI가 같은 URL 수집 → 중복 제거
- 다른 AI가 같은 URL 수집 → 모두 유지 (자연 가중치)

### 6.2 엔드포인트 간 중복 방지

```python
# collect_naver_v40_final.py:832-833
local_seen = set(exclude_urls) if exclude_urls else set()

# news API에서 수집한 URL은 blog API에서 제외됨
```

---

## 7. 관련성 및 품질 필터

### 7.1 관련성 필터 (필수)

**정치인 이름 확인 (collect_naver_v40_final.py:884-886):**
```python
name_in_text = actual_name in title or actual_name in description
if not name_in_text:
    continue  # 이름 없으면 제외
```

**동명이인 구분 (collect_naver_v40_final.py:780-795):**
```python
# 정치인명에서 당명, 직책 추출
# 예: "국민의힘 조은희 국회의원 (양천을)"
#     → actual_name: "조은희"
#     → id_keywords: ["국민의힘", "국회의원"]
```

### 7.2 무의미 문서 제외

**파일 다운로드 페이지 제외 (collect_naver_v40_final.py:889-891):**
```python
skip_extensions = ['.xlsx', '.xls', '.csv', '.hwp', '.pdf', '.zip']
if any(link.lower().endswith(ext) for ext in skip_extensions):
    continue
```

### 7.3 기간 제한

**날짜 정규화 (collect_naver_v40_final.py:894):**
```python
# Naver API postdate: "20240115" (yyyyMMdd)
# → normalize_date() → "2024-01-15" (yyyy-MM-dd)

date_normalized = normalize_date(postdate) if postdate else None
```

**검증 단계에서 확인:**
- `validate_v40_fixed.py`가 기간 제한 위반 자동 탐지
- OFFICIAL: 4년 초과 → 삭제 후 재수집
- PUBLIC: 2년 초과 → 삭제 후 재수집

---

## 8. 실행 예시

### 8.1 기본 실행

```bash
python collect_naver_v40_final.py \
  --politician_id=d0a5d6e1 \
  --politician_name="조은희"
```

**출력 예시:**
```
[Naver] API 호출 중... (data_type: official, topic_mode: negative)
  검색어: "조은희" 국회의원 전문성 논란 site:go.kr...
  [Naver] webkr: 15개 결과
  [Naver] 수집 완료: 10/10 (official)

[Naver] API 호출 중... (data_type: public, topic_mode: negative)
  검색어: 조은희 국민의힘 의원 전문성 비판...
  [Naver] news: 25개 결과
  [Naver] blog: 18개 결과
  [Naver] 수집 완료: 40/40 (public)

✅ expertise 카테고리 완료: 50개 (OFFICIAL 10 + PUBLIC 40)
```

### 8.2 병렬 실행

```bash
python collect_naver_v40_final.py \
  --politician_id=d0a5d6e1 \
  --politician_name="조은희" \
  --parallel
```

**효과:**
- 10개 카테고리 병렬 처리
- 소요 시간: 순차 30분 → 병렬 8분

### 8.3 재수집 (부족분만)

```bash
# 자동으로 부족한 카테고리만 재수집
python collect_naver_v40_final.py \
  --politician_id=d0a5d6e1 \
  --politician_name="조은희" \
  --ai=Naver
```

**동작:**
- collected_data_v40 테이블에서 기존 수집 개수 확인
- 100개 미만 카테고리만 추가 수집
- 버퍼 20% 범위 내 (최대 120개)

---

## 9. 트러블슈팅

### 9.1 API 인증 오류

**증상:**
```
[Naver] API 에러: 401
```

**원인:**
- `.env` 파일에 Client ID/Secret 누락 또는 오타
- API 키 비활성화

**해결:**
```bash
# 1. .env 파일 확인
cat .env | grep NAVER

# 2. API 키 재확인 (Naver Developers)
# 3. .env 파일 수정 후 재실행
```

### 9.2 검색 결과 부족

**증상:**
```
[Naver] 수집 완료: 3/10 (official)
```

**원인:**
- 검색어 조합이 너무 구체적
- .go.kr 도메인에 자료 부족

**해결:**
```python
# collect_naver_v40_final.py가 자동으로:
# 1. 다양한 검색어 조합 시도 (query_variants)
# 2. 여러 엔드포인트 순차 시도 (webkr → doc → encyc)
# 3. 센티멘트 키워드 무작위 변경
```

**수동 재수집:**
```bash
python collect_naver_v40_final.py \
  --politician_id={ID} \
  --politician_name="{이름}" \
  --ai=Naver \
  --category=1
```

### 9.3 Quota 초과

**증상:**
```
[Naver] API 에러: 429
```

**원인:**
- 일일 25,000 requests 초과
- 초당 10 requests 초과

**해결:**
```bash
# 1. Quota 확인 (Naver Developers)
# 2. 다음 날 재시도
# 3. 또는 병렬 실행 중단 (--parallel 제거)

python collect_naver_v40_final.py \
  --politician_id={ID} \
  --politician_name="{이름}" \
  --ai=Naver
# (병렬 없이 순차 실행 → API 호출 간격 확보)
```

### 9.4 중복 데이터 발생

**증상:**
- DB에 같은 URL이 2개 이상 저장됨

**원인:**
- 엔드포인트 간 중복 방지 로직 미작동

**해결:**
```bash
# validate_v40_fixed.py 실행 (중복 자동 제거)
cd 설계문서_V7.0/V40/scripts/core
python validate_v40_fixed.py \
  --politician_id={ID} \
  --no-dry-run
```

---

## 10. 성능 및 비용

### 10.1 수집 성능

| 지표 | Naver API |
|------|-----------|
| 카테고리당 소요 시간 | 30-45초 |
| 전체 10개 카테고리 (순차) | 5-8분 |
| 전체 10개 카테고리 (병렬) | 2-3분 |
| 정치인 1명 전체 수집 | 5-8분 |

### 10.2 API 비용

| 항목 | 비용 |
|------|------|
| Naver Search API | **무료** |
| 일일 Quota | 25,000 requests |
| 정치인 1명당 API calls | 약 50-60 calls |
| 처리 가능 정치인 수/일 | **약 400명** |

**V40 전체 비용 (Gemini + Naver):**
```
Gemini CLI Subprocess: $0 (Google AI Pro 구독 시)
Naver Search API:      $0 (무료 Quota)
─────────────────────────
총 수집 비용:           $0
```

---

## 11. 참고 문서

### 11.1 내부 문서
- `V40_기본방침.md` - V40 핵심 규칙 (수집 배분, 등급 체계)
- `V40_전체_프로세스_가이드.md` - 7단계 프로세스
- `TERMINOLOGY.md` - 공식 용어 정의
- `instructions/2_collect/prompts/naver_official.md` - OFFICIAL 템플릿
- `instructions/2_collect/prompts/naver_public.md` - PUBLIC 템플릿
- `instructions/2_collect/cat01~10_*.md` - 카테고리별 수집 기준

### 11.2 관련 스크립트
```
0-3_AI_Evaluation_Engine/
├── collect_naver_v40_final.py                           # Naver 수집 메인 스크립트
├── duplicate_check_utils.py                  # 중복 체크 유틸
└── 설계문서_V7.0/V40/
    ├── scripts/
    │   └── core/
    │       └── validate_v40_fixed.py        # 수집 검증 및 재수집
    └── instructions/
        └── 2_collect/
            ├── prompts/
            │   ├── naver_official.md
            │   └── naver_public.md
            └── cat01_expertise.md ~ cat10_publicinterest.md
```

### 11.3 공식 문서
- [Naver Developers](https://developers.naver.com) - API 발급 및 관리
- [Naver Search API 가이드](https://developers.naver.com/docs/serviceapi/search/) - 공식 API 문서

---

## 핵심 요약

### 3줄 요약

1. **Naver Search API = 무료 + 한국어 최적화**
2. **6개 엔드포인트 활용 (news, blog, cafearticle, kin, webkr, doc, encyc)**
3. **50개/카테고리 (OFFICIAL 10 + PUBLIC 40) = 10분 내 완료**

### 즉시 실행 가능한 명령

**정치인 1명 전체 수집:**
```bash
cd C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine

python collect_naver_v40_final.py \
  --politician_id={POLITICIAN_ID} \
  --politician_name="{POLITICIAN_NAME}" \
  --ai=Naver
```

### 최종 메시지

> **"Naver Search API = 무료 + 안정적 + 한국어 최적화!"**
>
> Client ID/Secret만 설정하면 즉시 수집 가능
> → 일일 25,000 requests (약 400명 처리 가능)

---

**작성**: Claude Code AI Agent
**최종 업데이트**: 2026-02-12
**버전**: V40

**실제 구현 기준**: `collect_naver_v40_final.py` (2026-02-01 버전)
