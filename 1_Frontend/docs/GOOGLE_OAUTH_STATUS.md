# Google OAuth 상태 보고서

**작성일**: 2025-11-05
**상태**: ✅ 코드 완성 / ⚠️ 설정 필요

---

## 📊 현재 상태

### ✅ 완료된 항목
- [x] Google OAuth API 엔드포인트 구현 (`/api/auth/google`)
- [x] Google OAuth 콜백 핸들러 구현 (`/api/auth/google/callback`)
- [x] Supabase Auth 통합
- [x] 세션 토큰 생성 및 관리
- [x] 프로필 자동 생성/관리
- [x] 에러 처리 및 리다이렉트
- [x] CORS 설정
- [x] Rate Limiting
- [x] 로그인 페이지에 "Google로 로그인" 버튼

### ⚠️ 필요한 설정
- [ ] Google Cloud Console에서 OAuth 클라이언트 생성
- [ ] Google 클라이언트 ID 획득
- [ ] Google 클라이언트 Secret 획득
- [ ] Supabase Dashboard에 Google 자격증명 등록
- [ ] `.env.local` 파일에 클라이언트 ID/Secret 입력
- [ ] 리다이렉션 URL 등록 확인

---

## 🏗️ 구현된 아키텍처

### API 엔드포인트

#### 1. OAuth 시작
```
GET /api/auth/google
```
- 역할: Google 인증 페이지로 사용자 리다이렉트
- Rate Limiting: 5회/5분
- 응답: Google 로그인 URL로 리다이렉트

#### 2. OAuth 콜백
```
GET /api/auth/google/callback?code=xxx
```
- 역할: Google 인증 코드를 세션으로 교환
- 프로필 자동 생성/확인
- 대시보드로 리다이렉트
- 실패 시 로그인 페이지로 리다이렉트 (에러 메시지 포함)

### 데이터 흐름

```
사용자 클릭
   ↓
"Google로 로그인" 버튼
   ↓
GET /api/auth/google
   ↓
Google 인증 페이지 (사용자가 Google 계정으로 로그인)
   ↓
GET /api/auth/google/callback?code=...
   ↓
Code를 세션으로 교환 (Supabase Auth)
   ↓
프로필 조회/생성
   ↓
/dashboard로 리다이렉트 (성공)
또는
/login?error=... 로 리다이렉트 (실패)
```

---

## 📋 필요한 설정 단계

### 단계 1: Google Cloud Console 설정

#### 1-1. 프로젝트 생성
1. https://console.cloud.google.com 접속
2. 프로젝트 생성 또는 기존 프로젝트 선택

#### 1-2. OAuth 클라이언트 생성
1. **API 및 서비스** > **사용자 인증 정보** 클릭
2. **+ 사용자 인증 정보 만들기** > **OAuth 클라이언트 ID** 선택
3. **웹 애플리케이션** 선택
4. 이름: `PoliticianFinder`

#### 1-3. 승인된 리디렉션 URI 추가
다음 URI들을 추가하세요:
```
https://ooddlafwdpzgxfefgsrx.supabase.co/auth/v1/callback
http://localhost:3002/api/auth/google/callback
```

프로덕션 배포 시 추가:
```
https://politicianfinder.com/api/auth/google/callback
```

#### 1-4. 자격증명 복사
생성된 OAuth 클라이언트에서:
- ✅ **클라이언트 ID** 복사 (예: `1234567890-abcd...apps.googleusercontent.com`)
- ✅ **클라이언트 비밀번호** 복사 (예: `GOCSPX-...`)

### 단계 2: Supabase Dashboard 설정

#### 2-1. Supabase 대시보드 접속
https://app.supabase.com > 프로젝트 선택: `ooddlafwdpzgxfefgsrx`

#### 2-2. Google Provider 설정
1. **Authentication** > **Providers** 클릭
2. **Google** 찾기 및 클릭
3. **Enable Sign in with Google** 토글 ON
4. **Client ID** 필드에 Google 클라이언트 ID 입력
5. **Client Secret** 필드에 Google 클라이언트 Secret 입력
6. **Save** 클릭

#### 2-3. URL Configuration 확인
**Authentication** > **URL Configuration**에서:
- **Site URL**: `http://localhost:3002` (개발용)
- **Redirect URLs**:
  ```
  http://localhost:3002/api/auth/google/callback
  ```

프로덕션 배포 시:
```
https://politicianfinder.com/api/auth/google/callback
```

### 단계 3: 환경 변수 설정

#### 3-1. .env.local 파일 생성
```bash
cp .env.example .env.local
```

#### 3-2. .env.local 파일 수정
```env
# Supabase (필수)
NEXT_PUBLIC_SUPABASE_URL=https://ooddlafwdpzgxfefgsrx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>

# Google OAuth (필수 - Google에서 복사)
GOOGLE_OAUTH_CLIENT_ID=<Google에서 복사한 클라이언트 ID>
GOOGLE_OAUTH_CLIENT_SECRET=<Google에서 복사한 클라이언트 Secret>

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3002
```

### 단계 4: 테스트

#### 4-1. 개발 서버 실행
```bash
npm run dev
```

#### 4-2. 로그인 페이지 접속
http://localhost:3002/login

#### 4-3. Google 로그인 테스트
1. **"Google로 로그인"** 버튼 클릭
2. Google 계정으로 로그인
3. 권한 승인
4. 자동으로 대시보드로 리다이렉트되는지 확인

---

## 🔧 트러블슈팅

### "OAuth 초기화에 실패했습니다" 에러
**원인**: Supabase에 Google 자격증명이 등록되지 않음

**해결책**:
1. Supabase Dashboard > Authentication > Providers > Google 확인
2. Client ID와 Secret이 올바르게 입력되어 있는지 확인
3. Save 클릭
4. 개발 서버 재시작

### "인증 코드를 받지 못했습니다" 에러
**원인**: Google 인증 실패 또는 리디렉션 URI 불일치

**해결책**:
1. Google Cloud Console에서 리디렉션 URI 확인
2. Supabase URL Configuration에서 Redirect URL 확인
3. 두 URL이 정확히 일치하는지 확인
4. 개발 서버 포트 확인 (3002인지 확인)

### "세션 교환 실패" 에러
**원인**: Supabase Google Provider 설정 문제

**해결책**:
1. Supabase Dashboard에서 Google Provider 활성화 확인 (토글 ON)
2. Client ID와 Secret 재입력
3. 환경 변수 재확인
4. 개발 서버 재시작

### 로그인 성공 후 리다이렉트 안 됨
**원인**: 프로필 생성 실패 또는 대시보드 페이지 없음

**해결책**:
1. 브라우저 개발자 도구 > 네트워크 탭 확인
2. `/api/auth/google/callback` 요청 상태 확인
3. `/dashboard` 페이지 존재 확인
4. 콘솔 로그 확인

---

## 📁 관련 파일

### 설정 가이드
- `docs/SETUP_GUIDE.md` - 전체 개발 환경 설정 가이드
- `docs/GOOGLE_AUTH_SETUP.md` - 상세 Google OAuth 설정 가이드
- `docs/GOOGLE_OAUTH_STATUS.md` - 이 파일

### 환경 변수
- `.env.example` - 환경 변수 템플릿
- `.env.local` - 실제 환경 변수 (개발용, Git에 커밋 안 함)

### 코드
- `src/app/api/auth/google/route.ts` - OAuth 시작 엔드포인트
- `src/app/api/auth/google/callback/route.ts` - OAuth 콜백 엔드포인트
- `src/app/login/page.tsx` - 로그인 페이지

---

## 🔐 보안 주의사항

### ✅ 해야 할 것
- ✅ `.env.local`은 `.gitignore`에 포함되어 있음 (확인 필요)
- ✅ 환경 변수는 개발 서버에서만 로컬로 관리
- ✅ 프로덕션에서는 GitHub Secrets 또는 Vercel Environment Variables 사용
- ✅ Secret Key는 절대 코드에 하드코딩하지 말 것

### ❌ 하면 안 되는 것
- ❌ `.env.local` 파일을 Git에 커밋
- ❌ Client Secret을 공개 저장소에 올리기
- ❌ 클라이언트 측에서 Secret Key 사용
- ❌ 리다이렉션 URL 검증 생략

---

## ✅ 최종 체크리스트

### 설정 전
- [ ] Reference 폴더에서 GOOGLE_AUTH_SETUP.md 복사 완료
- [ ] 1_Frontend/docs/ 폴더에 설정 가이드 저장 완료
- [ ] .env.example 파일 생성 완료

### Google Cloud Console
- [ ] Google Cloud 프로젝트 생성/선택
- [ ] OAuth 2.0 클라이언트 생성
- [ ] 웹 애플리케이션 선택
- [ ] 리다이렉션 URI 등록:
  - [ ] `https://ooddlafwdpzgxfefgsrx.supabase.co/auth/v1/callback`
  - [ ] `http://localhost:3002/api/auth/google/callback`
- [ ] 클라이언트 ID 복사
- [ ] 클라이언트 Secret 복사

### Supabase Dashboard
- [ ] Authentication > Providers > Google 찾기
- [ ] "Enable Sign in with Google" 토글 ON
- [ ] Client ID 입력
- [ ] Client Secret 입력
- [ ] Save 클릭
- [ ] URL Configuration 확인

### 환경 변수
- [ ] `.env.local` 파일 생성 (`.env.example` 복사)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` 입력
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 입력
- [ ] `GOOGLE_OAUTH_CLIENT_ID` 입력
- [ ] `GOOGLE_OAUTH_CLIENT_SECRET` 입력
- [ ] `NEXT_PUBLIC_SITE_URL=http://localhost:3002` 입력

### 테스트
- [ ] 개발 서버 시작: `npm run dev`
- [ ] http://localhost:3002/login 접속
- [ ] "Google로 로그인" 버튼 클릭
- [ ] Google 계정으로 로그인
- [ ] 권한 승인
- [ ] 대시보드로 자동 리다이렉트
- [ ] 프로필 정보 표시 확인

---

## 📞 지원

### 문제 해결
1. `docs/SETUP_GUIDE.md`의 트러블슈팅 섹션 참고
2. `docs/GOOGLE_AUTH_SETUP.md`의 상세 가이드 참고
3. 브라우저 개발자 도구 > 콘솔 로그 확인
4. Supabase Dashboard > Logs 확인

### 추가 정보
- Supabase Google OAuth: https://supabase.com/docs/guides/auth/social-login/auth-google
- Google OAuth 설정: https://developers.google.com/identity/protocols/oauth2/web-server-flow

---

**상태**: 🟢 코드 완성, 설정 대기 중
