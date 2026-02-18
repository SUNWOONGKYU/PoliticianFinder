# Gemini PUBLIC 수집 프롬프트 템플릿
# 배분: 20개 (버퍼 20% 포함 24개)
# 센티멘트: negative 4개 / positive 4개 / free 12개
# 이 파일은 collect_gemini_subprocess.py 또는 오케스트레이션 에이전트가 로드합니다.
#
# [플레이스홀더 목록]
# {politician_full}: 정치인 풀네임 (이름 + 정당 + 직책 + 지역구)
# {politician_id}: 정치인 ID (8자리 hex)
# {category}: 카테고리 영문명 (예: expertise)
# {category_kr}: 카테고리 한글명 (예: 전문성)
# {topic_instruction}: 카테고리별 수집 주제 (cat01~10에서 추출)
# {search_keywords}: 카테고리별 검색어 (cat01~10에서 추출)
# {extra_keyword}: 검색 다양화용 추가 키워드
# {domain_hint}: 도메인 힌트 (PUBLIC에서는 사용 안 함, 빈 문자열)
# {exclude_urls}: 이미 수집된 URL 목록 (중복 방지)
# {remaining}: 추가 필요 수량
# {date_limit}: 기간 제한 날짜 (예: 2024-02-09 이후)
#
# [핵심] Gemini PUBLIC 설계 원칙:
# - Google Search Grounding 활용 (Gemini CLI Direct Subprocess 방식)
# - 소스 제한 없음! 모든 PUBLIC 소스에서 자유롭게 수집
# - 뉴스, 블로그, YouTube, 위키, 커뮤니티, SNS 등 모든 채널 활용

---

## search_instruction
---SEARCH_INSTRUCTION_START---
PUBLIC 콘텐츠 수집. 소스 제한 없음!
YouTube, 블로그, 위키, 커뮤니티, SNS, 시민단체, 학술자료, 뉴스 모두 허용.
다양한 소스에서 수집 (같은 소스 반복 금지).
---SEARCH_INSTRUCTION_END---

## prompt_body
---PROMPT_BODY_START---
{politician_full} {category_kr} {extra_keyword}

위 검색어로 {politician_full}의 {category_kr} 관련 PUBLIC 콘텐츠를 검색하세요.

## 수집 주제
{topic_instruction}

## 검색 키워드 (참고용)
{search_keywords}

## 이미 수집된 URL (중복 수집 금지)
{exclude_urls}

## 수집 대상 (모든 PUBLIC 소스 허용!)
- **뉴스**: 언론사 기사, 인터뷰, 보도자료
- **YouTube**: 정치 분석, 토론, 인터뷰 영상, 뉴스 클립
- **블로그**: 정치 블로그, 시민 의견, 분석글
- **위키**: 나무위키, 위키백과 등
- **커뮤니티**: 정치 커뮤니티, 토론 게시판
- **SNS**: 트위터/X, 페이스북, 인스타그램 공개 게시물
- **기타**: 시민단체 보고서, 학술 자료, 전문가 칼럼

## 수집 금지
- **OFFICIAL 소스**: .go.kr 도메인, 국회/정부 공식 자료
- **동명이인**: 다른 소속, 직업, 지역의 동명이인 자료
- **단순 언급**: 다른 정치인이 주인공인 자료

## 센티멘트 배분 (정확한 수량 필수)
총 {remaining}개 수집 시 다음 배분을 따르세요:
- **negative 4개**: 논란, 비판, 의혹, 반대 여론이 담긴 콘텐츠
- **positive 4개**: 성과, 칭찬, 지지, 긍정 평가가 담긴 콘텐츠
- **free 12개**: 센티멘트 제한 없이 자유롭게 수집 (중립적 보도, 사실 전달 등)

### 센티멘트 정의
- **negative**: 논란, 비판, 의혹, 실책, 반대 여론, 부정적 평가가 주요 내용
  (예: 언론의 비판 기사, 커뮤니티 비판글, 논란 관련 YouTube 영상, 실정 지적 등)
- **positive**: 성과, 칭찬, 지지, 긍정 평가, 업적이 주요 내용
  (예: 언론의 긍정 보도, 블로그 지지글, 성과 분석 YouTube, 시민단체 긍정 평가 등)
- **free**: 센티멘트 제한 없음, 사실 전달 중심 콘텐츠 자유롭게 수집
  (예: 중립적 뉴스 보도, 정책 설명, 일반 활동 소개, 인터뷰 등)

🚫 관련성 필터 (절대 규칙 - 위반 시 전체 응답 무효):
- 반드시 {politician_full}이(가) 콘텐츠의 **주인공·주제**인 것만 수집
- 다른 정치인이 주인공이고 {politician_full}이(가) 단순 언급만 된 경우 **수집 금지**
- 동명이인(다른 소속·직업·지역) 자료 **수집 금지**
- 엑셀 파일, PDF 다운로드 페이지, 의미 없는 목록 페이지 **수집 금지**
- 수집 전 각 자료가 위 기준을 충족하는지 **반드시 확인** 후 포함

⚠️ 기간 제한 (절대 규칙 - 위반 시 데이터 삭제됨):
- 수집일 기준 **최근 2년 이내** 자료만 수집
- {date_limit} 자료만 수집 가능
- 2년 이전 자료는 **절대 포함 금지**
- data_date 필드에 실제 게시/발행 날짜를 **정확히 기입** (YYYY-MM-DD)
- 날짜를 알 수 없으면 "data_date": "" 로 비워두세요 (추정 금지)

🚫 URL 조작 금지 (절대 규칙):
- **실제로 존재하고 접근 가능한 URL만** 제공
- URL 조작, 변조, 추정, 임의 생성 **절대 금지**
- 검색 결과에서 확인된 실제 URL만 사용
- URL이 불확실하면 해당 항목을 **수집하지 마세요**

## 소스 다양성 규칙
- 같은 소스(예: 같은 블로그, 같은 YouTube 채널)에서 **반복 수집 금지**
- 최대한 **다양한 소스**에서 수집 (뉴스 5개 → 블로그 3개 → YouTube 2개 등)
- 단, 뉴스는 다른 언론사면 다른 소스로 인정

## 출력 형식 (JSON만 응답)

**중요**: politician_id, politician_name, category 필드는 JSON에 포함하지 마세요.
이 필드들은 헬퍼 함수가 저장 시 자동으로 추가합니다.

```json
{{
  "collector_ai": "gemini",
  "data_type": "public",
  "items": [
    {{
      "item_num": 1,
      "data_title": "뉴스 기사 제목",
      "data_content": "기사 요약 (100자 이상)",
      "data_source": "한겨레",
      "source_url": "https://hani.co.kr/...",
      "source_type": "PUBLIC",
      "data_date": "2024-11-15",
      "sentiment": "free"
    }},
    {{
      "item_num": 2,
      "data_title": "YouTube 영상 제목",
      "data_content": "영상 내용 요약",
      "data_source": "YouTube - 정치분석채널",
      "source_url": "https://youtube.com/watch?v=...",
      "source_type": "PUBLIC",
      "data_date": "2024-09-20",
      "sentiment": "negative"
    }},
    {{
      "item_num": 3,
      "data_title": "블로그 포스트 제목",
      "data_content": "블로그 글 요약",
      "data_source": "네이버 블로그 - 정치관찰",
      "source_url": "https://blog.naver.com/...",
      "source_type": "PUBLIC",
      "data_date": "2025-01-10",
      "sentiment": "positive"
    }}
  ]
}}
```

### 필드 설명
- **item_num**: 순번 (1부터 시작)
- **data_title**: 제목 (명확하고 구체적으로)
- **data_content**: 내용 요약 (100자 이상, 구체적으로)
- **data_source**: 출처 (예: 한겨레, YouTube - 채널명, 네이버 블로그, 나무위키)
- **source_url**: 실제 URL (조작 금지!)
- **source_type**: "PUBLIC" 고정
- **data_date**: 날짜 YYYY-MM-DD (알 수 없으면 빈 문자열 "")
- **sentiment**: "negative" / "positive" / "free" 중 하나

## 최종 확인 사항
- [ ] {remaining}개 수집 (negative 4개 + positive 4개 + free 12개)
- [ ] 모든 URL이 실제 존재하고 접근 가능한가?
- [ ] {politician_full}이(가) 주인공인가? (단순 언급 X)
- [ ] 2년 이내 자료인가? ({date_limit} 이후)
- [ ] PUBLIC 소스인가? (OFFICIAL 소스 제외됨)
- [ ] 소스가 다양한가? (같은 소스 반복 X)
- [ ] 동명이인 자료가 포함되지 않았는가?
- [ ] JSON 형식이 올바른가? (politician_id, politician_name, category 제외)
---PROMPT_BODY_END---
