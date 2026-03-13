# V60 CCI — Candidate Relative Competitive Index

## 핵심 구조

```
CCI = GPI(40%) + Alpha 1(30%) + Alpha 2(30%)

GPI (40%) — 훌륭한 정치인 지수
├── 적격성 30%: expertise, leadership, vision
├── 도덕성 40%: integrity, ethics, accountability, transparency
└── 진정성 30%: communication, responsiveness, publicinterest

Alpha 1: 민심·여론 (30%)
├── opinion   — 여론동향
├── media     — 이미지·내러티브
└── risk      — 리스크

Alpha 2: 선거구조 (30%)
├── party     — 정당경쟁력
├── candidate — 후보자경쟁력
└── regional  — 지역기반
```

## 보고서 듀얼 구조

| 보고서 | 대상 | 공개 | AI 평가 |
|--------|------|------|---------|
| **Type A: GPI 보고서** | 시민 | GitHub Pages (공개) | 4개 AI (객관성) |
| **Type B: CCI 전략보고서** | 정치인 전용 | 비공개 (유료) | Claude 단독 (일관성) |

## 디렉토리 구조

```
V60_CCI/
├── README.md                          ← 이 파일
├── CCI_전체구조.md                     ← CCI 개념 설계
├── CCI_V60_아키텍처.html              ← 아키텍처 뷰어
├── V60_CCI_아키텍처_전체구조도.svg     ← SVG 다이어그램
├── Alpha_데이터수집_소스.md            ← 수집 소스 정의
├── Alpha_상대평가_방법론.md            ← 상대평가 방법론
├── CCI_당선예측_근거.md               ← 학술 근거
│
├── database/
│   └── v60_cci_schema.sql             ← 8개 테이블 + 1 뷰
│
├── instructions/
│   ├── CCI_기본방침.md                ← 핵심 규칙
│   ├── a1_opinion_eval.md             ← 여론동향 평가 기준
│   ├── a1_media_eval.md               ← 이미지·내러티브 평가 기준
│   ├── a1_risk_eval.md                ← 리스크 평가 기준
│   ├── a2_party_eval.md               ← 정당경쟁력 평가 기준
│   ├── a2_candidate_eval.md           ← 후보자경쟁력 평가 기준
│   └── a2_regional_eval.md            ← 지역기반 평가 기준
│
├── scripts/
│   ├── helpers/
│   │   ├── common_cci.py              ← 공통 모듈 (DB, 상수, 유틸)
│   │   └── alpha_eval_helper.py       ← Alpha 평가 헬퍼 (fetch/save/status)
│   │
│   ├── collect/
│   │   └── collect_alpha.py           ← Alpha 데이터 수집 (6개 카테고리)
│   │
│   ├── core/
│   │   ├── validate_alpha.py          ← Alpha 데이터 검증 (Phase 2)
│   │   ├── adjust_alpha.py            ← 검증 후 조정 (Phase 2-2) ← NEW
│   │   ├── validate_alpha_eval.py     ← 평가 결과 검증 (Phase 3-2) ← NEW
│   │   ├── calculate_cci_scores.py    ← CCI 점수 계산
│   │   └── generate_cci_report.py     ← CCI 전략보고서 생성
│   │
│   └── utils/
│       ├── register_competitor_group.py ← 경쟁자 그룹 등록
│       └── check_cci_status.py         ← 전체 상태 확인
│
└── .claude/
    └── skills/
        └── evaluate-cci-v60.md         ← CCI 평가 스킬
```

## 프로세스 순서 (V40 동일 프로세스)

```
Phase 0: 경쟁자 그룹 등록
  ↓
Phase 1: Alpha 데이터 수집 (120개/카테고리, 뉴스+블로그+카페+공공API)
  ↓
Phase 2: Alpha 데이터 검증 (중복/기간 제거)
  ↓
Phase 2-2: 검증 후 조정 (초과 삭제/부족 재수집, 최대 4회) ← NEW
  ↓
Phase 3: Alpha 평가 🚨 반드시 플래툰 포메이션! (정치인별 분대 + 카테고리별 분대원 병렬)
  ↓
Phase 3-2: 평가 결과 검증 (편향/X과다/reasoning 누락 감지) ← NEW
  ↓
Phase 4: CCI 점수 계산 (GPI×0.4 + A1×0.3 + A2×0.3)
  ↓
Phase 4.5: 🛑 PO 승인 게이트 — CCI 결과 보고 후 PO 승인 대기 (인간 개입 필수!)
  ↓
Phase 5: CCI 전략보고서 생성
```

**전제조건:** GPI(V40 파이프라인)가 완료되어야 CCI 계산 가능

## 빠른 실행

```bash
# 1. 그룹 등록
cd scripts/utils
python register_competitor_group.py create \
  --group-name "2026 서울시장" \
  --election-type "지방선거" --region "서울특별시" \
  --election-date "2026-06-03" \
  --politician-ids 17270f25,de49f056,eeefba98

# 2. Alpha 수집 (120개/카테고리, 뉴스+블로그+카페+공공API)
cd ../collect
python collect_alpha.py --group-name "2026 서울시장" --category all

# 3. Alpha 검증 (Phase 2)
cd ../core
python validate_alpha.py --group-name "2026 서울시장" --no-dry-run

# 3-2. Alpha 조정 (Phase 2-2)
python adjust_alpha.py --group-name "2026 서울시장" --no-dry-run

# 4. Alpha 평가 — 플래툰 포메이션 필수! (순차 실행 금지)
# 반드시 /platoon-formation-슈퍼스킬2 스킬로 팀 편성 후 실행
# 구조: 소대장 + N개 분대장(정치인별) + 6개 분대원(카테고리별) 병렬
# 상세: CLAUDE.md, Alpha_상대평가_방법론.md 참조
/evaluate-cci-v60 --group-name="2026 서울시장" --phase=alpha-eval

# 4-2. 평가 결과 검증 (Phase 3-2)
python validate_alpha_eval.py --politician-id 17270f25

# 5. CCI 계산 + 순위
python calculate_cci_scores.py --group-name "2026 서울시장"

# 6. 보고서
python generate_cci_report.py --politician-id 17270f25 --group-name "2026 서울시장"

# 7. 상태 확인
cd ../utils
python check_cci_status.py --group-name "2026 서울시장"
```

## 점수 공식

```python
# GPI, Alpha1, Alpha2 모두 동일 스케일 (200~1000) — 정규화 불필요!

# Alpha 카테고리 점수: (6.0 + avg_score × 0.5) × 100  →  200~1000
# avg_score = rating × 2의 평균 (범위: -8 ~ +8)
# 기준값(0점) = 600점, 최고(+8) = 1000점, 최저(-8) = 200점

# Alpha 합계: 3개 카테고리 균등 평균 (200~1000)
alpha1_total = (opinion + media + risk) / 3
alpha2_total = (party + candidate + regional) / 3

# CCI 통합 점수 (200~1000)
cci_score = gpi_score * 0.4 + alpha1_total * 0.3 + alpha2_total * 0.3
# GPI(40%) + Alpha1(30%) + Alpha2(30%) 동일 스케일 가중합
```
