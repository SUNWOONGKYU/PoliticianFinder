# AI 평가 리포트 다운로드 기능 분석

**발견일**: 2025-10-15
**심각도**: 🔴 High (핵심 기능 누락)
**분류**: 2차 개발 필수 기능
**대상 사용자**: 정치인, 후보자

---

## 🔍 문제점: 핵심 기능 누락

### 누락된 기능
```
❌ AI 평가 리포트 생성
❌ 리포트 PDF 다운로드
❌ 리포트 공유 (링크)
❌ 리포트 히스토리 관리
```

### 왜 중요한가?
1. **정치인 입장**:
   - "AI가 나를 어떻게 평가했는지 자료로 받고 싶다"
   - 선거 캠페인 자료로 활용 가능
   - 공약 이행 증거 자료

2. **플랫폼 입장**:
   - 리포트 다운로드 = 회원 가입 유도
   - Premium 기능 (유료화 가능)
   - 바이럴 효과 (SNS 공유)

3. **비즈니스 가치**:
   - 정치인들이 돈 내고 받을 만한 가치
   - 경쟁 플랫폼 차별화 요소
   - 데이터 기반 정치 컨설팅 서비스

---

## 📊 리포트 종류

### 1. 기본 평가 리포트 (Phase 2-3)
```
정치인: 홍길동
평가일: 2025-10-15

📊 AI 평가 점수
- ChatGPT 평가: 85점
  - 신뢰도: 90
  - 실행력: 85
  - 공약 실현성: 80
  - 도덕성: 85

📝 시민 평가
- 평균: 82점 (1,234명 참여)
- 긍정: 65%, 중립: 25%, 부정: 10%

💬 주요 의견
- "공약 이행률이 높습니다"
- "소통이 좋아요"
```

### 2. 다중 AI 비교 리포트 (Phase 6)
```
정치인: 홍길동
평가일: 2025-10-15

📊 4개 AI 종합 평가

┌────────────────────────────┐
│ ChatGPT: 85점               │
│ Gemini: 78점                │
│ Perplexity: 88점 (팩트 기반)│
│ Grok: 77점 (최근 동향)      │
├────────────────────────────┤
│ 평균: 82점                  │
│ 합의도: 높음 (편차 4.7)    │
└────────────────────────────┘

📈 강점 분석
- 공약 이행률 우수 (Perplexity)
- 종합 평가 안정적 (ChatGPT)

⚠️ 개선 필요
- 최근 이슈 대응 (Grok 지적)
```

### 3. 시계열 리포트 (Phase 7-8)
```
정치인: 홍길동
기간: 2025년 1월 ~ 10월

📈 평가 점수 추이
1월: 78점 → 10월: 85점 (↑7점)

📊 월별 변화
- 3월: 공약 발표 → 점수 상승
- 6월: 논란 발생 → 점수 하락
- 9월: 공약 이행 → 점수 회복

💡 인사이트
"꾸준한 성장세, 위기관리 능력 우수"
```

---

## 🎯 Phase별 리포트 기능 추가 계획

### Phase 2: 기본 리포트 (MVP)
**목표**: 단일 AI 평가 리포트 다운로드

#### Frontend 추가 작업 (2개)
```csv
P2F11 (신규): 평가 리포트 다운로드 버튼
- 위치: 정치인 상세 페이지
- 기능: "리포트 다운로드" 버튼
- 담당AI: fullstack-developer
- 의존작업: P2F1 (정치인 카드)

P2F12 (신규): 리포트 미리보기 모달
- 위치: 다운로드 전 미리보기
- 기능: 리포트 내용 미리 확인
- 담당AI: fullstack-developer
- 의존작업: P2F11
```

#### Backend 추가 작업 (3개)
```csv
P2B9 (신규): 리포트 생성 API
- 엔드포인트: POST /api/reports/generate
- 기능: AI 평가 + 시민 평가 데이터 수집
- 담당AI: api-designer
- 의존작업: P2B1, P2B2

P2B10 (신규): PDF 생성 로직
- 라이브러리: ReportLab (Python) or jsPDF (Node)
- 기능: HTML → PDF 변환
- 담당AI: fullstack-developer
- 의존작업: P2B9

P2B11 (신규): 리포트 다운로드 API
- 엔드포인트: GET /api/reports/{report_id}/download
- 기능: PDF 파일 반환
- 담당AI: api-designer
- 의존작업: P2B10
```

#### Database 추가 작업 (1개)
```csv
P2D5 (신규): Report 테이블 확장
- 기존: Report 모델만 있음
- 추가 컬럼:
  - report_type (basic/multi_ai/timeline)
  - file_url (PDF 저장 경로)
  - download_count (다운로드 횟수)
  - is_public (공개 여부)
- 담당AI: database-architect
```

---

### Phase 3: 리포트 공유 기능
**목표**: 리포트 링크 공유, SNS 공유

#### Frontend 추가 작업 (2개)
```csv
P3F13 (신규): 리포트 공유 버튼
- 기능: 링크 복사, SNS 공유 (Twitter, Facebook)
- 담당AI: fullstack-developer
- 의존작업: P2F11

P3F14 (신규): 공개 리포트 뷰어
- URL: /reports/{share_token}
- 기능: 로그인 없이 리포트 열람
- 담당AI: fullstack-developer
- 의존작업: P3B13
```

#### Backend 추가 작업 (2개)
```csv
P3B13 (신규): 리포트 공유 토큰 생성
- 기능: share_token 생성 (UUID)
- 만료 시간: 30일
- 담당AI: fullstack-developer
- 의존작업: P2B11

P3B14 (신규): 공개 리포트 조회 API
- 엔드포인트: GET /api/reports/public/{token}
- 기능: 토큰으로 리포트 조회
- 담당AI: api-designer
- 의존작업: P3B13
```

---

### Phase 6: 다중 AI 비교 리포트
**목표**: 4개 AI 평가 비교 리포트

#### Frontend 추가 작업 (1개)
```csv
P6F7 (신규): 다중 AI 리포트 UI
- 기능: 4개 AI 평가 비교 차트
- 차트: Radar Chart, Bar Chart
- 담당AI: fullstack-developer
- 의존작업: P6B5
```

#### Backend 추가 작업 (1개)
```csv
P6B6 (신규): 다중 AI 리포트 생성
- 기능: 4개 AI 평가 통합 리포트
- 템플릿: multi_ai_report.html
- 담당AI: ai-ml-engineer
- 의존작업: P6B5
```

---

### Phase 7: 시계열 리포트
**목표**: 평가 점수 추이 분석 리포트

#### Frontend 추가 작업 (1개)
```csv
P7F7 (신규): 시계열 리포트 UI
- 기능: 월별 점수 추이 그래프
- 차트: Line Chart, Area Chart
- 담당AI: fullstack-developer
- 의존작업: P7B6
```

#### Backend 추가 작업 (1개)
```csv
P7B6 (신규): 시계열 데이터 집계
- 기능: 월별 평가 점수 집계
- 분석: 추세, 변화 포인트 감지
- 담당AI: fullstack-developer
- 의존작업: P2B9
```

---

## 📋 리포트 템플릿 구조

### HTML 템플릿 (PDF 변환용)

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>AI 평가 리포트 - {{politician_name}}</title>
  <style>
    body { font-family: 'Noto Sans KR', sans-serif; }
    .header { background: #1976d2; color: white; padding: 20px; }
    .score { font-size: 48px; font-weight: bold; }
    .chart { width: 100%; height: 300px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>{{politician_name}} AI 평가 리포트</h1>
    <p>평가일: {{evaluation_date}}</p>
  </div>

  <section class="summary">
    <h2>📊 종합 평가</h2>
    <div class="score">{{overall_score}}점</div>
    <p>{{ai_name}} 평가</p>
  </section>

  <section class="details">
    <h2>📝 세부 점수</h2>
    <table>
      <tr>
        <td>신뢰도</td>
        <td>{{credibility}}</td>
      </tr>
      <tr>
        <td>실행력</td>
        <td>{{effectiveness}}</td>
      </tr>
      <tr>
        <td>공약 실현성</td>
        <td>{{feasibility}}</td>
      </tr>
      <tr>
        <td>도덕성</td>
        <td>{{integrity}}</td>
      </tr>
    </table>
  </section>

  <section class="reasoning">
    <h2>💡 평가 근거</h2>
    <p>{{ai_reasoning}}</p>
  </section>

  <section class="citizen">
    <h2>👥 시민 평가</h2>
    <p>평균: {{citizen_avg}}점 ({{participant_count}}명)</p>
  </section>

  <footer>
    <p>PoliticianFinder | AI 기반 정치인 평가 플랫폼</p>
    <p>생성일: {{generated_at}}</p>
  </footer>
</body>
</html>
```

---

## 🔧 기술 스택

### PDF 생성 라이브러리

#### Option A: Python (Backend)
```python
# ReportLab
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

def generate_pdf_report(politician_data, scores):
    pdf = canvas.Canvas("report.pdf", pagesize=A4)
    pdf.setFont("Helvetica", 24)
    pdf.drawString(100, 800, f"{politician_data['name']} 평가 리포트")
    # ... 내용 추가
    pdf.save()
```

#### Option B: Node.js (Backend)
```javascript
// Puppeteer (HTML → PDF)
const puppeteer = require('puppeteer');

async function generatePDF(html) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html);
  await page.pdf({ path: 'report.pdf', format: 'A4' });
  await browser.close();
}
```

#### Option C: Frontend (브라우저)
```javascript
// jsPDF
import jsPDF from 'jspdf';

const doc = new jsPDF();
doc.text("평가 리포트", 10, 10);
doc.save("report.pdf");
```

**추천**: **Option B (Puppeteer)** - HTML 템플릿 활용, 디자인 자유도 높음

---

## 💰 비즈니스 모델

### 무료 기능
```
✅ 리포트 미리보기 (3페이지)
✅ 기본 점수 확인
✅ 공유 링크 생성 (30일 유효)
```

### 유료 리포트 (정치인 구매)
```
💎 AI 평가 리포트 (완전판)
💎 워터마크 없음
💎 고해상도 PDF (인쇄용)
💎 커스텀 브랜딩 (정치인 로고 삽입 가능)
💎 선거 캠페인 자료로 활용 가능
```

**실제 가격 정책**:
```
1개 AI 평가: 500,000원 (50만원)
2개 AI 평가: 900,000원 (90만원) - 10% 할인
3개 AI 평가: 1,300,000원 (130만원) - 13% 할인
4개 AI 평가: 1,600,000원 (160만원) - 20% 할인
5개 AI 평가 전체: 2,500,000원 (250만원) - 50% 할인

2차 주문 (재구매): 20% 추가 할인
- 1개: 400,000원
- 5개 전체: 2,000,000원
```

**타겟 고객**:
- 국회의원, 지방의원 (현직)
- 선거 후보자
- 정당 (대량 구매)
- 정치 컨설팅 업체

---

## 📊 추가 작업 통계

### Phase 2 추가
- Frontend: 2개 (P2F11, P2F12)
- Backend: 3개 (P2B9, P2B10, P2B11)
- Database: 1개 (P2D5)
- **총 6개**

### Phase 3 추가
- Frontend: 2개 (P3F13, P3F14)
- Backend: 2개 (P3B13, P3B14)
- **총 4개**

### Phase 6 추가
- Frontend: 1개 (P6F7)
- Backend: 1개 (P6B6)
- **총 2개**

### Phase 7 추가
- Frontend: 1개 (P7F7)
- Backend: 1개 (P7B6)
- **총 2개**

### 전체 추가
**총 14개 작업** (Frontend 6, Backend 7, Database 1)

---

## 🎯 우선순위

### 🔴 Critical (Phase 2 필수)
```
1. P2B9: 리포트 생성 API
2. P2B10: PDF 생성 로직
3. P2F11: 다운로드 버튼
4. P2D5: Report 테이블 확장
```

### 🟡 Important (Phase 3 권장)
```
5. P3B13: 공유 토큰 생성
6. P3F13: 공유 버튼
```

### 🟢 Nice to Have (Phase 6-7)
```
7. P6B6: 다중 AI 리포트
8. P7B6: 시계열 리포트
```

---

## 📝 작업지시서 예시

### tasks/P2B9.md
```markdown
# P2B9: 리포트 생성 API

## 개요
정치인의 AI 평가 + 시민 평가 데이터를 수집하여 리포트 생성

## 엔드포인트
POST /api/reports/generate

## Request
{
  "politician_id": "POL_001",
  "report_type": "basic"  // basic | multi_ai | timeline
}

## Response
{
  "report_id": "RPT_20251015_001",
  "politician_name": "홍길동",
  "scores": {
    "ai_score": 85,
    "citizen_score": 82
  },
  "generated_at": "2025-10-15T10:30:00Z",
  "download_url": "/api/reports/RPT_20251015_001/download"
}

## 구현
1. politician_id로 AI 평가 조회
2. citizen_ratings 테이블에서 시민 평가 집계
3. Report 테이블에 저장
4. PDF 생성 큐에 추가 (비동기)

## 의존성
- P2B1: 정치인 목록 API
- P2B2: 시민 평가 API
- P2D5: Report 테이블
```

---

## 🚀 다음 단계

### 즉시 실행 (v1.3.0)
1. ✅ 리포트 기능 분석 완료
2. ⏳ CSV에 14개 작업 추가
3. ⏳ Excel 재생성
4. ⏳ 작업지시서 작성 (P2B9, P2B10, P2B11, P2F11, P2F12, P2D5)

### Phase 2 시작 전
5. ⏳ PDF 템플릿 디자인
6. ⏳ Puppeteer vs ReportLab 결정
7. ⏳ 샘플 리포트 생성

---

## 💡 핵심 인사이트

### 왜 이 기능이 중요한가?
1. **정치인 입장**: 선거 캠페인 자료로 활용
2. **플랫폼 입장**: 회원 가입 유도, Premium 기능
3. **사용자 입장**: AI 평가 신뢰성 확인

### 왜 누락되었나?
- MVP 개발에 집중하다 보니 **2차 기능**으로 간주
- 하지만 실제로는 **핵심 기능** (정치인이 직접 다운로드)

### 교훈
```
❌ "나중에 추가하면 되지" → 핵심 기능 누락
✅ "사용자 입장에서 생각" → 필수 기능 발견
```

---

**결론**: AI 평가 리포트 다운로드는 **2차 개발 필수 기능**입니다. Phase 2에 6개, Phase 3-7에 8개, 총 **14개 작업 추가** 필요!

---

**작성일**: 2025-10-15
**버전**: v1.2.1 → v1.3.0
**다음 액션**: CSV에 14개 작업 추가
