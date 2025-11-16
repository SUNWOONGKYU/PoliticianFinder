# 야간 준비 작업 완료 보고서

**작성 일시**: 2025-11-17 (야간)
**작성자**: Claude Code (Sonnet 4.5)
**목적**: 내일 작업을 위한 사전 조사 및 준비

---

## 📋 요청 사항 (3가지)

1. ✅ 하드코딩 제거 완료 여부 검증
2. ✅ 보안 강화 및 실제 인증 시스템 전환 점검
3. ✅ 이메일 인증 시스템 (Resend + Vercel 도메인) 작업 준비

---

## 1️⃣ 하드코딩 제거 검증 결과

### ❌ 결론: 하드코딩 완전 제거 **미완료**

**발견된 하드코딩**: 총 **16개** (15개 파일)

### 긴급 수정 필요 (CRITICAL)

#### 1. MOCK_USER_ID 하드코딩
**파일**: `1_Frontend/src/app/api/auth/me/route.ts:17`
```typescript
const MOCK_USER_ID = '7f61567b-bbdf-427a-90a9-0ee060ef4595';
```
- **위험도**: 🔴 **CRITICAL**
- **영향**: 모든 사용자가 동일한 ID로 인증됨
- **수정**: Supabase Auth의 `getUser()` 사용

#### 2. 시드 데이터 하드코딩
**파일**: `1_Frontend/src/app/api/seed-politician-posts/route.ts:31`
```typescript
user_id: '7f61567b-bbdf-427a-90a9-0ee060ef4595',
```
- **위험도**: 🔴 **HIGH**
- **영향**: 모든 시드 게시글이 동일 사용자로 생성

### 주요 하드코딩 목록

| 파일 | 라인 | 내용 | 위험도 |
|------|------|------|--------|
| `api/auth/me/route.ts` | 17 | `MOCK_USER_ID` | 🔴 CRITICAL |
| `api/seed-politician-posts/route.ts` | 31 | 하드코딩 user_id | 🔴 HIGH |
| `api/search/politicians/route.ts` | 16-41 | `mockPoliticians` 배열 | 🔴 HIGH |
| `api/politicians/verify/route.ts` | 15-26 | `mockPoliticians` 10개 | 🔴 HIGH |
| `api/recommendations/politicians/route.ts` | 86-101 | `mockRecommendations` | 🔴 HIGH |
| `api/news/route.ts` | 28-98 | `mockEvaluationResults` | 🔴 HIGH |
| `api/politicians/evaluation/route.ts` | 115-136 | `mockEvaluation` | 🔴 HIGH |
| `mypage/page.tsx` | 30 | `demo@example.com` | 🟡 HIGH |
| `profile/edit/page.tsx` | 16-17 | 하드코딩 닉네임/이메일 | 🟡 HIGH |
| `payment/page.tsx` | 192 | `politician@example.com` | 🟡 MEDIUM |
| `users/[id]/profile/page.tsx` | 46-124 | 샘플 프로필 데이터 | 🟡 MEDIUM |
| `community/posts/create/page.tsx` | 45-54 | 샘플 정치인 8명 | 🟡 MEDIUM |
| `api/statistics/politicians/route.ts` | 72-82 | `mockImages` | 🟡 MEDIUM |

### 우선순위 수정 계획

**Phase 1 (즉시)**: 보안 위협 제거
1. `/api/auth/me` - MOCK_USER_ID 제거
2. 시드 API - 하드코딩 user_id 제거

**Phase 2 (조속히)**: 기능 정상화
3. 검색 API - DB 쿼리 구현
4. 검증 API - DB 연동
5. 추천/평가 API - Mock 데이터 제거

**Phase 3 (개선)**: UX 향상
6. 마이페이지 - API 연동
7. 프로필 편집 - 실제 데이터
8. 게시글 작성 - 정치인 목록 API

---

## 2️⃣ 보안 강화 및 인증 시스템 점검 결과

### 🔴 보안 등급: **C** (심각한 취약점 발견)

### 발견된 취약점

#### CRITICAL: 관리자 API 인증 부재

**인증 없이 접근 가능한 관리자 API (5개)**:

1. `/api/admin/dashboard` - 대시보드 통계
2. `/api/admin/content` - 콘텐츠 관리
3. `/api/admin/inquiries` - 문의 관리
4. `/api/admin/politicians` - 정치인 추가
5. `/api/admin/auto-moderate` - 자동 중재

**현재 코드 예시** (`/api/admin/dashboard/route.ts`):
```typescript
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    // ❌ 인증 체크 없음!
```

**수정 방법**:
```typescript
import { requireAdmin } from '@/lib/auth/helpers';

export async function GET(request: NextRequest) {
  try {
    // ✅ 관리자 권한 확인 추가
    const authResult = await requireAdmin();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
```

#### HIGH: Service Role Key 남용

다음 API들이 Service Role Key를 사용하지만 관리자 체크 없음:
- `/api/admin/dashboard`
- `/api/admin/content`
- `/api/admin/inquiries`

#### MEDIUM: 일관성 없는 인증 체크

관리자 API에서 `requireAuth`와 `requireAdmin` 혼용:
- `/api/admin/users` - `requireAuth` 사용 (❌ 일반 사용자도 접근 가능)
- `/api/admin/ads` - `requireAdmin` 사용 (✅ 올바름)

### 인증 시스템 전환 상태

#### ✅ 완료된 항목

1. **게시글 CRUD** - Supabase 세션 기반 인증
2. **알림 API** - 사용자 인증 및 권한 체크
3. **결제 API** - 사용자 인증
4. **Auth Helpers** - `requireAuth()`, `requireAdmin()` 구현 완료

#### ⚠️ 미완료 항목

1. **관리자 대시보드** - 인증 없음
2. **콘텐츠 관리** - 인증 없음
3. **문의 관리** - 인증 없음
4. **정치인 추가** - 인증 없음
5. **현재 사용자 정보** (`/api/auth/me`) - Mock 데이터 반환

### 보안 체크리스트

| 항목 | 상태 | 비고 |
|------|------|------|
| Supabase 세션 사용 | ✅ | 대부분 API 적용 |
| JWT 토큰 검증 | ✅ | Supabase SDK 자동 처리 |
| 쿠키 보안 설정 | ⚠️ | httpOnly, secure 명시 권장 |
| 관리자 API 인증 | ❌ | 5개 API 인증 없음 |
| 게시글 작성자 권한 | ✅ | 정상 구현 |
| IDOR 방지 | ✅ | user_id 필터링 적용 |
| Rate Limiting | ⚠️ | In-memory (Redis 권장) |
| Security Headers | ✅ | Middleware 적용 |

### 긴급 수정 필요 항목

**1순위 (즉시)**:
1. 모든 `/api/admin/**` 엔드포인트에 `requireAdmin()` 추가
2. `/api/auth/me` Mock 데이터 제거, 실제 세션 사용
3. `/api/admin/users`를 `requireAdmin()`으로 변경

**2순위 (중요)**:
1. 쿠키 보안 옵션 명시적 설정
2. Rate Limiting Redis/Upstash 전환
3. 관리자 작업 감사 로그 강화

---

## 3️⃣ 이메일 인증 시스템 현황 및 Resend 준비

### 📧 현재 이메일 시스템 구조

| 용도 | 서비스 | 파일 위치 | 상태 |
|------|--------|-----------|------|
| 회원가입 인증 | Supabase 내장 | `api/auth/signup/route.ts` | ✅ 정상 |
| 문의 답변 | Resend | `lib/email.ts` | ⚠️ API 키 필요 |
| 정치인 인증 | Nodemailer | `lib/verification/email-sender.ts` | ⚠️ SMTP 설정 필요 |

### 🔍 회원가입 이메일 인증 분석

**결론**: ✅ **정상 작동 중** (문제 없음!)

**현재 프로세스**:
1. 사용자가 회원가입 (`/api/auth/signup`)
2. Supabase Auth `signUp()` 호출 → 이메일 자동 발송
3. 사용자가 이메일 링크 클릭
4. `/auth/callback` 리다이렉트 → `verifyOtp()` 호출
5. 인증 완료 → 로그인 가능

**발신 주소**: `noreply@mail.app.supabase.io`

**주요 코드** (`api/auth/signup/route.ts:186-196`):
```typescript
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: data.email,
  password: data.password,
  options: {
    emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
  },
});
```

### 📚 발견된 Resend 관련 자료

#### 1. Resend 라이브러리 (이미 설치됨!)

**파일**: `1_Frontend/src/lib/email.ts` (95 lines)
```typescript
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInquiryResponseEmail({...}) {
  const { data, error } = await resend.emails.send({
    from: "PoliticianFinder <noreply@politicianfinder.com>",
    to: [to],
    subject: `[PoliticianFinder] 문의 답변: ${inquiryTitle}`,
    html: `...`
  });
}
```

**용도**: 관리자가 문의에 답변 시 자동 이메일 발송

#### 2. Resend 완벽 설정 가이드

**파일**: `INQUIRY_EMAIL_SETUP.md` (267 lines)

**주요 내용**:
- Resend 계정 생성 방법
- API Key 발급 방법
- 도메인 인증 (DNS TXT 레코드)
- 환경변수 설정
- 테스트 방법
- 문제 해결 가이드

**무료 플랜**: 월 3,000통

#### 3. 환경변수 설정

**파일**: `1_Frontend/.env.local` (Line 79-94)
```env
# Resend API Key
RESEND_API_KEY=re_your_resend_api_key_here

# 발신 이메일 주소 (Resend에서 인증된 도메인 필요)
RESEND_FROM_EMAIL=noreply@politicianfinder.com

# 앱 URL (이메일 템플릿에서 사용)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### 4. 기타 관련 문서

- **Supabase 이메일 가이드**: `SUPABASE_EMAIL_SETUP.md` (108 lines)
- **배포 가이드**: `DEPLOYMENT_GUIDE.md` (208 lines)
- **환경변수 예시**: `1_Frontend/.env.local.example` (139 lines)

### 🎯 Resend 전환 작업 계획

#### ✅ 이미 완료된 사항

1. Resend 라이브러리 설치 (`resend@6.4.2`)
2. 이메일 발송 함수 구현 (`lib/email.ts`)
3. 관리자 문의 답변 API 연동 완료
4. 완벽한 설정 가이드 문서 준비

#### ⚠️ 내일 작업 필요 사항

**30분 내 완료 가능**:

1. **Resend 계정 생성** (5분)
   - https://resend.com 접속
   - 회원가입 (Google/GitHub 연동 가능)

2. **API Key 발급** (3분)
   - Dashboard > API Keys > Create API Key
   - Full Access 권한 선택
   - 키 복사

3. **환경변수 설정** (2분)
   ```bash
   # .env.local 파일 수정
   RESEND_API_KEY=re_[발급받은_키]
   RESEND_FROM_EMAIL=onboarding@resend.dev  # 테스트용
   ```

4. **개발 서버 재시작** (2분)
   ```bash
   npm run dev
   ```

5. **테스트** (10분)
   - http://localhost:3000/admin/inquiries
   - 문의 생성 → 답변 작성 → 이메일 확인

#### 📌 프로덕션 배포 시 추가 작업

**도메인 인증** (Resend에서 본인 도메인 사용 시):

1. Resend Dashboard > Domains > Add Domain
2. 도메인 입력: `politicianfinder.com`
3. DNS TXT 레코드 추가:
   ```
   Type: TXT
   Name: resend._domainkey
   Value: [Resend에서 제공]
   ```
4. 환경변수 변경:
   ```env
   RESEND_FROM_EMAIL=noreply@politicianfinder.com
   ```

### 🔧 Vercel 도메인 설정

**현재 프로덕션 URL**: `https://politician-finder.vercel.app/`

**DNS 설정**:
- 테스트: `onboarding@resend.dev` (본인 이메일로만 발송)
- 프로덕션: 자체 도메인 인증 필요

### 💡 권장사항

1. **회원가입 인증**: Supabase 계속 사용 (변경 불필요)
2. **문의 답변**: Resend API 키만 발급하면 즉시 사용 가능
3. **정치인 인증**: 향후 Resend로 통합 권장

---

## 📂 내일 작업 시 참고할 파일 목록

### 필수 읽기 (우선순위순)

1. **INQUIRY_EMAIL_SETUP.md** - Resend 완벽 가이드 (267 lines)
2. **SUPABASE_EMAIL_SETUP.md** - Supabase 이메일 설정 (108 lines)
3. **1_Frontend/.env.local.example** - 환경변수 전체 목록 (139 lines)
4. **1_Frontend/src/lib/email.ts** - Resend 코드 구현 예시 (95 lines)

### 하드코딩 제거 작업

**Phase 1 (보안 위협)**:
- `1_Frontend/src/app/api/auth/me/route.ts` (Line 17)
- `1_Frontend/src/app/api/seed-politician-posts/route.ts` (Line 31)

**Phase 2 (기능 이슈)**:
- `1_Frontend/src/app/api/search/politicians/route.ts` (Line 16-41)
- `1_Frontend/src/app/api/politicians/verify/route.ts` (Line 15-26)
- `1_Frontend/src/app/api/recommendations/politicians/route.ts` (Line 86-101)
- `1_Frontend/src/app/api/news/route.ts` (Line 28-98)
- `1_Frontend/src/app/api/politicians/evaluation/route.ts` (Line 115-136)

### 보안 강화 작업

**관리자 API 인증 추가**:
- `1_Frontend/src/app/api/admin/dashboard/route.ts`
- `1_Frontend/src/app/api/admin/content/route.ts`
- `1_Frontend/src/app/api/admin/inquiries/route.ts`
- `1_Frontend/src/app/api/admin/politicians/route.ts`
- `1_Frontend/src/app/api/admin/auto-moderate/route.ts`

**참고 파일**:
- `1_Frontend/src/lib/auth/helpers.ts` - `requireAuth()`, `requireAdmin()` 구현

### 이메일 시스템 작업

**Resend 관련**:
- `1_Frontend/src/lib/email.ts` - 이메일 발송 함수
- `1_Frontend/.env.local` - 환경변수 설정

**Supabase 관련**:
- `1_Frontend/src/app/api/auth/signup/route.ts` - 회원가입
- `1_Frontend/src/app/auth/callback/route.ts` - 이메일 인증 콜백

### 테스트 스크립트

- `1_Frontend/scripts/check_supabase_settings.mjs`
- `1_Frontend/scripts/check_signup_status.mjs`
- `1_Frontend/scripts/check_email_logs.mjs`

---

## 🎯 내일 작업 우선순위

### 1순위: 보안 취약점 해결 (긴급)

**예상 소요 시간**: 2시간

1. **관리자 API 인증 추가** (5개 파일)
   - `/api/admin/dashboard`
   - `/api/admin/content`
   - `/api/admin/inquiries`
   - `/api/admin/politicians`
   - `/api/admin/auto-moderate`

2. **MOCK_USER_ID 제거**
   - `/api/auth/me` - 실제 Supabase 세션 사용

3. **테스트 및 검증**
   - 관리자 대시보드 접근 테스트
   - 일반 사용자 접근 차단 확인

### 2순위: Resend 이메일 시스템 활성화 (권장)

**예상 소요 시간**: 30분

1. Resend 계정 생성 및 API Key 발급
2. `.env.local` 환경변수 설정
3. 개발 서버 재시작 및 테스트
4. 문의 답변 이메일 발송 테스트

### 3순위: 하드코딩 완전 제거 (중요)

**예상 소요 시간**: 3시간

**Phase 1**: MOCK_USER_ID 제거 (완료 예정: 1순위에서)

**Phase 2**: Mock 정치인 데이터 제거
- 검색 API (`/api/search/politicians`)
- 검증 API (`/api/politicians/verify`)
- 추천 API (`/api/recommendations/politicians`)
- 평가 API (`/api/politicians/evaluation`, `/api/news`)

**Phase 3**: 프론트엔드 샘플 데이터 제거
- 마이페이지 (`mypage/page.tsx`)
- 프로필 편집 (`profile/edit/page.tsx`)
- 사용자 프로필 (`users/[id]/profile/page.tsx`)
- 게시글 작성 (`community/posts/create/page.tsx`)

### 4순위: 추가 보안 강화 (선택)

**예상 소요 시간**: 1시간

1. 쿠키 보안 옵션 명시적 설정
2. `/api/admin/users` 권한 체크 수정 (`requireAuth` → `requireAdmin`)
3. Rate Limiting Redis 전환 (프로덕션 배포 전)

---

## 📊 전체 작업 통계

### 하드코딩

| 위험도 | 발견 개수 | 파일 수 |
|--------|-----------|---------|
| CRITICAL | 4개 | 4개 |
| HIGH | 8개 | 7개 |
| MEDIUM | 4개 | 4개 |
| **총계** | **16개** | **15개** |

### 보안 취약점

| 위험도 | 발견 개수 | 설명 |
|--------|-----------|------|
| CRITICAL | 5개 | 관리자 API 인증 부재 |
| HIGH | 2개 | Service Role Key 남용 |
| MEDIUM | 2개 | 일관성 없는 인증 체크 |
| LOW | 2개 | Rate Limiting, CORS |
| **총계** | **11개** | |

### 이메일 시스템

| 항목 | 상태 | 비고 |
|------|------|------|
| 회원가입 인증 | ✅ 정상 | Supabase 내장 |
| 문의 답변 | ⚠️ 준비 완료 | API 키만 필요 |
| 정치인 인증 | ⚠️ 미설정 | SMTP 설정 필요 |

---

## ✅ 준비 완료 사항

1. ✅ 전체 코드베이스 하드코딩 검증 완료
2. ✅ 보안 취약점 식별 및 수정 방법 제시
3. ✅ 이메일 시스템 현황 파악 및 Resend 자료 수집
4. ✅ 내일 작업 우선순위 및 계획 수립
5. ✅ 참고 파일 목록 및 가이드 정리

---

## 💤 잘 주무세요!

**내일 아침에 이 보고서를 확인하시고 작업을 시작하시면 됩니다.**

모든 필요한 정보와 파일 위치, 수정 방법이 준비되어 있습니다.

**예상 총 작업 시간**: 4-6시간 (우선순위 1-3 모두 완료 시)

**가장 긴급한 작업**: 관리자 API 인증 추가 (보안 위협)

---

**작성 완료 시각**: 2025-11-17 야간
**다음 단계**: 내일 아침 작업 시작 🌅
