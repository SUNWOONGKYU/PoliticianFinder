# Work Log - Current Session

## Session Start: 2025-12-01 21:01:00

### Previous Log
- [2025-11-30 작업 로그](2025-11-30.md)

---

## ✅ 2025-12-01 완료: 보고서 판매 관리 기능 기획 (v2.0)

### 작업 개요
**상세 평가 보고서 판매 관리 시스템 기획서 작성**
- 정치인들에게 자신의 AI 평가 보고서를 판매하는 시스템
- 관리자 페이지에서 입금 확인 및 보고서 발송 관리

### 📂 생성된 파일
1. **작업용**: `.claude/work_logs/평가보고서_판매관리_기획.md`
2. **보관용**: `0-1_Project_Plan/00_프로젝트_기획서/보고서_판매관리_기획_V2.0.md`

---

### 🎯 핵심 기능

#### 1. 🔐 이메일 인증 (NEW!)
**구매 전 본인 확인 프로세스**
- **방식**: 6자리 영숫자 코드 (예: "AB12CD")
- **유효 시간**: 10분
- **발송 수단**: Resend API
- **보안 원리**: 이메일 소유권 = 본인 증명

**프로세스:**
```
1. 이름 + 정당 + 직위 입력
   ↓
2. DB에서 정치인 정보 조회
   ↓
3. 해당 이메일로 6자리 코드 발송
   ↓
4. 코드 입력 확인 (10분 이내)
   ↓
5. 인증 성공 → 결제 진행
```

#### 2. 입금 확인 관리
- 관리자가 계좌이체 입금 수동 확인
- 입금 일시 및 확인한 관리자 자동 기록
- 입금 확인 후 보고서 발송 가능

#### 3. 보고서 이메일 발송
- **Resend API** 사용 (이미 설정됨)
- 관리자 페이지에서 [보고서 발송] 버튼 클릭
- 정치인 이메일로 직접 전송
- 발송 일시 및 담당자 자동 기록

#### 4. 관리자 페이지
- **URL**: `/admin/report-sales`
- **기능**:
  - 구매 내역 목록 (필터, 검색, 페이지네이션)
  - 입금 확인 버튼
  - 보고서 발송 버튼
  - 상세 보기 (메모, 이력)
  - 통계 카드 4개 (월 매출, 입금 대기, 발송 대기, 총 판매)
- **페이지네이션**: 20개/페이지

---

### 🗄️ 데이터베이스 설계

#### 새 테이블 1: email_verifications
```sql
CREATE TABLE email_verifications (
    id UUID PRIMARY KEY,
    politician_id TEXT REFERENCES politicians(id),
    email VARCHAR(255) NOT NULL,
    verification_code VARCHAR(6) NOT NULL,
    purpose VARCHAR(50) DEFAULT 'report_purchase',
    verified BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 새 테이블 2: report_purchases
```sql
CREATE TABLE report_purchases (
    id UUID PRIMARY KEY,
    politician_id TEXT REFERENCES politicians(id),
    buyer_name VARCHAR(100) NOT NULL,
    buyer_email VARCHAR(255) NOT NULL,
    -- 전화번호는 저장 안 함 (이메일만 사용)

    payment_id UUID REFERENCES payments(id),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'KRW',

    payment_confirmed BOOLEAN DEFAULT FALSE,
    payment_confirmed_at TIMESTAMPTZ,
    payment_confirmed_by UUID REFERENCES users(user_id),

    report_type VARCHAR(50) NOT NULL,
    report_period VARCHAR(50),

    sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ,
    sent_by UUID REFERENCES users(user_id),
    sent_email TEXT,

    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**중요 결정 사항:**
- ✅ `politician_id`: TEXT 타입 (8자리 hex)
- ✅ 전화번호 필드 제외 (이메일만 사용)
- ✅ 환불 관련 필드 제외

---

### 📝 API 엔드포인트

#### 인증 API
```
POST /api/politicians/verify/send-code    // 인증 코드 발송
POST /api/politicians/verify/check-code   // 인증 코드 확인
```

#### 관리 API
```
GET    /api/admin/report-sales                     // 목록
GET    /api/admin/report-sales/:id                 // 상세
POST   /api/admin/report-sales                     // 수동 등록
PATCH  /api/admin/report-sales/:id/confirm-payment // 입금 확인
POST   /api/admin/report-sales/:id/send-report     // 발송
PATCH  /api/admin/report-sales/:id                 // 메모 수정
GET    /api/admin/report-sales/statistics          // 통계
```

---

### 🚀 구현 단계

#### Phase 1 (MVP)
1. email_verifications 테이블 생성
2. 인증 코드 발송 API
3. 인증 코드 확인 API
4. 결제 페이지 인증 UI 추가
5. report_purchases 테이블 생성
6. 관리자 페이지 (`/admin/report-sales`)
7. 입금 확인 기능
8. 보고서 이메일 발송 (Resend)
9. 통계 카드

#### Phase 2 (추후)
- PDF 보고서 자동 생성
- 이메일 첨부 파일 기능
- 매출 상세 통계 및 그래프
- 자동 이메일 스케줄링

---

### 💡 주요 결정 사항 및 사용자 피드백

#### 환불 기능 제외
- **사용자 피드백**: "환불은 없어"
- **결정**: 환불 관련 모든 기능 제거
- **이유**: 구매 후 환불 불가 정책

#### 전화번호 불필요
- **사용자 피드백**: "이메일만 있으면 되잖아"
- **결정**: buyer_phone 필드 제거
- **이유**:
  - 보고서는 이메일로만 발송
  - DB에 정치인 전화번호는 참고용으로만 존재
  - 중복 저장 불필요

#### 간단한 이메일 인증만
- **사용자 피드백**: "추가 보안까지는 할 필요 없어"
- **결정**: 6자리 코드 인증만 구현
- **제외**:
  - ❌ IP 제한
  - ❌ 브라우저 지문
  - ❌ SMS 2차 인증
  - ❌ 입력 횟수 제한
- **이유**: 본인 이메일 접근 = 본인 증명 완료

#### 이메일 인증 방식
- **사용자 피드백**: "이메일이 틀렸을 경우에는 인증 코드를 입력을 못하겠지"
- **결정**: 이메일 소유권으로 본인 확인
- **보안 원리**:
  ```
  정치인 정보 (이름/정당/직위) → 누구나 알 수 있음
           +
  이메일 소유권 (6자리 코드)    → 본인만 알 수 있음
           =
  본인 인증 완료 ✅
  ```

---

### 📧 이메일 시스템

#### Resend API
- **API Key**: `re_8hjt3JJR_5GD6Q8twLftC1LficQqkH9E7`
- **발신 이메일**: `noreply@politicianfinder.ai.kr`
- **이미 설정됨**: 추가 설정 불필요

#### 이메일 종류
1. **인증 코드 이메일**
   - 제목: `[PoliticianFinder] 보고서 구매 인증 코드`
   - 내용: 6자리 코드 + 10분 유효 안내

2. **보고서 발송 이메일**
   - 제목: `[PoliticianFinder] {정치인명}님의 상세 평가 보고서`
   - 내용: 보고서 정보 + 발급 일시
   - 첨부: PDF 보고서 (Phase 2)

---

### 🎨 화면 구성

#### 결제 페이지 (이메일 인증 추가)
```
┌─────────────────────────────────────┐
│ 본인 인증                            │
├─────────────────────────────────────┤
│ 이름: [노서현_______]               │
│ 소속 정당: [더불어민주당 ▼]         │
│ 출마직종: [국회의원 ▼]             │
│                                      │
│ [인증 코드 발송하기]                │
└─────────────────────────────────────┘

          ↓ 코드 발송 후

┌─────────────────────────────────────┐
│ ✅ 인증 코드가 발송되었습니다        │
├─────────────────────────────────────┤
│ nohseohyun@assembly.go.kr로         │
│ 6자리 인증 코드를 발송했습니다.     │
│                                      │
│ 인증 코드: [______]                 │
│ 유효 시간: ⏱️ 09:45                 │
│                                      │
│ [인증하기]  [코드 재발송]           │
└─────────────────────────────────────┘

          ↓ 인증 성공

┌─────────────────────────────────────┐
│ ✅ 이메일 인증이 완료되었습니다!    │
│ 이제 결제를 진행하실 수 있습니다.   │
│ [결제하기]                           │
└─────────────────────────────────────┘
```

#### 관리자 페이지
```
/admin/report-sales

┌──────────────────────────────────────┐
│ ₩3.4M  │ 5건   │ 3건   │ 304건      │
│ 이번달  │입금   │발송   │총판매      │
└──────────────────────────────────────┘

필터: [기간▼] [입금▼] [발송▼] 검색: [___][🔍]

┌────────────────────────────────────────────┐
│ ID │정치인│이메일│종류│금액│입금│발송│작업 │
├────────────────────────────────────────────┤
│001│노서현│noh@..│프리│300K│✅ │✅ │[보기]│
│002│안태준│ahn@..│스탠│150K│✅ │⏳ │[발송]│
│003│남도윤│nam@..│기본│50K │⏳ │⏳ │[입금]│
└────────────────────────────────────────────┘

[◀] 1 2 3 [▶]           20개/페이지
```

---

### ✅ 기획 완료 상태

**버전**: V2.0 (이메일 인증 추가)
**상태**: 최종 (사용자 승인 완료)
**작성일**: 2025-12-01
**작성자**: Claude Code

**다음 단계**: Phase 1 구현 시작 대기

---

### 📌 참고사항

- **politician_id 타입**: TEXT (8자리 hex) - 절대 parseInt 금지!
- **이메일 시스템**: Resend 이미 설정됨
- **보안 원칙**: 본인 확인만 되면 됨 (과도한 보안 X)
- **환불**: 없음
- **전화번호**: 저장 안 함 (이메일만 사용)

---

## 이전 작업 (2025-11-30)

### 30명 정치인 데이터 정확성 수정 작업

#### 수정 사항 요약:

1. **필드 매핑 수정**
   - position ↔ title 필드 매핑 오류 수정
   - fieldMapper.ts 수정 완료

2. **필드 순서 재조정**
   - 이름 → 직책 → 정당 → 신분 → 출마직종 → 출마지역 → 출마지구

3. **필드명 변경**
   - "지역구" → "지구" → "출마지구"
   - "지역" → "출마지역"

4. **30명 정치인 데이터 업데이트**
   - 출마직종: 광역단체장
   - 출마지역: 서울(10), 경기(10), 부산(10)
   - 출마지구: null

5. **신분(status) 정확히 수정**
   - 현직 3명: 오세훈(서울특별시장), 김동연(경기도지사), 박형준(부산시장)
   - 출마자 27명: 나머지 모두 (국회의원들도 광역단체장 도전이므로 출마자)

6. **직책(position) 정확성 개선**
   - 김민석: 국무총리
   - 염태영, 한준호: 국회의원
   - 차정인: 국가교육위원회 위원장
   - 이재성: 더불어민주당 부산시당 위원장 (정당도 더불어민주당으로 수정)
   - 유승민: 전 국회의원 (대한체육회장은 동명이인)
