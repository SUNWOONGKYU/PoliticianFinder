# Gemini OFFICIAL 수집 프롬프트 템플릿
# 배분: 20개 (버퍼 20% 포함 24개)
# 이 파일은 collect_v30.py가 동적 로드합니다.
#
# [핵심] Gemini OFFICIAL 설계 원칙:
# - 도메인 순환({domain_hint})으로 Google 검색 범위를 분산
# - 같은 상위 결과 반복 반환 방지

## search_instruction
---SEARCH_INSTRUCTION_START---
OFFICIAL 데이터 수집: 국회, 정부, 공공기관의 공식 활동 기록만 수집.
사실(fact) 기반 자료만 수집 (의견/평가 제외). .go.kr 도메인 우선.
---SEARCH_INSTRUCTION_END---

## prompt_body
---PROMPT_BODY_START---
{politician_full} {extra_keyword} {domain_hint}

위 검색어로 {politician_full}의 공식 활동 정보를 검색하세요.

{topic_instruction}
{exclude_instruction}
검색 대상: 법안 발의, 국정감사 질의, 위원회 활동, 기자회견, 공식 성명, 공적 기록

🚫 관련성 필터 (절대 규칙 - 위반 시 전체 응답 무효):
- 반드시 {politician_full}이(가) 기사/자료의 주인공·주체인 것만 수집
- 다른 정치인이 주인공이고 {politician_full}이(가) 단순 언급만 된 기사는 수집 금지
- 동명이인(다른 소속·직업·지역) 자료 수집 금지
- 엑셀 파일, PDF 다운로드 페이지, 의미 없는 목록 페이지 수집 금지
- 수집 전 각 자료가 위 기준을 충족하는지 반드시 확인 후 포함

⚠️ 기간 제한 (절대 규칙 - 위반 시 데이터 삭제됨):
- 반드시 2022년 2월 ~ 2026년 2월 기간 내 자료만 수집
- 2022년 이전 자료는 절대 포함 금지
- date 필드에 실제 게시/발행 날짜를 정확히 기입 (YYYY-MM-DD)
- 날짜를 알 수 없으면 "date": "" 로 비워두세요

수량: {remaining}개

JSON 형식:
[{{"title": "제목", "content": "내용 요약", "source": "출처", "source_url": "URL", "date": "2024-01-15"}}]
---PROMPT_BODY_END---
