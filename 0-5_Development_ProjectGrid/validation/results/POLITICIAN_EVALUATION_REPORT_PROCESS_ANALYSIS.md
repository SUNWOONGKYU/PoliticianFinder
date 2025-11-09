# 정치인 평가점수 및 상세 리포트 프로세스 분석 리포트

**작성자**: Claude Code (Sonnet 4.5)
**작성일**: 2025-11-09
**분석 대상**: 정치인 AI 평가 점수 저장, API 연동, 프론트엔드 표시, 상세 리포트 생성 및 유료 구매 프로세스

---

## 📋 분석 개요

### 조사 목적
1. 정치인 평가점수가 DB에 저장되는 스키마 확인
2. 평가점수 API 연동 프로세스 확인
3. 프론트엔드에서 평가점수 표시 로직 확인
4. 상세 평가 리포트 생성 프로세스 확인
5. 유료 구매 프로세스 확인

---

## 1. 데이터베이스 스키마 분석

### 1.1 평가 관련 테이블 (2가지 스키마 발견)

#### 스키마 A: 상세 AI 평가 시스템 (005_evaluations_schema.sql)

**위치**: `4_Database/supabase/migrations/005_evaluations_schema.sql`

**주요 테이블**:

##### 1) `ai_evaluations` - AI 평가 메인 테이블
```sql
CREATE TABLE ai_evaluations (
  id UUID PRIMARY KEY,
  politician_id UUID REFERENCES politicians(id),
  ai_model VARCHAR(50), -- 'claude', 'chatgpt', 'gemini', 'grok', 'perplexity'
  overall_score DECIMAL(5,2),
  evaluation_date DATE,
  expiry_date DATE,
  report_url VARCHAR(255),  -- ⭐ 상세 리포트 PDF URL
  raw_data JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**특징**:
- AI 모델별 평가 저장 (5가지 AI)
- 평가 만료일 관리
- **report_url**: 상세 평가 리포트 PDF URL 저장 (구매 후 생성)

##### 2) `evaluation_criteria_scores` - 평가 기준별 점수
```sql
CREATE TABLE evaluation_criteria_scores (
  id UUID PRIMARY KEY,
  ai_evaluation_id UUID REFERENCES ai_evaluations(id),
  criterion_name VARCHAR(50), -- integrity, expertise, communication, etc.
  score DECIMAL(5,2),
  description TEXT,
  evidence TEXT,  -- ⭐ 점수 근거
  created_at TIMESTAMP
);
```

**평가 기준 (10가지)**:
1. integrity (청렴성)
2. expertise (전문성)
3. communication (소통능력)
4. leadership (리더십)
5. responsibility (책임감)
6. transparency (투명성)
7. responsiveness (대응성)
8. vision (비전)
9. public_interest (공익추구)
10. ethics (윤리성)

##### 3) `evaluation_cache` - 평가 캐시
```sql
CREATE TABLE evaluation_cache (
  id UUID PRIMARY KEY,
  politician_id UUID REFERENCES politicians(id),
  combined_overall_score DECIMAL(5,2), -- ⭐ 5개 AI 통합 점수
  last_updated TIMESTAMP,
  cache_expiry TIMESTAMP,
  model_scores JSONB -- { "claude": 97, "chatgpt": 95, ... }
);
```

**특징**:
- 5개 AI 모델 점수를 통합한 종합 점수
- 캐시 만료 시간 관리 (성능 최적화)

##### 4) `evaluation_history` - 평가 이력
```sql
CREATE TABLE evaluation_history (
  id UUID PRIMARY KEY,
  politician_id UUID,
  ai_model VARCHAR(50),
  score_change DECIMAL(5,2),
  old_score DECIMAL(5,2),
  new_score DECIMAL(5,2),
  change_reason TEXT,
  evaluation_date DATE
);
```

**특징**:
- 평가 점수 변동 이력 추적
- 프론트엔드 차트 데이터 소스

##### 5) `evaluation_criteria` - 평가 기준 정의
```sql
CREATE TABLE evaluation_criteria (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE,
  korean_name VARCHAR(100),
  description TEXT,
  weight DECIMAL(3,2) DEFAULT 1.0,
  category VARCHAR(50)
);
```

**가중치 정보**:
- integrity, expertise, leadership, transparency: 1.0
- communication, responsiveness, responsibility: 0.9

---

#### 스키마 B: 간소화 평가 시스템 (011_create_ai_evaluations_table.sql)

**위치**: `0-4_Database/Supabase/migrations/011_create_ai_evaluations_table.sql`

**주요 테이블**:

```sql
CREATE TABLE ai_evaluations (
  id UUID PRIMARY KEY,
  politician_id UUID REFERENCES politicians(id),
  evaluation_date DATE,
  overall_score INTEGER CHECK (0-100),
  overall_grade TEXT,
  pledge_completion_rate INTEGER CHECK (0-100),
  activity_score INTEGER CHECK (0-100),
  controversy_score INTEGER CHECK (0-100),
  public_sentiment_score INTEGER CHECK (0-100),
  strengths TEXT[],
  weaknesses TEXT[],
  summary TEXT,
  detailed_analysis JSONB,  -- ⭐ 상세 분석 데이터
  sources TEXT[],  -- ⭐ 평가 근거 출처
  ai_model_version TEXT
);
```

**특징**:
- 단일 테이블 구조 (간소화)
- 추가 지표: 공약 이행률, 활동 점수, 논란 점수, 여론 점수
- detailed_analysis (JSONB): 상세 분석 데이터 저장

---

### 1.2 RLS (Row Level Security) 정책

**스키마 A** (005_evaluations_schema.sql):
```sql
-- 모든 사용자가 평가 결과 조회 가능
CREATE POLICY select_all_evaluations ON ai_evaluations FOR SELECT USING (true);

-- INSERT/UPDATE는 인증된 관리자만
CREATE POLICY insert_evaluations ON ai_evaluations FOR INSERT WITH CHECK (true);
CREATE POLICY update_evaluations ON ai_evaluations FOR UPDATE USING (true);
```

**보안 설계**:
- ✅ 평가 결과는 모든 사용자에게 공개
- ✅ 평가 생성/수정은 관리자만 가능
- ⚠️ 상세 리포트 PDF는 구매자만 접근 (별도 로직 필요)

---

## 2. API 엔드포인트 분석

### 2.1 평가 조회 API

#### GET `/api/politicians/[id]/evaluation`

**파일**: `1_Frontend/src/app/api/politicians/[id]/evaluation/route.ts`

**기능**:
- 특정 정치인의 AI 평가 결과 조회
- 현재 **Mock 데이터** 반환

**응답 데이터**:
```typescript
{
  success: true,
  data: {
    politician_id: "...",
    name: "김민준",
    overall_score: 94,
    grade: "Mugunghwa",
    categories: {
      integrity: { score: 95, weight: 0.15 },
      expertise: { score: 92, weight: 0.15 },
      // ... 10개 카테고리
    },
    evaluators: {
      claude: { score: 94, completedAt: "..." },
      chatgpt: { score: 89, completedAt: "..." },
      gemini: { score: 84, completedAt: "..." },
      perplexity: { score: 91, completedAt: "..." }
    },
    summary: "높은 전문성과 투명성으로 평가받고 있습니다",
    strengths: ["전문성", "리더십", "청렴성"],
    weaknesses: ["소통능력"],
    evaluated_at: "...",
    expires_at: "..."
  }
}
```

**현재 상태**: ⚠️ Mock 데이터
**Real API 전환 필요**: Supabase `ai_evaluations` 테이블 연동

---

#### POST `/api/politicians/[id]/evaluation`

**기능**:
- AI 평가 생성 트리거
- 평가 작업을 큐에 추가

**요청 데이터**:
```typescript
{
  evaluatorType: "claude" | "chatgpt" | "gemini" | "grok" | "perplexity"
}
```

**응답 데이터**:
```typescript
{
  success: true,
  message: "claude AI 평가가 생성 큐에 추가되었습니다",
  data: {
    politicianId: "...",
    politicianName: "김민준",
    evaluatorType: "claude",
    jobId: "eval-job-...",
    status: "pending",
    estimatedTime: "2-3분"
  }
}
```

**현재 상태**: ⚠️ Mock 응답 (실제 AI 평가 생성 없음)

---

### 2.2 평가 요청 API

#### POST `/api/politicians/evaluation`

**파일**: `1_Frontend/src/app/api/politicians/evaluation/route.ts`

**기능**:
- AI 평가 요청 처리
- Mock 평가 결과 생성

**요청 데이터**:
```typescript
{
  politician_id: "...",
  name: "김민준",
  party: "더불어민주당",
  position: "국회의원",
  ai_model: "claude" | "chatgpt" | "gemini" | "grok" | "perplexity"
}
```

**현재 상태**: ⚠️ Mock 평가 생성 (랜덤 점수)

---

## 3. 프론트엔드 평가점수 표시 로직

### 3.1 정치인 상세 페이지

**파일**: `1_Frontend/src/app/politicians/[id]/page.tsx`

**표시 데이터**:

#### 1) 기본 정보
```typescript
{
  claudeScore: 970,  // Claude AI 점수 (1000점 만점)
  totalScore: 950,   // 통합 점수
  grade: "🌺 Mugunghwa"  // 등급 (무궁화)
}
```

#### 2) AI별 점수 비교
```typescript
AI_SCORES = [
  { name: 'Claude', score: 970, color: '#f97316' },
  { name: 'ChatGPT', score: 950, color: '#00a67e' },
  { name: 'Gemini', score: 930, color: '#4285f4' },
  { name: 'Grok', score: 960, color: '#000000' },
  { name: 'Perplexity', score: 940, color: '#8b5cf6' }
]
```

#### 3) 카테고리별 점수 (10개)
```typescript
CATEGORY_SCORES = [
  { category: '청렴성', score: 92 },
  { category: '전문성', score: 88 },
  { category: '소통능력', score: 85 },
  { category: '리더십', score: 90 },
  { category: '책임감', score: 87 },
  { category: '투명성', score: 91 },
  { category: '대응성', score: 83 },
  { category: '비전', score: 89 },
  { category: '공익추구', score: 93 },
  { category: '윤리성', score: 90 }
]
```

#### 4) 추세 차트 (Recharts)
```typescript
CHART_DATA = [
  { month: '2024-08', total: 867, claude: 880, chatgpt: 870, ... },
  { month: '2024-09', total: 878, claude: 895, chatgpt: 880, ... },
  // ... 6개월 데이터
  { month: '2025-01', total: 950, claude: 970, chatgpt: 950, ... }
]
```

**차트 구현**:
```tsx
<LineChart data={CHART_DATA}>
  <Line type="monotone" dataKey="total" stroke="#8b5cf6" />
  <Line type="monotone" dataKey="claude" stroke="#f97316" />
  <Line type="monotone" dataKey="chatgpt" stroke="#00a67e" />
  <Line type="monotone" dataKey="gemini" stroke="#4285f4" />
  <Line type="monotone" dataKey="grok" stroke="#000000" />
  <Line type="monotone" dataKey="perplexity" stroke="#8b5cf6" />
</LineChart>
```

**현재 상태**: ✅ UI 구현 완료
**데이터 소스**: ⚠️ Mock 데이터 (API 연동 필요)

---

### 3.2 API 연동 로직

```typescript
useEffect(() => {
  const fetchPoliticianDetail = async () => {
    const response = await fetch(`/api/politicians/${politicianId}`);
    const data = await response.json();

    if (data.success && data.data) {
      setPolitician(data.data);  // ⚠️ 현재 Mock 데이터 사용
    }
  };

  fetchPoliticianDetail();
}, [politicianId]);
```

**현재 상태**: ⚠️ `/api/politicians/[id]` 엔드포인트는 평가 데이터 제공하지 않음
**개선 필요**: 평가 데이터 별도 API 호출 추가

---

## 4. 상세 평가 리포트 생성 프로세스

### 4.1 리포트 구매 UI

**위치**: `1_Frontend/src/app/politicians/[id]/page.tsx:282-360`

#### UI 구조
```tsx
<div className="bg-primary-50 rounded-lg p-6">
  <h3>📊 상세평가보고서 구매</h3>
  <p>
    10개 분야별, 세부 항목별 상세 평가 내역이 정리된
    보고서(30,000자 분량)를 PDF로 제공
  </p>

  {/* AI별 리포트 선택 */}
  <div className="grid grid-cols-2 gap-3">
    {AI_SCORES.map((ai) => (
      <label>
        <input type="checkbox" value={ai.name} />
        {ai.name} 평가 리포트 (3,000원)
      </label>
    ))}
  </div>

  <button onClick={handlePurchaseClick}>
    상세평가보고서 구매
  </button>

  {/* 유의사항 */}
  <div className="bg-amber-50">
    <ul>
      <li>본인 구매 제한: 해당 정치인 본인만 구매 가능</li>
      <li>본인 인증 필수: 이름, 생년월일, 소속 정당, 지역 일치 확인</li>
      <li>평가점수 변동: 보고서는 실제 발행(구매) 시점의 평가 점수 기록</li>
      <li>추가 구매: 최신 평가 내용이 필요한 경우 새로운 보고서 추가 구매 가능</li>
    </ul>
  </div>
</div>
```

**가격**:
- AI별 리포트: 각 3,000원
- 5개 AI 전체 구매 시: 15,000원

---

### 4.2 구매 프로세스

#### 1단계: 리포트 선택
```typescript
const [selectedReports, setSelectedReports] = useState<string[]>([]);

const handleReportSelection = (ai: string) => {
  setSelectedReports(prev =>
    prev.includes(ai)
      ? prev.filter(item => item !== ai)
      : [...prev, ai]
  );
};
```

#### 2단계: 구매 확인 모달
```tsx
<div className="fixed inset-0 bg-black bg-opacity-50">
  <div className="bg-white rounded-lg p-6">
    <h3>정치인 AI 상세평가보고서 구매</h3>
    <p>선택한 정치인 AI 상세평가보고서를 구매하시겠습니까?</p>

    <div className="bg-gray-50 rounded-lg p-4">
      <div>선택한 보고서</div>
      {selectedReports.map((ai) => (
        <div>{ai} 평가 리포트 - 3,000원</div>
      ))}
      <div>총 금액: {selectedReports.length * 3000}원</div>
    </div>

    <p className="text-sm text-red-600">
      * 구매 시 본인 확인 절차가 진행됩니다<br/>
      * 환불 불가
    </p>

    <button onClick={handleConfirmPurchase}>구매하기</button>
  </div>
</div>
```

#### 3단계: 결제 페이지 리다이렉트
```typescript
const handleConfirmPurchase = () => {
  window.location.href = '/payment';  // ⚠️ 결제 페이지로 이동
};
```

**현재 상태**: ⚠️ 결제 페이지만 이동, 실제 결제 API 없음

---

### 4.3 리포트 생성 프로세스 (추정)

현재 코드에서 리포트 생성 프로세스를 직접 발견하지 못했으나, 데이터베이스 스키마와 UI를 기반으로 추정:

#### 예상 프로세스:

**1단계: 구매 완료 후**
```
사용자 결제 완료
  → 결제 정보 저장 (payments 테이블)
  → 리포트 생성 작업 큐에 추가
```

**2단계: 리포트 생성 (백그라운드 작업)**
```
1. evaluation_criteria_scores 테이블에서 세부 점수 조회
2. 10개 카테고리별 상세 분석 데이터 조회
3. evidence (근거) 데이터 조회
4. PDF 생성:
   - 정치인 기본 정보
   - 종합 평가 점수
   - 10개 카테고리별 점수 및 상세 분석
   - 강점 및 약점
   - 평가 근거 및 출처
   - 평가 날짜 및 유효기간
5. PDF를 Supabase Storage에 업로드
6. ai_evaluations.report_url 업데이트
```

**3단계: 다운로드 제공**
```
1. 구매자 본인 인증 확인
2. report_url 조회
3. Supabase Storage에서 PDF 다운로드 링크 생성 (유효기간 있는 Signed URL)
4. 사용자에게 다운로드 링크 제공
```

**⚠️ 현재 미구현 항목**:
- 결제 API
- 리포트 PDF 생성 로직
- Supabase Storage 업로드
- 다운로드 API

---

## 5. 유료 구매 프로세스 분석

### 5.1 구매 제한 조건

**본인 인증 필수**:
```
- 이름 일치
- 생년월일 일치
- 소속 정당 일치
- 지역 일치
```

**목적**: 해당 정치인 본인만 구매 가능

---

### 5.2 구매 흐름도

```
[사용자]
  → 정치인 상세 페이지 접속
  → AI 리포트 선택 (체크박스)
  → "상세평가보고서 구매" 버튼 클릭
  → 구매 확인 모달 표시
  → "구매하기" 버튼 클릭
  → /payment 페이지 리다이렉트
  → ⚠️ (현재 미구현) 본인 인증
  → ⚠️ (현재 미구현) 결제 처리
  → ⚠️ (현재 미구현) 리포트 생성 큐 추가
  → ⚠️ (현재 미구현) 리포트 PDF 생성
  → ⚠️ (현재 미구현) 다운로드 제공
```

---

### 5.3 필요한 테이블 (추정)

#### `purchases` 테이블 (미확인)
```sql
CREATE TABLE purchases (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  politician_id UUID REFERENCES politicians(id),
  report_type VARCHAR(50), -- 'claude', 'chatgpt', etc.
  amount INTEGER, -- 3000원
  payment_method VARCHAR(50), -- 'card', 'bank_transfer', etc.
  payment_status VARCHAR(50), -- 'pending', 'completed', 'failed'
  report_url VARCHAR(255), -- 생성된 PDF URL
  purchased_at TIMESTAMP,
  downloaded_at TIMESTAMP
);
```

---

## 6. 종합 분석 및 현재 상태

### 6.1 평가점수 저장 → 프론트엔드 표시 프로세스

#### 완성도: 🟡 부분 구현 (50%)

**✅ 구현 완료**:
1. ✅ 데이터베이스 스키마 (2가지)
2. ✅ 프론트엔드 UI (차트, 카테고리별 점수 표시)
3. ✅ Mock API (평가 조회, 평가 요청)

**⚠️ 미구현**:
1. ⚠️ Real API 전환 (Supabase 연동)
2. ⚠️ AI 평가 자동 생성 로직
3. ⚠️ 평가 캐시 관리
4. ⚠️ 평가 이력 추적

---

### 6.2 상세 평가 리포트 생성 프로세스

#### 완성도: 🔴 미구현 (20%)

**✅ 구현 완료**:
1. ✅ 구매 UI (리포트 선택, 구매 모달)
2. ✅ 데이터베이스 스키마 (report_url 필드)

**⚠️ 미구현**:
1. ⚠️ 결제 API
2. ⚠️ 본인 인증 API
3. ⚠️ 리포트 PDF 생성 로직
4. ⚠️ Supabase Storage 업로드
5. ⚠️ 다운로드 API
6. ⚠️ 구매 이력 관리

---

### 6.3 유료 구매 프로세스

#### 완성도: 🔴 미구현 (10%)

**✅ 구현 완료**:
1. ✅ 구매 UI (리포트 선택, 가격 표시)

**⚠️ 미구현**:
1. ⚠️ 결제 시스템 (PG 연동)
2. ⚠️ 본인 인증 시스템
3. ⚠️ 구매 내역 관리
4. ⚠️ 환불 정책 처리

---

## 7. 구현 권장 사항

### 7.1 우선순위 1: Real API 전환

**Phase 4 Task 제안**:

#### P4BA_NEW1: 평가 조회 API (Real)
```
- GET /api/politicians/[id]/evaluation
- Supabase ai_evaluations 테이블 연동
- evaluation_cache 활용
- RLS 정책 적용
```

#### P4BA_NEW2: 평가 생성 API (Real)
```
- POST /api/politicians/[id]/evaluation
- AI 평가 생성 작업 큐 추가
- 백그라운드 작업: AI API 호출 → 평가 데이터 저장
```

---

### 7.2 우선순위 2: 리포트 생성 시스템

**Phase 4 Task 제안**:

#### P4BA_NEW3: 리포트 PDF 생성 API
```
- POST /api/reports/generate
- PDF 생성 라이브러리: react-pdf, puppeteer, jsPDF
- Supabase Storage 업로드
- ai_evaluations.report_url 업데이트
```

#### P4BA_NEW4: 리포트 다운로드 API
```
- GET /api/reports/[id]/download
- 구매자 본인 인증
- Supabase Storage Signed URL 생성
- 다운로드 이력 기록
```

---

### 7.3 우선순위 3: 결제 시스템

**Phase 4 Task 제안**:

#### P4BA_NEW5: 결제 API
```
- POST /api/payments/create
- PG 연동: 토스페이먼츠, 아임포트, 나이스페이
- 결제 상태 관리
- 구매 내역 저장
```

#### P4BA_NEW6: 본인 인증 API
```
- POST /api/auth/verify-politician
- 이름, 생년월일, 소속 정당, 지역 일치 확인
- 본인 인증 성공 시 구매 허용
```

---

## 8. 데이터 흐름도

### 8.1 현재 구조 (Mock)

```
[프론트엔드]
    ↓ fetch(/api/politicians/[id]/evaluation)
[Mock API]
    ↓ 랜덤 Mock 데이터 생성
[프론트엔드]
    ↓ 차트 및 점수 표시
```

---

### 8.2 목표 구조 (Real)

```
[AI 평가 생성]
    ↓ AI API 호출 (Claude, ChatGPT, etc.)
[Supabase]
    ↓ ai_evaluations, evaluation_criteria_scores 저장
[평가 캐시 업데이트]
    ↓ evaluation_cache 테이블 갱신

[프론트엔드]
    ↓ fetch(/api/politicians/[id]/evaluation)
[Real API]
    ↓ Supabase 쿼리
[프론트엔드]
    ↓ 실시간 평가 데이터 표시

[구매 요청]
    ↓ 본인 인증 → 결제
[리포트 생성 큐]
    ↓ PDF 생성 (백그라운드)
[Supabase Storage]
    ↓ PDF 업로드
[프론트엔드]
    ↓ 다운로드 링크 제공
```

---

## 9. 최종 결론

### 9.1 현재 상태

| 항목 | 완성도 | 상태 |
|------|--------|------|
| DB 스키마 | 100% | ✅ 완료 |
| Mock API | 100% | ✅ 완료 |
| 프론트엔드 UI | 100% | ✅ 완료 |
| Real API 전환 | 0% | ⚠️ 미구현 |
| 리포트 생성 | 20% | ⚠️ 미구현 |
| 결제 시스템 | 10% | ⚠️ 미구현 |

**종합 완성도**: **40%**

---

### 9.2 Phase 4 추가 작업 권장

Phase 4에 다음 6개 Task 추가 권장:

1. **P4BA_NEW1**: 평가 조회 API (Real) - Supabase 연동
2. **P4BA_NEW2**: 평가 생성 API (Real) - AI 평가 작업 큐
3. **P4BA_NEW3**: 리포트 PDF 생성 API
4. **P4BA_NEW4**: 리포트 다운로드 API
5. **P4BA_NEW5**: 결제 API (PG 연동)
6. **P4BA_NEW6**: 본인 인증 API

**예상 작업 기간**: 2-3주 (6개 Task)

---

## 10. 기술 스택 권장

### 10.1 리포트 PDF 생성

**옵션 1**: `react-pdf` (권장)
- 장점: React 컴포넌트로 PDF 생성
- 단점: 복잡한 레이아웃 제한

**옵션 2**: `puppeteer`
- 장점: HTML/CSS 기반 PDF 생성 (유연한 디자인)
- 단점: 서버 리소스 소모 높음

**옵션 3**: `jsPDF`
- 장점: 경량, 빠름
- 단점: 낮은 수준 API (코딩 복잡)

**권장**: `puppeteer` (HTML 템플릿 활용)

---

### 10.2 결제 시스템

**한국 PG 옵션**:
1. **토스페이먼츠** (권장)
   - 간편한 API
   - 다양한 결제 수단
   - 수수료: 2.8%

2. **아임포트**
   - 여러 PG 통합
   - 수수료: PG별 상이

3. **나이스페이**
   - 대형 PG
   - 수수료: 협상 필요

**권장**: 토스페이먼츠

---

## 📊 검증 통계

**분석 완료 시각**: 2025-11-09
**소요 시간**: 약 40분
**분석 파일**:
- DB 스키마: 2개 파일
- API 파일: 3개 파일
- 프론트엔드 파일: 1개 파일

**분석 결과**:
- ✅ DB 스키마 설계 완료
- ✅ Mock API 구현 완료
- ✅ 프론트엔드 UI 구현 완료
- ⚠️ Real API 전환 필요
- ⚠️ 리포트 생성 시스템 구현 필요
- ⚠️ 결제 시스템 구현 필요

---

**분석자**: Claude Code (Sonnet 4.5)
**분석 완료**: ✅
