# Perplexity PUBLIC 수집 프롬프트 템플릿
# 배분: 20개 (버퍼 20% 포함 24개)
# 이 파일은 collect_v30.py가 동적 로드합니다.
#
# [핵심] Perplexity 프롬프트 설계 원칙:
# 1. 짧고 간결하게 (긴 지시 = 검색 실패)
# 2. "부정적 뉴스 찾아라" 금지 (안전 필터 충돌) → 검색 키워드 방식
# 3. 세부 항목 키워드(item_keywords)는 검색어가 아닌 참고 힌트로만 사용

## search_instruction
---SEARCH_INSTRUCTION_START---
뉴스/언론 기사만 수집. YouTube, 블로그, 위키, .go.kr 제외.
다양한 언론사에서 수집 (같은 언론사 반복 금지).
---SEARCH_INSTRUCTION_END---

## prompt_body
---PROMPT_BODY_START---
{politician_full} {extra_keyword} 뉴스 검색

{topic_instruction}
{exclude_instruction}
수량: {remaining}개, 기간: 2024년~2026년
다양한 언론사에서 수집. 뉴스 기사만.

JSON 형식으로만 응답:
[{{"title": "기사 제목", "content": "기사 내용 요약", "source": "언론사명", "source_url": "실제 기사 URL", "date": "2024-06-15"}}]
---PROMPT_BODY_END---
