# 배포 가이드 (Deployment Guide)

## 환경별 설정

### 1. 로컬 개발 환경
- 파일: `.env.local`
- Site URL: `http://localhost:3000`

### 2. 프로덕션 환경 (Vercel)
- Vercel Dashboard에서 환경 변수 설정
- Site URL: `https://politician-finder.vercel.app` (실제 도메인으로 변경)

---

## Vercel 배포 설정

### 1. Vercel 환경 변수 설정

Vercel Dashboard > Settings > Environment Variables에서 다음 환경 변수를 추가:

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://ooddlafwdpzgxfefgsrx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 프로덕션 URL (⭐ 중요: 실제 도메인으로 변경)
NEXT_PUBLIC_SITE_URL=https://politician-finder.vercel.app
NEXT_PUBLIC_API_URL=https://politician-finder.vercel.app/api

# 환경
NEXT_PUBLIC_ENV=production

# JWT 설정
JWT_SECRET=your_production_jwt_secret
JWT_ACCESS_TOKEN_EXPIRY=3600
JWT_REFRESH_TOKEN_EXPIRY=604800

# 기능 플래그
NEXT_PUBLIC_ENABLE_GOOGLE_OAUTH=true
NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION=true
NEXT_PUBLIC_ENABLE_SIGNUP=true

# Google OAuth (프로덕션용 키)
GOOGLE_OAUTH_CLIENT_ID=your_production_google_oauth_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_production_google_oauth_client_secret

# 토스페이먼츠 (프로덕션용 키)
NEXT_PUBLIC_TOSS_CLIENT_KEY=live_ck_...
TOSS_SECRET_KEY=live_sk_...
```

---

## Supabase 설정

### 1. Redirect URLs 설정

Supabase Dashboard > Authentication > URL Configuration:

**Site URL:**
```
https://politician-finder.vercel.app
```

**Redirect URLs (여러 개 추가 가능):**
```
http://localhost:3000/auth/callback
https://politician-finder.vercel.app/auth/callback
```

### 2. Email Templates 설정

Supabase Dashboard > Authentication > Email Templates:

**Confirm signup** 템플릿에서 Redirect URL 확인:
```
{{ .ConfirmationURL }}
```

이 URL이 자동으로 올바른 환경의 `/auth/callback`으로 연결됩니다.

---

## 배포 단계별 가이드

### Step 1: 코드 준비
```bash
# 1. 최신 코드 커밋
git add .
git commit -m "chore: 프로덕션 배포 준비"

# 2. 메인 브랜치로 푸시
git push origin main
```

### Step 2: Vercel 프로젝트 생성
```bash
# Vercel CLI 설치 (처음 한 번만)
npm i -g vercel

# Vercel 로그인
vercel login

# 프로젝트 배포
cd 1_Frontend
vercel
```

### Step 3: 환경 변수 설정
1. Vercel Dashboard > 프로젝트 선택
2. Settings > Environment Variables
3. 위의 환경 변수들을 모두 추가
4. Production, Preview, Development 환경 선택

### Step 4: Supabase 설정 업데이트
1. Vercel 배포 후 URL 확인 (예: `https://politician-finder.vercel.app`)
2. Supabase Dashboard에서 Redirect URLs에 추가
3. Site URL을 프로덕션 URL로 변경

### Step 5: 재배포
```bash
# 환경 변수 변경 후 재배포
vercel --prod
```

---

## 도메인 설정 (선택 사항)

### 커스텀 도메인 연결

1. **Vercel에서 도메인 추가**
   - Vercel Dashboard > 프로젝트 > Settings > Domains
   - `politicianfinder.com` 추가

2. **DNS 설정**
   - 도메인 등록 업체(가비아, 후이즈 등)에서 DNS 레코드 추가:
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   ```

3. **환경 변수 업데이트**
   ```env
   NEXT_PUBLIC_SITE_URL=https://politicianfinder.com
   ```

4. **Supabase Redirect URLs 업데이트**
   ```
   https://politicianfinder.com/auth/callback
   ```

---

## 이메일 인증 테스트

### 로컬 환경 테스트
1. 회원가입: `http://localhost:3000/auth/signup`
2. 이메일 확인: 인증 링크가 `http://localhost:3000/auth/callback`로 연결
3. 로그인: 인증 완료 후 로그인 가능

### 프로덕션 환경 테스트
1. 회원가입: `https://politician-finder.vercel.app/auth/signup`
2. 이메일 확인: 인증 링크가 `https://politician-finder.vercel.app/auth/callback`로 연결
3. 로그인: 인증 완료 후 로그인 가능

---

## 트러블슈팅

### 문제: 이메일 인증 링크가 localhost로 연결됨
**원인**: Supabase Site URL이 localhost로 설정됨
**해결**: Supabase Dashboard에서 Site URL을 프로덕션 URL로 변경

### 문제: 이메일 인증 링크 클릭 시 404
**원인**: Supabase Redirect URLs에 프로덕션 URL이 없음
**해결**: Redirect URLs에 `https://your-domain.com/auth/callback` 추가

### 문제: 환경 변수가 적용되지 않음
**원인**: Vercel에서 환경 변수 변경 후 재배포 필요
**해결**: `vercel --prod` 명령으로 재배포

---

## 체크리스트

배포 전 확인사항:

- [ ] Vercel 프로젝트 생성 완료
- [ ] Vercel 환경 변수 설정 완료 (특히 `NEXT_PUBLIC_SITE_URL`)
- [ ] Supabase Site URL 설정 (프로덕션 URL)
- [ ] Supabase Redirect URLs 추가 (프로덕션 + 로컬)
- [ ] Google OAuth Redirect URI 설정 (프로덕션 URL)
- [ ] 프로덕션 빌드 테스트 (`npm run build`)
- [ ] 이메일 인증 테스트 (프로덕션 환경)
- [ ] 로그인/로그아웃 테스트
- [ ] 미인증 사용자 차단 테스트

---

## 참고 자료

- [Vercel 배포 가이드](https://vercel.com/docs/deployments)
- [Supabase Auth 설정](https://supabase.com/docs/guides/auth)
- [Next.js 환경 변수](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
