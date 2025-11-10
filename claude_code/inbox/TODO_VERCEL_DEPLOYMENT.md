# 내일 할 일: Vercel 배포 연결

**작성일**: 2025-11-10
**우선순위**: HIGH
**예상 소요 시간**: 30분

---

## 🎯 목표

GitHub 저장소를 Vercel에 연결하여 자동 배포 파이프라인 활성화

---

## ✅ Vercel 배포 연결 (3단계)

### 1단계: Vercel 대시보드에서 GitHub 연결

**URL**: https://vercel.com/finder-world/politician-finder/settings/git

**작업**:
1. Vercel 대시보드 접속
2. "Connect Git Repository" 클릭
3. GitHub 저장소 선택: `finder-world/PoliticianFinder`
4. Production Branch 설정: `main`

**예상 시간**: 5분

---

### 2단계: Vercel 환경 변수 설정

**경로**: Settings > Environment Variables

**필수 환경 변수**:

#### 기본 환경 변수 (2개)
```
NEXT_PUBLIC_SUPABASE_URL=https://ooddlafwdpzgxfefgsrx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Supabase Anon Key>
```

#### 추가 권장 환경 변수 (선택)
```
# Supabase Service Role (서버 전용)
SUPABASE_SERVICE_ROLE_KEY=<Service Role Key>

# AI API Keys (AI 평가 시스템)
ANTHROPIC_API_KEY=<Claude API Key>
OPENAI_API_KEY=<ChatGPT API Key>
GOOGLE_AI_API_KEY=<Gemini API Key>
XAI_API_KEY=<Grok API Key>
PERPLEXITY_API_KEY=<Perplexity API Key>

# 결제 시스템 (토스페이먼츠)
NEXT_PUBLIC_TOSS_CLIENT_KEY=<Toss Client Key>
TOSS_SECRET_KEY=<Toss Secret Key>

# Cron Job 보안
CRON_SECRET=<임의의 비밀 키>

# SMTP (정치인 검증 이메일)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<이메일>
SMTP_PASS=<앱 비밀번호>

# Google OAuth (선택)
GOOGLE_OAUTH_CLIENT_ID=<Client ID>
GOOGLE_OAUTH_CLIENT_SECRET=<Client Secret>

# 사이트 URL
NEXT_PUBLIC_SITE_URL=https://politician-finder.vercel.app
NEXT_PUBLIC_API_URL=https://politician-finder.vercel.app/api
NEXT_PUBLIC_ENV=production
```

**참고 파일**: `1_Frontend/.env.example` (153줄 전체 가이드)

**예상 시간**: 15분

---

### 3단계: 자동 배포 테스트

**작업**:
```bash
git push origin main
```

**확인 사항**:
1. Vercel 대시보드에서 배포 시작 확인
2. 빌드 로그 확인 (약 3분 소요)
3. 배포 완료 후 URL 확인
4. 프로덕션 사이트 접속 테스트

**예상 배포 URL**: `https://politician-finder.vercel.app`

**예상 시간**: 10분 (빌드 시간 포함)

---

## 📋 체크리스트

### 배포 전 확인
- [ ] GitHub 저장소 최신 상태 확인 (`git status`)
- [ ] Vercel 계정 로그인 확인
- [ ] Supabase URL 및 Key 준비
- [ ] 환경 변수 목록 준비 (`.env.example` 참고)

### 배포 중 확인
- [ ] Vercel GitHub 연결 완료
- [ ] Production Branch: `main` 설정 확인
- [ ] 환경 변수 입력 완료 (최소 2개)
- [ ] `git push origin main` 실행

### 배포 후 확인
- [ ] Vercel 빌드 성공 확인
- [ ] 배포 URL 접속 가능 확인
- [ ] 메인 페이지 정상 표시 확인
- [ ] 정치인 목록 페이지 확인 (`/politicians`)
- [ ] API 응답 확인 (브라우저 콘솔)
- [ ] 모바일 반응형 확인 (개발자 도구)

---

## 🚨 주의사항

### 1. 환경 변수 설정 시
- ✅ **Production, Preview, Development** 모두 체크하여 모든 환경에 적용
- ✅ 비밀 키는 절대 GitHub에 커밋하지 않기
- ✅ Supabase Anon Key는 공개 가능 (클라이언트 측)
- ❌ Service Role Key는 서버 전용 (노출 금지)

### 2. 빌드 실패 시
- Vercel 대시보드에서 빌드 로그 확인
- TypeScript 에러 확인: `npm run type-check`
- 빌드 로컬 테스트: `npm run build`
- 환경 변수 누락 확인

### 3. 배포 후 문제 발생 시
- Vercel 대시보드 > Deployments > Logs 확인
- Runtime Logs 확인 (실시간 에러)
- 환경 변수 재설정 후 재배포

---

## 📚 참고 문서

### 프로젝트 문서
- **환경 변수 전체 가이드**: `1_Frontend/.env.example`
- **Vercel 설정**: `1_Frontend/vercel.json`
- **CI/CD 설정**: `.github/workflows/ci-cd.yml`
- **Phase 6 승인서**: `PHASE6_GATE_APPROVAL.md`

### Vercel 문서
- **Vercel 환경 변수**: https://vercel.com/docs/environment-variables
- **GitHub 연동**: https://vercel.com/docs/git/vercel-for-github
- **Next.js 배포**: https://vercel.com/docs/frameworks/nextjs

### Supabase 문서
- **API Keys**: https://app.supabase.com/project/ooddlafwdpzgxfefgsrx/settings/api

---

## 🎯 성공 기준

배포가 성공하면 다음이 가능해야 함:

1. ✅ `https://politician-finder.vercel.app` 접속 가능
2. ✅ 메인 페이지 정상 표시
3. ✅ 정치인 목록 페이지 데이터 로드
4. ✅ 회원가입/로그인 가능 (Supabase Auth 연동)
5. ✅ 모바일 반응형 정상 작동
6. ✅ GitHub `main` 브랜치 push 시 자동 배포

---

## 🔄 자동 배포 파이프라인 (배포 후)

배포 후 다음과 같이 자동화됨:

```
git push origin main
    ↓
GitHub Actions 트리거 (ci-cd.yml)
    ↓
빌드 & 테스트 (약 3분)
    ↓
Vercel 자동 배포
    ↓
프로덕션 URL 업데이트
    ↓
완료! 🎉
```

**예상 전체 시간**: 3~5분 (자동)

---

## 📞 문제 발생 시

### Vercel 빌드 실패
```bash
# 로컬에서 빌드 테스트
cd 1_Frontend
npm run build

# TypeScript 체크
npm run type-check

# 환경 변수 확인
cat .env.example
```

### Supabase 연결 실패
- Supabase 대시보드에서 프로젝트 상태 확인
- API Keys 재확인
- RLS 정책 확인 (Public 테이블 읽기 허용)

### GitHub Actions 실패
- GitHub 저장소 > Actions 탭 확인
- Secrets 설정 확인 (VERCEL_TOKEN 등)
- Workflow 파일 확인 (`.github/workflows/ci-cd.yml`)

---

**작성자**: Claude Code (Sonnet 4.5)
**마지막 업데이트**: 2025-11-10
**상태**: 준비 완료 ✅

---

## 🎊 배포 완료 후

PoliticianFinder 프로젝트가 전 세계에 공개됩니다! 🚀

**다음 단계**:
1. 도메인 연결 (선택)
2. 실제 사용자 테스트
3. 모니터링 패키지 설치 (Sentry + GA4)
4. 성능 최적화
5. SEO 최적화

**축하합니다! 🎉**
