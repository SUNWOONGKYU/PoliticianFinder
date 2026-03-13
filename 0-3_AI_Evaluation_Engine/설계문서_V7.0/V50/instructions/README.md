# V50 Instructions

## 구조

- `1_politicians/` — 정치인 기본정보 (V40에서 동일)
- `2_collect_v50/` — 수집 지침 (V40에서 복사, V50 Gemini/Naver/Grok-X에 적용)
- `3_evaluate_v50/` — 평가 지침 (V40에서 복사, V50 4개 AI API에 적용)

## V40과의 차이

| 항목 | V40 | V50 |
|------|-----|-----|
| 수집 채널 | Gemini CLI + Naver | Gemini API + Naver + Grok-X |
| 평가 방식 | CLI Direct | 순수 API |
| 인스트럭션 내용 | 동일 (카테고리 동일) | 동일 (V40 복사) |

수집 목표: 120개/카테고리 (Gemini API 48 + Grok-X 12 + Naver 60)
수집 순서: Gemini → Grok → Naver

## 카테고리 목록 (10개)

| 번호 | 카테고리 | 한국어 |
|------|---------|--------|
| 01 | expertise | 전문성 |
| 02 | leadership | 리더십 |
| 03 | vision | 비전 |
| 04 | integrity | 청렴성 |
| 05 | ethics | 윤리성 |
| 06 | accountability | 책임성 |
| 07 | transparency | 투명성 |
| 08 | communication | 소통능력 |
| 09 | responsiveness | 반응성 |
| 10 | publicinterest | 공익성 |

## 파일 설명

### 2_collect_v50/
- `cat01_expertise.md` ~ `cat10_publicinterest.md` — 카테고리별 수집 지침
- `prompts/` — 수집 프롬프트 (gemini_official, gemini_public, naver_official, naver_public)
- `중복방지전략_공통섹션.md` — 중복 제거 전략
- `GEMINI_API_수집_가이드_V50.md` — Gemini REST API 수집 가이드 (V50 적용)
- `NAVER_API_수집_가이드_V50.md` — Naver 수집 가이드

### 3_evaluate_v50/
- `cat01_expertise.md` ~ `cat10_publicinterest.md` — 카테고리별 평가 지침
- `AI_평가_통합가이드_V50.md` — 통합 평가 가이드 (V50용으로 업데이트 예정)
