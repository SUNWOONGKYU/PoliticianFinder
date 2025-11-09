# Google OAuth 설정 가이드

## Supabase Dashboard 설정

### 1. Supabase 프로젝트 설정

1. [Supabase Dashboard](https://app.supabase.com)에 로그인
2. 프로젝트 선택: `ooddlafwdpzgxfefgsrx`
3. 왼쪽 메뉴에서 **Authentication** 클릭

### 2. Google Provider 활성화

1. **Providers** 탭 선택
2. **Google** 찾기 및 클릭
3. **Enable Sign in with Google** 토글 ON

### 3. Google Cloud Console 설정

#### Google Cloud 프로젝트 생성/선택
1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택

#### OAuth 2.0 자격 증명 만들기
1. **API 및 서비스** > **사용자 인증 정보** 이동
2. **+ 사용자 인증 정보 만들기** > **OAuth 클라이언트 ID** 선택
3. 애플리케이션 유형: **웹 애플리케이션** 선택
4. 이름: `PoliticianFinder`

#### 승인된 리디렉션 URI 추가
다음 URI를 추가하세요:
```
https://ooddlafwdpzgxfefgsrx.supabase.co/auth/v1/callback
```

#### Client ID와 Client Secret 복사
생성된 OAuth 2.0 클라이언트에서:
- **클라이언트 ID** 복사
- **클라이언트 비밀번호** 복사

### 4. Supabase에 Google 자격 증명 입력

1. Supabase Dashboard로 돌아가기
2. Google Provider 설정에서:
   - **Client ID**: Google에서 복사한 클라이언트 ID 입력
   - **Client Secret**: Google에서 복사한 클라이언트 비밀번호 입력
3. **Authorized Client IDs** (선택사항): 추가 클라이언트 ID가 있다면 입력
4. **Save** 클릭

### 5. 리디렉션 URL 설정

Supabase Dashboard > Authentication > URL Configuration에서:
- **Site URL**: `http://localhost:3000` (개발용)
- **Redirect URLs**:
  - `http://localhost:3000/auth/callback`
  - 프로덕션 URL 추가 (배포 시)

## 로컬 개발 환경 테스트

### 1. 환경 변수 확인
`.env.local` 파일에 다음이 설정되어 있는지 확인:
```env
NEXT_PUBLIC_SUPABASE_URL=https://ooddlafwdpzgxfefgsrx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. 개발 서버 실행
```bash
npm run dev
```

### 3. 테스트
1. http://localhost:3000 접속
2. 로그인 버튼 클릭
3. Google로 로그인 버튼 클릭
4. Google 계정으로 로그인
5. 자동으로 홈페이지로 리다이렉트되는지 확인

## 구현된 기능

### ✅ 완료된 기능
- **AuthContext**: 인증 상태 관리 (`/src/contexts/AuthContext.tsx`)
- **Google 로그인**: OAuth 2.0 통합
- **로그인 페이지**: Google 로그인 버튼 포함 (`/src/app/login/page.tsx`)
- **Header 컴포넌트**: 사용자 정보 표시 및 로그아웃 (`/src/components/Header.tsx`)
- **프로필 페이지**: 사용자 정보 표시 (`/src/app/profile/page.tsx`)
- **보호된 라우트**: ProtectedRoute 컴포넌트
- **인증 콜백**: OAuth 콜백 처리 (`/src/app/auth/callback/page.tsx`)

### 📋 주요 파일
- `/src/contexts/AuthContext.tsx` - 인증 컨텍스트
- `/src/app/login/page.tsx` - 로그인 페이지
- `/src/components/Header.tsx` - 헤더 컴포넌트
- `/src/app/profile/page.tsx` - 프로필 페이지
- `/src/app/auth/callback/page.tsx` - 인증 콜백 페이지
- `/src/app/layout.tsx` - AuthProvider 통합
- `/src/app/page.tsx` - 홈페이지 (인증 상태 반영)

## 보안 고려사항

1. **환경 변수 관리**
   - `.env.local` 파일은 절대 Git에 커밋하지 마세요
   - `.gitignore`에 포함되어 있는지 확인

2. **CSRF 보호**
   - Supabase는 자동으로 CSRF 토큰을 처리합니다

3. **세션 관리**
   - 자동 세션 갱신
   - 로그아웃 시 세션 완전 삭제

4. **리다이렉트 보안**
   - 승인된 URL만 리다이렉트 허용
   - Supabase Dashboard에서 설정

## 트러블슈팅

### 로그인이 작동하지 않는 경우
1. Google Cloud Console에서 OAuth 2.0 클라이언트가 활성화되어 있는지 확인
2. 리디렉션 URI가 정확히 일치하는지 확인
3. Supabase Dashboard에서 Google Provider가 활성화되어 있는지 확인

### 세션이 유지되지 않는 경우
1. 브라우저 쿠키가 활성화되어 있는지 확인
2. 로컬 스토리지가 차단되지 않았는지 확인

### CORS 오류가 발생하는 경우
1. Supabase URL이 올바른지 확인
2. 개발 서버 URL이 허용된 도메인에 포함되어 있는지 확인

## 다음 단계

1. **사용자 프로필 확장**: 추가 사용자 정보 수집
2. **역할 기반 접근 제어**: 관리자/일반 사용자 구분
3. **소셜 로그인 추가**: Facebook, Twitter 등
4. **이메일 인증**: 이메일/비밀번호 로그인 추가
5. **프로필 이미지 업로드**: Supabase Storage 활용
