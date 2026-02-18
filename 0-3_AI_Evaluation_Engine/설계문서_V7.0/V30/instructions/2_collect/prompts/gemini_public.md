# Gemini PUBLIC 수집 프롬프트 템플릿
# 배분: 10개 (버퍼 20% 포함 12개)
# 이 파일은 collect_v30.py가 동적 로드합니다.
#
# [핵심] Gemini PUBLIC 설계 원칙:
# - 도메인 순환({domain_hint})으로 YouTube/블로그/위키 분산 검색
# - 뉴스/언론은 Perplexity 담당이므로 수집 금지

## search_instruction
---SEARCH_INSTRUCTION_START---
비언론 콘텐츠만 수집 (뉴스/언론 기사 금지 - Perplexity 담당).
YouTube, 블로그, 위키, 커뮤니티, SNS, 시민단체, 학술자료에서 수집.
---SEARCH_INSTRUCTION_END---

## prompt_body
---PROMPT_BODY_START---
{politician_full} {extra_keyword} {domain_hint}

위 검색어로 {politician_full} 관련 비언론 콘텐츠를 검색하세요.

{topic_instruction}
{exclude_instruction}
수집 대상: YouTube 영상, 위키, 블로그, 커뮤니티, SNS, 시민단체, 학술자료
수집 금지: 뉴스/언론 기사 (조선일보, 중앙일보, KBS, MBC, 연합뉴스 등)
기간: 2024년 1월 - 2026년 1월
수량: {remaining}개

JSON 형식:
[{{"title": "제목", "content": "내용 요약", "source": "소스명", "source_url": "실제 URL", "date": "2024-06-15"}}]
---PROMPT_BODY_END---
