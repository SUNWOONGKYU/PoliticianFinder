# 설계문서 V7.0 - AI 평가 엔진

**버전**: V7.0 (수집 규칙 V26.0)
**작성일**: 2026-01-04
**이전 버전**: V6.0 (수집 규칙 V24.0/V25.0)

---

## 핵심 변경사항 (V6.0 → V7.0)

| 항목 | V6.0 | V7.0 |
|------|------|------|
| AI 개수 | 3개 (Claude, ChatGPT, Grok) | **4개 (+Gemini)** |
| OFFICIAL 기간 | 제한 없음 | **평가일 기준 4년 이내** |
| PUBLIC 기간 | 제한 없음 | **평가일 기준 1년 이내** |
| 수집 규칙 | V24.0/V25.0 | **V26.0** |
| 데이터 풀 | 150개/카테고리 | **200개/카테고리** |

---

## 디렉토리 구조

```
설계문서_V7.0/
├── README.md                       ← 현재 파일
├── CLAUDE.md                       ← Claude Code 작업 지침
│
├── V26_수집지침_및_프로세스.md     ← 핵심: 기간 제한 + 4개 AI 규칙
├── V26_멀티AI_구현계획.md          ← Gemini 추가된 4개 AI 체제
│
├── 30명_정치인_명단.md             ← 평가 대상 정치인
├── 등급체계_10단계_200-1000점_V24.md ← 점수 → 등급 변환
├── V24_점수계산_알고리즘_상세가이드.md ← 점수 계산 (V24와 동일)
├── V24_전체_카테고리_정의_개선_완료.md ← 10개 카테고리 정의
│
├── Database/                        ← DB 스키마 및 마이그레이션
│   ├── DB_SCHEMA.md
│   ├── migration_v24_to_v26.sql    ← V24 백업 SQL
│   └── 스키마정의/
│
├── instructions/                    ← 10개 카테고리 평가 인스트럭션
│   ├── category_1_expertise.md
│   ├── category_2_leadership.md
│   └── ... (10개)
│
├── 실행스크립트/                    ← V26.0 수집 스크립트
│   ├── collect_v26_claude.py       ← Claude 수집
│   ├── collect_v26_chatgpt.py      ← ChatGPT 수집
│   ├── collect_v26_grok.py         ← Grok 수집
│   ├── collect_v26_gemini.py       ← Gemini 수집 (신규)
│   ├── collect_v26_all.py          ← 4개 AI 일괄 수집
│   ├── backup_v24_data.py          ← V24 데이터 백업
│   ├── clear_for_v26.py            ← V26 수집 전 초기화
│   ├── calculate_v24_scores_correct.py ← 점수 계산
│   └── generate_ranking_simple.py  ← 순위 생성
│
└── 연구자료/                        ← 학술 근거
    ├── 10개카테고리_선정근거.md
    ├── Bayesian_Prior_이론적_근거.md
    └── ...
```

---

## 빠른 시작

### 1. 환경 설정

```bash
# 필요한 API 키 설정 (.env 파일)
ANTHROPIC_API_KEY=sk-ant-...      # Claude
OPENAI_API_KEY=sk-...              # ChatGPT
XAI_API_KEY=xai-...                # Grok
GEMINI_API_KEY=AIza...             # Gemini (신규)
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 2. V24.0 데이터 백업 (기존 데이터가 있는 경우)

```bash
cd 설계문서_V7.0/실행스크립트

# 백업 실행
python backup_v24_data.py

# 백업 확인
python backup_v24_data.py --verify

# 원본 테이블 초기화 (주의!)
python clear_for_v26.py --confirm
```

### 3. V26.0 데이터 수집

```bash
# 개별 AI 수집
python collect_v26_claude.py --politician_id=62e7b453 --politician_name="오세훈"
python collect_v26_chatgpt.py --politician_id=62e7b453 --politician_name="오세훈"
python collect_v26_grok.py --politician_id=62e7b453 --politician_name="오세훈"
python collect_v26_gemini.py --politician_id=62e7b453 --politician_name="오세훈"

# 4개 AI 일괄 수집 (순차)
python collect_v26_all.py --politician_id=62e7b453 --politician_name="오세훈"

# 4개 AI 일괄 수집 (병렬 - 빠름)
python collect_v26_all.py --politician_id=62e7b453 --politician_name="오세훈" --parallel
```

### 4. 점수 계산

```bash
python calculate_v24_scores_correct.py
```

---

## V26.0 기간 제한

### 규칙

| 데이터 유형 | 기간 제한 | 예시 (2026-01-04 기준) |
|-------------|-----------|------------------------|
| OFFICIAL | 평가일 기준 4년 | 2022-01-04 ~ 2026-01-04 |
| PUBLIC | 평가일 기준 1년 | 2025-01-04 ~ 2026-01-04 |

### 근거

**OFFICIAL 4년**:
- 지방자치단체장/국회의원 임기 = 4년
- 한 임기 동안의 실적 평가에 충분

**PUBLIC 1년**:
- 언론 보도는 최신성이 중요
- 1년 전 SNS 게시물은 현재 입장과 다를 수 있음
- 변별력 향상

---

## 4개 AI 체제

| AI | 모델 | 특징 |
|----|------|------|
| Claude | claude-haiku-4-5-20251001 | 균형잡힌 평가 |
| ChatGPT | gpt-4o-mini | 보수적 평가 |
| Grok | grok-3-mini | 현실감 있는 평가 |
| **Gemini** | gemini-2.5-flash | 빠른 처리, 비용 효율 |

---

## 관련 문서

### 필수 참조
- `V26_수집지침_및_프로세스.md` - 수집 규칙 상세
- `V26_멀티AI_구현계획.md` - 4개 AI 체제 상세
- `CLAUDE.md` - Claude Code 작업 지침

### 유지 (V6.0과 동일)
- `V24_점수계산_알고리즘_상세가이드.md` - 점수 계산
- `등급체계_10단계_200-1000점_V24.md` - 등급 체계
- `instructions/` - 카테고리별 평가 기준

---

**최종 업데이트**: 2026-01-04
