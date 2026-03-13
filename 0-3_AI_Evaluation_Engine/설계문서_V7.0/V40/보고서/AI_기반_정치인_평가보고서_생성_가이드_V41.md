# AI 기반 정치인 평가보고서 생성 가이드 V41 (Type B 전용)

**작성일**: 2026-02-18 (최종 수정: 2026-02-26)
**버전**: V41.1
**목적**: Type B (상세본) HTML 보고서의 표준 구조 정의

---

## 핵심 철학

> **"조언하지 않는다. 증명할 뿐이다."**

이 시스템은 **데이터 분석 서비스**입니다. 컨설팅 서비스가 아닙니다.

### 우리가 하는 것 vs 하지 않는 것

| 구분 | 내용 |
|------|------|
| ✅ **하는 것** | 데이터 수집, AI 평가, 점수 계산, 분석 결과 제시 |
| ❌ **하지 않는 것** | 전략 제언, 개선 방향, 강화 방향, 행동 권고 |

### 80/20 원칙

| 비중 | 역할 | 화법 |
|------|------|------|
| **80%** | 냉정한 팩트 진단 | 수치, 순위, 백분위만 |
| **20%** | 데이터 시사점 | "관찰됩니다(Observed)"만 허용 |

### 금지 사항 (예외 없음)

1. **전략 제언 완전 금지**: "~하세요", "~를 강화하세요", "~방향으로" 등 일체 금지
2. **개선 방향 완전 금지**: "개선 방향", "강화 방향" 섹션 자체 금지
3. **주관적 형용사 금지**: "안타깝게도", "훌륭하게도" 등
4. **학술 통계 용어 금지**: p-value, t-test 등 → 직관적 점수/순위로 대체
5. **미확인 사실 금지**: 수집 데이터에 없는 내용 추론/삽입 금지

---

## Type B — 상세본 (당사자 전용)

| 항목 | 내용 |
|------|------|
| **대상** | 정치인 본인 및 캠프 |
| **공개 범위** | 비공개 (당사자 한정) |
| **분량** | 약 1,200~1,400줄 (HTML) |
| **목적** | 전체 데이터를 깊이 있게 분석한 결과 제공 |
| **톤** | 전문적, 분석적 (제언 없음) |
| **파일명** | `{정치인명}_{YYYYMMDD}_B.html` |

---

## HTML 보고서 전체 구조

```
커버 페이지
목차 (TOC)
섹션 1. 정치인 프로필                    (~50줄)
섹션 2. 종합 평균점수 및 AI별 평가 점수   (~40줄)
섹션 3. 카테고리별 평가 점수              (~90줄)
섹션 4. 카테고리별 상세 분석             (~300줄)
섹션 5. 경쟁자 비교 / 평가 점수 구조 분석 (~100줄)  ← 택1
섹션 6. 등급 기준표                      (~60줄)
섹션 7. 평가 방법론 및 이론적 근거        (~80줄)
섹션 8. 평가의 한계 및 유의사항           (~30줄)  ← 법적 필수
푸터
PDF 다운로드 버튼

총: 약 1,200~1,400줄
```

**섹션 5 분기 규칙:**
- 경쟁자 비교 대상이 있는 보고서 → `5. 경쟁자 비교 ({N}인)`
- 경쟁자 비교 대상이 없는 보고서 → `5. 평가 점수 구조 분석`
- **경쟁자 관련 내용은 섹션 5에서만 다룸. 다른 섹션에 경쟁자 내용 포함 금지.**

---

### 커버 페이지

```html
<div class="cover">
  <div class="cover-badge">PoliticianFinder · AI 평가보고서 V40 · {YYYY-MM-DD}</div>
  <div class="cover-title">{정치인명}</div>
  <div class="cover-subtitle">{정당} · {현직} · {지역구}</div>

  <div class="cover-score-box">
    <div class="cover-score-num">{점수}점</div>
    <div class="cover-score-grade">{등급} ({등급명}) · 경쟁자 비교: 섹션 5 참조</div>
  </div>

  <div class="cover-meta">
    <!-- 5개 메타 항목 (순서 고정) -->
    <div class="cover-meta-item">
      <div class="cover-meta-label">출마 직종</div>
      <div class="cover-meta-value">{광역단체장/기초단체장/...}</div>
    </div>
    <div class="cover-meta-item">
      <div class="cover-meta-label">출마 지역</div>
      <div class="cover-meta-value">{서울특별시/고양시/...}</div>
    </div>
    <div class="cover-meta-item">
      <div class="cover-meta-label">평가 AI</div>
      <div class="cover-meta-value">Claude · ChatGPT · Gemini · Grok</div>
    </div>
    <div class="cover-meta-item">
      <div class="cover-meta-label">수집 채널</div>
      <div class="cover-meta-value">Gemini CLI 50% + Naver API 50%</div>
    </div>
    <div class="cover-meta-item">
      <div class="cover-meta-label">데이터 규모</div>
      <div class="cover-meta-value">약 {N}개 수집 → {N}건 평가</div>
    </div>
  </div>
</div>
```

**규칙:**
- cover-meta 5개 항목 순서: 출마 직종 → 출마 지역 → 평가 AI → 수집 채널 → 데이터 규모
- 출마 직종/출마 지역은 DB `politicians` 테이블의 `title`/`region` 필드
- cover-score-grade에 "경쟁자 비교: 섹션 5 참조" 포함 (경쟁자 있는 경우)

---

### 목차 (TOC)

```html
<div class="toc">
  <div class="toc-title">목차</div>
  <ol>
    <li><a href="#sec1">정치인 프로필</a></li>
    <li><a href="#sec2">종합 평균점수 및 AI별 평가 점수</a></li>
    <li><a href="#sec3">카테고리별 평가 점수</a></li>
    <li><a href="#sec4">카테고리별 상세 분석</a></li>
    <li><a href="#sec5">경쟁자 비교 ({N}인)</a></li>
    <li><a href="#sec6">등급 기준표</a></li>
    <li><a href="#sec7">평가 방법론 및 이론적 근거</a></li>
    <li><a href="#sec8">평가의 한계 및 유의사항</a></li>
  </ol>
</div>
```

---

### B-1. 정치인 프로필

```html
<h1 id="sec1">1. 정치인 프로필</h1>

<!-- 9개 info-field (순서 고정) -->
<div class="info-field">
  <div class="info-label">이름</div>
  <div class="info-value">{이름}</div>
</div>
<div class="info-field">
  <div class="info-label">소속 정당</div>
  <div class="info-value">{정당}</div>
</div>
<div class="info-field">
  <div class="info-label">현직</div>
  <div class="info-value">{현직}</div>
</div>
<div class="info-field">
  <div class="info-label">지역구</div>
  <div class="info-value">{지역구}</div>
</div>
<div class="info-field">
  <div class="info-label">출마 직종</div>
  <div class="info-value">{출마 직종}</div>
</div>
<div class="info-field">
  <div class="info-label">출마 지역</div>
  <div class="info-value">{출마 지역}</div>
</div>
<div class="info-field">
  <div class="info-label">이전 직책</div>
  <div class="info-value">{이전 직책}</div>
</div>
<div class="info-field">
  <div class="info-label">학력</div>
  <div class="info-value">{학력}</div>
</div>
<div class="info-field">
  <div class="info-label">핵심 경력</div>
  <div class="info-value">{주요 경력 3~5개, 쉼표 구분}</div>
</div>

<h2>평가 배경</h2>
<p>{해당 정치인의 정치적 위치·경력 맥락 서술. 3~5문장. 관찰 화법.}</p>
```

**규칙:**
- info-field 9개 항목, 순서 고정: 이름 → 소속 정당 → 현직 → 지역구 → 출마 직종 → 출마 지역 → 이전 직책 → 학력 → 핵심 경력
- 출마 직종/출마 지역: DB `politicians` 테이블의 `title`/`region` 필드
- 평가 배경: 해당 정치인 본인의 맥락만 서술 (경쟁자 언급 금지)
- 제언/권고 금지

---

### B-2. 종합 평균점수 및 AI별 평가 점수

```html
<h1 id="sec2">2. 종합 평균점수 및 AI별 평가 점수</h1>

<!-- 종합 평균점수 -->
<div class="claim claim-independent">
  <div class="claim-label">종합 평균점수</div>
  4개 AI 평균 <strong>{점수}점</strong> | 등급: <strong>{등급} ({등급명})</strong>
</div>

<!-- AI별 점수 카드 (4장) -->
<div class="ai-cards">
  <div class="ai-card">
    <div class="ai-card-name">Claude</div>
    <div class="ai-card-score">{점수}점</div>
    <div class="ai-card-desc">{한줄 평가 경향}</div>
  </div>
  <div class="ai-card">
    <div class="ai-card-name">ChatGPT</div>
    <div class="ai-card-score">{점수}점</div>
    <div class="ai-card-desc">{한줄 평가 경향}</div>
  </div>
  <div class="ai-card">
    <div class="ai-card-name">Gemini</div>
    <div class="ai-card-score">{점수}점</div>
    <div class="ai-card-desc">{한줄 평가 경향}</div>
  </div>
  <div class="ai-card">
    <div class="ai-card-name">Grok</div>
    <div class="ai-card-score">{점수}점</div>
    <div class="ai-card-desc">{한줄 평가 경향}</div>
  </div>
</div>

<!-- AI 간 편차 분석 -->
<div class="claim claim-independent">
  <div class="claim-label">AI 간 편차 분석</div>
  최대 편차 <strong>{N}점</strong> ({최고AI} {점수} - {최저AI} {점수}). {편차 원인 관찰 서술.}
</div>
```

**규칙:**
- **종합 평균점수를 먼저 표시** (4AI 평균 + 등급)
- AI별 점수는 **카드(ai-card) 형태** (테이블 아님)
- 카드 순서: Claude → ChatGPT → Gemini → Grok
- AI 간 편차 원인 분석 (관찰 화법)
- **경쟁자 비교 내용 포함 금지** (섹션 5에서만 다룸)

---

### B-3. 카테고리별 평가 점수

```html
<h1 id="sec3">3. 카테고리별 평가 점수</h1>

<!-- CSS 막대 차트 (점수 높은 순) -->
<div class="bar-chart">
  <div class="bar-row">
    <div class="bar-label">{카테고리}</div>
    <div class="bar-track">
      <div class="bar-fill bar-fill-top" style="width:{점수}%"><span>{점수}점 ★</span></div>
    </div>
  </div>
  <!-- ... 10개 카테고리, 점수 높은 순 정렬 -->
  <!-- 최하위: bar-fill 색상 연하게 -->
</div>

<!-- 카테고리별 AI 점수 상세표 -->
<h2>카테고리별 AI 점수 상세표</h2>
<table>
  <thead>
    <tr>
      <th>카테고리</th>
      <th>Claude</th>
      <th>ChatGPT</th>
      <th>Gemini</th>
      <th>Grok</th>
      <th class="highlight-col">평균</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>{카테고리} ★</td>
      <td>{점수}</td><td>{점수}</td><td>{점수}</td><td>{점수}</td>
      <td class="highlight-col">{점수}</td>
    </tr>
    <!-- ... 10개 카테고리 -->
  </tbody>
</table>

<!-- 점수 구조 해석 -->
<div class="claim">
  <div class="claim-label">점수 구조 해석</div>
  <strong>80점 이상 ({N}개):</strong> {카테고리 목록}<br>
  <strong>70점대 ({N}개):</strong> {카테고리 목록}<br>
  <strong>60점대 ({N}개):</strong> {카테고리 목록}<br><br>
  {구조적 특징 관찰. 1~2문장.}
</div>
```

**규칙:**
- 막대 차트: 점수 높은 순 정렬, ★ 최고 / 최하위는 색상 연하게
- AI 점수 상세표: 5열 (Claude, ChatGPT, Gemini, Grok, 평균)
- 평균 열은 `highlight-col` 클래스로 강조
- 점수 구조 해석: 점수 구간별 분포 요약

---

### B-4. 카테고리별 상세 분석

```html
<h1 id="sec4">4. 카테고리별 상세 분석</h1>

<!-- 카테고리 1개당 구조 (10개 반복) -->
<div class="cat-detail">
  <div class="cat-detail-header">
    <div class="cat-detail-name">{카테고리명} ({영문명}) {★ 최고 점수 / ⚠️ 최하위}</div>
    <div class="cat-detail-score">{점수}점</div>
  </div>
  <div class="cat-detail-body">
    <!-- AI 점수 테이블 (점수만, 근거 없음) -->
    <table>
      <thead>
        <tr><th>Claude</th><th>ChatGPT</th><th>Gemini</th><th>Grok</th><th class="highlight-col">평균</th></tr>
      </thead>
      <tbody>
        <tr><td>{점수}</td><td>{점수}</td><td>{점수}</td><td>{점수}</td><td class="highlight-col">{점수}</td></tr>
      </tbody>
    </table>

    <!-- 강점 박스 -->
    <div class="claim claim-success">
      <div class="claim-label">강점</div>
      {수집 데이터에서 도출된 강점 서술. 관찰 화법.}
    </div>

    <!-- 한계 박스 -->
    <div class="claim claim-warning">
      <div class="claim-label">한계</div>
      {수집 데이터에서 도출된 한계 서술. 관찰 화법.}
    </div>

    <!-- AI 평가 특이점 박스 (해당 시) -->
    <div class="claim claim-independent">
      <div class="claim-label">AI 평가 특이점</div>
      {AI 간 점수 차이 원인, 데이터 특성 등 관찰.}
    </div>
  </div>
</div>

<!-- 10개 카테고리 동일 구조 반복 -->
```

**규칙:**
- 10개 카테고리 모두 포함
- 점수 테이블: **점수만** (5열: Claude, ChatGPT, Gemini, Grok, 평균)
- 테이블 아래 **별도 박스**로 강점/한계/AI 특이점 분리
  - `claim-success`: 강점 (초록)
  - `claim-warning`: 한계 (빨강)
  - `claim-independent`: AI 특이점 (중립)
- 근거는 수집 데이터에서 직접 도출된 내용만 기재
- 제언/권고 금지

---

### B-5. 경쟁자 비교 / 평가 점수 구조 분석

> ⚠️ **이 섹션은 보고서 유형에 따라 택1.**

#### 유형 A: 경쟁자 비교 (해당 시)

```html
<h1 id="sec5">5. 경쟁자 비교 ({N}인)</h1>

<!-- 통합 비교 테이블 (1개) -->
<table>
  <thead>
    <tr>
      <th>카테고리</th>
      <th class="highlight-col">{평가대상}</th>
      <th>{비교1}</th>
      <th>{비교2}</th>
      <th>{비교3}</th>
    </tr>
  </thead>
  <tbody>
    <!-- 10개 카테고리 행 -->
    <tr>
      <td>전문성</td>
      <td class="highlight-col rank-1">{점수} ★</td>
      <td>{점수}</td>
      <td>{점수}</td>
      <td>{점수}</td>
    </tr>
    <!-- ... 나머지 9개 카테고리 -->

    <!-- 최종 점수 행 -->
    <tr>
      <td style="font-weight:700">최종 점수</td>
      <td class="highlight-col" style="font-weight:700">{점수} ★</td>
      <td style="font-weight:600">{점수}</td>
      <td style="font-weight:600">{점수}</td>
      <td style="font-weight:600">{점수}</td>
    </tr>

    <!-- 등급 행 -->
    <tr>
      <td>등급</td>
      <td class="highlight-col" style="font-weight:700">{등급} ({등급명})</td>
      <td>{등급} ({등급명})</td>
      <td>{등급} ({등급명})</td>
      <td>{등급} ({등급명})</td>
    </tr>
  </tbody>
</table>
<p class="note">★ = {N}인 중 1위.</p>

<!-- 비교 분석 요약 -->
<div class="claim claim-independent">
  <div class="claim-label">비교 분석 요약</div>
  {데이터 기반 비교 관찰. 제언 금지.}
</div>
```

#### 유형 B: 평가 점수 구조 분석 (경쟁자 없는 보고서)

```html
<h1 id="sec5">5. 평가 점수 구조 분석</h1>

<!-- 카테고리별 AI 일관성 테이블 -->
<table>
  <thead>
    <tr><th>카테고리</th><th>평균</th><th>표준편차</th><th>AI 일관성</th></tr>
  </thead>
  <tbody>
    <tr><td>{카테고리}</td><td>{점수}점</td><td>{N}</td><td>★★★★★ 최고</td></tr>
    <!-- ... 10개, 표준편차 낮은 순 정렬 -->
  </tbody>
</table>

<!-- 분석 -->
<div class="claim claim-independent">
  <div class="claim-label">일관성 분석</div>
  {일관성 높은/낮은 카테고리 관찰. 구조적 특징.}
</div>
```

**규칙:**
- **경쟁자 비교는 이 섹션에서만 다룸** (다른 섹션에 경쟁자 내용 포함 절대 금지)
- 경쟁자 비교 시: **1개 통합 테이블** (카테고리 10개 + 최종 점수 + 등급)
- 평가 대상 열은 `highlight-col` 클래스로 강조, 1위 항목에 ★ 마커 + `rank-1` 클래스
- 비교 시 순위·점수만 표기, 해석·제언 금지

---

### B-6. 등급 기준표

```html
<h1 id="sec6">6. 등급 기준표</h1>

<div class="grade-table">
  <div class="grade-row">
    <div class="grade-letter">M</div>
    <div class="grade-range">920 ~ 1,000점</div>
    <div class="grade-desc">최우수 — 탁월한 정치인</div>
  </div>
  <div class="grade-row">
    <div class="grade-letter">D</div>
    <div class="grade-range">840 ~ 919점</div>
    <div class="grade-desc">우수 — 매우 뛰어난 수준</div>
  </div>
  <!-- ... -->
  <div class="grade-row grade-current">
    <div class="grade-letter">{등급}</div>
    <div class="grade-range">{범위}</div>
    <div class="grade-desc">{의미} ← {정치인명} {점수}점 (이 등급)</div>
  </div>
  <!-- ... 나머지 등급 -->
  <div class="grade-row">
    <div class="grade-letter">L</div>
    <div class="grade-range">200 ~ 279점</div>
    <div class="grade-desc">최하 — 심각한 결격 수준</div>
  </div>
</div>

<!-- 등급 위치 분석 -->
<div class="claim claim-independent">
  <div class="claim-label">{정치인명} 등급 위치</div>
  {점수}점은 {등급}등급({범위}) 내 {위치}. {등급} 상단까지 <strong>{N}점</strong> 여유. {상위등급}까지 {N}점 차이.
</div>
```

**규칙:**
- 10단계 등급 모두 표시 (M, D, E, P, G, S, B, I, Tn, L)
- 해당 등급 행에 `grade-current` 클래스 + "← {정치인명} {점수}점 (이 등급)" 표시
- 등급 위치 분석: 등급 내 위치, 상위/하위 등급까지 거리

---

### B-7. 평가 방법론 및 이론적 근거

```html
<h1 id="sec7">7. 평가 방법론 및 이론적 근거</h1>

<h2>7-1. 평가 방법론</h2>

<h3>(1) 데이터 수집</h3>
<ul>
  <li>Gemini (Google Search, Gemini CLI Direct) + Naver (Naver Search API)의 상호보완적 2채널 수집 (각 50%)</li>
  <li>OFFICIAL(공식 문서·의회 기록 등) 40% + PUBLIC(언론·SNS·시민 반응 등) 60%</li>
  <li>OFFICIAL 기간: 최근 4년 이내 / PUBLIC 기간: 최근 2년 이내</li>
  <li>센티멘트 배분: Negative·Positive 최소 비율 확보(OFFICIAL 각 10%, PUBLIC 각 20%), 나머지 Free(자유형)</li>
  <li>총 수집량: 약 {N}개</li>
</ul>

<h3>(2) 데이터 검증</h3>
<ul>
  <li>동명이인 필터링, URL 유효성 검증, 기간 제한 검증, 중복 제거</li>
</ul>

<h3>(3) 평가</h3>
<ul>
  <li>4개 AI(Claude · ChatGPT · Gemini · Grok)가 수집된 전체 데이터를 각각 독립 평가</li>
  <li>수집 시점과 평가 시점을 분리하여 객관성 확보</li>
  <li>동일 데이터에 대해 4개 AI가 서로 다른 관점에서 판단 → 개별 AI 편향 완화</li>
  <li>등급 체계(8등급): +4(탁월) ~ -4(최악), X(평가 제외)</li>
  <li>총 평가: 4개 AI × 수집 데이터 = 약 {N}건</li>
</ul>

<h3>(4) 점수 산출</h3>
<ul>
  <li>카테고리 점수 = (6.0 + avg_score × 0.5) × 10 (범위 20~100점)</li>
  <li>AI별 최종 점수 = 10개 카테고리 합산 (범위 200~1,000점)</li>
  <li>평균 점수 = 4개 AI 최종 점수의 평균</li>
</ul>

<h2>7-2. 이론적 근거</h2>

<h3>(1) 10개 카테고리 선정 근거</h3>
<p>Stoker et al. (2024)의 7개 민주주의 국가 유권자 인지 구조 분석 외 국제 연구에서 70개 이상 항목 수집 → 5개 AI 독립 분석 → 최종 10개 카테고리 확정.</p>

<h3>(2) 베이지안 점수 설계</h3>
<div class="claim">
  <div class="claim-label">점수 공식</div>
  카테고리 점수 = (6.0 + avg_score × 0.5) × 10
</div>
<ul>
  <li><strong>PRIOR = 6.0</strong> (기본 60점): "선출직 공직자의 기본 신뢰"를 수치화. 베이지안 이론의 사전확률(Prior)에 해당하며, 데이터가 없는 정치인도 0점이 아닌 60점(보통)에서 출발.</li>
  <li><strong>COEFFICIENT = 0.5</strong>: 실제 평가 데이터의 영향력을 조절하는 계수. Prior(기본 신뢰)와 데이터(실제 활동 증거)를 결합하여 점수 산출.</li>
  <li><strong>고정 Prior 원칙</strong>: 데이터 양에 무관하게 PRIOR 기여분은 항상 60점 고정. 신인과 중진 모두에게 동일 공식 적용 → 일관성과 비교 가능성 보장.</li>
  <li>베이지안에서 가져온 것: 사전 믿음(Prior) 존재, Prior + Data = 결합 구조, "증거 부재 ≠ 부재의 증거"</li>
  <li>베이지안에서 가져오지 않은 것: Prior의 동적 감소 (신인 유입 시 통일성·선출직 신뢰 불소멸을 위해 고정)</li>
</ul>
```

---

### B-8. 평가의 한계 및 유의사항 (법적 필수 — 삭제 절대 금지)

```html
<h1 id="sec8">8. 평가의 한계 및 유의사항</h1>

<h2>평가의 한계</h2>
<div class="claim claim-warning">
  <div class="claim-label">주요 한계</div>
  <strong>(1) 비공개 자료 미반영</strong> — 내부 회의·오프라인 활동·비공개 협상 내용 수집 불가.<br>
  <strong>(2) 시간적 한계</strong> — 평가 일자({YYYY-MM-DD}) 이후 활동 미반영.<br>
  <strong>(3) {정치인별 고유 한계}</strong>
</div>

<h2>유의사항</h2>
<div class="claim">
  <div class="claim-label">법적 고지</div>
  <strong>(1)</strong> 본 보고서는 OFFICIAL 및 PUBLIC 자료를 AI가 수집·분석하여 생성한 참고 자료입니다.<br>
  <strong>(2)</strong> 특정 정치적 견해를 지지하거나 반대하기 위한 목적으로 작성되지 않았습니다.<br>
  <strong>(3)</strong> 본 자료는 유권자의 판단을 보조하는 정보 제공 목적이며, 최종 판단은 유권자 본인이 해야 합니다.
</div>
```

---

### 푸터 + PDF 버튼

```html
<div class="doc-footer">
  <div class="doc-footer-title">PoliticianFinder</div>
  <div class="doc-footer-text">
    PoliticianFinder.com | AI 정치인 평가 시스템 V40 | {YYYY-MM-DD}
  </div>
</div>

<!-- PDF 다운로드 버튼 (WYSIWYG: window.print → 브라우저 PDF 저장) -->
<button class="pdf-download-btn" onclick="window.print()" title="PDF로 다운로드">PDF 다운로드</button>
```

---

## 점수 계산 공식 (필수 숙지)

```
Step 1: AI가 각 수집 데이터에 rating 부여 (+4 ~ -4, X)
Step 2: score = rating × 2  →  범위: -8 ~ +8
Step 3: 카테고리 내 score 평균 계산 (X 제외)
         avg_score = Σ(score) / count(X 제외)
Step 4: 카테고리 점수 = (6.0 + avg_score × 0.5) × 10
         → 범위: 20점 ~ 100점
Step 5: 최종 점수 = Σ(10개 카테고리 점수)
         → 범위: 200점 ~ 1,000점

예시:
  avg_rating = +2.5  →  avg_score = +5.0
  카테고리 점수 = (6.0 + 5.0 × 0.5) × 10 = 85점
```

---

## CSS 클래스 참조 (HTML 작성 시)

| 클래스 | 용도 |
|--------|------|
| `.cover` | 커버 페이지 컨테이너 |
| `.cover-meta-item` | 커버 메타 항목 (출마 직종 등) |
| `.info-field` / `.info-label` / `.info-value` | 섹션 1 프로필 필드 |
| `.ai-cards` / `.ai-card` | 섹션 2 AI별 점수 카드 |
| `.bar-chart` / `.bar-row` / `.bar-fill` | 섹션 3 막대 차트 |
| `.cat-detail` / `.cat-detail-header` | 섹션 4 카테고리 상세 |
| `.claim` | 분석 박스 (기본) |
| `.claim-success` | 강점 박스 (초록) |
| `.claim-warning` | 한계/경고 박스 (빨강) |
| `.claim-independent` | 중립 분석 박스 |
| `.highlight-col` | 테이블 강조 열 (평균, 평가 대상) |
| `.rank-1` | 1위 셀 강조 |
| `.grade-table` / `.grade-row` / `.grade-current` | 등급 기준표 |
| `.toc` | 목차 컨테이너 |
| `.pdf-download-btn` | PDF 다운로드 버튼 |

---

## 정당별 CSS 색상

```css
/* 더불어민주당 (Blue) */
:root {
  --primary: #1a365d;
  --accent: #1565C0;
  --bg-highlight: #e8f0fe;
}

/* 국민의힘 (Red) */
:root {
  --primary: #1a0808;
  --accent: #B71C1C;
  --bg-highlight: #fff0f0;
}
```

---

## 파일명 규칙

| 유형 | 파일명 | 예시 |
|------|--------|------|
| Type B (상세본) | `{이름}_{YYYYMMDD}_B.html` | `정원오_20260221_B.html` |

---

## 생성 전 체크리스트

- [ ] `ai_final_scores_v40` 테이블에 해당 정치인 점수 존재 확인
- [ ] DB `politicians` 테이블에서 9개 프로필 필드 확인 (출마 직종/출마 지역 포함)
- [ ] 커버 페이지 5개 메타 항목 포함 확인
- [ ] 정치인 프로필 9개 info-field 포함 확인 (순서 정확)
- [ ] AI별 점수 카드 형태 확인 (테이블 아님)
- [ ] 카테고리별 상세 분석: 점수 테이블 + 강점/한계/AI 특이점 박스 분리 확인
- [ ] 경쟁자 비교는 섹션 5에서만 다룸 (다른 섹션 경쟁자 내용 금지)
- [ ] 경쟁자 비교: 1개 통합 테이블 (카테고리 + 최종 점수 + 등급) 확인
- [ ] **섹션 8 (평가의 한계 및 유의사항) 절대 삭제 금지**
- [ ] 전략 제언·개선 방향·권고 문구 없는지 최종 확인
- [ ] 정당별 CSS 색상 올바르게 설정 확인
- [ ] PDF 다운로드 버튼 포함 확인

---

**버전**: V41.1
**작성**: 2026-02-18 (V41.0) → 2026-02-26 (V41.1 — 실제 HTML 보고서 기준 전면 수정, Type B 전용)
