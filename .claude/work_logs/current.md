# Work Log - Current Session

**최종 업데이트**: 2026-03-13

---

## 세션: 2026-03-13 (최신) — V50 인프라 구축 + 가상 테스트 + 버그 수정

### 작업 요약
V50 인프라 구축(DB 스키마, .env, 스킬, n8n import), Phase 4.5 PO 승인 게이트 9개 문서 반영,
review-evaluate 4라운드(98/100점), V50 전체 파이프라인 가상 테스트 실행, 발견된 버그 2건 수정.

### 이전 세션(컨텍스트 압축 전) 완료 작업
- V50 DB 스키마 Supabase CLI로 적용 (ai_category_scores_v50, ai_final_scores_v50 보강)
- V50/.env 생성 (8개 API 키)
- evaluate-politician-v50 스킬 생성
- n8n 워크플로우 import (V50: MJ8zaDzfEkmL5BQX, V60: q4m7aTIrxYZoAGgG)
- Phase 4.5 PO 승인 게이트 → 9개 문서 반영 (SVG 포함)
- /review-evaluate 4라운드 98/100점 달성

### V50 가상 테스트 결과
- 인프라: .env 8키 OK, DB 5테이블 OK, 스크립트 13개 문법 OK, instructions 3폴더 OK
- Phase 0→1→2→2-2→3→4→5 체인 연결 검증 완료
- 발견된 버그 3건 중 2건 수정

### 버그 수정 (2건)

**Bug 1: adjust_v50.py L296 — Gemini 재수집 인자 불일치 → 수정 완료**
- 변경 전: `['--politician', politician_name, '--category', category]`
- 변경 후: `['--politician_id', politician_id, '--politician_name', politician_name, '--category', category]`

**Bug 2: n8n 워크플로우 Phase 4.5 Wait 노드 누락 → 수정 완료**
- 2개 노드 추가: "Phase 4.5: PO Report" (Code) + "Phase 4.5: PO Approval Wait" (Wait/Webhook)
- 연결 변경: Save Scores → PO Report → PO Wait → P5: Generate HTML Report
- 노드 수: 45 → 47, 연결 수: 42 → 44

### 미수정 (경미, 기능 문제 없음)
- collect_grok_x_v50.py: instruction 파일 미사용 (하드코딩 키워드, 동작은 정상)

### 수정 파일 목록
- `V50/scripts/adjust_v50.py` — Gemini 재수집 인자 수정
- `V50/n8n/v50_single_politician_workflow.json` — Phase 4.5 Wait 노드 추가
- `V50/V50_아키텍처_전체구조도.svg` — Phase 4.5 게이트 삽입 (이전 세션 연속)

### 다음 작업
- V50 실전 테스트 (실제 정치인 1명으로 Phase 0→5 전체 실행)
- 커밋 필요 (이번 세션 변경사항 다수)

---

## 세션: 2026-03-12 — 오세훈 CCI 보고서 정원오 벤치마크 구조로 재구성

### 작업 요약
오세훈_CCI_20260312.md를 정원오_CCI_20260312.md와 동일한 구조로 전면 재구성.
848줄 완성. 모든 DB 수치 정확히 반영.

### 수정 파일 (1개)

**V60_CCI/보고서/오세훈_CCI_20260312.md** (591줄 → 848줄)

주요 추가 사항:
1. **2-3 Alpha 카테고리별 점수 비교 테이블** 신규 추가 (6개 카테고리, 그룹평균, 오세훈 우위)
2. **기존 2-3 코드블록** → **2-4 경쟁자 대비 격차** 테이블로 변환 (vs정원오/박주민/조은희)
3. **3-3 경쟁자 대비 GPI 포지션** 테이블 신규 추가 (10개 카테고리, 1위 후보, 오세훈 순위)
4. **기존 3-3/3-4** → **3-4(상위/하위 테이블 형식)/3-5** 번호 조정 (테이블 형식으로 변환)
5. **4-1, 4-2, 4-3, 5-1, 5-2, 5-3** 각각에 "경쟁자 대비 위치" 테이블 추가
6. **8-3 시나리오** 3개에 지표 테이블 추가 (목표/현재/범위)
7. **별첨 2** "Alpha 평가 데이터 개요"로 전면 확장 (현황 테이블 + 방법론)
8. **마지막 줄** 통일: 평가일/버전/생성자 형식
9. **헤더 구조** 정원오와 동일하게 # 사용 (1장, 2장 등)

DB 수치 검증 (모두 일치):
- opinion 511, media 544, risk 648, A1 568
- party 555, candidate 800, regional 780, A2 712
- GPI 732, CCI 677 (3위)
- 그룹평균: opinion 636, media 681, risk 602, party 674, candidate 760, regional 798

---

## 세션: 2026-03-11 — V50 Python 스크립트 + n8n 설정 채널 비율 수정

### 작업 요약
V50 Python 스크립트 7개, n8n 설정 2개, 슈퍼스킬 파일 1개의 수집 채널 비율을
확정값(Gemini 48개 40% + Grok-X 12개 10% + Naver 60개 50% = 120개)으로 수정.

### 수정 파일 (10개)

**1. scripts/collect_gemini_v50.py**
- `--target` 기본값 60 → 48
- docstring 예시의 `--target 60` → `--target 48`
- 로그 메시지에 "(40%)" 추가

**2. scripts/collect_grok_x_v50.py**
- docstring "6개/카테고리 (5%)" → "12개/카테고리 (10%)"
- `TARGET_PER_CATEGORY = 6` → `12`
- 프롬프트 "6개 결과" → "12개 결과", 센티멘트 free 전용 규칙 추가
- `save_posts`: sentiment 항상 'free'로 강제 저장

**3. scripts/adjust_v50.py**
- 채널 목표 상수 3채널 분리: GEMINI(48), GROK_X(12), NAVER(60)
- `CHANNEL_AIS = ['Gemini', 'Grok-X', 'Naver']` 추가
- `CHANNEL_TARGETS` 딕셔너리 추가
- `analyze_current_status`, `validate_balance`, `print_final_report` 함수에서
  ['Gemini', 'Naver'] → CHANNEL_AIS로 교체
- `trigger_recollection`에 Grok-X 재수집 케이스 추가
- `--ai` argparse choices에 'Grok-X' 추가

**4. scripts/generate_report_v50.py**
- 보고서 "수집 채널" 표시: "Gemini CLI 50% + Naver API 50%" → "Gemini API 40% + Grok-X 10% + Naver API 50%"
- 7.3 데이터 출처 테이블에 Grok-X 행 추가
- 검색 편향 설명에 Grok-X 추가
- `xc` 변수로 Grok-X 수량 집계 추가

**5. n8n/v50_api_config.json**
- `grok_x.target_per_category`: 6 → 12
- `grok_x.note`: "5%" → "10%", free 전용 설명 추가
- `naver.note`: "PUBLIC 60%" → "PUBLIC 50%"
- `collection_targets`: gemini 60→48, grok_x 6→12, total 126→120
- 채널 순서 명시: "Gemini → Grok-X → Naver"

**6. n8n/v50_single_politician_workflow.json**
- Check Gate 1 note: "3채널 × 60개 = 1,260" → "48+12+60 = 120개 = 1,200"
- Grok-X collect note: "6개/카테고리" → "12개/카테고리, 10%, 전부 free"
- Naver collect note: "OFFICIAL 12 + PUBLIC 48" → "OFFICIAL 10 + PUBLIC 40"

**7. .claude/skills/evaluate-politician-platoon-슈퍼스킬.md**
- Phase 1 수집 목표: 각 채널 정확한 수치로 수정
- 채널 비율: "Gemini 40% + Naver 20% + Grok 40%" → "Gemini 40% + Grok-X 10% + Naver 50%"
- 채널 순서: "항상 Gemini → Grok-X → Naver" 명시

### 변경하지 않은 파일
- `validate_v50.py`: 채널 비율 독립적 검증 로직만 있음
- `soldier_v50.py`: n8n 폴링 로직만 있어 채널 비율 무관

---

## 세션: 2026-03-11 — V50 설계문서 수집 채널 비율 통일 수정

### 작업 요약
V50 설계문서 4개 파일의 수집 채널 비율을 확정값(Gemini 48개 40% + Grok 12개 10% + Naver 60개 50% = 120개)으로 통일 수정.

### 수정 파일 (4개)

**1. V50_기획안.md**
- 섹션 3에 "채널별 OFFICIAL/PUBLIC/Sentiment 배분" 표 신규 추가
- Grok 수집 방식 섹션에 "센티멘트: 구분 없음 — 전부 free" 항목 추가
- 기존 Gemini 48/Grok 12/Naver 60 수치는 이미 올바름 (변경 없음)

**2. V50_스크립트_역할_구분.md**
- 이미 올바른 값 (Gemini 48개 40%, Grok 12개 10%, Naver 60개 50%) — 변경 없음

**3. V50_V40_스크립트_연결_매핑.md**
- 이미 올바른 값 (363-365줄 Gemini 40%/Grok 10%/Naver 50%) — 변경 없음

**4. V50_정치인평가_스킬_기획안.md**
- 315-317줄: Gemini 60개→48개(40%), Grok 6개→12개(10%), 순서 Gemini→Grok→Naver로 수정
- 527-529줄: 동일 수정 (Phase 1 설명 두 번째 위치)

### 확정된 채널 비율
```
Gemini API:  48개 (40%) — OFFICIAL 30 + PUBLIC 10 (버퍼: 48)
Grok(X):     12개 (10%) — PUBLIC 10 only, 전부 free (버퍼: 12)
Naver NCP:   60개 (50%) — OFFICIAL 10 + PUBLIC 40 (버퍼: 60)
합계:       120개/카테고리
순서: 항상 Gemini → Grok → Naver
```

---

## 세션: 2026-03-11 (연속) — V50 수집 지침서 cat01~cat10 + 가이드 파일 V50 배분 업데이트

### 작업 요약
V50 수집 지침서 10개 카테고리 파일(cat01~cat10) 및 가이드 파일들을 V40 2채널에서 V50 3채널 배분으로 전면 업데이트.

### 수정 파일 (14개)

**1. GEMINI_API_수집_가이드_V50.md**
- Gemini CLI → REST API 방식 전환
- OFFICIAL 30 + PUBLIC 10 (V40: PUBLIC 20) 반영
- script 이름 collect_gemini_subprocess.py → collect_gemini_api.py

**2. NAVER_API_수집_가이드_V50.md**
- script 이름 V40→V50 업데이트
- 배분 설명에 Grok 채널 추가

**3~12. cat01_expertise.md ~ cat10_publicinterest.md (10개 파일 전부)**
- 헤더: V40 → V50
- 섹션 2: "2개 채널" → "3개 채널"
- 메인 박스: PUBLIC 60개→80개 (Gemini 10 + Grok 12 + Naver 40)
- AI 테이블: Gemini 50→40 (40%), Grok 행 신규 추가 (12개 10%), 합계 100→120
- 섹션 7 도구: Gemini 40%, Grok PUBLIC only 추가, Naver 50%
- 섹션 8 역할: Gemini 공개 20→10개, Grok 공개 12개 신규, 센티멘트 상세 추가
- 수집 구조: 100개→120개, V40→V50 균형 수집
- 체크리스트: Grok 12개 추가, 총 120개로 업데이트
- 핵심 규칙 요약: V50 배분 반영
- collector_ai 필드: gemini/naver → gemini/grok/naver
- 푸터: V40→V50

**13. instructions/README.md**
- 수집 목표: 126개 → 120개 (Gemini API 40 + Grok 12 + Naver 60)
- 순서 명시: Gemini → Grok → Naver
- 가이드 파일명: GEMINI_CLI_수집_가이드.md → GEMINI_API_수집_가이드_V50.md

### 주요 V50 수집 배분 (확정값)
```
OFFICIAL (40개): Gemini 30 + Naver 10
PUBLIC   (80개): Gemini 10 + Grok 12 + Naver 40
합계    (120개): Gemini 40 + Grok 12 + Naver 60
비율: Gemini 40% + Grok 10% + Naver 50%
순서: Gemini → Grok → Naver
```

---

**최종 업데이트 (이전)**: 2026-03-09
**프로젝트**: V40 평가보고서 생성 + GitHub Pages 배포 / V50 평가 스크립트 생성

---

## 세션: 2026-03-09 — V50 n8n 워크플로우 버그 수정 + 드라이런 검증

### 작업 요약
V50 n8n 워크플로우 드라이런(모의 테스트) 2회 실행, 버그 2개 발견·수정 완료.
신규 스킬 `/n8n-workflow-test` 생성 (이름에서 `코어1` 접미사 제거).

### 수정 파일
- `V50/n8n/v50_single_politician_workflow.json` — 버그 2개 수정

### 수정 내역

**Bug 1 (Critical) — P5: Generate HTML Report 크래시**
- `const p = $input.first().json` → `const p = $('P4: Calculate Scores').first().json`
- 원인: Supabase:Save Scores가 return=minimal → `{}` 반환, p.category_scores = undefined → TypeError

**Bug 2 (High) — Status: done report_path NULL 저장**
- `report_path: $json.report_path` → `report_path: $('P5: Generate HTML Report').first().json.report_path`
- 원인: 직전 Storage Upload 응답 스키마에 report_path 필드 없음

### 신규 스킬
- `~/.claude/skills/n8n-workflow-test/SKILL.md` (글로벌)
- `V50/.claude/skills/n8n-workflow-test.md` (프로젝트 로컬)
- 구: `n8n-workflow-test-코어1` → 신: `n8n-workflow-test`

### 보고서 저장
- `V50/보고서/V50_n8n_워크플로우_검증_20260309.md`

### 다음 작업
- **실전 테스트**: 화요일 이후 (API 토큰 한도 설정 후 실행)
- 잔여 이슈: Check Balance `&limit=1000` 단일 쿼리 (Medium, 비크래시)

---

---

## 세션: 2026-03-08 (4차) - V50 n8n 워크플로우 실구현 (Stub → 실코드)

### 작업 요약
V50 n8n 워크플로우 stub 부분을 실제 동작 코드로 교체 완료

### 생성 파일 1개 (신규)
- `V50/database/v50_schema.sql` — collected_data_v50 / evaluations_v50 / ai_final_scores_v50 테이블 + politicians ALTER

### 수정 파일 1개 (대폭 수정)
- `V50/n8n/v50_single_politician_workflow.json` — 38노드 → 45노드 (7개 신규 추가, 6개 수정)

#### 수정 내역 상세

**FIX 1 — Phase 2 (v50-p2-validate)**
- Before: `return [{ json: { validated: true } }]` (패스스루 stub)
- After: Supabase pagination fetch → 기간 위반 삭제 (OFFICIAL 4년/PUBLIC 2년) → 중복 제거 (정규화 title 기준) → chunk DELETE

**FIX 2 — Phase 2-2 (3개 노드 신규 추가)**
- `v50-status-validating` (HTTP PATCH): processing_status='validating' 업데이트
- `v50-check-balance` (Code): 카테고리별 건수 집계, 4라운드 초과 시 강제 통과
- `v50-if-balance-ok` (IF): balance_ok 분기
- `v50-recollect-gemini` (Code): Gemini API 재수집 + Supabase 저장 + 라운드 카운터
- 연결: P2: Validate → Status: validating → Check Balance → IF Balance OK → (true) Status: evaluating / (false) Recollect Gemini → [loop back to Check Balance]

**FIX 3 — Phase 3 배치 평가 (4개 노드 신규 추가)**
- `v50-prep-eval` 수정: 10개 → 40개 (10 cats × 4 batch_indices)
- `v50-fetch-batch-data` (Code): Supabase에서 25개 slice fetch (offset = batch_index × 25)
- `v50-if-data-exists` (IF): 빈 배치 skip
- `v50-build-eval-prompt` (Code): 수집 데이터 번호 목록으로 full_prompt 생성
- 4개 AI eval 노드: `$json.eval_prompt_template + '...'` → `$json.full_prompt`
- `v50-parse-evals`: `$('Category Eval Loop')` → `$('Build Eval Prompt')`, batch_item_ids로 ID 검증

### 연결 변경 요약
- P2: Validate → Status: validating (구: Status: evaluating)
- Category Eval Loop[0] → Fetch Batch Data (구: 4 AI evals 직접)
- IF Data Exists? false → Category Eval Loop (빈 배치 스킵)

---

## 세션: 2026-03-08 (3차) - V50 n8n 워크플로우 JSON 2개 생성

### 작업 요약
V40 type_c_workflow.json / type_c_api_config.json을 기반으로 V50용 n8n 파일 2개 생성

### 생성 파일 2개
- `V50/n8n/v50_single_politician_workflow.json` - 38개 노드, Webhook 진입점, Phase 0-5 전체 파이프라인
- `V50/n8n/v50_api_config.json` - V50 API 설정 (모델명, 비용, 테이블명, 수집 목표 등)

### V40 → V50 주요 변경사항
- 트리거: Manual Trigger → Webhook POST /webhook/v50-start (비동기 202 ACK)
- Phase 0 추가: politicians 테이블 DB 등록 노드 (ignore-duplicates)
- processing_status 추적: started → collecting → validating → evaluating → scoring → done
- 수집 채널: 2채널 (Gemini + Naver) → 3채널 (Gemini + Naver + Grok-X 병렬)
  - Grok-X: grok-3-mini + web_search_preview tool, 6개/카테고리
- Gemini 모델: gemini-2.0-flash → gemini-2.0-flash-lite (수집 + 평가 모두)
- ChatGPT 모델: o4-mini → gpt-4o-mini
- Grok 모델: grok-3 → grok-3-mini
- 테이블: _v40 → _v50 (collected_data_v50, evaluations_v50, ai_final_scores_v50)
- Phase 5 추가: Supabase Storage 업로드 (reports 버킷, HTML 보고서)
- 완료 시: processing_status='done' + final_score + grade + report_path 함께 저장
- JSON 문법 검증: python json.load() OK (38 nodes, 5073 bytes / 50877 bytes)

---

## 세션: 2026-03-08 (2차) - V50 수집/점수계산/soldier 스크립트 5개 생성

### 작업 요약
V40 수집·점수계산 스크립트를 V50 기준으로 변환하고, V50 신규 채널(Grok-X) 및 soldier 스크립트 추가

### 생성 파일 5개
- `V50/scripts/collect_gemini_v50.py` - Gemini 2.0 Flash-Lite REST API 수집 (Flash-Lite 우선)
- `V50/scripts/collect_naver_v50.py` - Naver Cloud Platform API 수집 (instructions/2_collect_v50/ 경로)
- `V50/scripts/collect_grok_x_v50.py` - V50 신규: X(Twitter) Live Search 수집 (grok-3-mini, web_search_preview)
- `V50/scripts/calculate_scores_v50.py` - 점수 계산 (evaluations_v50 -> ai_final_scores_v50, version='V50')
- `V50/scripts/soldier_v50.py` - 분대원 진입점 (webhook POST -> Supabase polling done/failed/timeout)

### V50 주요 변경사항 (수집/점수)
- 테이블: collected_data_v40 -> collected_data_v50, ai_final_scores_v40 -> ai_final_scores_v50
- Gemini: gemini-2.5-flash -> gemini-2.0-flash-lite (Flash-Lite 우선, Flash fallback)
- instructions 경로: instructions/2_collect/ -> instructions/2_collect_v50/
- argparse: --politician_id 추가 (V40 gemini_api_fill에는 없었음)
- 신규 채널: Grok-X (collector_ai='Grok-X', 6개/카테고리, PUBLIC 2년 기준)
- soldier: n8n webhook POST + Supabase processing_status polling (30초 간격, 2시간 최대)
- 문법 검증: 5개 파일 모두 ast.parse() OK

---

## 세션: 2026-03-08 (1차) - V50 평가 스크립트 4개 생성

### 작업 요약
V40 Python 스크립트를 V50 기준으로 변환하여 `V50/scripts/` 폴더에 저장

### 생성 파일 4개
- `V50/scripts/eval_claude_v50.py` - Claude Haiku 4.5 평가 (Anthropic API Direct)
- `V50/scripts/eval_gemini_v50.py` - Gemini 2.0-flash-lite 평가 (Gemini REST API)
- `V50/scripts/eval_chatgpt_v50.py` - gpt-4o-mini 평가 (OpenAI SDK)
- `V50/scripts/eval_grok_v50.py` - grok-3-mini 평가 (xAI API, requests.post)

### V50 주요 변경사항
- 테이블: collected_data_v40 -> collected_data_v50, evaluations_v40 -> evaluations_v50
- Gemini: gemini-2.5-flash CLI subprocess -> gemini-2.0-flash-lite REST API
- ChatGPT: o4-mini -> gpt-4o-mini
- Grok: grok-3 curl subprocess -> grok-3-mini requests.post
- V40 의존성(common_eval_saver, phase_tracker) 완전 제거 -> 자체 구현
- instructions 경로: instructions/3_evaluate/ -> instructions/3_evaluate_v50/
- Supabase pagination (.range()) 적용 (1000행 제한 대응)

---

## 세션: 2026-03-06 - 고양시장 후보 4인 HTML 보고서 GitHub Pages 배포

### 작업 요약
고양특례시장 후보 4인 HTML 평가보고서 생성 및 GitHub Pages 배포

### 생성 파일 (HTML 보고서 4개)
- `보고서/명재성_20260306_B.html` (더불어민주당, 778점 E등급, 1위)
- `보고서/이동환_20260306_B.html` (국민의힘, 770점 E등급, 2위)
- `보고서/오준환_20260306_B.html` (국민의힘, 765점 E등급, 3위)
- `보고서/이재준_20260306_B.html` (더불어민주당, 758점 P등급, 4위)

### GitHub Pages 배포
- gh-pages 브랜치 docs/reports/ 에 4개 파일 추가
- index.html에 "2026 고양특례시장 후보군 비교 평가 (2026-03-06)" 섹션 추가
- Push 완료: https://sunwoongkyu.github.io/PoliticianFinder/

### 배포 URL
- 명재성: https://sunwoongkyu.github.io/PoliticianFinder/reports/%EB%AA%85%EC%9E%AC%EC%84%B1_20260306_B.html
- 이동환: https://sunwoongkyu.github.io/PoliticianFinder/reports/%EC%9D%B4%EB%8F%99%ED%99%98_20260306_B.html
- 오준환: https://sunwoongkyu.github.io/PoliticianFinder/reports/%EC%98%A4%EC%A4%80%ED%99%98_20260306_B.html
- 이재준: https://sunwoongkyu.github.io/PoliticianFinder/reports/%EC%9D%B4%EC%9E%AC%EC%A4%80_20260306_B.html

---

## 세션: 2026-03-06 - 이동환 평가보고서 HTML 생성

### 작업 요약
이동환 고양특례시장 AI 평가보고서 HTML 파일 생성 (국민의힘, E등급 770점)

### 생성 파일
- `0-3_AI_Evaluation_Engine/설계문서_V7.0/V40/보고서/이동환_20260306_B.html`

### 주요 내용
- 박주민 HTML 구조/CSS 완전 복사 후 이동환 데이터로 교체
- CSS 색상: 국민의힘 계열 (--primary: #1a0808; --accent: #B71C1C; --bg-highlight: #fff0f0)
- 최종 점수: 770점 E등급 (Claude 796 / ChatGPT 773 / Grok 774 / Gemini 746)
- 경쟁자 비교: 4인 고양시장 후보 (명재성 778 / 이동환 770 / 오준환 765 / 이재준 758)
- 이동환 1위 카테고리: 비전(81), 소통능력(80), 대응성(80), 공익성(80) 총 4개
- PDF 다운로드 버튼 유지
- Section 4 카테고리 분석 10개 모두 작성 완료

---

**시작 시간**: 2026-02-23
**프로젝트**: PoliticianFinder 프론트엔드 (보고서 구매 기능)

**이전 로그**: `.claude/work_logs/2026-02-22.md`

---

## 세션: 2026-02-23 - 상세평가보고서 구매 기능 전면 수정

### 작업 요약
보고서 구매 기능을 전면 수정: 정치인 본인만 → 누구나(정치인+일반회원) 구매 가능, 가격 인상

### 핵심 변경 사항

| 항목 | 현행 | 변경 후 |
|------|------|---------|
| 구매 대상 | 정치인 본인만 | 정치인 + 일반 회원 |
| 일반인 인증 | - | 사이트 회원 로그인 (Supabase Auth) |
| 기본 가격 | 100만원 | **200만원** |
| 할인 | 회차별 10만원, 최저 50만원 | 회차별 10만원, 최저 **100만원** |
| 회차 기준 | 정치인별 (politician_id) | **구매자별 (buyer_email)** |
| 정치인 인증 | 이메일 인증 | 동일 (변경 없음) |
| 결제 방식 | 무통장입금 | 동일 (변경 없음) |

### 수정된 파일 목록

#### 프론트엔드
1. **`1_Frontend/src/app/politicians/[id]/page.tsx`** (740~808행)
   - 가격: ₩1,000,000 → ₩2,000,000
   - 안내사항: "정치인 본인만" → "정치인 본인 또는 회원 누구나"
   - 인증 방식: "정치인: 이메일 인증 / 일반 회원: 로그인 필요"
   - 할인: "최소 50만원" → "최소 100만원"
   - 보고서 목차(7개 항목) 추가

2. **`1_Frontend/src/app/report-purchase/page.tsx`** (전면 재작성)
   - 구매자 유형 선택 (정치인/일반회원) 추가
   - 일반 회원: useAuth() 로그인 확인 → 이메일 인증 건너뜀 → 결제
   - 정치인: 기존 이메일 인증 플로우 유지
   - 동적 단계 표시 (일반회원 3단계 / 정치인 4단계)
   - 보고서 목차 표시 추가

#### API 라우트
3. **`1_Frontend/src/app/api/report-purchase/route.ts`** (전면 재작성)
   - buyer_type ('politician' | 'member') 필드 추가
   - user_id (일반 회원용) 필드 추가
   - verification_id를 optional로 (일반 회원은 불필요)
   - 인증 분기: 정치인=이메일인증, 일반회원=requireAuth()
   - 회차 카운트: buyer_email 기준

4. **`1_Frontend/src/app/api/report-purchase/count/route.ts`**
   - 파라미터: politician_id → buyer_email
   - 쿼리: .eq('politician_id') → .eq('buyer_email')

5. **`1_Frontend/src/app/api/report-purchase/send-code/route.ts`**
   - 가격 함수: 200만원/100만원 최저
   - 회차 카운트: buyer_email 기준

#### DB 마이그레이션
6. **`0-4_Database/Supabase/migrations/081_add_buyer_type_to_report_purchases.sql`** (신규)
   - buyer_type VARCHAR(20) DEFAULT 'politician'
   - user_id UUID REFERENCES auth.users(id)
   - buyer_email + payment_confirmed 인덱스

### 검증 결과
- `npm run build` ✅ 성공 (에러/경고 없음)

### 다음 작업
- Supabase에 마이그레이션 081 적용 필요
- 정치인 구매 플로우 E2E 테스트
- 일반 회원 구매 플로우 E2E 테스트
- 회차 할인 확인 (buyer_email 기준)

---

## 세션: 2026-02-26 - 정원오 보고서 HTML 경쟁자 비교 콘텐츠 마이그레이션

### 작업 요약
정원오_20260221_B.html 파일에서 섹션 5(경쟁자 비교) 외 위치에 있던 경쟁자 비교 콘텐츠를 모두 섹션 5로 이관.

### 변경된 파일
- `0-3_AI_Evaluation_Engine/설계문서_V7.0/V40/보고서/정원오_20260221_B.html`

### 수정 내용

#### 섹션별 제거된 경쟁자 참조

| 위치 | 기존 내용 | 변경 후 |
|------|----------|---------|
| 커버 페이지 | `4인 평가 중 1위` | `경쟁자 비교: 섹션 5 참조` |
| 섹션 4 - 비전 한계 | `4인 비교에서 오세훈(80점)에 4점 뒤짐 — 유일한 열세 카테고리` | 제거 (정원오 한계만 유지) |
| 섹션 4 - 청렴성 강점 | `4인 중 청렴성 1위` | `장기 일관성 유지` (정원오 개인 평가) |
| 섹션 4 - 청렴성 AI특이점 | `타 후보 대비 현저히 적음` | `부정 보도가 현저히 적음` |
| 섹션 4 - 윤리성 4인순위 | `박주민(71) > 정원오(69) > 조은희·오세훈(66)` | `개선 방향` 박스로 대체 |
| 섹션 4 - 투명성 일관성분석 | `4인 중 투명성 1위(80점). 박주민(79점)과 1점 차` | `AI별 편차` 분석으로 대체 |
| 섹션 4 - 대응성 압도적우위 | `정원오 82점 vs 조은희·박주민·오세훈 75점. 격차 7점` | `데이터 특이점` (정원오 AI 점수) |
| 섹션 6 - 등급기준표 | `4인 중 유일한 E등급 — 나머지 3인(박주민 753, 조은희 745, 오세훈 732)` | D등급 개선 여지로 대체 |

#### 섹션 5에 추가된 콘텐츠
기존 비교 테이블 + 요약 3개 박스에 더해 다음 추가:
- `종합 점수 및 등급 비교` (4인 점수/등급 순위 상세)
- `카테고리별 순위 비교 — 이전 분석 통합` (10개 카테고리 개별 4인 비교 박스)
- `비교 총평` (강점 요약 + 취약점 요약)

### 검증 결과
- 섹션 1-4, 6-8에 경쟁자 이름(조은희, 박주민, 오세훈) 0개 잔존 확인
- 섹션 5만 경쟁자 참조 존재

---

## 세션: 2026-02-26 - 박주민 HTML 보고서 구조 개편 및 경쟁자 콘텐츠 마이그레이션

### 작업 대상
`0-3_AI_Evaluation_Engine/설계문서_V7.0/V40/보고서/박주민_20260221_B.html`

### 완료된 변경 사항

#### Part A: 구조적 변경
- **A1 TOC 업데이트**: 8개 항목으로 확장 (기존 7개), 섹션명 변경 반영
- **A2 섹션 2 제목**: "종합 점수" → "종합 평균점수 및 AI별 평가 점수", claim-label "종합 평균점수"
- **A3 섹션 3 제목**: "카테고리별 점수" → "카테고리별 평가 점수"
- **A4 섹션 6/7 스왑**: 등급 기준표(구 섹션7)가 섹션6으로, 평가 방법론(구 섹션6)이 섹션7로 이동, "이론적 근거" 섹션 추가
- **A5 섹션 8 신설**: "평가의 한계 및 유의사항" (한계 4개 + 유의사항 4개 불릿)
- **A6 푸터 간소화**: 유의사항 내용 제거, copyright/브랜딩만 유지

#### Part B: 경쟁자 콘텐츠 마이그레이션
- 커버 페이지: "4인 평가 중 2위" 제거
- 섹션 2: "4인 중 2위", "4인 중 두 번째로 큰 편차" 경쟁자 참조 제거
- 섹션 3: "정원오가 80점대 카테고리 6개를 보유" 경쟁자 참조 제거
- 섹션 4 전문성: "4인 비교" claim 박스 → 박주민 개별 분석으로 교체
- 섹션 4 윤리성: "4인 중 1위" 헤더 제거, 경쟁자 비교 텍스트 제거
- 섹션 4 책임감: "4인 중 최하위" 헤더/분석 제거
- 섹션 4 투명성: "4인 순위" 경쟁자 참조 제거

#### 섹션 5 강화 (마이그레이션된 콘텐츠)
- 종합 점수 순위 비교 (4인 서술)
- AI별 종합 점수 4인 비교표 (Claude/ChatGPT/Gemini/Grok × 4인)
- 카테고리별 4인 비교표 (기존 테이블 유지)
- 점수 분포 구조 비교 (80점대 카테고리 보유 현황)
- 카테고리별 순위 비교 (1위/2위권/구조적 열세)
- 상세 분석 비교 (야권 포지셔닝, 전문성 유형, 비전 이견, AI 편차)

### 검증 결과
- 섹션 1-4, 6-8에 경쟁자 이름(정원오, 조은희, 오세훈) 0개 잔존 확인
- 섹션 5(lines 1135-1369)에만 경쟁자 참조 집중
- 총 파일 길이: 1,504줄 (원본 1,380줄에서 증가)
- 섹션 5가 기존 대비 약 3배 분량으로 확장됨

---

## 세션: 2026-02-26 - 오세훈 HTML 보고서 경쟁자 콘텐츠 마이그레이션

### 작업 대상
`0-3_AI_Evaluation_Engine/설계문서_V7.0/V40/보고서/오세훈_20260221_B.html`

### 완료된 변경 사항

#### 섹션별 제거된 경쟁자 참조

| 위치 | 기존 내용 | 변경 후 |
|------|----------|---------|
| 섹션 2 - 4인 종합 순위 테이블 | 4인 전체 점수/등급 비교 테이블 | 섹션 5 링크 참조 박스로 대체 |
| 섹션 4 - 공익성 헤더 | "4인 중 최하위" | 제거 |
| 섹션 4 - 공익성 한계 | "정원오 83 > 박주민 81 > 조은희 78 > 오세훈 77" | 제거 |
| 섹션 4 - 전문성 한계 | "정원오(81점)가 도시공학 단일 분야..." | 오세훈 개별 분석으로 재작성 |
| 섹션 4 - 책임감 한계 | "4인 순위: 정원오(81) > 조은희(79) > 오세훈·박주민(75)" | 제거 |
| 섹션 4 - 투명성 AI특이점 | "4인 순위: 정원오(80) > 박주민(79) > 조은희(76) > 오세훈(71)" | 오세훈 개별 분석으로 대체 |
| 섹션 4 - 리더십 "4인 순위" 박스 | 전체 박스 제거 | 제거 |
| 섹션 4 - 청렴성 AI일치분석 | "4인 순위: 정원오(73) > 박주민(71) > 조은희(68) > 오세훈(66)" | 제거 |
| 섹션 4 - 윤리성 헤더 | "4인 공동 최하위 (조은희와 동점)" | "청렴성과 함께 최하위 카테고리"로 대체 |
| 섹션 4 - 윤리성 "4인 비교" 박스 | 경쟁자 순위 비교 전체 | 오세훈 AI 점수 특이점 분석으로 교체 |
| 섹션 6 - 등급 위치 | "E등급인 1위 정원오(785점)와 53점 차. 3위 조은희(745점)와 13점, 2위 박주민(753점)과 21점" | 섹션 5 링크로 대체 |

#### 섹션 5에 추가된 콘텐츠 (대폭 확장)
- 4인 종합 순위 상세 테이블 (비고 컬럼 포함)
- 4인 점수 차이 분석 박스 (정원오 53점·박주민 21점·조은희 13점 차)
- 카테고리별 4인 순위 비교 테이블 (오세훈 순위 컬럼 추가)
- 카테고리별 4인 순위 상세 분석 (cat-detail 박스 6개):
  - 비전 1위 분석 (비전의 역설 포함)
  - 소통능력 2위 분석
  - 공익성 4위(최하위) 분석
  - 투명성·리더십 4위 분석 (2개 항목)
  - 청렴성·윤리성 4위 분석 (조은희 공동 최하위 포함)
  - 책임감 공동 3위 분석
- 경쟁자 비교 분석 요약 (비전 강점 · 9개 최하위 구조 · 국민의힘 포지셔닝 · 정원오와 53점 격차)

### 검증 결과
- 섹션 1-4, 6-8에 경쟁자 이름(정원오, 박주민, 조은희) 0개 잔존 확인
- 섹션 5에만 경쟁자 참조 집중
- 섹션 5가 기존 3개 박스에서 10개 이상 분석 박스+2개 테이블로 대폭 확장됨
