# Google OAuth 설정 가이드

**작성일**: 2025-11-18
**상태**: 🔴 **설정 필요**

---

## ⚠️ 현재 상태

`.env.local` 파일에 플레이스홀더 값이 설정되어 있어 Google 로그인이 작동하지 않습니다:

```bash
GOOGLE_OAUTH_CLIENT_ID=your_google_oauth_client_id  # ← 실제 값 필요!
GOOGLE_OAUTH_CLIENT_SECRET=your_google_oauth_client_secret  # ← 실제 값 필요!
```

---

## 🚀 설정 방법

### 1단계: Google Cloud Console에서 OAuth 2.0 설정

#### 1.1 Google Cloud Console 접속
1. https://console.cloud.google.com/ 접속
2. 로그인 (Google 계정 필요)

#### 1.2 프로젝트 생성 또는 선택
1. 상단 드롭다운에서 프로젝트 선택 또는 "새 프로젝트" 생성
2. 프로젝트 이름: `PoliticianFinder` (또는 원하는 이름)

#### 1.3 OAuth 동의 화면 구성
1. 왼쪽 메뉴 → **APIs & Services** → **OAuth consent screen**
2. User Type 선택:
   - **External** 선택 (일반 사용자용)
   - "만들기" 클릭
3. 앱 정보 입력:
   ```
   앱 이름: PoliticianFinder
   사용자 지원 이메일: [본인 이메일]
   앱 로고: (선택사항)
   앱 도메인:
     - 애플리케이션 홈페이지: https://politician-finder.vercel.app
     - 개인정보처리방침: https://politician-finder.vercel.app/privacy
     - 서비스 약관: https://politician-finder.vercel.app/terms
   승인된 도메인:
     - politician-finder.vercel.app
     - localhost (개발용)
   개발자 연락처 정보: [본인 이메일]
   ```
4. "저장 후 계속" 클릭

5. 범위(Scopes) 설정:
   - "범위 추가 또는 삭제" 클릭
   - 다음 범위 선택:
     - `userinfo.email`
     - `userinfo.profile`
     - `openid`
   - "업데이트" → "저장 후 계속"

6. 테스트 사용자 추가 (개발 중):
   - "+ ADD USERS" 클릭
   - 테스트용 Google 계정 이메일 추가
   - "저장 후 계속"

7. 요약 확인 → "대시보드로 돌아가기"

#### 1.4 OAuth 2.0 Client ID 생성
1. 왼쪽 메뉴 → **Credentials** (사용자 인증 정보)
2. 상단 "+ CREATE CREDENTIALS" 클릭
3. "OAuth client ID" 선택
4. 애플리케이션 유형: **Web application**
5. 이름: `PoliticianFinder Web Client`
6. **승인된 자바스크립트 원본** 추가:
   ```
   http://localhost:3001
   https://politician-finder.vercel.app
   ```
7. **승인된 리디렉션 URI** 추가:
   ```
   http://localhost:3001/api/auth/google/callback
   https://politician-finder.vercel.app/api/auth/google/callback
   ```
8. "만들기" 클릭

9. **Client ID**와 **Client Secret** 복사
   - ⚠️ 이 값들을 안전하게 보관하세요!

---

### 2단계: Supabase에 Google Provider 설정

#### 2.1 Supabase Dashboard 접속
1. https://supabase.com/dashboard 접속
2. 프로젝트 선택: `ooddlafwdpzgxfefgsrx`

#### 2.2 Google Provider 활성화
1. 왼쪽 메뉴 → **Authentication** → **Providers**
2. **Google** 찾기
3. **Enabled** 토글 ON
4. 정보 입력:
   ```
   Client ID: [1단계에서 복사한 Client ID]
   Client Secret: [1단계에서 복사한 Client Secret]
   ```
5. **Redirect URL** 확인:
   ```
   https://ooddlafwdpzgxfefgsrx.supabase.co/auth/v1/callback
   ```
   → 이 URL을 Google Cloud Console의 "승인된 리디렉션 URI"에도 추가해야 함!

6. "Save" 클릭

#### 2.3 Google Cloud Console에 Supabase Redirect URL 추가
1. Google Cloud Console → Credentials로 돌아가기
2. 생성한 OAuth 2.0 Client ID 클릭
3. "승인된 리디렉션 URI"에 추가:
   ```
   https://ooddlafwdpzgxfefgsrx.supabase.co/auth/v1/callback
   ```
4. "저장" 클릭

---

### 3단계: 환경 변수 업데이트

#### 3.1 `.env.local` 파일 수정
```bash
cd 1_Frontend

# .env.local 파일 편집
code .env.local  # 또는 원하는 에디터
```

#### 3.2 Google OAuth 환경 변수 업데이트
```bash
# Google OAuth (실제 값으로 변경!)
GOOGLE_OAUTH_CLIENT_ID=[1단계에서 복사한 Client ID]
GOOGLE_OAUTH_CLIENT_SECRET=[1단계에서 복사한 Client Secret]

# Google OAuth 활성화
NEXT_PUBLIC_ENABLE_GOOGLE_OAUTH=true
```

**예시**:
```bash
GOOGLE_OAUTH_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=GOCSPX-abcd1234efgh5678ijkl
NEXT_PUBLIC_ENABLE_GOOGLE_OAUTH=true
```

#### 3.3 개발 서버 재시작
```bash
npm run dev
```

---

### 4단계: 테스트

#### 4.1 로컬 테스트
1. http://localhost:3001 접속
2. "Google로 로그인" 버튼 클릭
3. Google 로그인 화면으로 리디렉션 확인
4. 테스트 사용자 계정으로 로그인
5. 홈페이지로 리디렉션 및 로그인 상태 확인

#### 4.2 프로덕션 테스트 (Vercel)
1. https://politician-finder.vercel.app 접속
2. "Google로 로그인" 버튼 클릭
3. 정상 작동 확인

---

## 🔒 보안 주의사항

### ⚠️ 절대 Git에 커밋하지 마세요!
```bash
# .env.local 파일은 .gitignore에 포함되어 있어야 합니다
echo ".env.local" >> .gitignore
```

### ✅ Vercel 환경 변수 설정
1. Vercel Dashboard → 프로젝트 선택
2. **Settings** → **Environment Variables**
3. 추가:
   ```
   GOOGLE_OAUTH_CLIENT_ID = [실제 Client ID]
   GOOGLE_OAUTH_CLIENT_SECRET = [실제 Client Secret]
   NEXT_PUBLIC_ENABLE_GOOGLE_OAUTH = true
   ```
4. **Redeploy** 필수!

---

## 📝 추가 설정 (선택사항)

### 프로덕션 배포 시
1. Google Cloud Console에서 "OAuth 동의 화면" 편집
2. **Publishing status**를 "In production"으로 변경
3. Google 검토 제출 (선택사항, 100명 이상 사용자 시 필요)

---

## ❓ 문제 해결

### 오류: "redirect_uri_mismatch"
→ Google Cloud Console의 "승인된 리디렉션 URI"에 정확한 URL이 등록되어 있는지 확인

### 오류: "Access blocked: This app's request is invalid"
→ OAuth 동의 화면이 제대로 설정되지 않음. 1.3 단계 재확인

### 오류: "unauthorized_client"
→ Client ID 또는 Client Secret이 잘못됨. `.env.local` 값 재확인

---

## ✅ 완료 체크리스트

- [ ] Google Cloud Console에서 OAuth 2.0 Client ID 생성
- [ ] Supabase에서 Google Provider 활성화
- [ ] `.env.local`에 실제 Client ID/Secret 설정
- [ ] 개발 서버 재시작
- [ ] 로컬 테스트 성공
- [ ] Vercel 환경 변수 설정
- [ ] 프로덕션 배포 및 테스트

---

**작성자**: Claude Code
**참고**: Supabase Google OAuth 공식 문서 - https://supabase.com/docs/guides/auth/social-login/auth-google
