# 리포트 판매 시스템 설계

**작성일**: 2025-10-15
**목표**: AI 평가 리포트 유료 판매 시스템
**플로우**: 신청 → 결제 → 다운로드

---

## 🎯 비즈니스 모델

### 무료 vs 유료

#### 무료 기능
```
✅ 리포트 미리보기 (3페이지)
✅ 기본 점수 확인
✅ 월 1회 무료 다운로드 (워터마크 포함)
```

#### 유료 리포트 (정치인 구매)
```
💎 완전한 AI 평가 리포트
💎 워터마크 없음
💎 high-resolution PDF (인쇄용)
💎 다중 AI 비교 (Phase 6+)
💎 시계열 분석 (Phase 7+)
💎 커스텀 브랜딩 (정치인 로고)
```

### 가격 정책 (실제)
```
1개 AI 평가 리포트: 500,000원 (50만원)
2개 AI 평가 리포트: 900,000원 (90만원) - 10% 할인
3개 AI 평가 리포트: 1,300,000원 (130만원) - 13% 할인
4개 AI 평가 리포트: 1,600,000원 (160만원) - 20% 할인
5개 AI 평가 리포트 (전체): 2,500,000원 (250만원) - 전체 패키지

2차 주문 (재구매): 20% 추가 할인
- 1개: 400,000원 (40만원)
- 5개: 2,000,000원 (200만원)
```

**AI별 가격 동일**:
- ChatGPT 평가: 50만원
- Gemini 평가: 50만원
- Claude 평가: 50만원
- Perplexity 평가: 50만원
- Grok 평가: 50만원

---

## 🔄 사용자 플로우

### 1️⃣ 신청하기 (정치인)
```
[정치인 상세 페이지]
  ↓
[리포트 미리보기] (무료)
  ↓
["리포트 구매하기" 버튼 클릭]
  ↓
[AI 평가 리포트 선택]
- ChatGPT 평가: 500,000원
- Gemini 평가: 500,000원
- Claude 평가: 500,000원
- Perplexity 평가: 500,000원
- Grok 평가: 500,000원
- 전체 5개 패키지: 2,500,000원 (개별 구매 대비 50% 할인)
  ↓
[장바구니 추가] (선택)
  ↓
["구매하기" 클릭]
```

### 2️⃣ 결제하기
```
[결제 페이지]
  ↓
[결제 수단 선택]
- 카드 결제 (토스페이먼츠)
- 계좌이체
- 간편결제 (카카오페이, 네이버페이)
  ↓
[결제 정보 입력]
- 구매자: 홍길동 (정치인 본인 or 사무실)
- 이메일: hong@example.com
- 연락처: 010-1234-5678
  ↓
[결제 진행]
  ↓
[결제 완료]
```

### 3️⃣ 다운로드 받기
```
[결제 완료 페이지]
  ↓
["리포트 다운로드" 버튼 활성화]
  ↓
[PDF 다운로드]
  ↓
[이메일로도 전송] (선택)
  ↓
[구매 내역 저장]
```

---

## 📊 Phase별 기능 추가 (결제 시스템)

### Phase 2: 기본 결제 시스템
**목표**: 토스페이먼츠 연동, 카드 결제

#### Frontend 추가 (5개)
```csv
P2F13: 리포트 구매 버튼
- 위치: 정치인 상세 페이지
- 기능: "리포트 구매하기" CTA
- 담당AI: fullstack-developer

P2F14: 리포트 타입 선택 모달
- 기능: 기본/다중AI/시계열 선택
- 가격 표시
- 담당AI: fullstack-developer

P2F15: 결제 페이지
- 결제 수단 선택 UI
- 토스페이먼츠 위젯 통합
- 담당AI: fullstack-developer

P2F16: 결제 완료 페이지
- 결제 내역 표시
- 다운로드 버튼
- 영수증 발급
- 담당AI: fullstack-developer

P2F17: 구매 내역 페이지
- 마이페이지 > 구매 내역
- 재다운로드 가능
- 담당AI: fullstack-developer
```

#### Backend 추가 (6개)
```csv
P2B12: 주문 생성 API
- POST /api/orders
- 주문 정보 생성
- 담당AI: api-designer

P2B13: 토스페이먼츠 연동
- 결제 승인 API
- 웹훅 처리
- 담당AI: fullstack-developer

P2B14: 결제 검증 로직
- 금액 검증
- 중복 결제 방지
- 담당AI: security-auditor

P2B15: 주문 완료 처리
- 결제 완료 후 리포트 생성 큐
- 이메일 발송
- 담당AI: fullstack-developer

P2B16: 환불 처리 API
- 결제 취소/환불
- 환불 정책 (24시간 내)
- 담당AI: fullstack-developer

P2B17: 구매 내역 조회 API
- GET /api/orders/history
- 사용자별 구매 내역
- 담당AI: api-designer
```

#### Database 추가 (2개)
```csv
P2D6: Order 테이블
- order_id (PK)
- user_id (FK)
- politician_id (FK)
- report_type
- amount
- payment_method
- status (pending/paid/cancelled/refunded)
- created_at, updated_at
- 담당AI: database-architect

P2D7: Payment 테이블
- payment_id (PK)
- order_id (FK)
- transaction_id (토스 거래ID)
- amount
- status
- paid_at
- refunded_at
- 담당AI: database-architect
```

---

### Phase 3: 장바구니 & 쿠폰
**목표**: 복수 구매, 할인 쿠폰

#### Frontend 추가 (2개)
```csv
P3F15: 장바구니 페이지
- 여러 리포트 한번에 구매
- 수량 조절
- 담당AI: fullstack-developer

P3F16: 쿠폰 입력 UI
- 쿠폰 코드 입력
- 할인 금액 표시
- 담당AI: fullstack-developer
```

#### Backend 추가 (3개)
```csv
P3B15: 장바구니 API
- POST /api/cart
- 장바구니 담기/삭제
- 담당AI: api-designer

P3B16: 쿠폰 검증 API
- POST /api/coupons/validate
- 쿠폰 유효성 검사
- 담당AI: fullstack-developer

P3B17: 할인 계산 로직
- 쿠폰 할인 적용
- 대량 구매 할인
- 담당AI: fullstack-developer
```

#### Database 추가 (2개)
```csv
P3D5: Cart 테이블
- cart_id, user_id
- items (JSON)
- 담당AI: database-architect

P3D6: Coupon 테이블
- coupon_code, discount_type
- discount_value, expiry_date
- 담당AI: database-architect
```

---

### Phase 4: 정산 & 통계
**목표**: 매출 통계, 정산 시스템

#### Backend 추가 (3개)
```csv
P4B11: 매출 통계 API
- GET /api/admin/sales
- 일별/월별 매출
- 담당AI: fullstack-developer

P4B12: 정산 내역 API
- 플랫폼 수수료 계산
- 정산 내역 생성
- 담당AI: fullstack-developer

P4B13: 리포트 판매 분석
- 인기 리포트 타입
- 정치인별 판매량
- 담당AI: devops-troubleshooter
```

---

## 💳 결제 시스템 기술 스택

### 결제 게이트웨이

#### Option 1: 토스페이먼츠 (추천) ✅
```javascript
// 장점
✅ 한국 1위 결제 서비스
✅ 간편한 API
✅ 다양한 결제 수단
✅ 낮은 수수료 (2.9%)
✅ 훌륭한 문서

// 구현
import { loadTossPayments } from '@tosspayments/payment-sdk';

const tossPayments = await loadTossPayments(clientKey);

const payment = tossPayments.payment({
  amount: 9900,
  orderId: 'ORDER_001',
  orderName: '홍길동 AI 평가 리포트',
  successUrl: 'https://example.com/success',
  failUrl: 'https://example.com/fail',
});

await payment.requestPayment('카드');
```

#### Option 2: 아임포트
```
✅ 다양한 PG사 통합
⚠️ 복잡한 설정
```

#### Option 3: 스트라이프 (Stripe)
```
✅ 글로벌 결제
⚠️ 한국 결제 수단 부족
```

**추천**: **토스페이먼츠** (한국 시장 최적화)

---

## 🔐 보안 고려사항

### 1. 결제 검증
```python
# Backend에서 반드시 검증
def verify_payment(order_id, amount):
    # 1. 주문 금액 확인
    order = Order.objects.get(id=order_id)
    if order.amount != amount:
        raise PaymentError("금액 불일치")

    # 2. 토스 API로 재검증
    toss_payment = toss_api.get_payment(transaction_id)
    if toss_payment.amount != amount:
        raise PaymentError("결제 금액 위조")

    # 3. 중복 결제 방지
    if order.status == "paid":
        raise PaymentError("이미 결제된 주문")

    return True
```

### 2. CSRF 방지
```python
# Django CSRF token
@csrf_exempt  # 토스 웹훅만 예외
def toss_webhook(request):
    # 토스 시그니처 검증
    verify_toss_signature(request)
    # ... 웹훅 처리
```

### 3. SQL Injection 방지
```python
# ORM 사용 (Raw SQL 금지)
Order.objects.filter(user_id=user_id)  # ✅ 안전
Order.objects.raw(f"SELECT * FROM orders WHERE user_id={user_id}")  # ❌ 위험
```

---

## 📊 Database 스키마

### Order 테이블
```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(50) UNIQUE NOT NULL,  -- ORD_20251015_001
    user_id INTEGER REFERENCES users(id),
    politician_id INTEGER REFERENCES politicians(id),
    report_type VARCHAR(20),  -- basic, multi_ai, timeline
    amount INTEGER NOT NULL,
    discount_amount INTEGER DEFAULT 0,
    final_amount INTEGER NOT NULL,
    payment_method VARCHAR(20),  -- card, bank, kakaopay
    status VARCHAR(20),  -- pending, paid, cancelled, refunded
    created_at TIMESTAMP DEFAULT NOW(),
    paid_at TIMESTAMP,
    cancelled_at TIMESTAMP
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
```

### Payment 테이블
```sql
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    payment_id VARCHAR(50) UNIQUE NOT NULL,  -- PAY_20251015_001
    order_id VARCHAR(50) REFERENCES orders(order_id),
    transaction_id VARCHAR(100),  -- 토스 거래 ID
    amount INTEGER NOT NULL,
    status VARCHAR(20),  -- pending, success, failed
    payment_key VARCHAR(200),  -- 토스 paymentKey
    paid_at TIMESTAMP,
    refunded_at TIMESTAMP,
    refund_amount INTEGER DEFAULT 0
);
```

### Coupon 테이블
```sql
CREATE TABLE coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,  -- WELCOME2025
    discount_type VARCHAR(10),  -- percent, fixed
    discount_value INTEGER,  -- 10 (10% or 10000원)
    min_amount INTEGER,  -- 최소 구매 금액
    expiry_date DATE,
    usage_limit INTEGER,  -- 사용 횟수 제한
    used_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);
```

---

## 🎯 사용자 시나리오

### 시나리오 1: 정치인이 자기 리포트 구매
```
1. 홍길동 의원이 자신의 페이지 접속
2. "AI 평가 리포트 구매" 버튼 클릭
3. "기본 리포트 9,900원" 선택
4. 토스페이먼츠로 카드 결제
5. 결제 완료 후 즉시 PDF 다운로드
6. 이메일로도 PDF 수신
7. 선거 캠페인 자료로 활용
```

### 시나리오 2: 정치인 사무실에서 대량 구매
```
1. 사무실 직원이 장바구니에 10개 리포트 담기
   - 홍길동 기본 리포트
   - 홍길동 다중 AI 리포트
   - 홍길동 시계열 리포트
   - ... (7개 더)
2. 대량 구매 할인 자동 적용 (10% off)
3. 쿠폰 "BULK10" 입력 (추가 5% 할인)
4. 총 결제: 89,100원 (정가 99,000원)
5. 한 번에 10개 리포트 다운로드
```

### 시나리오 3: 환불 요청
```
1. 정치인이 리포트 다운로드 후 확인
2. "내용이 부실함" 판단
3. 24시간 내 환불 요청
4. 관리자 검토 (자동 승인)
5. 환불 처리 (1-3영업일)
6. 리포트 다운로드 권한 회수
```

---

## 💰 수익 모델 시뮬레이션

### 가정
```
- 전국 지방의원 수: 약 4,000명
- 국회의원: 300명
- 총 타겟: 4,300명
- 구매율: 10% (430명) - 보수적 추정
- 평균 구매액: 2,500,000원 (5개 전체 패키지)
- 플랫폼 수수료: 15%
```

### 예상 수익 (선거 시즌 기준)
```
총 거래액: 430명 × 2,500,000원 = 1,075,000,000원 (10.75억)
PG 수수료 (2.9%): -31,175,000원 (약 3,117만원)
플랫폼 순수익 (15%): 156,528,750원 (약 1.57억)
---
선거 시즌 수익: 약 1.57억원
```

### 시나리오별 수익 예측

#### 보수적 (5% 구매율)
```
215명 × 2,500,000원 = 537,500,000원 (5.37억)
플랫폼 수익: 약 7,850만원
```

#### 적정 (10% 구매율) ⭐ 기준
```
430명 × 2,500,000원 = 1,075,000,000원 (10.75억)
플랫폼 수익: 약 1.57억원
```

#### 공격적 (20% 구매율)
```
860명 × 2,500,000원 = 2,150,000,000원 (21.5억)
플랫폼 수익: 약 3.14억원
```

### 비선거 시즌 (평상시)
```
월 10명 × 500,000원 (1개 평가) = 5,000,000원
플랫폼 수익: 약 75만원/월
연간: 약 900만원
```

### 종합 예상 수익
```
선거 시즌 (1년): 1.57억원
비선거 시즌 (3년): 2,700만원
---
4년 주기 총 수익: 약 1.84억원
연평균: 약 4,600만원
```

---

## 📋 추가 작업 통계 (결제 시스템)

### Phase 2 추가
- Frontend: 5개 (P2F13~P2F17)
- Backend: 6개 (P2B12~P2B17)
- Database: 2개 (P2D6, P2D7)
- **총 13개**

### Phase 3 추가
- Frontend: 2개 (P3F15, P3F16)
- Backend: 3개 (P3B15~P3B17)
- Database: 2개 (P3D5, P3D6)
- **총 7개**

### Phase 4 추가
- Backend: 3개 (P4B11~P4B13)
- **총 3개**

### 전체 추가 (결제 시스템)
**총 23개 작업** (Frontend 7, Backend 12, Database 4)

---

## 🎯 우선순위

### 🔴 Critical (Phase 2 MVP)
```
1. P2F15: 결제 페이지
2. P2B13: 토스페이먼츠 연동
3. P2D6: Order 테이블
4. P2D7: Payment 테이블
5. P2B14: 결제 검증
```

### 🟡 Important (Phase 3)
```
6. P3F15: 장바구니
7. P3B16: 쿠폰 검증
```

### 🟢 Nice to Have (Phase 4)
```
8. P4B11: 매출 통계
9. P4B12: 정산 시스템
```

---

## 📝 작업지시서 예시

### tasks/P2B13.md
```markdown
# P2B13: 토스페이먼츠 연동

## 개요
토스페이먼츠 API를 연동하여 카드 결제 처리

## 구현 내용

### 1. 토스페이먼츠 SDK 설치
npm install @tosspayments/payment-sdk

### 2. 결제 요청
POST /api/payments/request
- order_id, amount, customer_info

### 3. 결제 승인
POST /api/payments/confirm
- paymentKey, orderId, amount

### 4. 웹훅 처리
POST /api/payments/webhook
- 결제 완료 알림
- 결제 취소 알림

## 보안
- 시크릿 키 환경 변수 관리
- 시그니처 검증 필수
- HTTPS 필수

## 테스트
- 테스트 API 키로 테스트
- 카드번호: 5500-0000-0000-0001
```

---

## 🚀 다음 단계

### 즉시 실행 (v1.3.0)
1. ✅ 판매 시스템 설계 완료
2. ⏳ CSV에 23개 작업 추가 (결제 시스템)
3. ⏳ 리포트 기능 14개 + 결제 시스템 23개 = **총 37개 작업 추가**
4. ⏳ Excel 재생성

### Phase 2 시작 전
5. ⏳ 토스페이먼츠 가입 및 API 키 발급
6. ⏳ 결제 UI 디자인 (Figma)
7. ⏳ 샘플 결제 플로우 테스트

---

## 💡 핵심 인사이트

### 왜 결제 시스템이 필요한가?
1. **수익 창출**: 무료 플랫폼 → 수익형 플랫폼
2. **가치 검증**: 정치인들이 돈 내고 살 만큼 가치 있는 리포트
3. **지속 가능성**: 광고 의존 → 직접 수익

### 리포트 + 결제 = 완벽한 조합
```
리포트: 사용자 가치 제공
결제: 수익 창출
→ 플랫폼 지속 가능성 확보
```

---

**결론**:

리포트 다운로드 기능 (14개) + 결제 시스템 (23개) = **총 37개 작업 추가** 필요!

**플로우**: 신청 → 결제 → 다운로드 → 재구매 → 정산

---

**작성일**: 2025-10-15
**버전**: v1.2.1 → v1.3.0
**예상 수익**: 연 3,200만원
**다음 액션**: CSV에 37개 작업 추가
