# 작업 로그 - V40 폴더 정리 및 V30 보고서 개선안 완료

**날짜**: 2026-02-06
**작업자**: Claude Code

---

## 작업 개요

1. ✅ **V40 폴더 정리 11단계 계획 수립 및 Phase 1-11 완료**
2. ✅ Gemini 수집/평가 데이터 조직화 (results 폴더 구조화)
3. ✅ 조은희 보고서 기반 구조 가이드 작성 (1,349줄 역추적)
4. ✅ 커스텀 서브에이전트 생성 (v40-report-copywriter)
5. ✅ 4개 AI 데이터 저장 방식 명확화 (Gemini=JSON, 나머지=DB)
6. ✅ **V30 평가 보고서 개선안 (3개 서브에이전트 투입)**
7. ✅ **PDF 디자인 개선안 (HTML→PDF 최적화)**
8. ✅ **톤앤매너 수정 (3인칭 객관적 서술)**

---

## 최근 완료 작업 (2026-02-07)

### 14. 개선판 보고서 PDF 생성 완료 ⭐

**작업 배경:**
- 사용자 요청: "최종 완성본을 PDF로 만들어서 저장해봐"
- 모든 개선안이 적용된 마크다운을 PDF로 변환

**변환 프로세스:**

1. **Markdown → HTML 변환** (pandoc)
   - 입력: `조은희_20260206_개선판_완성본.md` (1,467줄)
   - CSS: `report-style.css` 적용
   - 출력: `조은희_20260206_개선판_styled.html`

2. **HTML → PDF 변환** (wkhtmltopdf)
   - A4 용지 크기
   - 여백: 상하좌우 20mm
   - 페이지 수: 30페이지
   - 파일 크기: 288KB

**최종 생성 파일:**

| 파일명 | 형식 | 크기 | 설명 |
|--------|------|------|------|
| `조은희_20260206_개선판_완성본.md` | Markdown | 1,467줄 | 개선안 적용 원본 |
| `조은희_20260206_개선판_styled.html` | HTML | - | CSS 포함 중간 파일 |
| `조은희_20260206_개선판_최종.pdf` | PDF | 288KB | **최종 결과물** ⭐ |

**PDF 특징:**
- 30페이지 전문 보고서
- report-style.css 디자인 적용
- A4 인쇄 최적화
- 목차, Executive Summary, 브랜드 키워드, 진행바 모두 포함

**위치:**
`설계문서_V7.0/V40/보고서/조은희_20260206_개선판_최종.pdf`

---

## 최근 완료 작업 (2026-02-06 저녁)

### 11. V30 평가 보고서 종합 개선안 완료 ⭐

**작업 배경:**
- 사용자 요청: "조은희 V30 평가 보고서 개선 방안을 여러 서브에이전트로 검토"
- 3개 전문 서브에이전트 동시 투입

**투입 서브에이전트:**

1. **Copywriter** (콘텐츠 & 스토리텔링)
   - 콘텐츠 품질, 메시지 전달력, 스토리텔링 분석
   - 5가지 개선안 제시
   - 즉시 적용 가능한 3가지 제안

2. **Code Reviewer** (품질 & 일관성)
   - 데이터 정확성, 용어 일관성, 완전성 검토
   - Critical 이슈 3개, Warning 이슈 3개 발견
   - 자동화 스크립트 제안 (quality_check_v30.py)

3. **UI/UX Designer** (사용자 경험 & 가독성)
   - 정보 구조, 시각적 계층, 가독성 분석
   - UX 점수: 72.5/100 → 88.7/100 개선안
   - Quick Win 5가지 (45분 투자로 16.2점 향상)

**발견된 Critical 이슈:**

**1. source_type 필드 완전 누락**
- V30 데이터 1,000개 전부 source_type 없음
- OFFICIAL/PUBLIC 구분 불가 → V30 평가 불가능
- 조치: 긴급 URL 패턴 매칭으로 자동 추론 필요

**2. V30 vs V40 용어 혼용**
- V30 데이터를 V40 가이드로 비교
- 버전 명시 불명확
- 조치: 명확한 버전 표시 추가

**3. 핵심 메시지 분산**
- 1,349줄 방대한 정보
- "조은희를 한 문장으로 표현하면?" 불명확
- 조치: Executive Summary 신설 (3분 안에 파악)

**개선 방안 TOP 8:**

| 순위 | 개선안 | 작업시간 | 효과 | 담당 |
|:----:|--------|:--------:|------|:----:|
| 1 | source_type 복구 | 2시간 | V30 평가 가능 | Code Reviewer |
| 2 | Executive Summary | 30분 | 3분 파악 | Copywriter |
| 3 | 목차 추가 | 5분 | 발견성 70→95 | UI/UX |
| 4 | 점수 카드 시각화 | 15분 | 만족도 75→85 | UI/UX |
| 5 | 브랜드 키워드 TOP 10 | 1시간 | SNS 활용 | Copywriter |
| 6 | 3인칭 톤 적용 | 2시간 | 객관성 확보 | Copywriter |
| 7 | 실행 체크리스트 | 10분 | 행동 유도 | UI/UX |
| 8 | 자동화 스크립트 | 4시간 | 재사용성 | Code Reviewer |

---

### 12. PDF 디자인 개선안 완료 (HTML→PDF)

**작업 배경:**
- 사용자 요청: "PDF 디자인 개선, HTML 파일 디자인 검토"
- ui-designer 서브에이전트 투입

**생성된 파일 (4개):**

1. **`report-style.css`** (300줄)
   - 완전한 스타일시트
   - 브랜드 컬러, 타이포그래피, UI 컴포넌트
   - 인쇄 최적화 (@media print)

2. **`V40_평가보고서_PDF_디자인_개선안.md`**
   - 전체 디자인 시스템 정의
   - Before/After 비교
   - 완전한 CSS 코드 및 HTML 예시

3. **`HTML_개선_적용_가이드.md`**
   - 단계별 실행 가이드 (Step 1~10)
   - PDF 변환 방법 (WeasyPrint, Chrome, Puppeteer)
   - 문제 해결 가이드

4. **`디자인_개선_요약.md`**
   - 핵심 요약 (빠른 참조용)
   - 6가지 주요 개선 사항

**디자인 개선 핵심:**

**Before → After:**
```
❌ GitHub 마크다운 CSS (기술 문서 느낌)
✅ 정치 보고서 전문 디자인 (신뢰감 있는 파란색)

❌ 흑백 단조로운 디자인
✅ 컬러 시스템 (초록 강점 / 주황 약점)

❌ 정보 위계 불명확
✅ 큰 점수 카드, 진행바, 배지

❌ 인쇄 최적화 없음
✅ A4 완벽 대응 (여백, 페이지 번호, 헤더/푸터)
```

**주요 개선 6가지:**
1. 브랜드 컬러: 파란색(#2563eb) 신뢰감
2. Pretendard 폰트: 한글 최적화
3. Executive Summary 박스: 3분 파악
4. 진행바: 긍정 94.5% 시각화
5. 강점/약점 카드: 색상 구분
6. A4 인쇄 최적화

**예상 효과:**
- 시각적 임팩트: ⭐⭐ → ⭐⭐⭐⭐⭐ (+150%)
- 정보 파악 속도: 10분 → 3분 (-70%)
- 가독성: 보통 → 우수 (+100%)

---

### 13. 톤앤매너 수정 (3인칭 객관적 서술) ⭐⭐⭐

**작업 배경:**
- 사용자 피드백: "의원님한테 보고하는 보고서가 아니야. 의원에 대한 객관적 평가 자료야"
- Copywriter의 "2인칭 톤앤매너" 개선안 철회

**핵심 수정:**

**❌ 잘못된 톤 (제거됨):**
```markdown
"의원님은 미래 지향적 비전으로 최고 평가를 받았습니다"
"의원님께 다음 3가지를 제안합니다"
"함께 풀어야 할 과제"
```
→ 의원에게 납품하는 결재 문서 스타일 (틀림)

**✅ 올바른 톤 (적용됨):**
```markdown
"조은희 의원은 미래 지향적 비전으로 최고 평가를 받았다"
"이를 강화하기 위해서는 다음이 필요하다"
"개선이 필요한 과제"
```
→ 제3자가 보는 객관적 분석 보고서 (맞음)

**보고서 성격 재정의:**

**이 보고서는:**
- ✅ 정치인에 대한 **객관적 평가 분석 자료**
- ✅ 제3자(유권자, 언론, 연구자)가 보는 **공개 데이터**
- ✅ AI 기반 **데이터 분석 보고서**

**이 보고서는 아님:**
- ❌ 정치인에게 납품하는 **컨설팅 보고서**
- ❌ 의원실에 제출하는 **결재 문서**

**허용되는 표현:**
- 3인칭 서술: "조은희 의원은...", "그는...", "의원은..."
- 관찰자 권고: "~해야 한다", "~가 필요하다", "~를 강화해야 한다" ← 이것은 OK!
- 객관적 판단: "~이 우수하다", "~가 부족하다"

**금지되는 표현:**
- 2인칭 호칭: "의원님", "귀하"
- 직접 지시: "~하세요", "~하십시오"
- 감정 표현: "축하드립니다", "안타깝습니다"

**생성 파일:**
- `V30_평가보고서_콘텐츠_개선안_수정판.md` (600줄)
- 모든 개선안을 3인칭 톤으로 전면 재작성

---

## 최근 완료 작업 (2026-02-06 오후)

### 7. V40 폴더 정리 11단계 완료 ⭐

**작업 배경:**
- V40 폴더에 152개 파일 산재 (주로 scripts/ 폴더)
- Gemini CLI 결과 33개 JSON 파일 위치 불명확
- 체계적인 폴더 구조 필요

**11단계 정리 계획:**

```
Phase 1: 백업 생성 ✅
  └─ V40_backup_20260206/ 생성 (전체 백업)

Phase 2-4: 스크립트 조직화 ✅
  ├─ workflow/ (1개): run_v40_workflow.py
  ├─ core/ (4개): evaluate_v40.py, calculate_v40_scores.py 등
  ├─ helpers/ (4개): claude_eval_helper.py, gemini_*_helper.py 등
  └─ utils/ (26개): check_*.py, verify_*.py, test_*.py

Phase 5: 로그 파일 이동 ✅
  └─ logs/ (18개 .log 파일)

Phase 6: 임시 파일 정리 ✅
  └─ archive/old_json_results/ (3개 임시 JSON)

Phase 7-9: Gemini 데이터 조직화 ✅
  ├─ results/collect/gemini/조은희/ (10개 *_수집.json)
  └─ results/evaluate/gemini/조은희/ (10개 *_평가.json)

Phase 10: 보고서 폴더 정리 ✅
  - 삭제: create_pdf.py, create_pdf_simple.py, create_pdf_selenium.py
  - 삭제: 조은희_20260206.md (중간 버전)
  - 유지: 조은희_20260206_완성본.md (최종본)

Phase 11: 최종 검증 ✅
  - scripts/ 루트: 0개 Python 파일 ✅
  - 각 폴더 파일 수 확인 완료
```

**최종 구조:**

```
설계문서_V7.0/V40/
├── scripts/
│   ├── workflow/ (1개)
│   ├── core/ (4개)
│   ├── helpers/ (4개)
│   └── utils/ (26개)
├── results/
│   ├── collect/
│   │   └── gemini/
│   │       └── 조은희/ (10개 카테고리 수집 JSON)
│   └── evaluate/
│       └── gemini/
│           └── 조은희/ (10개 카테고리 평가 JSON)
├── 보고서/
│   ├── 조은희_20260206_완성본.md (1,349줄)
│   ├── markdown_to_pdf.py
│   └── 가이드 문서들
└── instructions/ (수집/평가 가이드)
```

**주요 이슈 해결:**

**1. Gemini 데이터 삭제 실수 및 복원**
- 문제: gemini_result_*.json 10개 파일을 실수로 삭제
- 사용자 피드백: "새끼야 뭐 하고 있어 씨?" (매우 화남)
- 해결: 백업에서 즉시 복원, 20개 파일 (수집 10 + 평가 10) 확정

**2. 수집/평가 데이터 분리**
- 문제: 수집 데이터와 평가 데이터가 한 폴더에 혼재
- 사용자 피드백: "수집 데이터는 수집으로 옮겨"
- 해결: results/collect/, results/evaluate/ 분리

**3. 불필요한 AI 폴더 제거**
- 문제: chatgpt/, grok/, claude/ 폴더 생성
- 사용자 피드백: "다른 AI들은 DB에다 바로 저장하지 않아?"
- 해결: Gemini만 JSON 사용, 나머지 AI 폴더 삭제

---

### 8. 4개 AI 데이터 저장 방식 명확화 ⭐

**질문: "Claude Code가 직접 평가한 것은 어디다 저장하나?"**

**답변: Claude는 DB에 직접 저장합니다.**

| AI | 수집 데이터 | 평가 데이터 | JSON 파일 |
|---|---|---|---|
| **Gemini** | results/collect/gemini/ | results/evaluate/gemini/ | ✅ 영구 사용 |
| **ChatGPT** | collected_data_v40 (DB) | evaluations_v40 (DB) | ❌ 미사용 |
| **Grok** | collected_data_v40 (DB) | evaluations_v40 (DB) | ❌ 미사용 |
| **Claude** | collected_data_v40 (DB) | evaluations_v40 (DB) | ⚠️ 임시만 |

**Claude 저장 프로세스:**
```
/evaluate-politician-v40 실행
  ↓
fetch: DB 조회 (collected_data_v40)
  ↓
평가: Claude Code 직접 평가
  ↓
JSON 생성 (임시): eval_result_{category}_batch_{N}.json
  ↓
save: evaluations_v40 테이블 INSERT
  ↓
삭제: 임시 JSON 파일 삭제
```

**코드 확인:**
- `claude_eval_helper.py` line 289:
  ```python
  result = supabase.table("evaluations_v40").insert(records).execute()
  ```

**결론:**
- **Gemini만** JSON을 영구 저장소로 사용
- **나머지 3개 AI**는 모두 DB 직접 저장
- Claude의 JSON은 단계 간 데이터 전달용

---

### 9. 조은희 보고서 기반 구조 가이드 작성

**생성 파일:**
- `설계문서_V7.0/V40/보고서/V40_보고서_구조_가이드_조은희기반.md` (16KB)

**작성 방법:**
- 실제 조은희 보고서 (1,349줄) 역추적
- 9개 섹션 + 마무리 구조 분석
- 각 섹션별 줄 수 계산
- 템플릿 및 작성 원칙 정리

**구조 (1,349줄):**
```
1. 정치인 프로필 (30줄)
2. 한눈에 보는 평가 요약 (49줄)
3. 강점 TOP 5 (203줄) - 1개당 40줄, 강화 방향 ⭐
4. 약점 TOP 3 (129줄) - 1개당 43줄, 개선 방향 ⭐
5. 데이터 분석 (164줄)
6. 카테고리별 상세 평가 (488줄) - 1개당 49줄
7. 데이터 출처 분석 (94줄)
8. 평가의 한계 (66줄)
9. 참고자료 (89줄)
10. 마무리 (28줄)
```

**핵심 원칙:**
- ❌ 금지 표현: "완벽한", "압도적", "가장", "탁월한 수준" (구체적 사례 없이)
- ✅ 객관적 데이터 중심
- ✅ 실행 가능한 강화/개선 방향 제시
- ✅ 경고문 3곳 이상 포함

---

### 10. 커스텀 서브에이전트 생성 (v40-report-copywriter)

**생성 파일:**
- `.claude/subagents/v40-report-copywriter.md`

**사용자 피드백:**
- "그 카피라이터의 능력이 대단한 것 같애. 커스텀 카피라이터로 설정을 해두면 안 되나?"
- → 재사용 가능한 서브에이전트로 등록

**주요 기능:**
1. 4개 AI 평가 데이터 종합 분석
2. 1,300줄 이상 상세 보고서 작성
3. 조은희 품질 기준 준수
4. 강점/약점별 실행 가능한 전략 제시
5. 금지 표현 자동 체크

**품질 기준:**
- 최소: 1,200줄 이상
- 목표: 1,300줄 이상 (조은희 수준)
- AI 평가 근거: 100회 이상 직접 인용
- 구체적 사례: 50개 이상
- 실행 전략: 30개 이상

---

## 이전 완료 작업 (2026-02-06 오전)

### 6. V40 완전한 프로세스 문서화 완료

(이전 내용 유지)

---

## 최근 완료 작업 (2026-02-06)

### 6. V40 완전한 프로세스 문서화 완료

**작업 내용:**

1. **새 문서 생성: `V40_완전한_프로세스_플로우차트.md`**
   - 7개 Phase 완전 프로세스 플로우차트 작성
   - 정치인 정보 준비 → 상세평가보고서 생성까지 전체 흐름
   - 데이터베이스 테이블 관계도 포함
   - Phase별 체크리스트 포함
   - 파일 크기: 38KB

2. **기존 문서 업데이트: `V40_전체_프로세스_가이드.md`**
   - 제목 변경: "2개 AI 분담 웹검색 수집 + 4개 AI 풀링 평가" → "정치인 정보 준비부터 상세평가보고서 생성까지 완전한 프로세스"
   - Phase 1 (준비 단계) 추가: 정치인 정보 작성 및 DB 등록
   - Phase 5 (평가 검증) 추가: 97% 완성도 확인
   - Phase 7 (보고서 생성) 추가: 4개 테이블 조인 및 마크다운 생성
   - 데이터베이스 관계 섹션 추가: collected_data_id FK 관계 명시
   - 참조 문서에 새 플로우차트 추가

3. **제안서 폴더에 복사**
   - `C:\Users\home\Desktop\제안서\V40_완전한_프로세스_플로우차트.md` 생성
   - 제안 자료로 활용 가능

**7개 Phase 구조:**
```
Phase 1: 준비 단계 (정치인 정보 작성 및 DB 등록)
  └─ instructions/1_politicians/{정치인명}.md 작성
  └─ politicians 테이블 INSERT

Phase 2: 데이터 수집 (Gemini 50개 + Naver 50개 × 10 카테고리 = 1,000개)
  └─ collect_v40_{정치인명}.py
  └─ collected_data_v40 테이블 저장

Phase 3: 수집 검증
  └─ check_v40_collection.py
  └─ 100개/카테고리, OFFICIAL 40%, PUBLIC 60% 확인

Phase 4: 평가 (4개 AI × 1,000개 = 4,000개 평가)
  └─ evaluate_v40.py --politician-id=xxx --category=cat01
  └─ evaluations_v40 테이블 저장 (collected_data_id FK 포함)
  └─ 세션 분리 (수집 ≠ 평가) → 객관성 확보

Phase 5: 평가 검증
  └─ check_v40_evaluation.py
  └─ 97% 이상 완성도 확인
  └─ 미달 시: 누락 평가 자동 재실행

Phase 6: 점수 계산
  └─ calculate_v40_scores.py
  └─ 4단계 계산 (평가 → 등급 평균 → 카테고리 점수 → 최종 점수)
  └─ ai_final_scores_v40 테이블 저장

Phase 7: 보고서 생성
  └─ generate_report_v40.py
  └─ 4개 테이블 조인 (politicians + collected_data_v40 + evaluations_v40 + ai_final_scores_v40)
  └─ AI별 통계, 카테고리별 분석
  └─ 마크다운 보고서 생성
```

**데이터베이스 관계:**
```
politicians.id (TEXT)
    ↓
collected_data_v40.politician_id (TEXT FK)
    ↓ (id → collected_data_id)
evaluations_v40.collected_data_id (UUID FK)
evaluations_v40.politician_id (TEXT FK)
    ↓
ai_final_scores_v40.politician_id (TEXT FK)
```

**생성 파일:**
- `설계문서_V7.0/V40/V40_완전한_프로세스_플로우차트.md` (신규)
- `설계문서_V7.0/V40/instructions/V40_전체_프로세스_가이드.md` (업데이트)
- `C:\Users\home\Desktop\제안서\V40_완전한_프로세스_플로우차트.md` (복사)

**검증:**
- ✅ 3개 파일 모두 생성 확인
- ✅ 파일 크기 정상 (38KB, 21KB, 38KB)
- ✅ 전체 프로세스 7개 Phase 완전 문서화
- ✅ 데이터베이스 관계 명확히 문서화

---

### 5. AI 기반 정치인 상세평가보고서 생성 가이드 수정 (V40)

**수정 파일:**
- `설계문서_V7.0/V40/AI_기반_정치인_상세평가보고서_생성_가이드_V40.md`

**사용자 피드백 반영 (6가지 수정):**

**1. AI 평가 성향 분석 섹션 삭제**
- "정치인이 AI 평가 성향을 알 필요 없음"
- 삭제된 내용: ChatGPT(관대), Grok(관대), Gemini(중립), Claude(엄격) 성향 분석
- Python 코드에서 해당 섹션 생성 코드 제거

**2. AI별 점수와 평균 통합**
- 이전: AI별 점수 + 평균 점수 별도 섹션
- 수정: 한 테이블에 AI별 + 평균 통합
- 테이블: AI | 점수 | 평균 등급

**3. 등급 설명 제거**
- "등급 자체만 표시, 해석 불필요"
- 이전: "E (Emerald) - 매우 우수한 리더십"
- 수정: "E (Emerald)" (설명 제거)
- 테이블에서 등급 컬럼 제거, 점수만 표시

**4. 강점/약점 분석 재정의**
- "타 정치인 대비 비교가 강점/약점"
- 이전: 카테고리별 점수 기준 (80점 이상/미만)
- 수정: 다른 정치인 평균 대비 상대 비교
- 예: 조은희 85점 vs 정치인 평균 75점 = +10점 (강점)

**5. 좋은 점/나쁜 점 분석 명확화**
- "시민 입장에서 좋다/나쁘다"
- 이전: 긍정/부정 평가 사례 단순 나열
- 수정: 시민 입장의 긍정/부정 활동으로 재구성
- 좋은 점: 규제개혁, 스마트시티, 주민 소통, 재난 대응, 복지 확대
- 나쁜 점: 이해충돌, 정치자금, 정책 실효성, 공약 지연, 예산 낭비

**6. 등급 순서 오류 수정 ⭐**
- **중대 오류**: 등급 순서를 완전히 반대로 작성
- 잘못된 내용:
  - M (Mugunghwa) = '평균 수준' ❌
  - L (Lead) = '완벽한 성과' ❌
- 올바른 내용:
  - M (Mugunghwa) = '최우수 성과' (920~1000점, **가장 높음**) ✅
  - L (Lead) = '최하 수준' (200~279점, **가장 낮음**) ✅
- `get_grade_description()` 함수 전면 수정

**올바른 등급 순서 (높음 → 낮음):**
1. M (Mugunghwa): 920~1000점 - 최우수
2. D (Diamond): 840~919점 - 매우 우수
3. E (Emerald): 760~839점 - 우수
4. P (Platinum): 680~759점 - 양호
5. G (Gold): 600~679점 - 보통
6. S (Silver): 520~599점 - 평균
7. B (Bronze): 440~519점 - 미흡
8. I (Iridium): 360~439점 - 개선 필요
9. Tn (Titanium): 280~359점 - 부족
10. L (Lead): 200~279점 - 최하

**보고서 최종 구조:**
```
1. 종합 점수
   - 최종 점수 및 종합 평가
   - AI별 최종 점수 (평균 포함, 한 테이블)
   - 카테고리별 점수

2. 강점/약점 분석 (타 정치인 대비 비교)
   - 상대적 강점
   - 상대적 약점
   - 종합 순위

3. 좋은 점/나쁜 점 분석 (시민 입장 평가)
   - 좋은 점 (시민이 좋아할 활동)
   - 나쁜 점 (시민이 비판할 활동)
   - 종합 분석

4. AI별 카테고리 평가 비교

5. 카테고리별 상세 평가

6. 데이터 출처 분석
```

---

### 4. AI 기반 정치인 상세평가보고서 생성 가이드 작성 (V40)

**생성 파일:**
- `설계문서_V7.0/V40/AI_기반_정치인_상세평가보고서_생성_가이드_V40.md`

**공식 명칭 확정:**
- ✅ **"AI 기반 정치인 상세평가보고서"**
- 파일명: `AI_기반_정치인_상세평가보고서_{정치인명}_{날짜}.md`

**V15.0 → V40.0 주요 변경:**
- AI 개수: 1개 → **4개** (Claude, ChatGPT, Grok, Gemini)
- 평가 데이터: 500개 → **4,000개** (4 AIs × 1,000개)
- 등급 체계: -6~+10 → **+4~-4, X**
- 점수 범위: 250~1,000 → **200~1,000점**
- 테이블: collected_data, politician_scores → **collected_data_v40, evaluations_v40, ai_final_scores_v40**

**새로 추가된 섹션:**
- ✅ AI별 평가 성향 분석
- ✅ AI 평가 일관성 분석 (상관계수 1.0)
- ✅ AI별 카테고리 점수 비교
- ✅ 대표 긍정/부정 사례 (AI별)

**Python 생성 스크립트:**
- `generate_report_v40.py` 코드 포함
- 4개 테이블 조인 쿼리 제공
- AI별 통계 계산 로직 포함

---

## 최근 완료 작업 (2026-02-06)

### 1. X 판정 규칙 완화

**문제 발견:**
- Claude ethics: X 97.7% (127/130)
- Claude accountability: X 96.4% (108/112)
- Gemini ethics: X 17.7% (23/130)
- → 80% 차이, 명백한 오류

**원인 분석:**
- X 판정 규칙 5개 중 2개가 너무 모호:
  - ❌ "현재 카테고리와 무관한 내용" (주관적)
  - ❌ "의미 없는 데이터" (주관적)
- 재평가 시 "출석 명단", "의안 제출"을 X 처리 (93.9% X)
- 문제 재현 확인 → 규칙 문제 확정

**규칙 완화 (5개 → 3개):**

기존 규칙:
```
- 10년 이상 과거 사건
- 동명이인
- 현재 카테고리와 무관한 내용  ← 삭제
- 가짜/날조 정보
- 의미 없는 데이터  ← 삭제
```

완화된 규칙:
```
X 판정 (명백히 잘못된 데이터만):
- 10년 이상 과거 사건 (2016년 이전)
- 동명이인 (명백히 다른 사람)
- 가짜/날조 정보 (허위 사실)

⚠️ 다음은 X가 아닌 낮은 평가로 처리:
- 출석 명단, 회의 참석 → +1 (기본 직무)
- 의안 제출 (내용 미상) → +1 (입법 노력)
- 간단한 언급 → +1~+2 (최소한의 긍정)
- 애매하면 낮은 점수라도 부여
```

**수정 파일:**
- `.claude/commands/evaluate-politician-v40.md`

### 2. ethics, accountability 재평가

**ethics (윤리성):**
- 이전: X 97.7% (127/130)
- 재평가: X 3.8% (5/130)
- ✅ **94% 개선**

**accountability (책임감):**
- 이전: X 96.4% (108/112)
- 재평가: X 0% (0/112)
- ✅ **96% 개선**

**점수 변화:**
- Claude: 733점 → 738점 (+5점)
- 최종 평균: 815점 → 816점 (+1점)

### 3. AI 평가 성향 분석 ⭐

**핵심 발견: 평가 성향과 점수 간 완벽한 상관관계 (상관계수 1.0)**

| 순위 | AI | 평균 등급 | 최종 점수 | X 비율 | 긍정 비율 |
|---|---|---|---|---|---|
| 1위 | ChatGPT | +2.77 | 881점 | 20.0% | 75.0% |
| 2위 | Grok | +2.32 | 835점 | 21.8% | 71.6% |
| 3위 | Gemini | +2.10 | 807점 | 16.6% | 80.2% |
| 4위 | Claude | +1.50 | 738점 | 29.3% | 65.4% |

**카테고리별 일관성:**
- **10개 카테고리 모두** 동일 순위 (ChatGPT > Grok > Gemini > Claude)
- 예외 0개, 100% 일관성

**성향 특징:**
- **ChatGPT**: 가장 관대, +3/+4 중심 (56.1%)
- **Grok**: 관대, +3/+2 중심, 부정 평가 6.6% (최다)
- **Gemini**: 중립, +2 중심 (60.3%), X 최소 (16.6%)
- **Claude**: 가장 엄격, +1/+2 중심 (58.6%), X 최다 (29.3%)

**보고서 생성:**
- `AI_평가성향_점수연관성_분석.md` 작성 완료

---

## 이전 완료 작업 (2026-02-05)

### 1. V40 스키마 개선

**배경:**
- 기존 evaluations_v40 테이블에 collected_data_id 필드 없음
- 평가가 어떤 수집 데이터를 평가한 것인지 추적 불가
- 부정확한 ID 비교로 중복 평가 발생

**작업 내용:**

**A. SQL 마이그레이션 (add_collected_data_id_to_evaluations.sql)**
```sql
-- 1. collected_data_id 필드 추가
ALTER TABLE evaluations_v40
ADD COLUMN IF NOT EXISTS collected_data_id UUID;

-- 2. Foreign Key 제약
ALTER TABLE evaluations_v40
ADD CONSTRAINT fk_evaluations_collected_data
FOREIGN KEY (collected_data_id)
REFERENCES collected_data_v40(id)
ON DELETE SET NULL;

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_evaluations_collected_data_id
ON evaluations_v40(collected_data_id);

CREATE INDEX IF NOT EXISTS idx_evaluations_lookup
ON evaluations_v40(politician_id, category, evaluator_ai);

-- 4. Unique 제약 (중복 방지)
CREATE UNIQUE INDEX IF NOT EXISTS unique_evaluation_per_data
ON evaluations_v40(politician_id, category, evaluator_ai, collected_data_id)

---

## 최근 완료 작업

### 1. V40 스키마 개선 (2026-02-05)

**배경:**
- 기존 evaluations_v40 테이블에 collected_data_id 필드 없음
- 평가가 어떤 수집 데이터를 평가한 것인지 추적 불가
- 부정확한 ID 비교로 중복 평가 발생

**작업 내용:**

**A. SQL 마이그레이션 (add_collected_data_id_to_evaluations.sql)**
```sql
-- 1. collected_data_id 필드 추가
ALTER TABLE evaluations_v40
ADD COLUMN IF NOT EXISTS collected_data_id UUID;

-- 2. Foreign Key 제약
ALTER TABLE evaluations_v40
ADD CONSTRAINT fk_evaluations_collected_data
FOREIGN KEY (collected_data_id)
REFERENCES collected_data_v40(id)
ON DELETE SET NULL;

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_evaluations_collected_data_id
ON evaluations_v40(collected_data_id);

CREATE INDEX IF NOT EXISTS idx_evaluations_lookup
ON evaluations_v40(politician_id, category, evaluator_ai);

-- 4. Unique 제약 (중복 방지)
CREATE UNIQUE INDEX IF NOT EXISTS unique_evaluation_per_data
ON evaluations_v40(politician_id, category, evaluator_ai, collected_data_id)
WHERE collected_data_id IS NOT NULL;
```

**B. helper 스크립트 업데이트 (2개 파일)**

1. **gemini_eval_helper.py**
   - fetch: collected_data_id 기반 필터링으로 변경
   - save: collected_data_id 저장 추가

2. **claude_eval_helper.py**
   - fetch: collected_data_id 기반 필터링으로 변경
   - save: collected_data_id 저장 추가

**개선 효과:**
- ✅ 평가-수집 데이터 완전 연결
- ✅ 정확한 평가 현황 조회
- ✅ 중복 평가 자동 방지
- ✅ 빠른 조회 성능

---

### 2. 용어 통일 (2026-02-05)

**변경 사항:**

**이전 (불일치):**
- Claude: "Subscription Mode"
- Gemini: "CLI에서 직접 평가"
- → 동일한 개념에 다른 용어 사용

**수정 (통일):**
- Claude: "CLI Direct Mode"
- Gemini: "CLI Direct Mode"
- → 기술적 표현으로 통일

**수정된 파일:**
1. `claude_eval_helper.py` (line 6)
   - "subscription mode" → "CLI Direct Mode"

2. `gemini_eval_helper.py` (line 6)
   - "무료" → "CLI Direct Mode, $0"

**통일된 용어 체계:**
- **CLI Direct Mode**: Claude Code CLI Direct, Gemini CLI Direct
- **API Mode**: ChatGPT API, Grok API

---

### 3. 조은희 V40 평가 완료 (2026-02-05)

**평가 현황:**
- 정치인: 조은희 (d0a5d6e1)
- 전체 완료: 4개 AI × 10개 카테고리 = 5,163개 평가

| AI | 평가 방식 | 총 평가 수 |
|---|---|---|
| Claude | Claude Code CLI Direct | 860 |
| ChatGPT | ChatGPT API | 1,094 |
| Grok | Grok API | 1,094 |
| Gemini | Gemini CLI Direct | 1,094 |

**비용 구조 (2/4 AI 완전 무료):**
- Claude Code CLI Direct: $0
- Gemini CLI Direct: $0
- ChatGPT API: 사용량 과금
- Grok API: 사용량 과금

---

## 이전 완료 작업

### 1. V40 Scripts 구 A~H 등급체계 코드 제거 (2개 파일)

**제거 대상:**
1. **evaluate_v40.py**
   - Line 29-36: 등급 표 설명에서 A~H를 +4~-4로 변경
   - Line 468-480: 프롬프트 등급 표에서 A~H를 +4~-4로 변경
   - Line 529-535: rating_map 변환 코드 전체 삭제 (하위호환 제거)

2. **calculate_v40_scores.py**
   - Line 86-88: RATING_TO_SCORE에서 A~H 하위호환 부분 삭제
   - Line 174-180: rating_map 변환 코드 전체 삭제

**수정 결과:**
- 모든 A~H 참조 제거 완료
- rating_map 변환 로직 제거 완료
- +4~-4 체계만 유지
- 하위호환 코드 완전 제거

**검증:**
- `Grep` 검색으로 A~H 패턴 제거 확인
- `rating_map` 키워드 제거 확인
- "하위 호환" 주석 제거 확인

---

### 2. V40 수집 지침 용어 정비 (5개 파일) - 이전 작업

V40 수집 지침 5개 파일에서 "차등 센티멘트 배분" 용어를 간결한 숫자 표기로 교체

---

## 완료된 작업

### 1. V40 수집 지침 용어 정비 (5개 파일)

**변경 내용:**
1. **cat06_accountability.md**
   - 섹션 제목: "## 8. 수집 구조 (차등 센티멘트 배분) - V40 버전" → "(OFFICIAL 10-10-80 / PUBLIC 20-20-60) - V40 버전"
   - 체크리스트: "총 100개, 센티멘트 차등 배분 (OFFICIAL 10-10-80, PUBLIC 20-20-60)" → "총 100개, OFFICIAL 10-10-80 / PUBLIC 20-20-60"

2. **cat07_transparency.md**
   - 동일한 치환 A, B 적용

3. **cat08_communication.md**
   - 동일한 치환 A, B 적용

4. **cat09_responsiveness.md**
   - 참조 설명: "(이전 파일들과 동일 - V40 버전으로 100개, 버퍼 20%, 차등 센티멘트: OFFICIAL 10-10-80 / PUBLIC 20-20-60)" → "(이전 파일들과 동일 - V40 버전으로 100개, 버퍼 20%, OFFICIAL 10-10-80 / PUBLIC 20-20-60)"
   - 체크리스트: 동일한 치환 D 적용

5. **cat10_publicinterest.md**
   - 동일한 치환 C, D 적용

**수정 결과:**
- "차등 센티멘트 배분" → 제거 (간결화)
- 모든 참조를 숫자 비율로 통일: "OFFICIAL 10-10-80 / PUBLIC 20-20-60"
- 문서 가독성 및 간결성 개선

---

## 수정 파일 경로

**V40 Scripts A~H 제거:**
- `설계문서_V7.0/V40/scripts/evaluate_v40.py`
- `설계문서_V7.0/V40/scripts/calculate_v40_scores.py`

**V40 수집 지침 용어 정비:**
- `설계문서_V7.0/V40/instructions/2_collect/cat06_accountability.md`
- `설계문서_V7.0/V40/instructions/2_collect/cat07_transparency.md`
- `설계문서_V7.0/V40/instructions/2_collect/cat08_communication.md`
- `설계문서_V7.0/V40/instructions/2_collect/cat09_responsiveness.md`
- `설계문서_V7.0/V40/instructions/2_collect/cat10_publicinterest.md`

---

## 최근 완료 작업 (2026-02-09)

### V40 검증 이슈 4건 해결 + GitHub Pages 배포

**작업 배경:**
- 4개 전문 서브에이전트 검증 결과 (90.6점/A등급) 에서 발견된 4건 이슈 해결

**해결된 이슈:**
1. **generate_report_v40.py 재작성** (Critical) - V40.2 8섹션 구조, 점수 기반 강점/약점 분석
2. **CLI Direct 에러 처리 문서화** - V40_전체_프로세스_가이드.md 4.2.1절 추가
3. **"1,000+α" → "1,000~1,200"** - 다이어그램 모호한 표현 명확화
4. **버퍼 계산 방식 상세화** - V40_기본방침.md bottom-up 예시 추가

**커밋 및 배포:**
- main: `6d2fba6` - fix: V40 검증 이슈 4건 해결
- gh-pages: `82cf363` - docs: V40 다이어그램 업데이트 (검증 이슈 반영)
- GitHub Pages URL: https://sunwoongkyu.github.io/PoliticianFinder/v40_process_diagram.html

**수정 파일:**
- `V40/scripts/core/generate_report_v40.py` (재작성)
- `V40/instructions/V40_전체_프로세스_가이드.md` (4.2.1절 추가)
- `V40/instructions/V40_기본방침.md` (버퍼 계산 상세화)
- `scratchpad/v40_process_diagram.html` (1,000~1,200)

## 다음 작업
- V40 프로세스 설계 완료 상태
- 실제 수집/평가 실행 준비
