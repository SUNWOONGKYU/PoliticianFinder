# Supabase Google OAuth 설정 가이드

## 문제 상황
- Google 소셜 로그인 시 **404 에러** 발생
- 회원가입 불가

## 원인
Supabase 대시보드에서 Google OAuth Provider 설정이 누락되었거나 Callback URL이 잘못 설정됨

## 해결 방법

### 1. Supabase 대시보드 접속
```
https://app.supabase.com → PoliticianFinder 프로젝트 선택
```

### 2. Authentication 설정으로 이동
```
왼쪽 메뉴: Authentication (🔐 아이콘)
→ Providers 탭 클릭
→ Google 찾기
```

### 3. Google OAuth Provider 설정

#### A. Google OAuth가 비활성화되어 있는 경우
1. Google 행의 토글을 **ON**으로 변경
2. 다음 정보 입력:

| 항목 | 값 |
|------|-----|
| **Enabled** | ON (체크) |
| **Client ID** | Google Cloud Console에서 발급받은 Client ID |
| **Client Secret** | Google Cloud Console에서 발급받은 Client Secret |

#### B. Google Cloud Console 설정 확인
만약 Client ID/Secret이 없다면:

1. https://console.cloud.google.com 접속
2. **APIs & Services** → **Credentials** 이동
3. **+ CREATE CREDENTIALS** → **OAuth 2.0 Client ID** 선택
4. Application type: **Web application**
5. **Authorized redirect URIs**에 다음 추가:
   ```
   https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback
   ```

   **예시**: `https://abc123xyz.supabase.co/auth/v1/callback`

6. Create 후 Client ID와 Client Secret 복사
7. Supabase 대시보드에 입력

### 4. Redirect URLs 설정 (중요!)

Supabase 대시보드에서:
```
Authentication → URL Configuration
```

**Site URL** (프로덕션 URL):
```
https://www.politicianfinder.ai.kr
```

**Redirect URLs** (허용할 콜백 URL 목록):
```
https://www.politicianfinder.ai.kr/api/auth/google/callback
https://www.politicianfinder.ai.kr/
http://localhost:3000/api/auth/google/callback
http://localhost:3000/
```

### 5. 환경 변수 확인

프로젝트의 `.env.local` 파일에 다음 변수가 설정되어 있는지 확인:

```env
NEXT_PUBLIC_SITE_URL=https://www.politicianfinder.ai.kr
NEXT_PUBLIC_SUPABASE_URL=https://<YOUR_PROJECT>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<YOUR_ANON_KEY>
```

Vercel 배포 시에도 동일한 환경 변수 설정 필요!

## 테스트 방법

### 1. 프로덕션에서 테스트
1. https://www.politicianfinder.ai.kr 접속
2. "Google로 로그인" 버튼 클릭
3. Google 계정 선택 화면으로 리디렉션되는지 확인
4. 계정 선택 후 서비스로 다시 리디렉션되는지 확인
5. 로그인 상태 확인

### 2. 로그 확인
- Supabase 대시보드 → **Logs** → **Auth Logs**에서 에러 확인
- 브라우저 개발자 도구 → Network 탭에서 `/api/auth/google` 호출 확인

## 자주 발생하는 에러

### 에러 1: "redirect_uri_mismatch"
**원인**: Google Cloud Console의 Authorized redirect URIs와 실제 콜백 URL이 다름
**해결**: Google Cloud Console에서 정확한 Supabase 콜백 URL 추가
```
https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback
```

### 에러 2: "404 Not Found"
**원인**:
1. Supabase Google Provider가 비활성화됨
2. Client ID/Secret 미입력
**해결**: Supabase 대시보드에서 Google Provider 활성화 및 설정

### 에러 3: "Invalid callback URL"
**원인**: Supabase URL Configuration의 Redirect URLs에 콜백 URL이 없음
**해결**:
```
https://www.politicianfinder.ai.kr/api/auth/google/callback
```
추가

### 에러 4: "Access blocked: This app's request is invalid"
**원인**: Google Cloud Console에서 OAuth consent screen 설정 미완료
**해결**:
1. Google Cloud Console → **OAuth consent screen**
2. User Type: **External** 선택
3. App information 입력
4. Scopes 추가: `email`, `profile`, `openid`
5. Test users 추가 (프로덕션 전)

## 체크리스트

설정 완료 후 아래 항목 확인:

- [ ] Supabase Google OAuth Provider 활성화 (ON)
- [ ] Google Client ID 입력 완료
- [ ] Google Client Secret 입력 완료
- [ ] Google Cloud Console Authorized redirect URIs 설정 완료
- [ ] Supabase Redirect URLs에 프로덕션 콜백 URL 추가
- [ ] Supabase Site URL 설정 완료
- [ ] Vercel 환경 변수 설정 완료
- [ ] Google OAuth consent screen 설정 완료
- [ ] 프로덕션 테스트 성공

## 관련 문서
- Supabase Auth Providers: https://supabase.com/docs/guides/auth/social-login/auth-google
- Google OAuth 2.0: https://developers.google.com/identity/protocols/oauth2
