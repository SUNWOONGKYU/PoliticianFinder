# Supabase 프로젝트 설정 가이드

**작업 ID**: P1D5
**작업일**: 2025-10-31
**설명**: PoliticianFinder Supabase 프로젝트 설정 방법

---

## 📋 목차

1. [Supabase 프로젝트 생성](#1-supabase-프로젝트-생성)
2. [API 키 발급](#2-api-키-발급)
3. [Google OAuth 설정](#3-google-oauth-설정)
4. [환경변수 설정](#4-환경변수-설정)
5. [데이터베이스 마이그레이션](#5-데이터베이스-마이그레이션)
6. [시드 데이터 적용](#6-시드-데이터-적용)
7. [검증](#7-검증)

---

## 1. Supabase 프로젝트 생성

### 1-1. Supabase 계정 생성
1. https://app.supabase.com 접속
2. GitHub 계정으로 로그인
3. 계정 생성 완료

### 1-2. 새 프로젝트 생성
1. **New Project** 클릭
2. 프로젝트 정보 입력:
   - **Name**: `PoliticianFinder`
   - **Database Password**: 안전한 비밀번호 생성 (메모 필수!)
   - **Region**: `Northeast Asia (Seoul)` 선택
   - **Pricing Plan**: `Free` 선택 (개발 단계)
3. **Create new project** 클릭
4. 프로젝트 생성 완료 (약 2분 소요)

### 1-3. 프로젝트 정보 확인
- **Project URL**: `https://your-project-ref.supabase.co`
- **Project Ref**: `your-project-ref`

---

## 2. API 키 발급

### 2-1. API 키 확인
1. Supabase 대시보드 > **Settings** > **API**
2. 다음 키 복사:
   - **Project URL**: `https://your-project-ref.supabase.co`
   - **anon public**: 공개 키 (클라이언트에서 사용)
   - **service_role**: 비공개 키 (서버 API에서만 사용)

### 2-2. JWT Secret 확인
1. Supabase 대시보드 > **Settings** > **API**
2. **JWT Settings** 섹션에서 **JWT Secret** 복사

⚠️ **주의**:
- `service_role` 키는 **절대 클라이언트에 노출하면 안 됩니다!**
- JWT Secret도 안전하게 보관하세요!

---

## 3. Google OAuth 설정

### 3-1. Google Cloud Console 설정
1. https://console.cloud.google.com 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. **APIs & Services** > **OAuth consent screen**
   - User Type: `External` 선택
   - App name: `PoliticianFinder`
   - User support email: 본인 이메일
   - Developer contact email: 본인 이메일
   - **Save and Continue**

### 3-2. OAuth 클라이언트 ID 생성
1. **APIs & Services** > **Credentials**
2. **Create Credentials** > **OAuth client ID**
3. Application type: `Web application`
4. Name: `PoliticianFinder Web Client`
5. **Authorized redirect URIs** 추가:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```
6. **Create** 클릭
7. **Client ID**와 **Client Secret** 복사 (메모 필수!)

### 3-3. Supabase에 Google OAuth 설정
1. Supabase 대시보드 > **Authentication** > **Providers**
2. **Google** 제공자 클릭
3. **Enable Google provider** 토글 활성화
4. Google OAuth 정보 입력:
   - **Client ID**: Google Cloud Console에서 복사한 Client ID
   - **Client Secret**: Google Cloud Console에서 복사한 Client Secret
5. **Save** 클릭

---

## 4. 환경변수 설정

### 4-1. .env.local 파일 생성
```bash
# Frontend 폴더로 이동
cd 1_Frontend

# .env.local.example을 복사하여 .env.local 생성
cp .env.local.example .env.local
```

### 4-2. .env.local 파일 편집
```bash
# 에디터로 .env.local 파일 열기
code .env.local
```

다음 값을 실제 값으로 대체:
```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key

# Google OAuth
GOOGLE_OAUTH_CLIENT_ID=your_google_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_google_client_secret

# JWT Secret
JWT_SECRET=your_jwt_secret_from_supabase

# Site URL (개발 환경)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 5. 데이터베이스 마이그레이션

### 5-1. Supabase CLI 설치 (이미 설치되어 있다면 생략)
```bash
# npm으로 설치
npm install -g supabase

# 설치 확인
supabase --version
```

### 5-2. Supabase 프로젝트 연결
```bash
# Backend Infrastructure 폴더로 이동
cd 2_Backend_Infrastructure/supabase

# Supabase 로그인
supabase login

# 프로젝트 연결
supabase link --project-ref your-project-ref
```

### 5-3. 마이그레이션 실행
```bash
# 001_auth_schema.sql 실행 (테이블, 인덱스, RLS)
supabase db push

# 또는 Supabase SQL Editor에서 직접 실행:
# 1. Supabase 대시보드 > SQL Editor
# 2. migrations/001_auth_schema.sql 내용 복사
# 3. 붙여넣기 후 Run 클릭
```

### 5-4. 트리거 적용
```bash
# 002_auth_triggers.sql 실행 (트리거 함수)
# Supabase SQL Editor에서:
# migrations/002_auth_triggers.sql 내용 복사 후 Run
```

---

## 6. 시드 데이터 적용

### 6-1. 개발용 시드 데이터 적용
```bash
# Supabase SQL Editor에서:
# seed_dev.sql 내용 복사 후 Run
```

### 6-2. 테스트 계정 확인
적용 후 다음 테스트 계정 사용 가능:

| 이메일 | 비밀번호 | 유형 | 이메일 인증 |
|--------|----------|------|-------------|
| member1@test.com | TestPass123! | 일반 회원 | ✅ 완료 |
| member2@test.com | TestPass123! | 일반 회원 | ❌ 미완료 |
| member.google@test.com | TestPass123! | 구글 OAuth | ✅ 완료 |
| politician1@test.com | TestPass123! | 정치인 | ✅ 완료 |
| politician2@test.com | TestPass123! | 정치인 | ✅ 완료 |
| admin@test.com | TestPass123! | 관리자 | ✅ 완료 |

---

## 7. 검증

### 7-1. 데이터베이스 테이블 확인
1. Supabase 대시보드 > **Table Editor**
2. 다음 테이블이 생성되었는지 확인:
   - `profiles`
   - `auth_tokens`
   - `email_verifications`
   - `password_resets`

### 7-2. RLS 정책 확인
1. Supabase 대시보드 > **Authentication** > **Policies**
2. 각 테이블에 RLS 정책이 적용되었는지 확인

### 7-3. 시드 데이터 확인
1. Supabase 대시보드 > **Table Editor** > `profiles`
2. 6개의 테스트 계정이 생성되었는지 확인

### 7-4. API 연결 테스트
```bash
# Frontend 폴더로 이동
cd 1_Frontend

# 개발 서버 실행
npm run dev

# 브라우저에서 http://localhost:3000 접속
# 회원가입/로그인 페이지가 정상적으로 표시되는지 확인
```

---

## ✅ 완료 기준

다음 항목이 모두 완료되면 Supabase 프로젝트 설정 완료:

- [ ] Supabase 프로젝트 생성 완료
- [ ] API 키 발급 및 .env.local 설정 완료
- [ ] Google OAuth 설정 완료
- [ ] 데이터베이스 마이그레이션 실행 완료
- [ ] 트리거 적용 완료
- [ ] 시드 데이터 적용 완료
- [ ] 테이블 및 RLS 정책 확인 완료
- [ ] API 연결 테스트 성공

---

## 🚨 문제 해결

### 문제 1: 마이그레이션 실행 시 권한 오류
**증상**: `permission denied for schema auth`

**해결**:
- Supabase SQL Editor에서 직접 실행하세요.
- SQL Editor는 관리자 권한으로 실행됩니다.

### 문제 2: Google OAuth 로그인 실패
**증상**: `redirect_uri_mismatch` 오류

**해결**:
1. Google Cloud Console > OAuth 클라이언트 설정 확인
2. Authorized redirect URIs가 정확한지 확인:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```
3. Supabase > Authentication > Providers에서 Google 설정 확인

### 문제 3: 환경변수 인식 안 됨
**증상**: `NEXT_PUBLIC_SUPABASE_URL is undefined`

**해결**:
1. .env.local 파일이 1_Frontend 폴더 루트에 있는지 확인
2. Next.js 개발 서버 재시작:
   ```bash
   # Ctrl+C로 서버 종료 후
   npm run dev
   ```

---

## 📚 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [Supabase Auth 가이드](https://supabase.com/docs/guides/auth)
- [Google OAuth 설정 가이드](https://developers.google.com/identity/protocols/oauth2)
- [Next.js 환경변수 문서](https://nextjs.org/docs/basic-features/environment-variables)

---

**P1D5 완료**
다음 작업: P1BI1 (Supabase 클라이언트 설정)
