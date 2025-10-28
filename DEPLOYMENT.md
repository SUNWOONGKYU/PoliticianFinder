# Vercel 배포 가이드

이 문서는 PoliticianFinder 프론트엔드를 Vercel에 배포하는 방법을 설명합니다.

## 목차
1. [사전 준비사항](#사전-준비사항)
2. [Vercel 프로젝트 생성](#vercel-프로젝트-생성)
3. [환경 변수 설정](#환경-변수-설정)
4. [배포 실행](#배포-실행)
5. [도메인 설정](#도메인-설정-선택사항)
6. [트러블슈팅](#트러블슈팅)

---

## 사전 준비사항

### 1. 필요한 계정
- GitHub 계정 (코드 저장소)
- Vercel 계정 (https://vercel.com)
- Supabase 계정 및 프로젝트 (인증 및 데이터베이스)

### 2. 로컬 빌드 테스트
배포 전에 반드시 로컬에서 빌드가 성공하는지 확인하세요:

```bash
cd frontend
npm install
npm run build
npm run start
```

빌드 성공 시 `.next` 디렉토리가 생성됩니다.

---

## Vercel 프로젝트 생성

### 방법 1: Vercel 대시보드 사용 (권장)

1. **Vercel 로그인**
   - https://vercel.com 접속
   - GitHub 계정으로 로그인

2. **새 프로젝트 생성**
   - "Add New..." > "Project" 클릭
   - GitHub 저장소 연결 및 선택
   - Import Git Repository에서 PoliticianFinder 저장소 선택

3. **프로젝트 설정**
   - Framework Preset: `Next.js` (자동 감지됨)
   - Root Directory: `frontend`
   - Build Command: `npm run build` (자동 설정)
   - Output Directory: `.next` (자동 설정)
   - Install Command: `npm install` (자동 설정)

4. **환경 변수 설정** (다음 섹션 참조)

5. **Deploy 버튼 클릭**

### 방법 2: Vercel CLI 사용

```bash
# Vercel CLI 설치
npm install -g vercel

# 프로젝트 디렉토리로 이동
cd frontend

# Vercel 로그인
vercel login

# 배포 (첫 배포 시 프로젝트 설정 진행)
vercel
```

---

## 환경 변수 설정

### 필수 환경 변수

Vercel 대시보드에서 다음 환경 변수를 설정하세요:

| 환경 변수 | 설명 | 예시 |
|-----------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anonymous Key | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` |

### 선택적 환경 변수

| 환경 변수 | 설명 | 예시 |
|-----------|------|------|
| `NEXT_PUBLIC_API_URL` | 백엔드 API URL (별도 API 서버가 있는 경우) | `https://api.yourdomain.com` |

### 환경 변수 설정 방법

#### 1. Vercel 대시보드에서 설정

1. Vercel 대시보드 > 프로젝트 선택
2. "Settings" 탭 클릭
3. "Environment Variables" 메뉴 선택
4. 각 환경 변수 추가:
   - Key: 변수 이름 입력
   - Value: 변수 값 입력
   - Environment: Production, Preview, Development 선택
     - **Production**: 프로덕션 배포에 사용
     - **Preview**: PR 및 브랜치 배포에 사용
     - **Development**: 로컬 개발에 사용 (선택사항)

#### 2. Vercel CLI로 설정

```bash
# Production 환경 변수 설정
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

# Preview 환경 변수 설정
vercel env add NEXT_PUBLIC_SUPABASE_URL preview
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
```

### Supabase 환경 변수 찾기

1. Supabase 대시보드 접속 (https://supabase.com)
2. 프로젝트 선택
3. Settings > API 메뉴
4. Project URL과 Project API keys 확인
   - URL: `NEXT_PUBLIC_SUPABASE_URL`에 사용
   - anon/public key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`에 사용

---

## 배포 실행

### 자동 배포 (권장)

GitHub와 연동된 경우, 자동 배포가 활성화됩니다:

- **Production 배포**: `main` 또는 `master` 브랜치에 push
- **Preview 배포**: PR 생성 또는 다른 브랜치에 push

### 수동 배포

#### Vercel 대시보드
1. 프로젝트 대시보드 > "Deployments" 탭
2. "Redeploy" 버튼 클릭

#### Vercel CLI
```bash
# Production 배포
vercel --prod

# Preview 배포
vercel
```

---

## 도메인 설정 (선택사항)

### 1. 커스텀 도메인 추가

1. Vercel 대시보드 > 프로젝트 > "Settings" > "Domains"
2. "Add Domain" 버튼 클릭
3. 도메인 입력 (예: `politicianfinder.com`)
4. DNS 설정 안내에 따라 도메인 제공업체에서 DNS 레코드 추가

### 2. DNS 레코드 설정

도메인 제공업체(예: Cloudflare, Namecheap)에서:

- **A 레코드** 또는 **CNAME 레코드** 추가
- Vercel이 제공하는 값으로 설정

### 3. HTTPS 자동 설정

Vercel은 Let's Encrypt를 사용하여 자동으로 SSL 인증서를 발급합니다.
도메인 설정 후 몇 분 내에 HTTPS가 활성화됩니다.

### 4. Supabase Redirect URL 업데이트

커스텀 도메인을 사용하는 경우, Supabase에서 인증 리다이렉트 URL을 업데이트해야 합니다:

1. Supabase 대시보드 > Authentication > URL Configuration
2. Site URL: `https://yourdomain.com`
3. Redirect URLs에 추가:
   - `https://yourdomain.com/auth/callback`
   - `https://yourdomain.com/**` (와일드카드)

---

## 배포 후 확인사항

### 1. 배포 상태 확인
- Vercel 대시보드에서 배포 로그 확인
- 빌드 성공 여부 체크

### 2. 기능 테스트
- [ ] 페이지 로딩 확인
- [ ] Google OAuth 로그인 테스트
- [ ] 정치인 목록 조회
- [ ] 페이지네이션 동작
- [ ] 정렬 기능
- [ ] 반응형 디자인 (모바일/데스크톱)

### 3. 성능 확인
- Lighthouse 점수 확인
- Core Web Vitals 확인
- 이미지 최적화 확인

---

## 트러블슈팅

### 빌드 실패

#### 문제: 빌드 중 타입 에러 발생
```
Type error: ...
```

**해결 방법:**
```bash
# 로컬에서 타입 체크
npm run build

# TypeScript 에러 수정
# 또는 next.config.ts에서 일시적으로 타입 체크 비활성화 (권장하지 않음)
```

#### 문제: 의존성 설치 실패
```
npm ERR! code ERESOLVE
```

**해결 방법:**
```bash
# package-lock.json 삭제 후 재설치
rm package-lock.json
npm install

# 또는 Vercel 설정에서 Install Command 변경
# npm install --legacy-peer-deps
```

### 환경 변수 문제

#### 문제: 환경 변수가 undefined
```
Error: supabaseUrl is required
```

**해결 방법:**
1. Vercel 대시보드에서 환경 변수 확인
2. `NEXT_PUBLIC_` 접두사 확인 (클라이언트 사이드에서 사용하려면 필수)
3. 환경 변수 저장 후 재배포 필요
4. Redeploy 버튼 클릭

#### 문제: 로컬에서는 작동하는데 Vercel에서 안됨
- `.env.local` 파일은 Vercel에 업로드되지 않음
- Vercel 대시보드에서 환경 변수를 직접 설정해야 함

### Google OAuth 문제

#### 문제: Google 로그인 후 리다이렉트 실패
```
Error: Invalid redirect URI
```

**해결 방법:**
1. Supabase 대시보드 > Authentication > URL Configuration
2. Redirect URLs에 Vercel URL 추가:
   - `https://your-project.vercel.app/auth/callback`
   - `https://your-project.vercel.app/**`
3. Google Cloud Console에서도 승인된 리디렉션 URI 추가

### 이미지 최적화 문제

#### 문제: 외부 이미지 로딩 실패
```
Error: Invalid src prop
```

**해결 방법:**
- `next.config.ts`의 `remotePatterns` 설정 확인
- 필요한 도메인이 포함되어 있는지 확인

### CORS 에러

#### 문제: API 호출 시 CORS 에러
```
Access to fetch has been blocked by CORS policy
```

**해결 방법:**
1. 백엔드 API에서 Vercel 도메인을 CORS 허용 목록에 추가
2. Supabase는 기본적으로 모든 도메인 허용 (별도 설정 불필요)

---

## 성능 최적화

### 1. 이미지 최적화
- Next.js Image 컴포넌트 사용 (`next/image`)
- 적절한 이미지 크기 및 포맷 설정
- Lazy loading 활용

### 2. 번들 크기 최적화
```bash
# 번들 분석
npm install -g @next/bundle-analyzer

# next.config.ts에 추가
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig)

# 분석 실행
ANALYZE=true npm run build
```

### 3. 캐싱 설정
- Vercel은 자동으로 정적 파일을 캐싱
- `vercel.json`에서 추가 헤더 설정 가능

### 4. Edge Functions (선택사항)
- API 라우트를 Edge Runtime으로 변경하여 전 세계에서 빠른 응답 제공

---

## 모니터링 및 분석

### Vercel Analytics
1. Vercel 대시보드 > 프로젝트 > "Analytics" 탭
2. Core Web Vitals 모니터링
3. 실시간 트래픽 확인

### Vercel Speed Insights
```bash
# 패키지 설치
npm install @vercel/speed-insights

# app/layout.tsx에 추가
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  )
}
```

---

## 롤백 및 버전 관리

### 이전 버전으로 롤백
1. Vercel 대시보드 > "Deployments" 탭
2. 이전 배포 선택
3. "Promote to Production" 버튼 클릭

### 특정 커밋으로 배포
```bash
# 특정 브랜치 배포
vercel --prod --git-ref <branch-name>

# 특정 커밋 배포 (수동)
git checkout <commit-hash>
vercel --prod
```

---

## 보안 체크리스트

배포 전 확인사항:

- [ ] 환경 변수가 Vercel 대시보드에 안전하게 저장됨
- [ ] `.env.local` 파일이 `.gitignore`에 포함됨
- [ ] Supabase RLS (Row Level Security) 활성화
- [ ] HTTPS 강제 적용 (Vercel 자동 설정)
- [ ] API 키 및 시크릿이 코드에 하드코딩되지 않음
- [ ] CORS 설정이 적절함
- [ ] CSP (Content Security Policy) 헤더 설정 (선택사항)

---

## 추가 리소스

- [Vercel 공식 문서](https://vercel.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/app/building-your-application/deploying)
- [Supabase 인증 설정](https://supabase.com/docs/guides/auth)
- [Vercel CLI 문서](https://vercel.com/docs/cli)

---

## 지원 및 문의

배포 중 문제가 발생하면:
1. Vercel 대시보드에서 빌드 로그 확인
2. GitHub Issues에 문제 보고
3. Vercel 커뮤니티 포럼 활용

---

**작성일**: 2025-10-17
**버전**: 1.0
**최종 수정**: Initial Release
