# 사용자 작업 가이드 - OAuth 앱 등록

**작성일**: 2025-10-17
**프로젝트**: PoliticianFinder
**Phase**: Phase 2 - P2C1 소셜 로그인

---

## 📋 개요

P2C1 작업(다중 플랫폼 소셜 로그인)이 완료되었습니다. 이제 **사용자가 직접** 각 플랫폼에서 OAuth 앱을 등록하고 Supabase에 설정해야 합니다.

---

## ✅ 완료된 작업 (AI가 구현)

- ✅ 5개 플랫폼 로그인 버튼 컴포넌트 생성
- ✅ 통합 로그인 페이지 UI 구현
- ✅ OAuth 콜백 처리 로직
- ✅ 프로필 자동 생성 기능
- ✅ 에러 핸들링

---

## 🎯 사용자가 해야 할 작업

다음 5개 플랫폼에서 OAuth 앱을 등록하고, Supabase에 연동해야 합니다.

### 우선순위

**필수 (한국 사용자용)**:
1. 카카오 (Kakao)
2. 네이버 (Naver)

**추천 (글로벌 사용자용)**:
3. Google
4. 페이스북 (Facebook)
5. X (트위터)

---

## 📝 준비 사항

### 필요한 정보

1. **Supabase 프로젝트 정보**
   - Supabase 대시보드: https://supabase.com
   - 프로젝트 URL: `https://[YOUR_PROJECT_ID].supabase.co`
   - Callback URL: `https://[YOUR_PROJECT_ID].supabase.co/auth/v1/callback`

2. **사이트 URL**
   - 개발: `http://localhost:3000`
   - 프로덕션: `https://politician-finder.vercel.app` (배포 후)

---

## 🔧 상세 작업 가이드

---

### 1️⃣ Google OAuth 설정 (필수)

**소요 시간**: 약 10분
**난이도**: ⭐ 쉬움

#### Step 1: Google Cloud Console에서 프로젝트 생성

1. https://console.cloud.google.com 접속
2. 로그인 (Google 계정 필요)
3. 상단의 프로젝트 선택 > "새 프로젝트"
4. 프로젝트 이름: `PoliticianFinder` 입력
5. "만들기" 클릭

#### Step 2: OAuth 동의 화면 구성

1. 좌측 메뉴 > "API 및 서비스" > "OAuth 동의 화면"
2. 사용자 유형: "외부" 선택 > "만들기"
3. 앱 정보 입력:
   - 앱 이름: `PoliticianFinder`
   - 사용자 지원 이메일: (본인 이메일)
   - 개발자 연락처: (본인 이메일)
4. "저장 후 계속" 클릭
5. 범위: 기본값 유지 > "저장 후 계속"
6. 테스트 사용자: (본인 이메일 추가) > "저장 후 계속"

#### Step 3: OAuth 클라이언트 ID 생성

1. 좌측 메뉴 > "API 및 서비스" > "사용자 인증 정보"
2. 상단 "+ 사용자 인증 정보 만들기" > "OAuth 클라이언트 ID"
3. 애플리케이션 유형: "웹 애플리케이션"
4. 이름: `PoliticianFinder Web`
5. **승인된 자바스크립트 원본** 추가:
   ```
   http://localhost:3000
   https://politician-finder.vercel.app
   ```
6. **승인된 리디렉션 URI** 추가:
   ```
   https://[YOUR_SUPABASE_PROJECT_ID].supabase.co/auth/v1/callback
   http://localhost:54321/auth/v1/callback
   ```
7. "만들기" 클릭
8. **Client ID와 Client Secret 복사** (메모장에 저장)

#### Step 4: Supabase에 Google Provider 설정

1. https://supabase.com 로그인
2. 프로젝트 선택
3. 좌측 메뉴 > "Authentication" > "Providers"
4. "Google" 찾기 > "Enable" 토글
5. 입력:
   - **Client ID**: (Step 3에서 복사한 값)
   - **Client Secret**: (Step 3에서 복사한 값)
6. "Save" 클릭

#### ✅ 완료 확인

- 로컬에서 `npm run dev` 실행
- http://localhost:3000/login 접속
- "Google로 계속하기" 버튼 클릭
- Google 로그인 화면 나오면 성공!

---

### 2️⃣ 카카오 OAuth 설정 (한국 필수)

**소요 시간**: 약 15분
**난이도**: ⭐⭐ 보통

#### Step 1: Kakao Developers 앱 등록

1. https://developers.kakao.com 접속
2. 로그인 (카카오 계정 필요)
3. 상단 "내 애플리케이션" 클릭
4. "애플리케이션 추가하기" 클릭
5. 앱 정보 입력:
   - 앱 이름: `PoliticianFinder`
   - 사업자명: (본인 이름 또는 회사명)
6. "저장" 클릭

#### Step 2: 플랫폼 설정

1. 생성된 앱 클릭 > 좌측 "플랫폼"
2. "Web 플랫폼 등록" 클릭
3. 사이트 도메인 입력:
   ```
   http://localhost:3000
   https://[YOUR_SUPABASE_PROJECT_ID].supabase.co
   https://politician-finder.vercel.app
   ```
4. "저장" 클릭

#### Step 3: 카카오 로그인 활성화

1. 좌측 "카카오 로그인" 메뉴
2. "활성화 설정" > "ON" 으로 변경
3. "Redirect URI" 등록:
   ```
   https://[YOUR_SUPABASE_PROJECT_ID].supabase.co/auth/v1/callback
   http://localhost:54321/auth/v1/callback
   ```
4. "저장" 클릭

#### Step 4: 동의 항목 설정

1. 좌측 "동의 항목" 메뉴
2. 다음 항목을 **필수 동의**로 설정:
   - 닉네임
   - 카카오계정(이메일)
3. 다음 항목을 **선택 동의**로 설정:
   - 프로필 사진
4. "저장" 클릭

#### Step 5: 앱 키 확인

1. 좌측 "앱 설정" > "앱 키" 메뉴
2. 다음 키 복사 (메모장에 저장):
   - **REST API 키** (Client ID로 사용)
   - **JavaScript 키** (Client Secret으로 사용 가능)

#### Step 6: Supabase에 Kakao Provider 설정

1. https://supabase.com 로그인
2. 프로젝트 선택
3. 좌측 메뉴 > "Authentication" > "Providers"
4. "Kakao" 찾기 > "Enable" 토글
5. 입력:
   - **Client ID**: (REST API 키)
   - **Client Secret**: (JavaScript 키)
6. "Save" 클릭

#### ✅ 완료 확인

- 로컬에서 http://localhost:3000/login 접속
- "카카오로 계속하기" 버튼 클릭 (노란색)
- 카카오 로그인 화면 나오면 성공!

---

### 3️⃣ 네이버 OAuth 설정 (한국 필수)

**소요 시간**: 약 15분
**난이도**: ⭐⭐ 보통

#### Step 1: 네이버 개발자 센터 앱 등록

1. https://developers.naver.com/apps 접속
2. 로그인 (네이버 계정 필요)
3. "애플리케이션 등록" 클릭
4. 애플리케이션 정보 입력:
   - 애플리케이션 이름: `PoliticianFinder`
   - 사용 API: **"네이버 로그인"** 체크

#### Step 2: 서비스 환경 설정

1. 서비스 환경:
   - **PC 웹** 체크
2. 서비스 URL:
   ```
   http://localhost:3000
   ```
3. **네이버아이디로로그인 Callback URL**:
   ```
   https://[YOUR_SUPABASE_PROJECT_ID].supabase.co/auth/v1/callback
   ```

#### Step 3: 제공 정보 선택

다음 항목 선택:
- ✅ 회원이름
- ✅ 이메일 주소 (필수)
- ✅ 프로필 사진 (선택)

#### Step 4: 앱 등록 완료

1. "등록하기" 클릭
2. 생성된 앱 클릭
3. **Client ID**와 **Client Secret** 복사 (메모장에 저장)

#### Step 5: Supabase Custom OAuth Provider 설정

**중요**: Supabase는 네이버를 기본 지원하지 않으므로, Custom OAuth로 설정해야 합니다.

##### 방법 1: Supabase Dashboard 수동 설정 (추천)

1. Supabase 프로젝트 > "Authentication" > "Providers"
2. 아래로 스크롤하여 "Add a new provider" 찾기
3. 또는 "Custom" OAuth provider 사용
4. 네이버 OAuth 2.0 엔드포인트 입력:
   - **Authorization URL**: `https://nid.naver.com/oauth2.0/authorize`
   - **Token URL**: `https://nid.naver.com/oauth2.0/token`
   - **User Info URL**: `https://openapi.naver.com/v1/nid/me`
   - **Client ID**: (네이버 Client ID)
   - **Client Secret**: (네이버 Client Secret)

##### 방법 2: 코드 수정 (대안)

`NaverLoginButton.tsx` 컴포넌트에서 직접 네이버 OAuth URL 호출:

```typescript
const handleNaverLogin = () => {
  const clientId = 'YOUR_NAVER_CLIENT_ID'
  const redirectUri = encodeURIComponent('https://[YOUR_SUPABASE_PROJECT_ID].supabase.co/auth/v1/callback')
  const state = Math.random().toString(36).substring(7)

  window.location.href = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}`
}
```

#### ✅ 완료 확인

- 로컬에서 http://localhost:3000/login 접속
- "네이버로 계속하기" 버튼 클릭 (초록색)
- 네이버 로그인 화면 나오면 성공!

---

### 4️⃣ 페이스북 OAuth 설정 (선택)

**소요 시간**: 약 15분
**난이도**: ⭐⭐ 보통

#### Step 1: Meta for Developers 앱 생성

1. https://developers.facebook.com 접속
2. 로그인 (Facebook 계정 필요)
3. 상단 "내 앱" > "앱 만들기"
4. 앱 유형: "소비자" 선택 > "다음"
5. 앱 이름: `PoliticianFinder` 입력
6. 앱 연락처 이메일: (본인 이메일)
7. "앱 만들기" 클릭

#### Step 2: Facebook 로그인 제품 추가

1. 대시보드에서 "제품 추가" 찾기
2. "Facebook 로그인" > "설정" 클릭
3. 플랫폼: "웹" 선택
4. 사이트 URL: `https://politician-finder.vercel.app`
5. "저장" > "계속"

#### Step 3: 설정

1. 좌측 메뉴 > "Facebook 로그인" > "설정"
2. **유효한 OAuth 리디렉션 URI** 입력:
   ```
   https://[YOUR_SUPABASE_PROJECT_ID].supabase.co/auth/v1/callback
   http://localhost:54321/auth/v1/callback
   ```
3. "변경 내용 저장" 클릭

#### Step 4: 앱 ID 확인

1. 좌측 메뉴 > "설정" > "기본 설정"
2. **앱 ID** 복사 (Client ID)
3. **앱 시크릿 코드** 표시 후 복사 (Client Secret)

#### Step 5: Supabase에 Facebook Provider 설정

1. Supabase > "Authentication" > "Providers"
2. "Facebook" > "Enable" 토글
3. 입력:
   - **Facebook Client ID**: (앱 ID)
   - **Facebook Secret**: (앱 시크릿 코드)
4. "Save" 클릭

#### ✅ 완료 확인

- "Facebook으로 계속하기" 버튼 클릭 (파란색)
- Facebook 로그인 화면 나오면 성공!

---

### 5️⃣ X (트위터) OAuth 설정 (선택)

**소요 시간**: 약 20분
**난이도**: ⭐⭐⭐ 어려움 (승인 필요)

#### Step 1: X Developer Portal 가입

1. https://developer.x.com 접속
2. 로그인 (X 계정 필요)
3. "Sign up for Free Account" (무료 계정 신청)
4. 개발자 정보 입력
5. 이용 약관 동의

#### Step 2: 프로젝트 및 앱 생성

1. "Create Project" 클릭
2. 프로젝트 이름: `PoliticianFinder`
3. Use case: "Making a bot" 선택
4. Project description 입력
5. "Create App" 클릭
6. App name: `PoliticianFinder`

#### Step 3: OAuth 2.0 설정

1. 생성된 앱 클릭
2. "Keys and tokens" 탭
3. **API Key**와 **API Secret Key** 복사 (메모장에 저장)
4. "User authentication settings" > "Set up" 클릭
5. App permissions: "Read" 선택
6. Type of App: "Web App, Automated App or Bot"
7. App info 입력:
   - **Callback URI**: `https://[YOUR_SUPABASE_PROJECT_ID].supabase.co/auth/v1/callback`
   - **Website URL**: `https://politician-finder.vercel.app`
8. "Save" 클릭

#### Step 4: Supabase에 Twitter Provider 설정

1. Supabase > "Authentication" > "Providers"
2. "Twitter" > "Enable" 토글
3. 입력:
   - **API Key**: (Client ID)
   - **API Secret Key**: (Client Secret)
4. "Save" 클릭

#### ✅ 완료 확인

- "X로 계속하기" 버튼 클릭 (검은색)
- X 로그인 화면 나오면 성공!

---

## 🚀 환경 변수 설정

모든 OAuth 앱 등록 후, 환경 변수를 설정하세요.

### 로컬 개발 (.env.local)

프론트엔드 폴더에 `.env.local` 파일 생성:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Google OAuth (선택 - Supabase가 처리)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Kakao OAuth (선택 - Supabase가 처리)
NEXT_PUBLIC_KAKAO_CLIENT_ID=your_kakao_rest_api_key
KAKAO_CLIENT_SECRET=your_kakao_javascript_key

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Vercel 배포 (Production)

Vercel 대시보드 > Settings > Environment Variables에 추가:

```
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SITE_URL=https://politician-finder.vercel.app
```

---

## 🧪 테스트 방법

### 1. 로컬 테스트

```bash
cd frontend
npm run dev
```

브라우저에서 http://localhost:3000/login 접속

각 버튼 클릭하여 로그인 플로우 테스트:
- ✅ Google로 계속하기
- ✅ 카카오로 계속하기
- ✅ 네이버로 계속하기
- ✅ Facebook으로 계속하기
- ✅ X로 계속하기

### 2. 프로필 확인

로그인 후:
1. Supabase Dashboard > Authentication > Users에서 사용자 생성 확인
2. Database > profiles 테이블에서 프로필 자동 생성 확인

---

## ❗ 트러블슈팅

### 문제 1: "Invalid Redirect URI" 오류

**원인**: OAuth 앱에 Callback URL이 등록되지 않음

**해결**:
1. 각 플랫폼 Developer Console에서 Redirect URI 재확인
2. 정확히 `https://[YOUR_SUPABASE_PROJECT_ID].supabase.co/auth/v1/callback` 등록

### 문제 2: 네이버 로그인 작동 안 함

**원인**: Supabase가 네이버를 기본 지원하지 않음

**해결**:
1. Custom OAuth Provider 설정 필요
2. 또는 네이버 OAuth를 직접 구현

### 문제 3: 로그인 후 프로필이 생성되지 않음

**원인**: Callback 라우트에서 에러 발생

**해결**:
1. `frontend/src/app/auth/callback/route.ts` 파일 확인
2. Supabase 콘솔에서 에러 로그 확인

### 문제 4: CORS 에러

**원인**: Supabase에서 사이트 URL이 허용되지 않음

**해결**:
1. Supabase > Authentication > URL Configuration
2. Site URL 및 Redirect URLs 추가

---

## 📚 참고 자료

### 공식 문서

- **Google OAuth**: https://developers.google.com/identity/protocols/oauth2
- **Kakao OAuth**: https://developers.kakao.com/docs/latest/ko/kakaologin/common
- **Naver OAuth**: https://developers.naver.com/docs/login/overview/overview.md
- **Facebook OAuth**: https://developers.facebook.com/docs/facebook-login
- **X OAuth**: https://developer.x.com/en/docs/authentication/oauth-2-0
- **Supabase Auth**: https://supabase.com/docs/guides/auth

### 프로젝트 파일

- 작업지시서: `G:\내 드라이브\Developement\PoliticianFinder\13DGC-AODM_Grid\tasks\P2C1.md`
- 프로젝트 그리드: `G:\내 드라이브\Developement\PoliticianFinder\13DGC-AODM_Grid\project_grid_v2.0_supabase.xlsx`

---

## ✅ 완료 체크리스트

작업 완료 후 체크하세요:

### Google OAuth
- [ ] Google Cloud Console에서 OAuth 클라이언트 생성
- [ ] Client ID/Secret 복사
- [ ] Supabase에 Google Provider 활성화
- [ ] 로컬 테스트 완료

### Kakao OAuth
- [ ] Kakao Developers에서 앱 등록
- [ ] 플랫폼 및 Redirect URI 설정
- [ ] REST API 키 복사
- [ ] Supabase에 Kakao Provider 활성화
- [ ] 로컬 테스트 완료

### Naver OAuth
- [ ] 네이버 개발자 센터에서 앱 등록
- [ ] Callback URL 설정
- [ ] Client ID/Secret 복사
- [ ] Supabase Custom OAuth 설정
- [ ] 로컬 테스트 완료

### Facebook OAuth (선택)
- [ ] Meta for Developers에서 앱 생성
- [ ] Facebook 로그인 제품 추가
- [ ] 앱 ID/시크릿 복사
- [ ] Supabase에 Facebook Provider 활성화
- [ ] 로컬 테스트 완료

### X OAuth (선택)
- [ ] X Developer Portal에서 앱 생성
- [ ] OAuth 2.0 설정
- [ ] API Key/Secret 복사
- [ ] Supabase에 Twitter Provider 활성화
- [ ] 로컬 테스트 완료

### 최종 확인
- [ ] 모든 플랫폼 로그인 테스트 완료
- [ ] 프로필 자동 생성 확인
- [ ] 환경 변수 설정 완료
- [ ] Vercel 배포 환경 변수 설정

---

## 💬 문의

작업 중 문제가 발생하면:
1. 트러블슈팅 섹션 확인
2. 각 플랫폼 공식 문서 참조
3. Supabase 콘솔에서 에러 로그 확인

---

**작성**: AI Agent (Claude Code)
**마지막 업데이트**: 2025-10-17
**버전**: 1.0