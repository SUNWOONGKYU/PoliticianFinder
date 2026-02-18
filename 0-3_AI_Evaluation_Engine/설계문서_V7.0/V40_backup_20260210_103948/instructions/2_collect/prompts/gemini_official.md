# Gemini OFFICIAL 수집 프롬프트 템플릿
# 배분: 30개 (버퍼 20% 포함 36개)
# 센티멘트: negative 3개 / positive 3개 / free 24개
# 이 파일은 collect_v40.py 또는 오케스트레이션 에이전트가 로드합니다.
#
# [플레이스홀더 목록]
# {politician_full}: 정치인 풀네임 (이름 + 정당 + 직책 + 지역구)
# {politician_id}: 정치인 ID (8자리 hex)
# {category}: 카테고리 영문명 (예: expertise)
# {category_kr}: 카테고리 한글명 (예: 전문성)
# {topic_instruction}: 카테고리별 수집 주제 (cat01~10에서 추출)
# {search_keywords}: 카테고리별 검색어 (cat01~10에서 추출)
# {extra_keyword}: 검색 다양화용 추가 키워드
# {domain_hint}: 도메인 힌트 (예: site:assembly.go.kr)
# {exclude_urls}: 이미 수집된 URL 목록 (중복 방지)
# {remaining}: 추가 필요 수량
# {date_limit}: 기간 제한 날짜 (예: 2022-02-09 이후)
#
# [핵심] Gemini OFFICIAL 설계 원칙:
# - 도메인 순환({domain_hint})으로 Google 검색 범위를 분산
# - 같은 상위 결과 반복 반환 방지
# - Google Search Grounding 활용 (수동 Gemini CLI 사용)

---

## search_instruction
---SEARCH_INSTRUCTION_START---
OFFICIAL 데이터 수집: 국회, 정부, 공공기관의 공식 활동 기록만 수집.
사실(fact) 기반 자료만 수집 (의견/평가 제외). .go.kr 도메인 우선.
---SEARCH_INSTRUCTION_END---

## prompt_body
---PROMPT_BODY_START---
{politician_full} {category_kr} {extra_keyword} {domain_hint}

위 검색어로 {politician_full}의 {category_kr} 관련 공식 활동 정보를 검색하세요.

## 수집 주제
{topic_instruction}

## 검색 키워드 (참고용)
{search_keywords}

## 이미 수집된 URL (중복 수집 금지)
{exclude_urls}

## 수집 대상
- 법안 발의, 국정감사 질의, 위원회 활동 기록
- 정부/국회 공식 성명, 기자회견, 정책 발표
- 공공기관 공식 보도자료, 활동 보고서
- .go.kr 도메인 우선 (assembly.go.kr, korea.kr, moleg.go.kr 등)

## 수집 금지
- PUBLIC 소스 (뉴스, 블로그, 커뮤니티, SNS 등)
- 의견/평가/분석 중심 콘텐츠
- 동명이인, 다른 정치인의 자료

## 센티멘트 배분 (정확한 수량 필수)
총 {remaining}개 수집 시 다음 배분을 따르세요:
- **negative 3개**: 논란, 비판, 실책, 반대 여론이 포함된 공식 기록
- **positive 3개**: 성과, 수상, 긍정 평가가 포함된 공식 기록
- **free 24개**: 센티멘트 제한 없이 자유롭게 수집 (사실 중심, 중립적 기록 포함)

### 센티멘트 정의
- **negative**: 논란, 비판, 실책, 반대 입장, 부정적 여론이 주요 내용인 자료
  (예: 국정감사 질타, 법안 반대 논란, 공약 미이행 지적, 윤리위 징계 등)
- **positive**: 성과, 수상, 긍정 평가, 법안 통과, 표창이 주요 내용인 자료
  (예: 법안 대표발의 통과, 정책 성과 발표, 유공 표창, 위원회 활약 등)
- **free**: 센티멘트 제한 없음, 사실 중심 자료 자유롭게 수집
  (예: 일반 법안 발의, 위원회 참석 기록, 일반 질의, 중립적 활동 보고)

🚫 관련성 필터 (절대 규칙 - 위반 시 전체 응답 무효):
- 반드시 {politician_full}이(가) 기사/자료의 **주인공·주체**인 것만 수집
- 다른 정치인이 주인공이고 {politician_full}이(가) 단순 언급만 된 기사는 **수집 금지**
- 동명이인(다른 소속·직업·지역) 자료 **수집 금지**
- 엑셀 파일, PDF 다운로드 페이지, 의미 없는 목록 페이지 **수집 금지**
- 수집 전 각 자료가 위 기준을 충족하는지 **반드시 확인** 후 포함

⚠️ 기간 제한 (절대 규칙 - 위반 시 데이터 삭제됨):
- 수집일 기준 **최근 4년 이내** 자료만 수집
- {date_limit} 자료만 수집 가능
- 4년 이전 자료는 **절대 포함 금지**
- data_date 필드에 실제 게시/발행 날짜를 **정확히 기입** (YYYY-MM-DD)
- 날짜를 알 수 없으면 "data_date": "" 로 비워두세요 (추정 금지)

🚫 URL 조작 금지 (절대 규칙):
- **실제로 존재하고 접근 가능한 URL만** 제공
- URL 조작, 변조, 추정, 임의 생성 **절대 금지**
- 검색 결과에서 확인된 실제 URL만 사용
- URL이 불확실하면 해당 항목을 **수집하지 마세요**

## 출력 형식 (JSON만 응답)

**중요**: politician_id, politician_name, category 필드는 JSON에 포함하지 마세요.
이 필드들은 헬퍼 함수가 저장 시 자동으로 추가합니다.

```json
{{{{
  "collector_ai": "gemini",
  "data_type": "official",
  "items": [
    {{{{
      "item_num": 1,
      "data_title": "법안 제목 또는 활동 제목",
      "data_content": "법안 요지 또는 활동 내용 요약 (100자 이상)",
      "data_source": "국회 법제사법위원회",
      "source_url": "https://assembly.go.kr/...",
      "source_type": "OFFICIAL",
      "data_date": "2024-01-15",
      "sentiment": "free"
    }}}},
    {{{{
      "item_num": 2,
      "data_title": "국정감사 질의 제목",
      "data_content": "질의 내용 및 지적 사항 요약",
      "data_source": "국회 국정감사",
      "source_url": "https://assembly.go.kr/...",
      "source_type": "OFFICIAL",
      "data_date": "2023-10-12",
      "sentiment": "negative"
    }}}},
    {{{{
      "item_num": 3,
      "data_title": "법안 통과 관련 제목",
      "data_content": "법안 통과 과정 및 의의",
      "data_source": "국회사무처",
      "source_url": "https://assembly.go.kr/...",
      "source_type": "OFFICIAL",
      "data_date": "2024-06-20",
      "sentiment": "positive"
    }}}}
  ]
}}}}
```

### 필드 설명
- **item_num**: 순번 (1부터 시작)
- **data_title**: 제목 (명확하고 구체적으로)
- **data_content**: 내용 요약 (100자 이상, 구체적으로)
- **data_source**: 출처 기관명 (예: 국회, 법제사법위원회, 기획재정부)
- **source_url**: 실제 URL (조작 금지!)
- **source_type**: "OFFICIAL" 고정
- **data_date**: 날짜 YYYY-MM-DD (알 수 없으면 빈 문자열 "")
- **sentiment**: "negative" / "positive" / "free" 중 하나

## 최종 확인 사항
- [ ] {remaining}개 수집 (negative 3개 + positive 3개 + free 24개)
- [ ] 모든 URL이 실제 존재하고 접근 가능한가?
- [ ] {politician_full}이(가) 주인공인가? (단순 언급 X)
- [ ] 4년 이내 자료인가? ({date_limit} 이후)
- [ ] OFFICIAL 소스인가? (.go.kr 도메인 등)
- [ ] 동명이인 자료가 포함되지 않았는가?
- [ ] JSON 형식이 올바른가? (politician_id, politician_name, category 제외)
---PROMPT_BODY_END---
