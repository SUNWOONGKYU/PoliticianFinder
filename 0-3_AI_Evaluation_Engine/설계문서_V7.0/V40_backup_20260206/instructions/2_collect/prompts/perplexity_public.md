# Naver PUBLIC 수집 프롬프트 템플릿
# 배분: 40개 (버퍼 20% 포함 48개)
# 이 파일은 collect_v40.py가 동적 로드합니다.
#
# [핵심] Naver Search API 설계 원칙:
# 1. 카테고리별 분리 검색 (blog, news, cafearticle, kin, webkr, doc, encyc)
# 2. 소스 제한 없음 - 모든 PUBLIC 소스에서 자유롭게 수집
# 3. JSON 응답에서 title, link, description, postdate 추출

## search_instruction
---SEARCH_INSTRUCTION_START---
PUBLIC 데이터 수집. 뉴스, 블로그, 카페, 커뮤니티, 위키 등 모든 소스 허용.
다양한 소스에서 수집 (같은 소스 반복 금지).
소스 제한 없음! OFFICIAL(.go.kr) 소스만 제외.
---SEARCH_INSTRUCTION_END---

## prompt_body
---PROMPT_BODY_START---
{politician_full} {extra_keyword} 검색

{topic_instruction}
{exclude_instruction}

🚫 관련성 필터 (절대 규칙 - 위반 시 전체 응답 무효):
- 반드시 {politician_full}이(가) 기사/자료의 주인공·주체인 것만 수집
- 다른 정치인이 주인공이고 {politician_full}이(가) 단순 언급만 된 기사는 수집 금지
- 동명이인(다른 소속·직업·지역) 자료 수집 금지
- 엑셀 파일, PDF 다운로드 페이지, 의미 없는 목록 페이지 수집 금지
- 수집 전 각 자료가 위 기준을 충족하는지 반드시 확인 후 포함

수량: {remaining}개, 기간: 2024년~2026년
다양한 소스에서 수집. 소스 제한 없음.

JSON 형식으로만 응답:
[{{"title": "제목", "content": "내용 요약", "source": "소스명", "source_url": "실제 URL", "date": "2024-06-15"}}]
---PROMPT_BODY_END---
