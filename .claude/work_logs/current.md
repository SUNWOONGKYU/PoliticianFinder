# Work Log - Current Session

**시작 시간**: 2026-02-23
**프로젝트**: PoliticianFinder 프론트엔드 (보고서 구매 기능)

**이전 로그**: `.claude/work_logs/2026-02-22.md`

---

## 세션: 2026-02-23 - 상세평가보고서 구매 기능 전면 수정

### 작업 요약
보고서 구매 기능을 전면 수정: 정치인 본인만 → 누구나(정치인+일반회원) 구매 가능, 가격 인상

### 핵심 변경 사항

| 항목 | 현행 | 변경 후 |
|------|------|---------|
| 구매 대상 | 정치인 본인만 | 정치인 + 일반 회원 |
| 일반인 인증 | - | 사이트 회원 로그인 (Supabase Auth) |
| 기본 가격 | 100만원 | **200만원** |
| 할인 | 회차별 10만원, 최저 50만원 | 회차별 10만원, 최저 **100만원** |
| 회차 기준 | 정치인별 (politician_id) | **구매자별 (buyer_email)** |
| 정치인 인증 | 이메일 인증 | 동일 (변경 없음) |
| 결제 방식 | 무통장입금 | 동일 (변경 없음) |

### 수정된 파일 목록

#### 프론트엔드
1. **`1_Frontend/src/app/politicians/[id]/page.tsx`** (740~808행)
   - 가격: ₩1,000,000 → ₩2,000,000
   - 안내사항: "정치인 본인만" → "정치인 본인 또는 회원 누구나"
   - 인증 방식: "정치인: 이메일 인증 / 일반 회원: 로그인 필요"
   - 할인: "최소 50만원" → "최소 100만원"
   - 보고서 목차(7개 항목) 추가

2. **`1_Frontend/src/app/report-purchase/page.tsx`** (전면 재작성)
   - 구매자 유형 선택 (정치인/일반회원) 추가
   - 일반 회원: useAuth() 로그인 확인 → 이메일 인증 건너뜀 → 결제
   - 정치인: 기존 이메일 인증 플로우 유지
   - 동적 단계 표시 (일반회원 3단계 / 정치인 4단계)
   - 보고서 목차 표시 추가

#### API 라우트
3. **`1_Frontend/src/app/api/report-purchase/route.ts`** (전면 재작성)
   - buyer_type ('politician' | 'member') 필드 추가
   - user_id (일반 회원용) 필드 추가
   - verification_id를 optional로 (일반 회원은 불필요)
   - 인증 분기: 정치인=이메일인증, 일반회원=requireAuth()
   - 회차 카운트: buyer_email 기준

4. **`1_Frontend/src/app/api/report-purchase/count/route.ts`**
   - 파라미터: politician_id → buyer_email
   - 쿼리: .eq('politician_id') → .eq('buyer_email')

5. **`1_Frontend/src/app/api/report-purchase/send-code/route.ts`**
   - 가격 함수: 200만원/100만원 최저
   - 회차 카운트: buyer_email 기준

#### DB 마이그레이션
6. **`0-4_Database/Supabase/migrations/081_add_buyer_type_to_report_purchases.sql`** (신규)
   - buyer_type VARCHAR(20) DEFAULT 'politician'
   - user_id UUID REFERENCES auth.users(id)
   - buyer_email + payment_confirmed 인덱스

### 검증 결과
- `npm run build` ✅ 성공 (에러/경고 없음)

### 다음 작업
- Supabase에 마이그레이션 081 적용 필요
- 정치인 구매 플로우 E2E 테스트
- 일반 회원 구매 플로우 E2E 테스트
- 회차 할인 확인 (buyer_email 기준)
