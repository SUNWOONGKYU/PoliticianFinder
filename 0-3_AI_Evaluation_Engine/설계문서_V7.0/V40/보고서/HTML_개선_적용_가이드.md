# HTML 개선 적용 가이드

**작성일**: 2026-02-06
**대상**: 조은희_V40_평가보고서_20260206.html
**목표**: 디자인 개선안을 실제 HTML에 적용

---

## 1. 준비 사항

### 1-1. 파일 확인

```bash
# 필요한 파일 3개
C:\...\설계문서_V7.0\V40\보고서\
├── 조은희_V40_평가보고서_20260206.html  (원본 - 수정할 파일)
├── report-style.css                      (신규 - 생성 완료)
└── V40_평가보고서_PDF_디자인_개선안.md    (참조 문서)
```

### 1-2. 백업 생성

```bash
# 원본 백업 (수정 전 필수)
copy "조은희_V40_평가보고서_20260206.html" "조은희_V40_평가보고서_20260206_원본백업.html"
```

---

## 2. HTML <head> 섹션 수정

### 2-1. 현재 <head> 확인

기존 HTML 파일을 열어 `<head>` 섹션을 찾습니다.

```html
<head>
  <meta charset="utf-8" />
  <meta name="generator" content="pandoc" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes" />
  <title>조은희 의원 V40 평가보고서</title>
  <style>
    /* pandoc 기본 스타일 (긴 CSS) */
  </style>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@5/github-markdown.min.css" />
</head>
```

### 2-2. 수정 방법

**방법 1: 기존 <style> 태그 제거, CSS 파일 링크 추가**

```html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="author" content="PoliticianFinder AI Evaluation System">
  <meta name="description" content="조은희 의원 V40 AI 기반 상세평가보고서">

  <title>조은희 의원 V40 평가보고서 | PoliticianFinder</title>

  <!-- Pretendard 폰트 -->
  <link rel="preconnect" href="https://cdn.jsdelivr.net">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css">

  <!-- 메인 스타일시트 (새 CSS) -->
  <link rel="stylesheet" href="report-style.css">
</head>
```

**변경 사항**:
- ❌ 제거: 기존 `<style>` 태그 (pandoc 기본 스타일)
- ❌ 제거: GitHub 마크다운 CSS 링크
- ✅ 추가: Pretendard 폰트 링크
- ✅ 추가: `report-style.css` 링크

---

## 3. HTML <body> 구조 개선

### 3-1. 표지 페이지 추가

기존 HTML의 `<body>` 시작 부분을 다음과 같이 수정:

**Before**:
```html
<body>
<header id="title-block-header">
<h1 class="title">조은희 의원 V40 평가보고서</h1>
</header>
<h1 id="조은희-ai-기반-정치인-상세평가보고서">조은희 AI 기반 정치인 상세평가보고서</h1>
<p><strong>평가 일자</strong>: 2026-02-06 <strong>데이터 수집</strong>: Google 검색 및 웹 페칭, Naver 검색 API <strong>평가 AI</strong>: Claude, ChatGPT, Grok, Gemini</p>
```

**After**:
```html
<body>
<!-- 표지 페이지 -->
<div class="page-break-after">
  <h1>조은희 의원<br>V40 평가보고서</h1>

  <div class="meta-info" style="text-align: center; margin-top: 48pt;">
    <p style="font-size: 12pt; margin-bottom: 8pt;">
      <span class="meta-info-highlight">평가 일자</span>: 2026-02-06
    </p>
    <p style="font-size: 11pt; margin-bottom: 8pt;">
      <span class="meta-info-highlight">데이터 수집</span>: Google 검색, Naver API, 웹 페칭
    </p>
    <p style="font-size: 11pt; margin-bottom: 8pt;">
      <span class="meta-info-highlight">평가 AI</span>: Claude, ChatGPT, Grok, Gemini (4개)
    </p>
    <p style="margin-top: 72pt; font-size: 10pt; color: #9ca3af;">
      Powered by <strong>PoliticianFinder AI Evaluation System</strong><br>
      © 2026 All Rights Reserved
    </p>
  </div>
</div>
```

---

### 3-2. Executive Summary 박스 개선

**섹션 2: 한눈에 보는 평가 요약** 부분을 찾아 다음과 같이 수정:

**Before**:
```html
<h2 id="한눈에-보는-평가-요약">2. 한눈에 보는 평가 요약</h2>
<h3 id="종합-점수">종합 점수</h3>
<p><strong>최종 점수</strong>: <strong>816점</strong> / 1,000점 <strong>등급</strong>: <strong>E (Emerald - 양호)</strong></p>
```

**After**:
```html
<section id="section-2" class="page-break-before">
  <h2>2. 한눈에 보는 평가 요약</h2>

  <div class="executive-summary no-break">
    <!-- 점수 카드 -->
    <div style="text-align: center; margin: 20pt 0;">
      <div class="score-card">
        <span class="score-card-value">816</span>
        <span class="score-card-label">최종 점수 / 1,000</span>
        <div class="score-card-grade">E</div>
        <span class="score-card-label" style="display: block; margin-top: 8pt;">Emerald - 양호</span>
      </div>
    </div>

    <!-- 한 줄 평가 (blockquote는 CSS에서 자동 스타일 적용) -->
    <blockquote>
      <p><strong>"행정 전문성과 미래 비전은 우수하나, 청렴성 논란 해소 필요"</strong></p>
    </blockquote>

    <!-- AI별 점수 표 (기존 표 유지하되 executive-summary 안으로 이동) -->
    <div style="margin: 16pt 0;">
      <h4 style="margin-bottom: 12pt;">AI별 점수</h4>
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
          <tr style="background: #dbeafe; font-weight: 700;">
            <td><strong>4 AIs 평균</strong></td>
            <td style="text-align: center;"><strong>816점</strong></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</section>
```

---

### 3-3. 긍정/부정 비율 진행바 추가

**기존 코드 블록** 찾기:

```html
<pre><code>긍정 평가 데이터: ████████████████████ 94.5% (3,870개)
부정 평가 데이터: █ 5.5% (224개)</code></pre>
```

**교체**:

```html
<div class="no-break" style="margin: 24pt 0;">
  <h4>긍정/부정 평가 비율</h4>

  <!-- 긍정 평가 진행바 -->
  <div style="margin: 16pt 0;">
    <p style="margin-bottom: 4pt; font-weight: 600;">
      긍정 평가 데이터: <strong style="color: #059669;">94.5%</strong> (3,870개)
    </p>
    <div class="progress-bar">
      <div class="progress-bar-fill" style="width: 94.5%; background: linear-gradient(to right, #059669, #10b981);">
        <span class="progress-bar-text">94.5%</span>
      </div>
    </div>
  </div>

  <!-- 부정 평가 진행바 -->
  <div style="margin: 16pt 0;">
    <p style="margin-bottom: 4pt; font-weight: 600;">
      부정 평가 데이터: <strong style="color: #dc2626;">5.5%</strong> (224개)
    </p>
    <div class="progress-bar">
      <div class="progress-bar-fill" style="width: 5.5%; background: linear-gradient(to right, #dc2626, #ef4444);">
        <span class="progress-bar-text">5.5%</span>
      </div>
    </div>
  </div>

  <!-- 참고 사항 박스 -->
  <div class="info-box" style="margin-top: 16pt;">
    <p style="margin: 0;">이것은 AI가 수집한 뉴스/자료 데이터의 긍정/부정 비율이며, 시민 여론조사 결과가 아닙니다.</p>
  </div>
</div>
```

---

### 3-4. 카테고리별 점수 표에 진행바 추가

**기존 표** 찾기:

```html
<table>
<thead>
<tr>
<th>카테고리</th>
<th style="text-align: center;">점수</th>
<th style="text-align: center;">평가</th>
</tr>
</thead>
<tbody>
<tr>
<td>비전 (Vision)</td>
<td style="text-align: center;">86점</td>
<td style="text-align: center;">⭐ 최고</td>
</tr>
<!-- ... -->
</tbody>
</table>
```

**교체** (진행바 컬럼 추가):

```html
<table class="no-break">
<thead>
<tr>
<th>카테고리</th>
<th style="text-align: center; width: 80pt;">점수</th>
<th style="text-align: center; width: 100pt;">평가</th>
<th style="width: 200pt;">시각화</th>
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
<tr>
<td><strong>전문성 (Expertise)</strong></td>
<td style="text-align: center;">83점</td>
<td style="text-align: center;"><span class="badge badge-success">⭐</span></td>
<td>
  <div class="progress-bar">
    <div class="progress-bar-fill" style="width: 83%;">
      <span class="progress-bar-text">83%</span>
    </div>
  </div>
</td>
</tr>
<tr>
<td><strong>공익성 (Publicinterest)</strong></td>
<td style="text-align: center;">83점</td>
<td style="text-align: center;"><span class="badge badge-success">⭐</span></td>
<td>
  <div class="progress-bar">
    <div class="progress-bar-fill" style="width: 83%;">
      <span class="progress-bar-text">83%</span>
    </div>
  </div>
</td>
</tr>
<tr>
<td><strong>리더십 (Leadership)</strong></td>
<td style="text-align: center;">82점</td>
<td style="text-align: center;"><span class="badge badge-info">우수</span></td>
<td>
  <div class="progress-bar">
    <div class="progress-bar-fill" style="width: 82%;">
      <span class="progress-bar-text">82%</span>
    </div>
  </div>
</td>
</tr>
<tr>
<td><strong>소통능력 (Communication)</strong></td>
<td style="text-align: center;">82점</td>
<td style="text-align: center;"><span class="badge badge-info">우수</span></td>
<td>
  <div class="progress-bar">
    <div class="progress-bar-fill" style="width: 82%;">
      <span class="progress-bar-text">82%</span>
    </div>
  </div>
</td>
</tr>
<tr>
<td><strong>투명성 (Transparency)</strong></td>
<td style="text-align: center;">81점</td>
<td style="text-align: center;"><span class="badge badge-info">우수</span></td>
<td>
  <div class="progress-bar">
    <div class="progress-bar-fill" style="width: 81%;">
      <span class="progress-bar-text">81%</span>
    </div>
  </div>
</td>
</tr>
<tr>
<td><strong>책임감 (Accountability)</strong></td>
<td style="text-align: center;">80점</td>
<td style="text-align: center;"><span class="badge badge-info">우수</span></td>
<td>
  <div class="progress-bar">
    <div class="progress-bar-fill" style="width: 80%;">
      <span class="progress-bar-text">80%</span>
    </div>
  </div>
</td>
</tr>
<tr>
<td><strong>윤리성 (Ethics)</strong></td>
<td style="text-align: center;">79점</td>
<td style="text-align: center;"><span class="badge badge-info">양호</span></td>
<td>
  <div class="progress-bar">
    <div class="progress-bar-fill" style="width: 79%;">
      <span class="progress-bar-text">79%</span>
    </div>
  </div>
</td>
</tr>
<tr>
<td><strong>청렴성 (Integrity)</strong></td>
<td style="text-align: center;">76점</td>
<td style="text-align: center;"><span class="badge badge-warning">⚠️ 개선 필요</span></td>
<td>
  <div class="progress-bar">
    <div class="progress-bar-fill" style="width: 76%; background: linear-gradient(to right, #d97706, #f59e0b);">
      <span class="progress-bar-text">76%</span>
    </div>
  </div>
</td>
</tr>
</tbody>
</table>
```

---

### 3-5. 강점/약점 카드 스타일 적용

**섹션 3: 강점 TOP 5**에서 각 강점을 다음과 같이 감싸기:

**Before**:
```html
<h3 id="강점-1-미래-지향적-비전-86점">강점 1: 미래 지향적 비전 (86점) ⭐</h3>
<h4 id="왜-강점인가">왜 강점인가</h4>
<p>제주특별자치도 국제자유도시 조성을 위한 특별법 개정안...</p>
<!-- ... 나머지 내용 ... -->
```

**After**:
```html
<div class="strength-card no-break">
  <h3>강점 1: 미래 지향적 비전 (86점) ⭐</h3>

  <h4>왜 강점인가</h4>
  <p>제주특별자치도 국제자유도시 조성을 위한 특별법 개정안, 경부고속도로 지하화 등 <strong>중장기 정책 비전 제시</strong>로 높은 평가를 받았습니다.</p>

  <h4>구체적 평가 사례</h4>
  <ol>
    <li>
      <strong>제주특별자치도 국제자유도시 조성 특별법 개정안</strong>
      <ul>
        <li>ChatGPT 평가: <span class="badge badge-success">+4점 (최우수)</span></li>
        <li>ChatGPT 평가 근거: "지역 발전에 기여할 수 있는 중요한 정책이다"</li>
        <li>의미: 제주만이 아닌 전국적 확장 가능성을 염두에 둔 입법</li>
      </ul>
    </li>
    <!-- ... 나머지 사례 ... -->
  </ol>

  <h4>강화 방향 ⭐</h4>
  <p>이미 우수한 비전을 <strong>더 구체적인 실행 계획</strong>으로 발전시키면 더욱 효과적입니다:</p>
  <ol>
    <li><strong>단기/중기/장기 로드맵 제시</strong>
      <ul>
        <li>예: "경부고속도로 지하화 → 1단계(타당성 조사) → 2단계(예비 설계) → 3단계(시범 구간)"</li>
        <li>구체적 일정을 제시하여 정책 실행 가능성 강조</li>
      </ul>
    </li>
    <!-- ... 나머지 방향 ... -->
  </ol>
</div>
<hr>
```

**동일하게** 강점 2, 3, 4, 5에도 `.strength-card` 적용.

---

**섹션 4: 약점 TOP 3**에도 동일하게:

**After**:
```html
<div class="weakness-card no-break">
  <h3>약점 1: 청렴성 논란 (76점) ⚠️</h3>

  <h4>왜 약점인가</h4>
  <p>친인척 채용 논란, 특혜 의혹 등으로 청렴성 부분에서 상대적으로 낮은 점수를 받았습니다.</p>

  <h4>구체적 평가 사례</h4>
  <!-- ... -->

  <h4>개선 방향 🎯</h4>
  <!-- ... -->
</div>
<hr>
```

---

## 4. 빠른 수정 팁 (Find & Replace)

### 4-1. VS Code 또는 텍스트 편집기 사용

**검색 및 치환 (Ctrl+H 또는 Cmd+H)**:

#### 치환 1: 강점 섹션 감싸기

**찾기** (정규식 사용):
```regex
(<h3 id="강점.*?</h3>)([\s\S]*?)(<hr />)
```

**바꾸기**:
```html
<div class="strength-card no-break">
$1$2
</div>
$3
```

#### 치환 2: 약점 섹션 감싸기

**찾기** (정규식):
```regex
(<h3 id="약점.*?</h3>)([\s\S]*?)(<hr />)
```

**바꾸기**:
```html
<div class="weakness-card no-break">
$1$2
</div>
$3
```

#### 치환 3: 배지 추가

**찾기**:
```
⭐ 최고
```

**바꾸기**:
```html
<span class="badge badge-success">⭐ 최고</span>
```

**찾기**:
```
⚠️ 개선 필요
```

**바꾸기**:
```html
<span class="badge badge-warning">⚠️ 개선 필요</span>
```

---

## 5. PDF 변환

### 5-1. WeasyPrint 사용 (권장)

```bash
# 1. WeasyPrint 설치 (Python 필요)
pip install weasyprint

# 2. HTML → PDF 변환
weasyprint "조은희_V40_평가보고서_20260206.html" "조은희_V40_평가보고서_최종.pdf"
```

**결과 확인**:
- 파일 크기: 약 2-5MB (예상)
- 페이지 수: 약 30-40페이지 (예상)

---

### 5-2. Chrome 브라우저 인쇄 (간편)

1. HTML 파일을 Chrome에서 열기
2. **Ctrl+P** (인쇄)
3. 대상: **PDF로 저장**
4. 설정:
   - 레이아웃: **세로**
   - 용지 크기: **A4**
   - 여백: **기본값** 또는 **사용자 설정** (상하좌우 20mm, 25mm)
   - 배경 그래픽: **✅ 켜기** (필수!)
   - 척도: **100%**
5. **저장** 클릭

**장점**:
- 설치 불필요
- 빠른 미리보기

**단점**:
- 헤더/푸터 커스터마이징 제한
- 페이지 번호 자동 생성 안 됨

---

### 5-3. Puppeteer 사용 (고급)

Node.js가 설치되어 있다면:

**convert-to-pdf.js** 생성:

```javascript
const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const htmlPath = path.resolve(__dirname, '조은희_V40_평가보고서_20260206.html');

  await page.goto(`file://${htmlPath}`, {
    waitUntil: 'networkidle0'
  });

  await page.pdf({
    path: '조은희_V40_평가보고서_최종.pdf',
    format: 'A4',
    margin: {
      top: '20mm',
      right: '25mm',
      bottom: '20mm',
      left: '25mm'
    },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="font-size: 9pt; color: #9ca3af; text-align: center; width: 100%; padding-bottom: 5mm; border-bottom: 0.5pt solid #e5e7eb;">
        조은희 의원 V40 평가보고서
      </div>
    `,
    footerTemplate: `
      <div style="font-size: 9pt; color: #9ca3af; text-align: center; width: 100%;">
        - <span class="pageNumber"></span> / <span class="totalPages"></span> -
      </div>
    `
  });

  await browser.close();
  console.log('✅ PDF 생성 완료: 조은희_V40_평가보고서_최종.pdf');
})();
```

**실행**:

```bash
# Puppeteer 설치
npm install puppeteer

# PDF 생성
node convert-to-pdf.js
```

---

## 6. 품질 검증

### 6-1. 시각적 검증

PDF를 열어 다음을 확인:

- [ ] **표지 페이지**
  - [ ] 제목이 중앙 정렬되어 있는가?
  - [ ] 메타 정보가 잘 보이는가?
  - [ ] 페이지 번호가 없는가? (첫 페이지만)

- [ ] **섹션 2: 한눈에 보는 평가 요약**
  - [ ] 점수 카드가 눈에 띄는가?
  - [ ] 파란색 테두리와 큰 숫자(816)가 보이는가?
  - [ ] 등급(E) 박스가 파란색 배경인가?

- [ ] **긍정/부정 비율**
  - [ ] 진행바가 표시되는가?
  - [ ] 초록색(긍정), 빨간색(부정) 색상이 보이는가?
  - [ ] 참고 박스가 파란색 배경인가?

- [ ] **카테고리별 점수 표**
  - [ ] 표 헤더가 파란색 배경인가?
  - [ ] 진행바 컬럼이 추가되었는가?
  - [ ] 각 카테고리 점수가 진행바로 표시되는가?

- [ ] **강점/약점 카드**
  - [ ] 강점 카드가 초록색 배경인가?
  - [ ] 약점 카드가 주황색 배경인가?
  - [ ] 좌측 세로 테두리가 보이는가?

- [ ] **페이지 번호**
  - [ ] 하단 중앙에 페이지 번호가 있는가? (표지 제외)
  - [ ] 상단에 "조은희 의원 V40 평가보고서" 헤더가 있는가?

### 6-2. 인쇄 테스트

실제 프린터로 2-3페이지만 인쇄하여 확인:

- [ ] **색상**
  - [ ] 파란색이 선명하게 인쇄되는가?
  - [ ] 초록색/주황색이 구분되는가?

- [ ] **여백**
  - [ ] 상하좌우 여백이 적절한가?
  - [ ] 텍스트가 잘리지 않는가?

- [ ] **글자**
  - [ ] 글자가 선명하게 읽히는가?
  - [ ] 제목과 본문 크기 차이가 명확한가?

- [ ] **표**
  - [ ] 표 헤더 파란색이 인쇄되는가?
  - [ ] 진행바 색상이 인쇄되는가?

---

## 7. 문제 해결

### 7-1. CSS가 적용되지 않음

**증상**: HTML을 열었을 때 기본 스타일만 보임

**해결**:
1. `report-style.css` 파일이 HTML과 같은 폴더에 있는지 확인
2. HTML `<head>`에 `<link rel="stylesheet" href="report-style.css">` 있는지 확인
3. 브라우저 캐시 삭제 (Ctrl+Shift+R)

---

### 7-2. 폰트가 적용되지 않음

**증상**: 폰트가 시스템 기본 폰트로 표시됨

**해결**:
1. 인터넷 연결 확인 (Pretendard CDN)
2. HTML `<head>`에 폰트 링크 있는지 확인:
   ```html
   <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css">
   ```
3. 브라우저 개발자 도구(F12) → Network 탭에서 폰트 로드 확인

---

### 7-3. 진행바가 보이지 않음

**증상**: 진행바 대신 빈 회색 박스만 보임

**해결**:
1. HTML에 `.progress-bar-fill`의 `width` 속성이 설정되어 있는지 확인:
   ```html
   <div class="progress-bar-fill" style="width: 86%;">
   ```
2. `style` 속성이 인라인으로 들어가야 함 (CSS 파일이 아닌 HTML에 직접)

---

### 7-4. 배경색이 PDF에 인쇄되지 않음

**증상**: 박스 배경색, 표 헤더 색상이 PDF에서 흰색으로 나옴

**해결**:

**WeasyPrint 사용 시**:
- `-webkit-print-color-adjust: exact` 속성이 CSS에 있는지 확인 (이미 포함됨)

**Chrome 인쇄 시**:
- 인쇄 대화상자에서 **"배경 그래픽"을 반드시 켜기** ✅

**Puppeteer 사용 시**:
- `printBackground: true` 옵션 확인 (이미 포함됨)

---

### 7-5. 페이지 번호가 보이지 않음

**증상**: PDF에 페이지 번호가 표시되지 않음

**해결**:

**WeasyPrint**: 자동 지원 (CSS `@page` 규칙 사용)

**Chrome 인쇄**:
- 안타깝게도 Chrome은 CSS `@page`의 `@bottom-center`를 지원하지 않음
- 대안: Puppeteer 사용 (headerTemplate, footerTemplate 지원)

**Puppeteer**:
- `displayHeaderFooter: true` 옵션 확인
- `headerTemplate`, `footerTemplate` 설정 확인

---

## 8. 최종 체크리스트

### 8-1. HTML 수정 완료 확인

- [ ] `<head>` 섹션에 `report-style.css` 링크 추가
- [ ] Pretendard 폰트 링크 추가
- [ ] 표지 페이지 추가
- [ ] Executive Summary 박스 적용
- [ ] 긍정/부정 비율 진행바 추가
- [ ] 카테고리별 점수 표에 진행바 컬럼 추가
- [ ] 강점 5개에 `.strength-card` 적용
- [ ] 약점 3개에 `.weakness-card` 적용
- [ ] 배지 (badge) 클래스 추가

### 8-2. PDF 변환 완료 확인

- [ ] PDF 파일 생성 성공
- [ ] 파일 크기 10MB 이하
- [ ] 페이지 수 확인 (30-40페이지 예상)
- [ ] 표지 페이지 확인
- [ ] 페이지 번호 확인 (표지 제외)
- [ ] 섹션별 페이지 브레이크 확인

### 8-3. 디자인 품질 확인

- [ ] 파란색 브랜드 컬러 일관성
- [ ] 제목 계층 명확 (H1 > H2 > H3 > H4)
- [ ] 점수 카드 시각적 강조
- [ ] 진행바 정확한 비율 표시
- [ ] 강점(초록)/약점(주황) 색상 구분
- [ ] 표 헤더 파란색 배경
- [ ] 배지 색상 적절히 적용

### 8-4. 인쇄 품질 확인

- [ ] 배경색 인쇄됨
- [ ] 색상 선명함
- [ ] 글자 가독성 우수
- [ ] 여백 적절함
- [ ] 페이지 중간에서 섹션 끊기지 않음

---

## 9. 다음 단계

### 9-1. 다른 정치인 적용

이 디자인을 다른 정치인 보고서에도 적용하려면:

1. `report-style.css` 재사용 (동일)
2. HTML `<head>` 섹션 동일하게 수정
3. 점수, 이름만 변경하여 동일한 구조 적용

### 9-2. 자동화 스크립트 개발

Python으로 마크다운 → 개선된 HTML 자동 변환:

```python
# markdown_to_html_improved.py
import markdown
from jinja2 import Template

def convert_md_to_improved_html(md_file, output_html):
    # 마크다운 읽기
    with open(md_file, 'r', encoding='utf-8') as f:
        md_content = f.read()

    # HTML 변환
    html_body = markdown.markdown(md_content, extensions=['tables', 'fenced_code'])

    # 템플릿 적용
    template = Template('''
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ politician_name }} 의원 V40 평가보고서</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css">
  <link rel="stylesheet" href="report-style.css">
</head>
<body>
{{ body }}
</body>
</html>
    ''')

    final_html = template.render(
        politician_name="조은희",
        body=html_body
    )

    # HTML 저장
    with open(output_html, 'w', encoding='utf-8') as f:
        f.write(final_html)

    print(f"✅ HTML 생성 완료: {output_html}")

# 실행
convert_md_to_improved_html(
    '조은희_20260206_완성본.md',
    '조은희_V40_평가보고서_개선.html'
)
```

---

## 10. 요약

### 작업 순서

1. ✅ `report-style.css` 생성 (완료)
2. ✅ HTML `<head>` 수정 (CSS 링크, 폰트 추가)
3. ✅ 표지 페이지 추가
4. ✅ Executive Summary 박스 적용
5. ✅ 진행바 추가 (긍정/부정 비율, 카테고리 점수)
6. ✅ 강점/약점 카드 스타일 적용
7. ✅ 배지 클래스 적용
8. ✅ PDF 변환 (WeasyPrint 또는 Chrome 또는 Puppeteer)
9. ✅ 품질 검증 (시각적, 인쇄)

### 예상 소요 시간

- **HTML 수정**: 30-60분
- **PDF 변환**: 5-10분
- **품질 검증**: 10-20분
- **총 소요 시간**: 약 1-2시간

### 최종 결과물

- ✅ 전문적인 디자인 (정부 보고서 수준)
- ✅ 인쇄 최적화 (A4 기준)
- ✅ 시각적 위계 명확 (점수, 강점, 약점)
- ✅ 브랜드 아이덴티티 (파란색 계열)
- ✅ 데이터 시각화 (진행바, 배지)

---

**작성 완료**: 2026-02-06
**적용 대상**: 조은희_V40_평가보고서_20260206.html
**참조 문서**: V40_평가보고서_PDF_디자인_개선안.md
