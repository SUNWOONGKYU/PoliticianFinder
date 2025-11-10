# Vercel + GitHub 자동 배포 설정 가이드

## 📋 현재 상태
- ✅ GitHub 저장소: `finder-world/PoliticianFinder` (push 완료)
- ✅ Vercel 프로젝트: `politician-finder` (생성 완료)
- ✅ Vercel 계정: `sunwoongkyu`
- ✅ CI/CD 파일: `.github/workflows/ci-cd.yml` (생성 완료)
- ⚠️ GitHub Secrets: 설정 필요

---

## 🔑 1단계: Vercel Token 발급

### 1-1. Vercel 대시보드 접속
https://vercel.com/account/tokens

### 1-2. 새 Token 생성
1. "Create Token" 클릭
2. Token 이름: `GitHub Actions Deploy`
3. Scope: `Full Account`
4. Expiration: `No Expiration` (또는 원하는 기간)
5. "Create" 클릭
6. **생성된 Token 복사** (다시 볼 수 없으니 주의!)

```
예시: vercel_abc123...xyz789
```

---

## 🏢 2단계: Vercel Organization ID 확인

### 방법 1: Vercel CLI 사용
```bash
cd C:\Development_PoliticianFinder_copy\Developement_Real_PoliticianFinder\1_Frontend
vercel whoami
```

출력 예시:
```
sunwoongkyu  ← 이것이 Organization ID (개인 계정인 경우)
```

### 방법 2: Vercel 대시보드
1. https://vercel.com/dashboard 접속
2. 우측 상단 프로필 클릭
3. Settings > General
4. "Account ID" 또는 Organization ID 복사

```
예시: team_abc123... 또는 개인 계정 이름
```

---

## 📦 3단계: Vercel Project ID 확인

### 방법 1: Vercel CLI 사용
```bash
cd C:\Development_PoliticianFinder_copy\Developement_Real_PoliticianFinder\1_Frontend
vercel link
```

연결 후 `.vercel/project.json` 파일 확인:
```json
{
  "orgId": "team_abc123...",
  "projectId": "prj_xyz789..."
}
```

### 방법 2: Vercel 대시보드
1. https://vercel.com/dashboard 접속
2. `politician-finder` 프로젝트 클릭
3. Settings > General
4. "Project ID" 복사

```
예시: prj_abc123xyz789...
```

---

## 🔐 4단계: GitHub Secrets 설정

### 4-1. GitHub 저장소 접속
https://github.com/finder-world/PoliticianFinder/settings/secrets/actions

### 4-2. Secrets 추가 (각각 "New repository secret" 클릭)

#### Secret 1: VERCEL_TOKEN
```
Name: VERCEL_TOKEN
Value: [2단계에서 복사한 Vercel Token]
```

#### Secret 2: VERCEL_ORG_ID
```
Name: VERCEL_ORG_ID
Value: [3단계에서 확인한 Organization ID]
```

#### Secret 3: VERCEL_PROJECT_ID
```
Name: VERCEL_PROJECT_ID
Value: [4단계에서 확인한 Project ID]
```

#### 추가 Secrets (필수)

##### Secret 4: NEXT_PUBLIC_SUPABASE_URL
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://ooddlafwdpzgxfefgsrx.supabase.co
```

##### Secret 5: NEXT_PUBLIC_SUPABASE_ANON_KEY
```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: [.env.local 파일에서 복사]
```

---

## ✅ 5단계: 자동 배포 테스트

### 5-1. GitHub에 Push
```bash
cd C:\Development_PoliticianFinder_copy\Developement_Real_PoliticianFinder\1_Frontend

# 변경사항 확인
git status

# Phase 6 작업 커밋 (아직 안 했다면)
git add .
git commit -m "feat: Phase 6 Operations complete - CI/CD + Vercel + Monitoring + Security

- Add GitHub Actions CI/CD pipeline
- Configure Vercel deployment settings
- Set up Sentry and Google Analytics (stub implementations)
- Implement security middleware (rate limiting, CORS, CSP)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# main 브랜치에 push
git push origin main
```

### 5-2. GitHub Actions 확인
1. https://github.com/finder-world/PoliticianFinder/actions 접속
2. 최신 workflow run 확인
3. 각 Job 성공 확인:
   - ✅ lint-and-typecheck
   - ✅ test
   - ✅ build
   - ✅ deploy-production

### 5-3. Vercel 배포 확인
1. https://vercel.com/finder-world/politician-finder 접속
2. Deployments 탭에서 최신 배포 확인
3. 배포 완료 후 Production URL 접속:
   - https://politician-finder-finder-world.vercel.app

---

## 🎯 배포 전략

### Production (main 브랜치)
```bash
git push origin main
```
→ 자동으로 https://politician-finder-finder-world.vercel.app 배포

### Preview (develop 브랜치)
```bash
git checkout -b develop  # develop 브랜치 생성 (아직 없다면)
git push origin develop
```
→ 자동으로 Preview URL 생성 (예: https://politician-finder-git-develop-...)

---

## 🔍 트러블슈팅

### 문제 1: GitHub Actions 실패 - "VERCEL_TOKEN not found"
**해결**: GitHub Secrets가 제대로 설정되었는지 확인
- Settings > Secrets and variables > Actions
- VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID 존재 확인

### 문제 2: Vercel 배포 실패 - "Build failed"
**해결**: 환경 변수 확인
- Vercel Dashboard > Settings > Environment Variables
- NEXT_PUBLIC_SUPABASE_URL 설정
- NEXT_PUBLIC_SUPABASE_ANON_KEY 설정

### 문제 3: 배포 성공했지만 페이지 오류
**해결**: Supabase 연결 확인
- Supabase Dashboard에서 프로젝트 상태 확인
- API Keys 유효성 확인
- .env.local 파일과 동일한 값 사용하는지 확인

---

## 📌 빠른 명령어 모음

### Vercel CLI로 직접 배포 (테스트용)
```bash
cd C:\Development_PoliticianFinder_copy\Developement_Real_PoliticianFinder\1_Frontend

# 프리뷰 배포
vercel

# 프로덕션 배포
vercel --prod
```

### Vercel 프로젝트 정보 확인
```bash
vercel project ls
vercel whoami
vercel inspect
```

### Vercel 로그 확인
```bash
vercel logs politician-finder
```

---

## ✨ 다음 단계

배포 완료 후:

1. ✅ **도메인 연결** (선택)
   - Vercel Dashboard > Settings > Domains
   - 커스텀 도메인 추가

2. ✅ **모니터링 활성화** (선택)
   ```bash
   npm install @sentry/nextjs react-ga4
   ```
   - sentry.client.config.ts에서 import 주석 해제
   - sentry.server.config.ts에서 import 주석 해제
   - src/lib/monitoring/analytics.ts에서 import 주석 해제

3. ✅ **환경별 설정**
   - Production 환경 변수 설정
   - Preview 환경 변수 설정
   - Development 환경 변수 설정

---

**생성 일시**: 2025-11-10
**작성자**: Claude Code
**Phase 6 상태**: ✅ 검증 완료 및 승인
