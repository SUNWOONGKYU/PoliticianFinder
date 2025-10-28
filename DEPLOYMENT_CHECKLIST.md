# Vercel 배포 체크리스트

배포 전 이 체크리스트를 확인하여 안전하고 성공적인 배포를 보장하세요.

## 배포 전 (Pre-Deployment)

### 코드 준비
- [ ] 모든 변경사항이 커밋되었는지 확인
- [ ] Git 저장소가 GitHub에 푸시되었는지 확인
- [ ] 브랜치가 올바른지 확인 (main/master 또는 배포용 브랜치)

### 로컬 빌드 테스트
```bash
cd frontend
npm install
npm run build
npm run start
```
- [ ] 빌드가 성공적으로 완료됨
- [ ] TypeScript 에러 없음
- [ ] 경고 메시지 확인 및 해결
- [ ] 로컬에서 프로덕션 모드 실행 테스트 완료

### 환경 변수 준비
- [ ] `.env.example` 파일 작성됨
- [ ] `.env.local` 파일이 `.gitignore`에 포함됨
- [ ] Supabase URL 및 Anon Key 준비됨
- [ ] 모든 필수 환경 변수 확인

### 설정 파일 확인
- [ ] `vercel.json` 파일 생성됨
- [ ] `next.config.ts` 최적화 설정 완료
- [ ] `.vercelignore` 파일 생성됨
- [ ] `package.json`의 빌드 스크립트 확인

---

## Vercel 프로젝트 설정

### 계정 및 프로젝트
- [ ] Vercel 계정 생성 및 로그인
- [ ] GitHub 계정과 Vercel 연동
- [ ] 새 프로젝트 생성
- [ ] GitHub 저장소 선택

### 프로젝트 구성
- [ ] Framework: Next.js 선택됨
- [ ] Root Directory: `frontend` 설정됨
- [ ] Build Command: `npm run build` (자동 설정)
- [ ] Output Directory: `.next` (자동 설정)
- [ ] Install Command: `npm install` (자동 설정)
- [ ] Node.js Version: 18.x 이상 (자동 설정)

### 환경 변수 설정
- [ ] `NEXT_PUBLIC_SUPABASE_URL` 추가 (Production)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 추가 (Production)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` 추가 (Preview)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 추가 (Preview)
- [ ] 선택사항: `NEXT_PUBLIC_API_URL` 추가

---

## 첫 배포

### 배포 실행
- [ ] "Deploy" 버튼 클릭
- [ ] 빌드 로그 모니터링
- [ ] 빌드 성공 확인
- [ ] 배포 URL 확인

### 배포 후 즉시 테스트
- [ ] 배포된 사이트 접속 확인
- [ ] 홈페이지 로딩 확인
- [ ] 404 페이지 없는지 확인
- [ ] 콘솔 에러 확인 (브라우저 개발자 도구)

---

## Supabase 설정 업데이트

### Redirect URL 설정
Vercel 배포 후 Supabase에 리다이렉트 URL을 추가하세요:

1. Supabase 대시보드 > Authentication > URL Configuration
2. Site URL 업데이트:
   ```
   https://your-project.vercel.app
   ```
3. Redirect URLs에 추가:
   ```
   https://your-project.vercel.app/auth/callback
   https://your-project.vercel.app/**
   ```

- [ ] Site URL 업데이트됨
- [ ] Redirect URLs 추가됨
- [ ] 변경사항 저장됨

### Google OAuth 설정 (이미 설정되어 있다면 건너뛰기)
- [ ] Supabase에서 Google Provider 활성화됨
- [ ] Google Cloud Console에서 OAuth 2.0 Client ID 생성됨
- [ ] Authorized redirect URIs에 Supabase callback URL 추가됨

---

## 기능 테스트

### 핵심 기능
- [ ] Google OAuth 로그인 테스트
- [ ] 로그아웃 테스트
- [ ] 정치인 목록 조회
- [ ] 정치인 상세 정보 조회
- [ ] 페이지네이션 동작
- [ ] 정렬 기능 (이름순, 최신순 등)
- [ ] 검색 기능 (있는 경우)

### 반응형 디자인
- [ ] 데스크톱 (1920x1080)
- [ ] 태블릿 (768x1024)
- [ ] 모바일 (375x667)

### 브라우저 호환성
- [ ] Chrome
- [ ] Safari
- [ ] Firefox
- [ ] Edge

---

## 성능 최적화 확인

### Lighthouse 테스트
브라우저 개발자 도구 > Lighthouse 탭에서 실행:

- [ ] Performance: 90+ 점
- [ ] Accessibility: 90+ 점
- [ ] Best Practices: 90+ 점
- [ ] SEO: 90+ 점

### Core Web Vitals
Vercel Dashboard > Analytics 에서 확인:

- [ ] LCP (Largest Contentful Paint): < 2.5s
- [ ] FID (First Input Delay): < 100ms
- [ ] CLS (Cumulative Layout Shift): < 0.1

### 이미지 최적화
- [ ] 이미지가 WebP/AVIF 형식으로 제공됨
- [ ] 이미지 lazy loading 적용됨
- [ ] 적절한 이미지 크기 사용

---

## 보안 체크리스트

### 환경 변수 보안
- [ ] `.env.local` 파일이 Git에 커밋되지 않음
- [ ] 환경 변수가 Vercel 대시보드에만 저장됨
- [ ] 민감한 정보가 코드에 하드코딩되지 않음

### HTTP 헤더
- [ ] HTTPS 강제 적용 (Vercel 자동)
- [ ] Security headers 설정 (`next.config.ts`)
- [ ] CORS 설정 적절함

### Supabase 보안
- [ ] Row Level Security (RLS) 활성화됨
- [ ] 적절한 권한 정책 설정됨
- [ ] Anon key만 프론트엔드에서 사용 (Service key 절대 사용 금지)

---

## 모니터링 설정

### Vercel Analytics (선택사항)
- [ ] Vercel Analytics 활성화
- [ ] Speed Insights 설치 (선택사항)

### 에러 추적 (선택사항)
- [ ] Sentry 또는 다른 에러 추적 도구 설정
- [ ] 에러 알림 설정

---

## 도메인 설정 (선택사항)

### 커스텀 도메인
- [ ] Vercel에 도메인 추가
- [ ] DNS 레코드 설정 (A 또는 CNAME)
- [ ] SSL 인증서 발급 확인 (자동)
- [ ] HTTPS 리다이렉트 확인

### 도메인 설정 후
- [ ] Supabase Site URL 업데이트
- [ ] Supabase Redirect URLs 업데이트
- [ ] Google OAuth Authorized redirect URIs 업데이트

---

## 자동 배포 설정

### GitHub Integration
- [ ] GitHub 푸시 시 자동 배포 활성화
- [ ] PR 생성 시 Preview 배포 활성화
- [ ] Main 브랜치 보호 규칙 설정 (선택사항)

### 배포 설정
- [ ] Production Branch: `main` 또는 `master`
- [ ] Deployment Protection: 활성화 여부 결정
- [ ] Build & Development Settings 확인

---

## 문서화

### README 업데이트
- [ ] 배포 URL 추가
- [ ] 환경 변수 설정 방법 문서화
- [ ] 로컬 개발 가이드 업데이트

### 팀 공유
- [ ] 배포 URL 팀과 공유
- [ ] Vercel 프로젝트 접근 권한 설정
- [ ] 환경 변수 관리 방법 공유

---

## 트러블슈팅 준비

### 롤백 계획
- [ ] 이전 배포 버전 확인 방법 숙지
- [ ] 롤백 절차 이해
- [ ] 긴급 연락망 준비

### 로그 모니터링
- [ ] Vercel 배포 로그 확인 방법 숙지
- [ ] Runtime 로그 확인 방법 숙지
- [ ] 에러 발생 시 대응 절차 준비

---

## 배포 완료 후

### 최종 확인
- [ ] Production URL에서 모든 기능 정상 작동
- [ ] Preview 배포도 정상 작동
- [ ] 환경 변수 모두 적용됨
- [ ] 성능 목표 달성 (Lighthouse 90+)
- [ ] 보안 설정 완료

### 사용자 안내
- [ ] 베타 테스터에게 URL 공유
- [ ] 피드백 수집 계획
- [ ] 사용자 가이드 준비

### 후속 작업
- [ ] 모니터링 대시보드 설정
- [ ] 정기 성능 체크 일정 수립
- [ ] 업데이트 및 유지보수 계획

---

## 배포 정보 기록

배포 완료 후 다음 정보를 기록하세요:

- **배포 일시**: _________________
- **Production URL**: _________________
- **Vercel Project Name**: _________________
- **배포한 사람**: _________________
- **Git Commit Hash**: _________________
- **주요 변경사항**: _________________

---

## 알려진 이슈

배포 시 발견된 이슈를 여기에 기록하세요:

1. 이슈 내용 및 해결 방법
2. ...

---

## 다음 단계

- [ ] 사용자 피드백 수집
- [ ] 성능 모니터링 및 최적화
- [ ] 추가 기능 개발 계획
- [ ] 정기 업데이트 일정 수립

---

**체크리스트 버전**: 1.0
**최종 업데이트**: 2025-10-17
