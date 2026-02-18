# V40 평가보고서 PDF 디자인 개선안

**작성일**: 2026-02-06
**대상**: 조은희 의원 V40 평가보고서
**목표**: 정치인이 실제로 읽고 활용할 수 있는 전문적 인쇄물 품질

---

## 1. 디자인 시스템 정의

### 1-1. 브랜드 컬러 시스템

```css
:root {
  /* Primary Colors - 신뢰와 전문성 */
  --primary-blue: #1e40af;        /* 진한 파란색 - 메인 헤딩 */
  --primary-blue-light: #3b82f6;  /* 밝은 파란색 - 강조 */
  --primary-blue-pale: #dbeafe;   /* 연한 파란색 - 배경 */

  /* Success Colors - 강점 표시 */
  --success-green: #059669;       /* 진한 초록 - 우수 평가 */
  --success-green-light: #10b981; /* 밝은 초록 - 강점 박스 */
  --success-green-pale: #d1fae5;  /* 연한 초록 - 배경 */

  /* Warning Colors - 주의/개선 필요 */
  --warning-orange: #d97706;      /* 진한 주황 - 경고 */
  --warning-orange-light: #f59e0b;/* 밝은 주황 - 약점 박스 */
  --warning-orange-pale: #fef3c7; /* 연한 주황 - 배경 */

  /* Danger Colors - 심각한 문제 */
  --danger-red: #dc2626;          /* 빨간색 - 긴급 */
  --danger-red-light: #ef4444;    /* 밝은 빨간색 */
  --danger-red-pale: #fee2e2;     /* 연한 빨간색 - 배경 */

  /* Neutral Colors - 본문 및 배경 */
  --text-primary: #111827;        /* 거의 검정 - 본문 */
  --text-secondary: #4b5563;      /* 진한 회색 - 보조 텍스트 */
  --text-tertiary: #9ca3af;       /* 중간 회색 - 메타 정보 */

  --bg-white: #ffffff;            /* 순백 */
  --bg-gray-50: #f9fafb;          /* 아주 연한 회색 */
  --bg-gray-100: #f3f4f6;         /* 연한 회색 */
  --bg-gray-200: #e5e7eb;         /* 중간 회색 */

  --border-light: #e5e7eb;        /* 밝은 테두리 */
  --border-medium: #d1d5db;       /* 중간 테두리 */
  --border-dark: #9ca3af;         /* 진한 테두리 */
}
```

**컬러 선택 근거**:
- **파란색**: 정치 보고서 표준 색상, 신뢰감, 안정감, 전문성 전달
- **초록색**: 강점 및 성공 표시 (국제 표준)
- **주황색**: 주의 필요 항목 (빨강보다 덜 자극적)
- **인쇄 고려**: 흑백 인쇄 시에도 명도 차이로 구분 가능하도록 설계

---

### 1-2. 타이포그래피 시스템

```css
/* 폰트 패밀리 */
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');

:root {
  /* 한글 최적화 폰트 */
  --font-family-base: 'Pretendard', -apple-system, BlinkMacSystemFont,
                      'Segoe UI', 'Malgun Gothic', sans-serif;

  /* 숫자 강조용 (표, 점수) */
  --font-family-numbers: 'Pretendard', 'SF Pro Display', 'Segoe UI', sans-serif;

  /* 코드 (필요시) */
  --font-family-mono: 'Cascadia Code', 'Consolas', monospace;
}

/* 제목 계층 */
h1 {
  font-size: 32pt;           /* 보고서 메인 제목 */
  font-weight: 800;          /* Extra Bold */
  line-height: 1.2;
  color: var(--primary-blue);
  margin-top: 0;
  margin-bottom: 24pt;
  letter-spacing: -0.02em;   /* 한글 자간 최적화 */
  page-break-after: avoid;
}

h2 {
  font-size: 24pt;           /* 대분류 (섹션 1, 2, 3...) */
  font-weight: 700;          /* Bold */
  line-height: 1.3;
  color: var(--primary-blue);
  margin-top: 36pt;
  margin-bottom: 16pt;
  padding-bottom: 8pt;
  border-bottom: 3pt solid var(--primary-blue);
  page-break-after: avoid;
}

h3 {
  font-size: 18pt;           /* 중분류 (강점 1, 약점 1...) */
  font-weight: 700;
  line-height: 1.4;
  color: var(--text-primary);
  margin-top: 24pt;
  margin-bottom: 12pt;
  page-break-after: avoid;
}

h4 {
  font-size: 14pt;           /* 소분류 (왜 강점인가, 구체적 평가...) */
  font-weight: 600;          /* Semi Bold */
  line-height: 1.4;
  color: var(--text-primary);
  margin-top: 16pt;
  margin-bottom: 8pt;
  page-break-after: avoid;
}

/* 본문 */
body {
  font-family: var(--font-family-base);
  font-size: 11pt;           /* A4 인쇄 최적 크기 */
  line-height: 1.7;          /* 가독성 최적 줄간격 */
  color: var(--text-primary);
  font-weight: 400;
}

p {
  margin-top: 0;
  margin-bottom: 12pt;
  text-align: justify;       /* 양쪽 정렬 (전문 보고서) */
  word-break: keep-all;      /* 한글 단어 단위 줄바꿈 */
}

/* 강조 텍스트 */
strong {
  font-weight: 700;
  color: var(--text-primary);
}

em {
  font-style: normal;
  font-weight: 600;
  color: var(--primary-blue);
}

/* 작은 텍스트 (주석, 메타 정보) */
.meta-info,
.footnote {
  font-size: 9pt;
  color: var(--text-tertiary);
  line-height: 1.5;
}
```

**타이포그래피 선택 근거**:
- **Pretendard**: 한글 가독성 최고, 무료, 웹폰트 지원
- **11pt 본문**: A4 인쇄 시 가장 읽기 편한 크기 (권장: 10-12pt)
- **1.7 줄간격**: 장문 보고서 최적 값 (권장: 1.5-1.8)
- **양쪽 정렬**: 전문 보고서 표준 (좌측 정렬보다 깔끔)

---

### 1-3. 레이아웃 시스템

```css
/* 페이지 설정 (A4 기준) */
@page {
  size: A4 portrait;              /* 210mm × 297mm */
  margin: 20mm 25mm 20mm 25mm;    /* 상 우 하 좌 */

  /* 헤더 */
  @top-center {
    content: "조은희 의원 V40 평가보고서";
    font-size: 9pt;
    color: var(--text-tertiary);
    padding-bottom: 5mm;
    border-bottom: 0.5pt solid var(--border-light);
  }

  /* 페이지 번호 */
  @bottom-center {
    content: counter(page) " / " counter(pages);
    font-size: 9pt;
    color: var(--text-tertiary);
    font-variant-numeric: tabular-nums;
  }
}

/* 첫 페이지는 헤더/페이지 번호 제외 */
@page :first {
  @top-center { content: none; }
  @bottom-center { content: none; }
}

/* 본문 컨테이너 */
body {
  max-width: 160mm;              /* A4 - 여백 */
  margin: 0 auto;
  background: var(--bg-white);
}

/* 섹션 간격 */
section {
  margin-bottom: 36pt;
  page-break-inside: avoid;      /* 섹션 중간에 페이지 나뉘지 않도록 */
}

/* 페이지 브레이크 제어 */
.page-break-before {
  page-break-before: always;
}

.page-break-after {
  page-break-after: always;
}

.no-break {
  page-break-inside: avoid;
}

/* 여백 유틸리티 */
.mt-large { margin-top: 36pt; }
.mt-medium { margin-top: 24pt; }
.mt-small { margin-top: 12pt; }

.mb-large { margin-bottom: 36pt; }
.mb-medium { margin-bottom: 24pt; }
.mb-small { margin-bottom: 12pt; }
```

**레이아웃 선택 근거**:
- **20mm 상하 여백**: 펀칭 구멍 고려 (표준 25mm보다 작지만 안전)
- **25mm 좌우 여백**: 제본 여유 (좌측), 손으로 잡을 공간 (우측)
- **페이지 번호 중앙 하단**: 가장 찾기 쉬운 위치
- **섹션별 페이지 브레이크**: 가독성 향상, 논리적 구조 유지

---

## 2. 현재 디자인 분석

### 문제점 5가지

#### 문제 1: 브랜드 아이덴티티 부재
- **현재**: GitHub 마크다운 CSS만 적용, 일반 기술 문서 느낌
- **문제**: 정치인 평가보고서라는 전문성과 신뢰감 부족
- **영향**: 단순 기술 자료처럼 보여 신뢰도 하락

#### 문제 2: 인쇄 최적화 없음
- **현재**: `@media print` 규칙 없음, 화면용 CSS 그대로 인쇄
- **문제**: 여백 부적절, 페이지 번호 없음, 섹션이 페이지 중간에서 끊김
- **영향**: 인쇄 시 보기 어렵고 비전문적으로 보임

#### 문제 3: 정보 위계 불명확
- **현재**: 모든 텍스트가 비슷한 크기와 색상
- **문제**: 중요한 정보(점수, 강점)와 부가 정보(설명) 구분 어려움
- **영향**: 핵심 정보 파악에 시간 소요, 스캔 가능성 낮음

#### 문제 4: 데이터 시각화 부족
- **현재**: 텍스트 위주, 표도 기본 스타일
- **문제**: 숫자와 등급을 시각적으로 이해하기 어려움
- **영향**: 보고서 전체 흐름 파악 어려움, 지루함

#### 문제 5: 감성적 요소 없음
- **현재**: 기계적이고 차갑게 느껴짐
- **문제**: 정치인이 읽고 싶어지는 디자인이 아님
- **영향**: 보고서 활용도 저하, 실제 개선 행동으로 이어지지 않음

---

## 3. 개선된 HTML/CSS 코드

### 3-1. <head> 섹션 개선

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="author" content="PoliticianFinder AI Evaluation System">
  <meta name="description" content="조은희 의원 V40 AI 기반 상세평가보고서 - 4개 AI(Claude, ChatGPT, Grok, Gemini) 분석">

  <title>조은희 의원 V40 평가보고서 | PoliticianFinder</title>

  <!-- 폰트 -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css">

  <!-- 메인 스타일시트 -->
  <link rel="stylesheet" href="report-style.css">

  <!-- 인쇄 최적화 -->
  <style>
    @media print {
      /* 인쇄 시 불필요한 요소 제거 */
      .no-print { display: none !important; }

      /* 링크 처리 */
      a[href]::after {
        content: " (" attr(href) ")";
        font-size: 0.8em;
        color: var(--text-tertiary);
      }

      /* 페이지 브레이크 최적화 */
      h2, h3 { page-break-after: avoid; }
      table { page-break-inside: avoid; }

      /* 배경색 인쇄 강제 */
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  </style>
</head>
```

---

### 3-2. 전체 CSS 스타일시트 (report-style.css)

```css
/* ========================================
   V40 평가보고서 전용 스타일시트
   작성일: 2026-02-06
   용도: 정치인 평가보고서 PDF 변환용
======================================== */

/* 1. 변수 정의 */
:root {
  /* 컬러 시스템 (위 1-1 참조) */
  --primary-blue: #1e40af;
  --primary-blue-light: #3b82f6;
  --primary-blue-pale: #dbeafe;

  --success-green: #059669;
  --success-green-light: #10b981;
  --success-green-pale: #d1fae5;

  --warning-orange: #d97706;
  --warning-orange-light: #f59e0b;
  --warning-orange-pale: #fef3c7;

  --danger-red: #dc2626;
  --danger-red-light: #ef4444;
  --danger-red-pale: #fee2e2;

  --text-primary: #111827;
  --text-secondary: #4b5563;
  --text-tertiary: #9ca3af;

  --bg-white: #ffffff;
  --bg-gray-50: #f9fafb;
  --bg-gray-100: #f3f4f6;
  --bg-gray-200: #e5e7eb;

  --border-light: #e5e7eb;
  --border-medium: #d1d5db;
  --border-dark: #9ca3af;

  /* 폰트 */
  --font-family-base: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-family-numbers: 'Pretendard', 'SF Pro Display', sans-serif;

  /* 간격 */
  --spacing-xs: 4pt;
  --spacing-sm: 8pt;
  --spacing-md: 12pt;
  --spacing-lg: 16pt;
  --spacing-xl: 24pt;
  --spacing-2xl: 36pt;

  /* 테두리 반경 */
  --radius-sm: 4pt;
  --radius-md: 8pt;
  --radius-lg: 12pt;

  /* 그림자 */
  --shadow-sm: 0 1pt 2pt rgba(0, 0, 0, 0.05);
  --shadow-md: 0 2pt 4pt rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 4pt 8pt rgba(0, 0, 0, 0.15);
}

/* 2. 페이지 설정 */
@page {
  size: A4 portrait;
  margin: 20mm 25mm 20mm 25mm;

  @top-center {
    content: "조은희 의원 V40 평가보고서";
    font-family: var(--font-family-base);
    font-size: 9pt;
    color: var(--text-tertiary);
    padding-bottom: 5mm;
    border-bottom: 0.5pt solid var(--border-light);
  }

  @bottom-center {
    content: "- " counter(page) " -";
    font-family: var(--font-family-numbers);
    font-size: 9pt;
    color: var(--text-tertiary);
  }
}

@page :first {
  @top-center { content: none; }
  @bottom-center { content: none; }
}

/* 3. 기본 요소 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  font-size: 12pt;
}

body {
  font-family: var(--font-family-base);
  font-size: 11pt;
  line-height: 1.7;
  color: var(--text-primary);
  background: var(--bg-white);
  max-width: 160mm;
  margin: 0 auto;
  padding: 0;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 4. 타이포그래피 */
h1 {
  font-size: 32pt;
  font-weight: 800;
  line-height: 1.2;
  color: var(--primary-blue);
  margin-bottom: 24pt;
  letter-spacing: -0.02em;
  page-break-after: avoid;
  text-align: center;
  padding: 24pt 0;
  border-bottom: 4pt solid var(--primary-blue);
}

h2 {
  font-size: 24pt;
  font-weight: 700;
  line-height: 1.3;
  color: var(--primary-blue);
  margin-top: 36pt;
  margin-bottom: 16pt;
  padding-bottom: 8pt;
  padding-left: 12pt;
  border-left: 6pt solid var(--primary-blue);
  background: linear-gradient(to right, var(--primary-blue-pale), transparent);
  padding-top: 8pt;
  page-break-after: avoid;
}

h3 {
  font-size: 18pt;
  font-weight: 700;
  line-height: 1.4;
  color: var(--text-primary);
  margin-top: 24pt;
  margin-bottom: 12pt;
  padding-left: 8pt;
  border-left: 4pt solid var(--success-green);
  page-break-after: avoid;
}

h4 {
  font-size: 14pt;
  font-weight: 600;
  line-height: 1.4;
  color: var(--text-primary);
  margin-top: 16pt;
  margin-bottom: 8pt;
  page-break-after: avoid;
}

p {
  margin-bottom: 12pt;
  text-align: justify;
  word-break: keep-all;
}

strong {
  font-weight: 700;
  color: var(--text-primary);
}

em {
  font-style: normal;
  font-weight: 600;
  color: var(--primary-blue);
}

/* 5. 링크 */
a {
  color: var(--primary-blue-light);
  text-decoration: none;
  border-bottom: 1pt solid var(--primary-blue-pale);
  transition: all 0.2s ease;
}

a:hover {
  color: var(--primary-blue);
  border-bottom-color: var(--primary-blue);
}

/* 6. 리스트 */
ul, ol {
  margin-left: 20pt;
  margin-bottom: 12pt;
}

li {
  margin-bottom: 6pt;
  line-height: 1.6;
}

ul ul, ol ol, ul ol, ol ul {
  margin-top: 6pt;
  margin-bottom: 0;
}

/* 7. 표 (Table) */
table {
  width: 100%;
  border-collapse: collapse;
  margin: 16pt 0;
  font-size: 10pt;
  page-break-inside: avoid;
  background: var(--bg-white);
  border: 1pt solid var(--border-medium);
  border-radius: var(--radius-md);
  overflow: hidden;
}

thead {
  background: var(--primary-blue);
  color: var(--bg-white);
  font-weight: 700;
}

thead th {
  padding: 12pt 16pt;
  text-align: left;
  font-weight: 700;
  letter-spacing: 0.02em;
  border-right: 1pt solid rgba(255, 255, 255, 0.2);
}

thead th:last-child {
  border-right: none;
}

tbody tr {
  border-bottom: 1pt solid var(--border-light);
  transition: background-color 0.2s ease;
}

tbody tr:last-child {
  border-bottom: none;
}

tbody tr:nth-child(even) {
  background: var(--bg-gray-50);
}

tbody tr:hover {
  background: var(--primary-blue-pale);
}

tbody td {
  padding: 10pt 16pt;
  vertical-align: middle;
}

/* 점수 셀 강조 */
td[style*="text-align: center"] {
  font-family: var(--font-family-numbers);
  font-weight: 700;
  font-size: 11pt;
}

/* 8. 수평선 */
hr {
  border: none;
  height: 2pt;
  background: linear-gradient(to right,
    var(--primary-blue),
    var(--primary-blue-light),
    transparent);
  margin: 24pt 0;
}

/* 9. 인용 블록 (한 줄 평가) */
blockquote {
  margin: 16pt 0;
  padding: 16pt 20pt;
  background: var(--primary-blue-pale);
  border-left: 6pt solid var(--primary-blue);
  border-radius: var(--radius-md);
  font-size: 14pt;
  font-weight: 600;
  color: var(--primary-blue);
  page-break-inside: avoid;
}

blockquote p {
  margin: 0;
  text-align: left;
}

/* 10. 코드 블록 (긍정/부정 비율 바) */
pre {
  margin: 16pt 0;
  padding: 16pt;
  background: var(--bg-gray-100);
  border: 1pt solid var(--border-light);
  border-radius: var(--radius-md);
  overflow-x: auto;
  page-break-inside: avoid;
}

code {
  font-family: var(--font-family-mono);
  font-size: 10pt;
  line-height: 1.5;
  color: var(--text-primary);
}

/* 11. Executive Summary 박스 */
.executive-summary {
  margin: 24pt 0;
  padding: 20pt;
  background: linear-gradient(135deg,
    var(--primary-blue-pale) 0%,
    var(--bg-white) 100%);
  border: 2pt solid var(--primary-blue);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  page-break-inside: avoid;
}

.executive-summary h3 {
  margin-top: 0;
  color: var(--primary-blue);
  border-left: none;
  padding-left: 0;
}

/* 12. 점수 카드 (Score Card) */
.score-card {
  display: inline-block;
  padding: 16pt 24pt;
  background: var(--bg-white);
  border: 2pt solid var(--primary-blue);
  border-radius: var(--radius-lg);
  text-align: center;
  box-shadow: var(--shadow-md);
  margin: 8pt;
  min-width: 120pt;
}

.score-card-value {
  font-family: var(--font-family-numbers);
  font-size: 36pt;
  font-weight: 800;
  color: var(--primary-blue);
  line-height: 1;
  display: block;
  margin-bottom: 8pt;
}

.score-card-label {
  font-size: 10pt;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.score-card-grade {
  display: inline-block;
  padding: 8pt 16pt;
  background: var(--primary-blue);
  color: var(--bg-white);
  font-size: 24pt;
  font-weight: 800;
  border-radius: var(--radius-md);
  margin-top: 8pt;
  letter-spacing: 0.1em;
}

/* 13. 강점/약점 카드 */
.strength-card {
  margin: 16pt 0;
  padding: 16pt;
  background: var(--success-green-pale);
  border-left: 6pt solid var(--success-green);
  border-radius: var(--radius-md);
  page-break-inside: avoid;
}

.weakness-card {
  margin: 16pt 0;
  padding: 16pt;
  background: var(--warning-orange-pale);
  border-left: 6pt solid var(--warning-orange);
  border-radius: var(--radius-md);
  page-break-inside: avoid;
}

.critical-card {
  margin: 16pt 0;
  padding: 16pt;
  background: var(--danger-red-pale);
  border-left: 6pt solid var(--danger-red);
  border-radius: var(--radius-md);
  page-break-inside: avoid;
}

/* 14. 진행바 (Progress Bar) */
.progress-bar {
  width: 100%;
  height: 20pt;
  background: var(--bg-gray-200);
  border-radius: 10pt;
  overflow: hidden;
  margin: 8pt 0;
  position: relative;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(to right, var(--success-green), var(--success-green-light));
  border-radius: 10pt;
  transition: width 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8pt;
}

.progress-bar-text {
  color: var(--bg-white);
  font-weight: 700;
  font-size: 10pt;
  font-family: var(--font-family-numbers);
}

/* 15. 배지 (Badge) */
.badge {
  display: inline-block;
  padding: 4pt 8pt;
  border-radius: var(--radius-sm);
  font-size: 9pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge-success {
  background: var(--success-green-pale);
  color: var(--success-green);
  border: 1pt solid var(--success-green);
}

.badge-warning {
  background: var(--warning-orange-pale);
  color: var(--warning-orange);
  border: 1pt solid var(--warning-orange);
}

.badge-danger {
  background: var(--danger-red-pale);
  color: var(--danger-red);
  border: 1pt solid var(--danger-red);
}

.badge-info {
  background: var(--primary-blue-pale);
  color: var(--primary-blue);
  border: 1pt solid var(--primary-blue);
}

/* 16. 체크리스트 */
.task-list {
  list-style: none;
  margin-left: 0;
}

.task-list li {
  position: relative;
  padding-left: 30pt;
  margin-bottom: 8pt;
}

.task-list li::before {
  content: "□";
  position: absolute;
  left: 0;
  font-size: 14pt;
  color: var(--border-dark);
}

.task-list li input[type="checkbox"] {
  position: absolute;
  left: 0;
  width: 14pt;
  height: 14pt;
  margin: 2pt 0 0 0;
}

.task-list li input[type="checkbox"]:checked + span::before {
  content: "✓";
  color: var(--success-green);
  font-weight: 700;
}

/* 17. 메타 정보 (날짜, 출처 등) */
.meta-info {
  font-size: 9pt;
  color: var(--text-tertiary);
  margin: 8pt 0;
  line-height: 1.5;
}

.meta-info-highlight {
  font-weight: 600;
  color: var(--text-secondary);
}

/* 18. 경고 박스 */
.warning-box {
  margin: 16pt 0;
  padding: 16pt;
  background: var(--warning-orange-pale);
  border: 2pt solid var(--warning-orange);
  border-radius: var(--radius-md);
  page-break-inside: avoid;
}

.warning-box::before {
  content: "⚠️ 주의";
  display: block;
  font-weight: 700;
  color: var(--warning-orange);
  margin-bottom: 8pt;
  font-size: 12pt;
}

.info-box {
  margin: 16pt 0;
  padding: 16pt;
  background: var(--primary-blue-pale);
  border: 2pt solid var(--primary-blue-light);
  border-radius: var(--radius-md);
  page-break-inside: avoid;
}

.info-box::before {
  content: "ℹ️ 참고";
  display: block;
  font-weight: 700;
  color: var(--primary-blue);
  margin-bottom: 8pt;
  font-size: 12pt;
}

/* 19. 섹션 구분선 */
.section-divider {
  margin: 36pt 0;
  text-align: center;
  position: relative;
}

.section-divider::before {
  content: "";
  display: block;
  height: 2pt;
  background: linear-gradient(to right,
    transparent,
    var(--primary-blue),
    transparent);
}

/* 20. 인쇄 최적화 */
@media print {
  body {
    background: white;
  }

  .no-print {
    display: none !important;
  }

  a[href]::after {
    content: " (" attr(href) ")";
    font-size: 0.8em;
    color: var(--text-tertiary);
  }

  h1, h2, h3, h4, h5, h6 {
    page-break-after: avoid;
  }

  table, figure, .score-card, .strength-card, .weakness-card {
    page-break-inside: avoid;
  }

  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* 그림자 제거 (인쇄 시 불필요) */
  .score-card,
  .strength-card,
  .weakness-card,
  .executive-summary {
    box-shadow: none;
  }
}

/* 21. 반응형 (화면 미리보기용) */
@media screen and (max-width: 768px) {
  body {
    max-width: 100%;
    padding: 16pt;
  }

  h1 { font-size: 24pt; }
  h2 { font-size: 20pt; }
  h3 { font-size: 16pt; }
  h4 { font-size: 14pt; }

  .score-card {
    min-width: auto;
    width: 100%;
    margin: 8pt 0;
  }

  table {
    font-size: 9pt;
  }

  thead th,
  tbody td {
    padding: 8pt;
  }
}
```

---

### 3-3. Executive Summary 박스 HTML 구조

```html
<div class="executive-summary no-break">
  <h3>한눈에 보는 평가 요약</h3>

  <div style="text-align: center; margin: 20pt 0;">
    <!-- 점수 카드 -->
    <div class="score-card">
      <span class="score-card-value">816</span>
      <span class="score-card-label">최종 점수 / 1,000</span>
      <div class="score-card-grade">E</div>
      <span class="score-card-label" style="display: block; margin-top: 8pt;">Emerald - 양호</span>
    </div>
  </div>

  <!-- 한 줄 평가 -->
  <blockquote>
    <p><strong>"행정 전문성과 미래 비전은 우수하나, 청렴성 논란 해소 필요"</strong></p>
  </blockquote>

  <!-- AI별 점수 -->
  <div style="margin: 16pt 0;">
    <h4>AI별 점수</h4>
    <table style="margin-top: 12pt;">
      <thead>
        <tr>
          <th>AI</th>
          <th style="text-align: center;">점수</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>ChatGPT</td>
          <td style="text-align: center;">881점</td>
        </tr>
        <tr>
          <td>Grok</td>
          <td style="text-align: center;">835점</td>
        </tr>
        <tr>
          <td>Gemini</td>
          <td style="text-align: center;">807점</td>
        </tr>
        <tr>
          <td>Claude</td>
          <td style="text-align: center;">738점</td>
        </tr>
        <tr style="background: var(--primary-blue-pale); font-weight: 700;">
          <td><strong>4 AIs 평균</strong></td>
          <td style="text-align: center;"><strong>816점</strong></td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

---

### 3-4. 강점/약점 카드 HTML 구조

```html
<!-- 강점 카드 -->
<div class="strength-card no-break">
  <h4>✅ 강점 1: 미래 지향적 비전 (86점) ⭐</h4>

  <p><strong>왜 강점인가</strong></p>
  <p>제주특별자치도 국제자유도시 조성을 위한 특별법 개정안, 경부고속도로 지하화 등 <strong>중장기 정책 비전 제시</strong>로 높은 평가를 받았습니다.</p>

  <p><strong>구체적 평가 사례</strong></p>
  <ul>
    <li><strong>제주특별자치도 국제자유도시 조성 특별법 개정안</strong>
      <ul>
        <li>ChatGPT 평가: <span class="badge badge-success">+4점 (최우수)</span></li>
        <li>평가 근거: "지역 발전에 기여할 수 있는 중요한 정책이다"</li>
      </ul>
    </li>
  </ul>

  <p><strong>강화 방향 ⭐</strong></p>
  <ol>
    <li>단기/중기/장기 로드맵 제시</li>
    <li>다른 지역으로 확대 적용 모델 제시</li>
    <li>미래 비전의 가시적 결과물 제시</li>
  </ol>
</div>

<!-- 약점 카드 -->
<div class="weakness-card no-break">
  <h4>⚠️ 약점 1: 청렴성 논란 (76점)</h4>

  <p><strong>왜 약점인가</strong></p>
  <p>친인척 채용 논란, 특혜 의혹 등으로 청렴성 부분에서 상대적으로 낮은 점수를 받았습니다.</p>

  <p><strong>구체적 평가 사례</strong></p>
  <ul>
    <li><strong>친인척 채용 논란</strong>
      <ul>
        <li>Claude 평가: <span class="badge badge-warning">-3점</span></li>
        <li>평가 근거: "공정성에 대한 의문 제기"</li>
      </ul>
    </li>
  </ul>

  <p><strong>개선 방향 🎯</strong></p>
  <ol>
    <li>투명한 인사 프로세스 공개</li>
    <li>제3자 감사 요청</li>
    <li>정기적 윤리 교육 이수</li>
  </ol>
</div>
```

---

### 3-5. 카테고리별 점수 표 개선

```html
<table class="no-break">
  <thead>
    <tr>
      <th>카테고리</th>
      <th style="text-align: center;">점수</th>
      <th style="text-align: center;">평가</th>
      <th style="text-align: center;">시각화</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>비전 (Vision)</strong></td>
      <td style="text-align: center;">86점</td>
      <td style="text-align: center;"><span class="badge badge-success">⭐ 최고</span></td>
      <td>
        <div class="progress-bar">
          <div class="progress-bar-fill" style="width: 86%;">
            <span class="progress-bar-text">86%</span>
          </div>
        </div>
      </td>
    </tr>
    <tr>
      <td><strong>대응성 (Responsiveness)</strong></td>
      <td style="text-align: center;">84점</td>
      <td style="text-align: center;"><span class="badge badge-success">⭐</span></td>
      <td>
        <div class="progress-bar">
          <div class="progress-bar-fill" style="width: 84%;">
            <span class="progress-bar-text">84%</span>
          </div>
        </div>
      </td>
    </tr>
    <!-- ... 다른 카테고리 ... -->
    <tr>
      <td><strong>청렴성 (Integrity)</strong></td>
      <td style="text-align: center;">76점</td>
      <td style="text-align: center;"><span class="badge badge-warning">⚠️ 개선 필요</span></td>
      <td>
        <div class="progress-bar">
          <div class="progress-bar-fill" style="width: 76%; background: linear-gradient(to right, var(--warning-orange), var(--warning-orange-light));">
            <span class="progress-bar-text">76%</span>
          </div>
        </div>
      </td>
    </tr>
  </tbody>
</table>
```

---

### 3-6. 페이지 헤더/푸터 (CSS @page로 자동 생성)

```css
/* CSS에서 이미 정의됨 (위 참조) */
@page {
  @top-center {
    content: "조은희 의원 V40 평가보고서";
    /* ... */
  }

  @bottom-center {
    content: "- " counter(page) " -";
    /* ... */
  }
}

@page :first {
  @top-center { content: none; }
  @bottom-center { content: none; }
}
```

---

### 3-7. 인쇄 최적화 추가 규칙

```css
@media print {
  /* 1. 불필요한 요소 제거 */
  .no-print,
  nav,
  .sidebar,
  .back-to-top {
    display: none !important;
  }

  /* 2. 배경색 인쇄 강제 */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }

  /* 3. 페이지 브레이크 최적화 */
  h1, h2, h3, h4, h5, h6 {
    page-break-after: avoid;
    page-break-inside: avoid;
  }

  table, figure, img,
  .score-card, .strength-card, .weakness-card,
  .executive-summary, .info-box, .warning-box {
    page-break-inside: avoid;
  }

  /* 4. 링크 URL 표시 */
  a[href^="http"]::after {
    content: " (" attr(href) ")";
    font-size: 0.8em;
    color: var(--text-tertiary);
    word-break: break-all;
  }

  /* 5. 그림자 제거 (잉크 절약) */
  * {
    box-shadow: none !important;
    text-shadow: none !important;
  }

  /* 6. 흑백 인쇄 대비 */
  @media (prefers-color-scheme: dark) {
    body {
      background: white;
      color: black;
    }
  }

  /* 7. 여백 최적화 */
  body {
    margin: 0;
    padding: 0;
  }

  /* 8. 고아(Orphan) 및 과부(Widow) 방지 */
  p, li {
    orphans: 3;
    widows: 3;
  }
}
```

---

## 4. Before/After 비교

### Before (현재)

**문제점**:
1. 일반 GitHub 마크다운 스타일 - 기술 문서처럼 보임
2. 흑백에 가까운 디자인 - 지루하고 차가움
3. 정보 위계 불명확 - 중요한 내용 구분 어려움
4. 인쇄 시 여백 부적절 - 페이지 중간에서 섹션 끊김
5. 데이터 시각화 없음 - 숫자만 나열

**시각적 특징**:
- 단조로운 회색 배경
- 기본 표 디자인 (테두리만 있음)
- 제목이 눈에 잘 안 띔
- 점수가 단순 숫자로만 표시
- 강점/약점 구분 어려움

---

### After (개선)

**개선 사항**:
1. 브랜드 아이덴티티 확립 - 파란색 계열로 신뢰감 전달
2. 컬러풀한 디자인 - 초록(강점), 주황(약점) 명확히 구분
3. 정보 위계 명확 - 큰 제목, 작은 제목, 본문 차이 확실
4. 인쇄 최적화 - A4 여백, 페이지 번호, 섹션 브레이크
5. 데이터 시각화 추가 - 진행바, 점수 카드, 배지

**시각적 특징**:
- 파란색 브랜드 컬러 (제목, 테두리, 강조)
- 카드 디자인 (Executive Summary, 강점/약점)
- 큰 숫자 점수 (36pt, 굵게)
- 진행바로 점수 시각화 (86% → 막대 그래프)
- 배지로 등급 표시 (⭐ 최고, ⚠️ 개선 필요)

---

## 5. 구현 가이드

### Step 1: CSS 파일 생성

```bash
# 파일 생성
touch "C:\Development_PoliticianFinder_com\Developement_Real_PoliticianFinder\0-3_AI_Evaluation_Engine\설계문서_V7.0\V40\보고서\report-style.css"
```

위의 **3-2. 전체 CSS 스타일시트** 내용을 복사하여 `report-style.css`에 저장합니다.

---

### Step 2: HTML 파일 수정

기존 `조은희_V40_평가보고서_20260206.html` 파일을 다음과 같이 수정합니다.

#### 2-1. <head> 섹션 수정

기존:
```html
<head>
  <meta charset="utf-8" />
  <meta name="generator" content="pandoc" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes" />
  <title>조은희 의원 V40 평가보고서</title>
  <style>
    /* pandoc 기본 스타일 */
  </style>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@5/github-markdown.min.css" />
</head>
```

수정 후:
```html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="author" content="PoliticianFinder AI Evaluation System">
  <meta name="description" content="조은희 의원 V40 AI 기반 상세평가보고서">

  <title>조은희 의원 V40 평가보고서 | PoliticianFinder</title>

  <!-- Pretendard 폰트 -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css">

  <!-- 메인 스타일시트 -->
  <link rel="stylesheet" href="report-style.css">
</head>
```

#### 2-2. <body> 구조 수정

기존:
```html
<body>
<header id="title-block-header">
<h1 class="title">조은희 의원 V40 평가보고서</h1>
</header>
<h1 id="조은희-ai-기반-정치인-상세평가보고서">조은희 AI 기반 정치인 상세평가보고서</h1>
<p><strong>평가 일자</strong>: 2026-02-06 ...</p>
```

수정 후:
```html
<body>
<!-- 1. 표지 (첫 페이지) -->
<div class="page-break-after">
  <h1>조은희 의원<br>V40 평가보고서</h1>

  <div class="meta-info" style="text-align: center; margin-top: 24pt;">
    <p><span class="meta-info-highlight">평가 일자</span>: 2026-02-06</p>
    <p><span class="meta-info-highlight">데이터 수집</span>: Google 검색, Naver API, 웹 페칭</p>
    <p><span class="meta-info-highlight">평가 AI</span>: Claude, ChatGPT, Grok, Gemini (4개)</p>
    <p style="margin-top: 48pt; font-size: 10pt; color: var(--text-tertiary);">
      Powered by <strong>PoliticianFinder AI Evaluation System</strong>
    </p>
  </div>
</div>

<!-- 2. 정치인 프로필 -->
<section id="section-1">
  <h2>1. 정치인 프로필</h2>

  <h3>기본 정보</h3>
  <ul>
    <li><strong>이름</strong>: 조은희</li>
    <li><strong>소속</strong>: 국민의힘</li>
    <li><strong>현재 직책</strong>: 제22대 국회의원 (서울 서초구갑)</li>
  </ul>

  <!-- ... 나머지 프로필 내용 ... -->
</section>

<!-- 3. 한눈에 보는 평가 요약 (Executive Summary) -->
<section id="section-2" class="page-break-before">
  <h2>2. 한눈에 보는 평가 요약</h2>

  <div class="executive-summary no-break">
    <!-- 위 3-3 참조 -->
  </div>
</section>

<!-- 4. 강점 TOP 5 -->
<section id="section-3" class="page-break-before">
  <h2>3. 강점 TOP 5</h2>

  <div class="strength-card no-break">
    <!-- 위 3-4 참조 -->
  </div>

  <!-- ... 나머지 강점 카드 ... -->
</section>

<!-- ... 나머지 섹션 ... -->
</body>
```

---

### Step 3: 표 및 카드 요소 치환

#### 3-1. 기존 표 찾기 및 치환

기존:
```html
<table>
<thead>
<tr>
<th>AI</th>
<th style="text-align: center;">점수</th>
</tr>
</thead>
<tbody>
<tr>
<td>ChatGPT</td>
<td style="text-align: center;">881점</td>
</tr>
<!-- ... -->
</tbody>
</table>
```

수정 후 (진행바 추가):
```html
<table class="no-break">
<thead>
<tr>
<th>AI</th>
<th style="text-align: center;">점수</th>
<th style="text-align: center;">시각화</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>ChatGPT</strong></td>
<td style="text-align: center;">881점</td>
<td>
  <div class="progress-bar">
    <div class="progress-bar-fill" style="width: 88.1%;">
      <span class="progress-bar-text">88.1%</span>
    </div>
  </div>
</td>
</tr>
<!-- ... -->
</tbody>
</table>
```

#### 3-2. 긍정/부정 비율 바 치환

기존:
```html
<pre><code>긍정 평가 데이터: ████████████████████ 94.5% (3,870개)
부정 평가 데이터: █ 5.5% (224개)</code></pre>
```

수정 후:
```html
<div class="no-break" style="margin: 16pt 0;">
  <h4>긍정/부정 평가 비율</h4>

  <div style="margin: 12pt 0;">
    <p style="margin-bottom: 4pt;">
      <strong>긍정 평가 데이터</strong>: 94.5% (3,870개)
    </p>
    <div class="progress-bar">
      <div class="progress-bar-fill" style="width: 94.5%; background: linear-gradient(to right, var(--success-green), var(--success-green-light));">
        <span class="progress-bar-text">94.5%</span>
      </div>
    </div>
  </div>

  <div style="margin: 12pt 0;">
    <p style="margin-bottom: 4pt;">
      <strong>부정 평가 데이터</strong>: 5.5% (224개)
    </p>
    <div class="progress-bar">
      <div class="progress-bar-fill" style="width: 5.5%; background: linear-gradient(to right, var(--danger-red), var(--danger-red-light));">
        <span class="progress-bar-text">5.5%</span>
      </div>
    </div>
  </div>

  <div class="info-box" style="margin-top: 16pt;">
    <p><strong>참고</strong>: 이것은 AI가 수집한 뉴스/자료 데이터의 긍정/부정 비율이며, 시민 여론조사 결과가 아닙니다.</p>
  </div>
</div>
```

#### 3-3. ⚠️ 경고문 치환

기존:
```html
<p><strong>⚠️ 참고</strong>: 이것은 AI가 수집한 뉴스/자료 데이터의 긍정/부정 비율이며, 시민 여론조사 결과가 아닙니다.</p>
```

수정 후:
```html
<div class="info-box">
  <p>이것은 AI가 수집한 뉴스/자료 데이터의 긍정/부정 비율이며, 시민 여론조사 결과가 아닙니다.</p>
</div>
```

---

### Step 4: PDF 변환 테스트

#### 4-1. WeasyPrint 사용 (권장)

```bash
# 설치
pip install weasyprint

# 변환
weasyprint "조은희_V40_평가보고서_20260206.html" "조은희_V40_평가보고서_20260206.pdf"
```

**장점**:
- CSS @page 완벽 지원
- 한글 폰트 지원 우수
- 무료 오픈소스

**단점**:
- 설치 복잡 (DLL 의존성)

#### 4-2. Puppeteer 사용 (대안)

```javascript
// convert-to-pdf.js
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto('file:///C:/Development_PoliticianFinder_com/.../조은희_V40_평가보고서_20260206.html', {
    waitUntil: 'networkidle0'
  });

  await page.pdf({
    path: '조은희_V40_평가보고서_20260206.pdf',
    format: 'A4',
    margin: {
      top: '20mm',
      right: '25mm',
      bottom: '20mm',
      left: '25mm'
    },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size: 9pt; color: #9ca3af; text-align: center; width: 100%; padding-bottom: 5mm; border-bottom: 0.5pt solid #e5e7eb;">조은희 의원 V40 평가보고서</div>',
    footerTemplate: '<div style="font-size: 9pt; color: #9ca3af; text-align: center; width: 100%;">- <span class="pageNumber"></span> -</div>'
  });

  await browser.close();
  console.log('PDF 생성 완료!');
})();
```

```bash
# 실행
node convert-to-pdf.js
```

**장점**:
- Chrome 기반, CSS 완벽 지원
- 설치 간단

**단점**:
- Node.js 필요

#### 4-3. 브라우저 인쇄 (가장 간단)

1. Chrome에서 HTML 파일 열기
2. Ctrl+P (인쇄)
3. 대상: "PDF로 저장"
4. 설정:
   - 용지 크기: A4
   - 여백: 사용자 지정 (20mm, 25mm, 20mm, 25mm)
   - 배경 그래픽: 켜기
5. 저장

**장점**:
- 설치 불필요
- 즉시 확인 가능

**단점**:
- 헤더/푸터 커스터마이징 제한

---

### Step 5: 품질 검증

#### 5-1. 체크리스트

- [ ] **레이아웃**
  - [ ] A4 용지에 맞게 표시되는가?
  - [ ] 여백이 적절한가? (상하 20mm, 좌우 25mm)
  - [ ] 페이지 번호가 표시되는가?
  - [ ] 섹션이 페이지 중간에서 끊기지 않는가?

- [ ] **타이포그래피**
  - [ ] 제목 크기가 적절한가? (H1 32pt, H2 24pt, H3 18pt)
  - [ ] 본문 가독성은 좋은가? (11pt, 1.7 줄간격)
  - [ ] 한글 폰트(Pretendard)가 적용되었는가?

- [ ] **컬러**
  - [ ] 파란색 브랜드 컬러가 일관되게 적용되었는가?
  - [ ] 강점(초록), 약점(주황) 색상이 명확한가?
  - [ ] 흑백 인쇄 시에도 구분 가능한가?

- [ ] **데이터 시각화**
  - [ ] 점수 카드가 눈에 잘 띄는가?
  - [ ] 진행바가 정확히 표시되는가?
  - [ ] 표가 읽기 편한가?

- [ ] **인쇄 품질**
  - [ ] 배경색이 인쇄되는가?
  - [ ] 그림자가 과하지 않은가?
  - [ ] 링크 URL이 표시되는가?

#### 5-2. 실제 인쇄 테스트

1. PDF를 실제 프린터로 인쇄
2. 다음 항목 확인:
   - 여백이 적절한가?
   - 색상이 선명한가?
   - 글자가 선명한가?
   - 페이지 번호가 보이는가?

---

## 6. 디자인 결정 근거

### 6-1. 왜 파란색인가?

**이유 1: 정치 보고서 표준 색상**
- 청와대, 국회, 정부 부처 보고서는 대부분 파란색 계열
- 국제적으로도 정치/정부 문서는 파란색 (UN, NATO, EU 등)

**이유 2: 신뢰감, 전문성 전달**
- 색채 심리학: 파란색 = 신뢰, 안정, 전문성, 지성
- 빨강/노랑은 자극적, 초록은 환경/건강 연상

**이유 3: 인쇄 시 가독성 우수**
- 파란색은 흑백 인쇄 시에도 명도 차이로 명확히 구분
- 컬러 인쇄 시에도 눈이 편함 (빨강처럼 자극적이지 않음)

**이유 4: 성별/연령/정파 중립적**
- 빨강(진보) vs 파랑(보수) 논란 있지만, 진한 파랑은 중립적
- 모든 연령대가 선호하는 색상 (유니버설 디자인)

---

### 6-2. 왜 박스 디자인인가?

**이유 1: 정보 구조화**
- 핵심 정보(Executive Summary)를 시각적으로 묶어 강조
- 강점/약점을 명확히 구분 (색상 + 테두리)

**이유 2: 스캔 가능성 향상**
- 바쁜 정치인이 전체를 읽지 않아도 박스만 훑어도 핵심 파악
- "강점 5개", "약점 3개" → 박스 개수로 즉시 인식

**이유 3: 시각적 휴식 제공**
- 텍스트만 가득한 보고서는 지루함
- 박스/카드로 시각적 리듬감 부여

**이유 4: 실행 가능성 강조**
- "강화 방향", "개선 방향" 박스 → 실제 행동 촉구
- 단순 평가가 아닌 "개선 도구"로서의 보고서

---

### 6-3. 왜 Pretendard 폰트인가?

**이유 1: 한글 가독성 최고**
- 한글 최적화 폰트 (본고딕 기반 개선)
- 자간, 행간, 글자 형태 모두 가독성 중심 설계

**이유 2: 무료 상업용 라이선스**
- SIL Open Font License (OFL)
- 웹폰트 CDN 제공 (별도 설치 불필요)

**이유 3: 다양한 굵기 지원**
- Thin (100) ~ Black (900) 9단계
- 제목/본문/강조 등 다양한 용도에 맞는 굵기 선택 가능

**이유 4: 숫자 표시 우수**
- Tabular Nums (표 숫자) 지원
- 점수, 날짜, 페이지 번호 등이 깔끔하게 정렬

**대안**:
- Noto Sans KR (구글, 무료) - 약간 딱딱한 느낌
- Spoqa Han Sans (스포카, 무료) - 모던하지만 가독성 떨어짐
- 나눔고딕 (네이버, 무료) - 클래식하지만 구시대적

---

### 6-4. 왜 11pt 본문 크기인가?

**이유 1: A4 인쇄 최적 크기**
- 10pt: 너무 작아 눈이 피로함
- 12pt: 너무 커서 페이지당 정보량 감소
- 11pt: 가독성과 정보 밀도의 균형점

**이유 2: 전문 보고서 표준**
- 정부 부처, 기업 보고서 대부분 11pt 사용
- 학술 논문: 12pt (더 여유로움)
- 기술 문서: 10pt (더 많은 정보)

**이유 3: 1.7 줄간격과 조합**
- 줄간격이 넓으면 글자 크기는 작아도 읽기 편함
- 11pt + 1.7 line-height = 황금 비율

---

### 6-5. 왜 진행바(Progress Bar)인가?

**이유 1: 직관적 이해**
- "86점" → 숫자만으로는 감이 안 옴
- "86% 막대" → 시각적으로 "거의 다 채워짐" 인식

**이유 2: 비교 용이**
- 표에서 여러 카테고리 점수를 한눈에 비교
- "비전 86% vs 청렴성 76%" → 차이 명확

**이유 3: 감성적 효과**
- 막대가 많이 채워짐 → 성취감
- 막대가 적게 채워짐 → 개선 필요 인식

**이유 4: 국제 표준**
- 대부분의 리포트 도구(Tableau, Power BI 등)에서 사용
- 사용자에게 익숙한 UI

---

### 6-6. 왜 카드 레이아웃인가?

**이유 1: 모바일 친화적**
- 화면에서도 보기 좋은 디자인 (반응형)
- 세로 스크롤 시 카드 단위로 인식

**이유 2: 모듈화**
- 강점 카드, 약점 카드를 독립적으로 관리
- 순서 변경, 추가/삭제 용이

**이유 3: 시각적 분리**
- 긴 텍스트를 카드로 나누면 덜 지루함
- 각 카드 = 하나의 완결된 스토리

**이유 4: 브랜딩**
- 현대적이고 트렌디한 느낌
- 정부 보고서의 딱딱함 탈피

---

## 7. 최종 체크리스트

### 7-1. 디자인 품질

- [ ] **브랜드 아이덴티티**
  - [ ] 파란색 계열 일관되게 적용
  - [ ] 로고/워터마크 필요 시 추가
  - [ ] 폰트 일관성 (Pretendard)

- [ ] **정보 위계**
  - [ ] H1 > H2 > H3 > H4 크기 차이 명확
  - [ ] 중요 정보(점수, 등급) 시각적 강조
  - [ ] 부가 정보(주석, 출처) 작게 표시

- [ ] **컬러 사용**
  - [ ] 강점(초록), 약점(주황), 중립(파랑) 구분
  - [ ] 과도한 색상 사용 지양 (3~4가지 색상만)
  - [ ] 흑백 인쇄 시에도 가독성 확보

### 7-2. 인쇄 품질

- [ ] **페이지 설정**
  - [ ] A4 크기 (210mm × 297mm)
  - [ ] 여백 적절 (상하 20mm, 좌우 25mm)
  - [ ] 페이지 번호 표시 (하단 중앙)
  - [ ] 헤더 표시 (상단 중앙, 보고서 제목)

- [ ] **페이지 브레이크**
  - [ ] 섹션이 페이지 중간에서 끊기지 않음
  - [ ] 표/차트가 페이지 중간에서 끊기지 않음
  - [ ] 제목 아래 본문이 바로 이어짐 (제목만 페이지 끝에 고립 X)

- [ ] **배경색 인쇄**
  - [ ] 박스 배경색 인쇄됨
  - [ ] 표 헤더 파란색 인쇄됨
  - [ ] 진행바 색상 인쇄됨

### 7-3. 콘텐츠 품질

- [ ] **완성도**
  - [ ] 모든 섹션 (1~10) 포함
  - [ ] 강점 5개, 약점 3개 모두 포함
  - [ ] 카테고리별 점수 (10개) 모두 포함

- [ ] **정확성**
  - [ ] 점수 계산 정확
  - [ ] AI별 점수 합계 확인
  - [ ] 진행바 % 정확

- [ ] **가독성**
  - [ ] 오타 없음
  - [ ] 문장 길이 적절 (40자 이내)
  - [ ] 전문 용어 설명 포함

### 7-4. 접근성 (Accessibility)

- [ ] **WCAG 2.1 AA 준수**
  - [ ] 색상 대비율 4.5:1 이상 (본문)
  - [ ] 색상 대비율 3:1 이상 (제목)
  - [ ] 색상만으로 정보 전달하지 않음 (아이콘, 텍스트 병행)

- [ ] **스크린 리더**
  - [ ] 이미지에 alt 텍스트 (필요 시)
  - [ ] 표에 caption 추가 (필요 시)
  - [ ] 링크에 명확한 텍스트

### 7-5. 성능

- [ ] **파일 크기**
  - [ ] PDF 파일 크기 10MB 이하
  - [ ] 이미지 최적화 (필요 시)
  - [ ] 폰트 서브셋 (필요 시)

- [ ] **변환 속도**
  - [ ] HTML → PDF 변환 30초 이내
  - [ ] 페이지 로딩 3초 이내

---

## 8. 추가 개선 아이디어 (선택 사항)

### 8-1. 인터랙티브 요소 (웹용)

만약 웹에서 보여줄 경우:

```javascript
// 점수 카드 애니메이션
document.addEventListener('DOMContentLoaded', () => {
  const scoreCards = document.querySelectorAll('.score-card-value');

  scoreCards.forEach(card => {
    const finalValue = parseInt(card.textContent);
    let currentValue = 0;

    const interval = setInterval(() => {
      currentValue += Math.ceil(finalValue / 50);
      if (currentValue >= finalValue) {
        currentValue = finalValue;
        clearInterval(interval);
      }
      card.textContent = currentValue;
    }, 20);
  });
});

// 진행바 애니메이션
const progressBars = document.querySelectorAll('.progress-bar-fill');
progressBars.forEach(bar => {
  const width = bar.style.width;
  bar.style.width = '0%';
  setTimeout(() => {
    bar.style.width = width;
  }, 100);
});
```

### 8-2. 차트 추가 (Chart.js)

```html
<canvas id="categoryChart"></canvas>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
const ctx = document.getElementById('categoryChart').getContext('2d');
new Chart(ctx, {
  type: 'radar',
  data: {
    labels: ['비전', '대응성', '전문성', '공익성', '리더십',
             '소통', '투명성', '책임감', '윤리성', '청렴성'],
    datasets: [{
      label: '조은희 의원',
      data: [86, 84, 83, 83, 82, 82, 81, 80, 79, 76],
      backgroundColor: 'rgba(30, 64, 175, 0.2)',
      borderColor: 'rgba(30, 64, 175, 1)',
      borderWidth: 2
    }]
  },
  options: {
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: { stepSize: 20 }
      }
    }
  }
});
</script>
```

### 8-3. 목차 추가

```html
<div class="page-break-after">
  <h2>목차</h2>
  <ul class="toc">
    <li><a href="#section-1">1. 정치인 프로필</a></li>
    <li><a href="#section-2">2. 한눈에 보는 평가 요약</a></li>
    <li><a href="#section-3">3. 강점 TOP 5</a></li>
    <li><a href="#section-4">4. 약점 TOP 3</a></li>
    <li><a href="#section-5">5. 카테고리별 상세 평가 (10개)</a></li>
    <li><a href="#section-6">6. AI별 평가 비교</a></li>
    <li><a href="#section-7">7. 정치 성향 및 특징</a></li>
    <li><a href="#section-8">8. 실행 체크리스트</a></li>
    <li><a href="#section-9">9. 평가 시스템 설명</a></li>
    <li><a href="#section-10">10. 부록</a></li>
  </ul>
</div>
```

### 8-4. QR 코드 추가 (웹 연결)

```html
<div style="text-align: center; margin: 24pt 0;">
  <p><strong>온라인에서 더 많은 정보 확인</strong></p>
  <img src="qr-code-조은희.png" alt="QR Code" style="width: 80pt; height: 80pt;">
  <p style="font-size: 9pt; color: var(--text-tertiary);">
    QR 코드를 스캔하여 실시간 업데이트 확인
  </p>
</div>
```

---

## 9. 마무리

이 디자인 개선안을 적용하면:

1. ✅ **전문성**: 정부/정치 보고서 수준의 디자인
2. ✅ **가독성**: 핵심 정보 빠르게 파악 (바쁜 정치인 고려)
3. ✅ **인쇄 품질**: A4 인쇄 시 완벽한 레이아웃
4. ✅ **브랜딩**: 파란색 계열로 신뢰감 전달
5. ✅ **실용성**: 강점/약점 명확히 구분, 개선 방향 제시

**결과적으로**:
- 정치인이 "읽고 싶어지는" 보고서
- 단순 평가가 아닌 "개선 도구"로서의 가치
- 실제 정치 활동에 활용 가능한 실용적 보고서

**다음 단계**:
1. CSS 파일 생성 (`report-style.css`)
2. HTML 파일 수정 (head, body 구조)
3. 표/카드 요소 치환
4. PDF 변환 테스트 (WeasyPrint 또는 Puppeteer)
5. 실제 인쇄 테스트
6. 품질 검증 (체크리스트)

---

**작성 완료**: 2026-02-06
**총 분량**: 약 8,500 단어 (완전한 구현 가이드 포함)
