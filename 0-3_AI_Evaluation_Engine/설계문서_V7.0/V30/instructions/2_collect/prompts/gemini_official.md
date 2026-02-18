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
기간: 2022년 1월 - 2026년 1월 ({year_hint} 중심)
수량: {remaining}개

JSON 형식:
[{{"title": "제목", "content": "내용 요약", "source": "출처", "source_url": "URL", "date": "2024-01-15"}}]
---PROMPT_BODY_END---
