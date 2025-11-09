# PoliticianFinder Frontend Setup Guide

## 📋 목차
1. [프로젝트 구조](#프로젝트-구조)
2. [개발 환경 설정](#개발-환경-설정)
3. [Google OAuth 설정](#google-oauth-설정)
4. [Supabase 연결](#supabase-연결)
5. [개발 서버 실행](#개발-서버-실행)
6. [배포](#배포)

---

## 프로젝트 구조

```
1_Frontend/
├── src/
│   ├── app/
│   │   ├── api/              # 백엔드 API 라우트
│   │   │   ├── auth/         # 인증 API
│   │   │   ├── politicians/  # 정치인 API
│   │   │   └── ...
│   │   ├── login/            # 로그인 페이지
│   │   ├── signup/           # 회원가입 페이지
│   │   ├── politicians/      # 정치인 목록 페이지
│   │   └── ...
│   ├── components/           # 재사용 가능한 컴포넌트
│   ├── lib/                  # 유틸리티 함수
│   └── styles/              # 스타일시트
├── docs/                     # 문서
│   ├── GOOGLE_AUTH_SETUP.md # Google OAuth 설정
│   └── SETUP_GUIDE.md       # 이 파일
├── .env.example             # 환경 변수 템플릿
├── .env.local               # 환경 변수 (개발용, .gitignore 등록)
├── package.json             # 의존성
├── tsconfig.json            # TypeScript 설정
└── tailwind.config.js       # Tailwind CSS 설정
```

---

## 개발 환경 설정

### 1. 저장소 클론
```bash
git clone https://github.com/your-repo/politician-finder.git
cd politician-finder/1_Frontend
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정

#### 단계 1: .env.example 복사
```bash
cp .env.example .env.local
```

#### 단계 2: .env.local 파일 수정
```bash
# Supabase 정보 (필수)
NEXT_PUBLIC_SUPABASE_URL=https://ooddlafwdpzgxfefgsrx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>

# Google OAuth (선택사항, Google 로그인 필요 시)
GOOGLE_OAUTH_CLIENT_ID=<your-client-id>
GOOGLE_OAUTH_CLIENT_SECRET=<your-client-secret>

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3002
```

---

## Google OAuth 설정

### 📘 상세 가이드: [GOOGLE_AUTH_SETUP.md](./GOOGLE_AUTH_SETUP.md)

### 빠른 설정 (3단계)

#### 단계 1: Google Cloud Console에서 OAuth 설정
1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. API 및 서비스 > 사용자 인증 정보 > OAuth 클라이언트 ID 생성
4. 웹 애플리케이션 선택
5. 리디렉션 URI 추가:
   ```
   https://ooddlafwdpzgxfefgsrx.supabase.co/auth/v1/callback
   http://localhost:3002/api/auth/google/callback
   ```
6. 클라이언트 ID와 비밀번호 복사

#### 단계 2: Supabase Dashboard 설정
1. [Supabase Dashboard](https://app.supabase.com) 접속
2. 프로젝트 선택: `ooddlafwdpzgxfefgsrx`
3. Authentication > Providers > Google
4. 클라이언트 ID와 비밀번호 입력
5. Save 클릭

#### 단계 3: 환경 변수 설정
```bash
# .env.local에 입력
GOOGLE_OAUTH_CLIENT_ID=<Google에서 복사한 ID>
GOOGLE_OAUTH_CLIENT_SECRET=<Google에서 복사한 Secret>
```

---

## Supabase 연결

### Supabase 정보
- **프로젝트 참조**: `ooddlafwdpzgxfefgsrx`
- **대시보드**: https://app.supabase.com
- **URL**: https://ooddlafwdpzgxfefgsrx.supabase.co

### 필요한 환경 변수
```env
NEXT_PUBLIC_SUPABASE_URL=https://ooddlafwdpzgxfefgsrx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>  # API에서만 사용
```

### 데이터베이스 스키마
데이터베이스 스키마는 Supabase 대시보드의 SQL Editor에서 확인할 수 있습니다:
- profiles 테이블
- users 테이블
- posts, comments 테이블
- etc.

---

## 개발 서버 실행

### 기본 실행
```bash
npm run dev
```

개발 서버가 `http://localhost:3002`에서 실행됩니다.

### 포트 변경 (3002가 이미 사용 중인 경우)
```bash
npm run dev -- -p 3003
```

### 빌드 및 프로덕션 서버 실행
```bash
# 빌드
npm run build

# 프로덕션 서버 실행
npm run start
```

---

## 기능 테스트

### 1. 회원가입 테스트
1. http://localhost:3002/signup 접속
2. 이메일, 비밀번호, 닉네임 입력
3. 약관 동의 후 가입
4. 이메일 인증 링크 확인 (콘솔 로그)

### 2. 로그인 테스트
1. http://localhost:3002/login 접속
2. 이메일과 비밀번호로 로그인
3. Remember Me 옵션 테스트
4. 로그인 성공 후 대시보드로 리다이렉트

### 3. Google OAuth 테스트
1. http://localhost:3002/login 접속
2. "Google로 로그인" 버튼 클릭
3. Google 계정으로 로그인
4. 권한 승인
5. 자동으로 대시보드로 리다이렉트

### 4. 정치인 정보 테스트
1. http://localhost:3002/politicians 접속
2. 정치인 목록 확인
3. 정치인 상세 정보 클릭
4. AI 평가 정보 확인

### 5. 커뮤니티 기능 테스트
1. http://localhost:3002/community 접속
2. 게시물 목록 확인
3. 게시물 작성
4. 댓글 작성
5. 공감/공유/팔로우 테스트

---

## 빌드 및 배포

### 빌드 확인
```bash
npm run build
```

빌드가 성공하면 `.next` 디렉토리가 생성됩니다.

### 타입 체크
```bash
npm run type-check
```

### 린트 확인
```bash
npm run lint
```

### Vercel 배포
```bash
# Vercel CLI 설치
npm install -g vercel

# 배포
vercel --prod
```

---

## 환경 변수 관리

### 개발 환경
- 파일: `.env.local`
- 위치: 프로젝트 루트
- Git: `.gitignore`에 포함 (커밋 안 함)

### 프로덕션 환경
- 위치: Vercel Environment Variables 또는 GitHub Secrets
- 설정: https://vercel.com/docs/projects/environment-variables

### 필수 환경 변수
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GOOGLE_OAUTH_CLIENT_ID` (Google OAuth 사용 시)
- `GOOGLE_OAUTH_CLIENT_SECRET` (Google OAuth 사용 시)

---

## 트러블슈팅

### 포트 이미 사용 중
```bash
# macOS/Linux
lsof -i :3002
kill -9 <PID>

# Windows
netstat -ano | findstr :3002
taskkill /PID <PID> /F
```

### 환경 변수 오류
```
Error: NEXT_PUBLIC_SUPABASE_URL is not set
```
→ `.env.local` 파일이 존재하는지 확인하고 올바른 값이 입력되어 있는지 확인

### Google OAuth 작동 안 함
- Supabase Dashboard에서 Google Provider 활성화 확인
- Client ID와 Secret이 올바른지 확인
- 리디렉션 URI가 일치하는지 확인
- 상세 가이드: [GOOGLE_AUTH_SETUP.md](./GOOGLE_AUTH_SETUP.md)

### Supabase 연결 실패
- URL이 `https://ooddlafwdpzgxfefgsrx.supabase.co`인지 확인
- Anon Key가 올바른지 확인
- Supabase 프로젝트가 active 상태인지 확인

---

## 참고 자료

- [Next.js 문서](https://nextjs.org/docs)
- [Supabase 문서](https://supabase.com/docs)
- [Google OAuth 설정](./GOOGLE_AUTH_SETUP.md)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)

---

**최종 업데이트**: 2025-11-05
**작성자**: Claude Code
