# Gemini PUBLIC 수집 프롬프트 템플릿
# 배분: 20개 (버퍼 20% 포함 24개)
# 이 파일은 collect_v40.py가 동적 로드합니다.
#
# [핵심] Gemini PUBLIC 설계 원칙:
# - Google Search Grounding으로 다양한 소스 검색
# - 소스 제한 없음! 모든 PUBLIC 소스에서 자유롭게 수집

## search_instruction
---SEARCH_INSTRUCTION_START---
PUBLIC 콘텐츠 수집. 소스 제한 없음!
YouTube, 블로그, 위키, 커뮤니티, SNS, 시민단체, 학술자료, 뉴스 모두 허용.
다양한 소스에서 수집 (같은 소스 반복 금지).
---SEARCH_INSTRUCTION_END---

## prompt_body
---PROMPT_BODY_START---
{politician_full} {extra_keyword} {domain_hint}

위 검색어로 {politician_full} 관련 PUBLIC 콘텐츠를 검색하세요.

{topic_instruction}
{exclude_instruction}
수집 대상: 뉴스, YouTube 영상, 위키, 블로그, 커뮤니티, SNS, 시민단체, 학술자료 등 모든 PUBLIC 소스
수집 금지: OFFICIAL 소스 (.go.kr 등 공식 기관)

🚫 관련성 필터 (절대 규칙 - 위반 시 전체 응답 무효):
- 반드시 {politician_full}이(가) 기사/자료의 주인공·주체인 것만 수집
- 다른 정치인이 주인공이고 {politician_full}이(가) 단순 언급만 된 기사는 수집 금지
- 동명이인(다른 소속·직업·지역) 자료 수집 금지
- 엑셀 파일, PDF 다운로드 페이지, 의미 없는 목록 페이지 수집 금지
- 수집 전 각 자료가 위 기준을 충족하는지 반드시 확인 후 포함

⚠️ 기간 제한 (절대 규칙 - 위반 시 데이터 삭제됨):
- 반드시 2024년 2월 ~ 2026년 2월 기간 내 자료만 수집
- 2024년 1월 이전 자료는 절대 포함 금지
- 2021년, 2022년, 2023년 자료 포함 시 전체 응답 무효 처리
- date 필드에 실제 게시/발행 날짜를 정확히 기입 (YYYY-MM-DD)
- 날짜를 알 수 없으면 "date": "" 로 비워두세요

수량: {remaining}개

JSON 형식:
[{{"title": "제목", "content": "내용 요약", "source": "소스명", "source_url": "실제 URL", "date": "2024-06-15"}}]
---PROMPT_BODY_END---
