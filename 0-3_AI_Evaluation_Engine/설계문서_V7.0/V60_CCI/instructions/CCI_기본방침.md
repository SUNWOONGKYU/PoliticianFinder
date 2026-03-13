# CCI V60 기본 방침

**작성일**: 2026-03-11
**버전**: V60 CCI
**목적**: GPI(V60 API) + Alpha 1(민심·여론) + Alpha 2(선거구조) 통합 평가

---

## 1. CCI 핵심 구조

### CCI = GPI(40%) + Alpha 1(30%) + Alpha 2(30%)

```
CCI (Candidate Relative Competitive Index)
│
├── GPI (40%) — 훌륭한 정치인 지수
│   ├── 적격성 30%: expertise, leadership, vision
│   ├── 도덕성 40%: integrity, ethics, accountability, transparency
│   └── 진정성 30%: communication, responsiveness, publicinterest
│
├── Alpha 1: 민심·여론 (30%)
│   ├── opinion  — 여론동향 (여론조사 추이 + 바람 효과)
│   ├── media    — 이미지·내러티브 (미디어 논조 + SNS + 브랜드 일관성)
│   └── risk     — 리스크 (네거티브 취약점 역산)
│
└── Alpha 2: 선거구조 (30%)
    ├── party      — 정당경쟁력 (정당 지지율 + PVI)
    ├── candidate  — 후보자경쟁력 (현직효과 + 인지도 + 공천)
    └── regional   — 지역기반 (연고 + 조직동원력 + 지역 서비스)
```

---

## 2. GPI vs Alpha 근본 차이

| 항목 | GPI | Alpha |
|------|-----|-------|
| **대상** | 시민용 (공개) | 정치인 전용 (비공개) |
| **핵심 가치** | 객관성이 생명 | 전략적 분석이 핵심 |
| **평가 AI** | 4개 AI 다수결 | **Claude 단독** |
| **일관성 보장** | AI 수(4개)로 편향 보정 | **플래툰 포메이션** (소대장 조율) |
| **수집 방식** | V60 API (V40 CLI→API 전환) | 공공 API + 웹 크롤링 |
| **카테고리** | 10개 (고정) | 6개 (3+3) |

---

## 3. 등급 체계 (GPI·Alpha 공통)

```
+4(+8점) 탁월 — 모범 사례, 압도적 1위, 독보적
+3(+6점) 우수 — 구체적 성과, 안정적 선두
+2(+4점) 양호 — 일반적 긍정, 유리한 조건
+1(+2점) 보통 — 기본적 경쟁력, 평균적 상황
-1(-2점) 미흡 — 하락세, 비판, 구조적 약점
-2(-4점) 부족 — 부정 여론 우세, 불리한 구도
-3(-6점) 심각 — 치명적 리스크, 대규모 이탈
-4(-8점) 최악 — 가능성 사실상 없음
X (0점)  제외 — 무관한 데이터
```

**Alpha 레이팅은 상대평가를 반영한다:**
- 같은 여론조사에서 1위 37.8% → +4, 2위 23.7% → +2~+3
- 별도 상대평가 알고리즘(Elo, Z-Score 등) 불필요
- 레이팅 자체가 경쟁 맥락을 반영

---

## 4. 점수 계산

### GPI 점수 (V40과 동일)

```python
PRIOR = 6.0
COEFFICIENT = 0.5

# 카테고리 점수 (20~100점)
category_score = (PRIOR + avg_score * COEFFICIENT) * 10
# avg_score = 해당 카테고리 전체 rating × 2 의 평균

# GPI 최종 점수 (200~1000점)
gpi_score = round(min(sum(10개 카테고리), 1000))
```

### Alpha 점수

```python
# Alpha 소분류별 점수 (200~1000점 — GPI와 동일 스케일!)
alpha_category_score = (PRIOR + avg_score * COEFFICIENT) * 100
# avg_score = rating × 2의 평균 (범위 -8 ~ +8)
# 기준값(0점) = 600점, 최고(+8점) = 1000점, 최저(-8점) = 200점

# Alpha 1 합계 = opinion + media + risk (각 균등 가중, 200~1000)
alpha1_total = (opinion_score + media_score + risk_score) / 3

# Alpha 2 합계 = party + candidate + regional (각 균등 가중, 200~1000)
alpha2_total = (party_score + candidate_score + regional_score) / 3
```

### CCI 통합 점수

```python
# GPI, Alpha1, Alpha2 모두 200~1000 동일 스케일 — 정규화 불필요!

# CCI 통합 점수 (200~1000)
cci_score = gpi_score * 0.4 + alpha1_total * 0.3 + alpha2_total * 0.3
# GPI(40%) + Alpha1(30%) + Alpha2(30%) 가중합
# 예시: GPI=785, Alpha1=670, Alpha2=845 → CCI = 785×0.4 + 670×0.3 + 845×0.3 = 767.5점
```

---

## 5. 경쟁자 그룹 (상대평가 기반)

### 정의
- 같은 선거구에 출마 예상되는 후보들을 하나의 그룹으로 묶음
- CCI 상대평가는 그룹 내에서 수행

### 예시
```
그룹: "2026 서울시장"
├── 정원오 (더불어민주당)
├── 오세훈 (국민의힘)
├── 김문수 (국민의힘)
├── 나경원 (국민의힘)
└── ...
```

### 규칙
- 그룹 최소 2명 이상
- 같은 정치인이 여러 그룹에 속할 수 있음 (예: 서울시장 + 대선)
- Alpha 평가는 반드시 같은 그룹 내 후보를 비교하며 수행

---

## 6. 플래툰 포메이션 (Alpha 평가 구조)

### 3계층 구조

```
소대장 (Opus, Teammate)
├── 평가 기준 통일: 모든 분대장에게 동일한 instruction 하달
├── 교차 검증: 분대장들의 결과를 비교·조율
├── SendMessage 양방향 통신
│
├── 분대장 A (Sonnet, Teammate) — 후보 1
│   ├── 분대원 1 (Haiku, Subagent) — opinion 평가
│   ├── 분대원 2 (Haiku, Subagent) — media 평가
│   ├── 분대원 3 (Haiku, Subagent) — risk 평가
│   ├── 분대원 4 (Haiku, Subagent) — party 평가
│   ├── 분대원 5 (Haiku, Subagent) — candidate 평가
│   └── 분대원 6 (Haiku, Subagent) — regional 평가
│
├── 분대장 B (Sonnet, Teammate) — 후보 2
│   └── (동일 구조)
│
└── ... (경쟁 후보 수만큼 분대)
```

### Teammate vs Subagent

| 역할 | 구현 | 통신 | 수명 |
|------|------|------|------|
| 소대장 | Teammate (SendMessage) | 양방향 | 상주 |
| 분대장 | Teammate (SendMessage) | 양방향 | 상주 |
| 분대원 | Subagent (Task tool) | 결과만 반환 | 일회성 |

### 조율 프로세스

1. **사전 조율**: 소대장 → 전체 분대장에게 동일 평가 기준 broadcast
2. **중간 조율**: 분대장 결과를 소대장이 비교, 이상치 재검토 요청
3. **사후 검증**: 전체 결과 종합, 논리적 일관성 확인

---

## 7. 데이터 수집

### GPI 수집 (V60 API 방식)

V40 CLI → V60 API 전환. 규칙은 V40과 동일:
- 10카테고리 × 100개 = 1,000개/인 (버퍼 20% = 1,200개)
- OFFICIAL 4년 / PUBLIC 2년
- 수집 채널 50-50 분배
- Sentiment: negative / positive / free

### Alpha 수집 (공공 API + 크롤링)

| 카테고리 | 주요 데이터 소스 |
|---------|----------------|
| opinion (여론동향) | NESDC, MBC 여론M, 갤럽, 리얼미터 |
| media (이미지·내러티브) | 빅카인즈, 네이버 뉴스/데이터랩, 썸트렌드 |
| risk (리스크) | 빅카인즈 부정기사, 경실련, 참여연대 |
| party (정당경쟁력) | 선관위 개방포털, 갤럽/리얼미터 정당지지율 |
| candidate (후보자경쟁력) | 열린국회정보, 정치랭크, 선관위 후보자정보 |
| regional (지역기반) | 오픈와치, 후보자정보 API, 빅카인즈 지지선언 |

**상세**: `Alpha_데이터수집_소스.md` 참조

---

## 8. 보고서 체계 (2종)

### Type A: GPI 보고서 (시민용, 공개)
- V40 형식 유지
- GitHub Pages 배포
- GPI 10개 카테고리 점수 + 등급

### Type B: CCI 전략보고서 (정치인 전용, 비공개)
- 6개 섹션:
  1. 종합 대시보드 (CCI 점수 + 경쟁자 매트릭스)
  2. GPI 분석 (기존 GPI 보고서 내용)
  3. Alpha 1 민심·여론 분석
  4. Alpha 2 선거구조 분석
  5. 경쟁자 비교 (레이더 차트, 순위표)
  6. 전략 제언 (강점 활용 + 약점 보완)

---

## 9. DB 테이블 (8개)

| # | 테이블 | 용도 |
|---|--------|------|
| 1 | `competitor_groups_v60` | 경쟁자 그룹 |
| 2 | `collected_data_v60` | GPI 수집 데이터 |
| 3 | `evaluations_v60` | GPI 평가 결과 |
| 4 | `ai_final_scores_v60` | GPI 최종 점수 |
| 5 | `collected_alpha_v60` | Alpha 수집 데이터 |
| 6 | `evaluations_alpha_v60` | Alpha 평가 결과 |
| 7 | `alpha_scores_v60` | Alpha 소분류 점수 |
| 8 | `cci_scores_v60` | CCI 최종 통합 점수 |

**스키마 상세**: `database/v60_cci_schema.sql` 참조

---

## 10. 프로세스 순서 (절대 건너뛰기 금지!)

```
Phase G-0: 정치인 등록 + 경쟁자 그룹 등록
     ↓
Phase G-1: GPI 데이터 수집 (V60 API)
     ↓
Phase G-2/2-2: GPI 검증 + 조정
     ↓
Phase G-3: GPI AI 평가 (4AI 다수결)
     ↓
Phase G-4: GPI 점수 계산
     ↓
Phase A-1: Alpha 데이터 수집 (공공 API + 크롤링)
     ↓
Phase EVAL: Alpha 플래툰 평가 (Claude 단독)
     ↓
Phase CCI-1: CCI 통합 점수 계산
     ↓
Phase CCI-2: 보고서 생성 (GPI 공개 + CCI 비공개)
```

### 완료 조건

- **Phase G-0**: politicians 12필드 NOT NULL + competitor_groups 최소 2명
- **Phase G-1**: 카테고리별 100개+ (버퍼 120개 권장)
- **Phase G-2/2-2**: 중복·기간위반 제거 + 50개↑/카테고리 달성
- **Phase G-3**: 4AI × 전체 수집데이터 = 평가 완료
- **Phase G-4**: ai_final_scores_v60 저장 확인
- **Phase A-1**: 6개 Alpha 카테고리 수집 완료
- **Phase EVAL**: 플래툰 평가 완료 (소대장 최종 검증)
- **Phase CCI-1**: cci_scores_v60 저장 + 그룹 내 순위
- **Phase CCI-2**: GPI 보고서 + CCI 전략보고서 생성

---

## 11. 비용 구조

| 항목 | 비용 |
|------|------|
| Claude (GPI 평가 + Alpha 평가) | $0 (구독) |
| Gemini (GPI 평가) | ~$0.19/1K tokens |
| ChatGPT (GPI 평가) | ~$1.125/1K tokens |
| Grok (GPI 평가) | ~$0.54/정치인 |
| 공공 API (Alpha 수집) | 대부분 무료 |
| Supabase | ~$25/월 (Pro) |
| **10명 후보 총 비용** | **~$4.80 + $25/월** |

---

## 12. CRITICAL RULES (DB)

- `politician_id`: TEXT 8자리 hex (**INTEGER 절대 금지**)
- `rating`: TEXT '+4'~'-4', 'X' (**숫자 변환 금지**)
- `evaluator_ai`: 'Claude' / 'ChatGPT' / 'Gemini' / 'Grok' (시스템명)
- Alpha `evaluator_ai`: 'Claude' 고정 (Claude 단독)
- Supabase 1000행 제한 → `.range()` pagination 필수
- `sentiment`: 'negative' / 'positive' / 'free' (**'neutral' 사용 금지**)
- Phase 순서 건너뛰기 절대 금지

---

**작성일**: 2026-03-11
