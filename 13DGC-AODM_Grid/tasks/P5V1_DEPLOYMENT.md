# P5V1: GitHub → Vercel 자동 배포 파이프라인 구축

## 작업 정보
- **Phase**: Phase 5
- **영역**: DevOps & Infra  
- **담당 AI**: devops-troubleshooter
- **의존 작업**: Phase 4 전체 완료
- **자동화 방식**: AI-only
- **작업 시작**: 2025-10-18 23:45
- **작업 상태**: 진행 중

## 작업 목표
GitHub를 중앙 저장소로 하여 Vercel에 자동 배포되는 CI/CD 파이프라인을 구축합니다.

## 배포 플로우
```
로컬 개발 → Git Commit → GitHub Push → Vercel 자동 감지 → 빌드 → 배포 완료
```

## 구현 단계

### 1단계: Git 저장소 초기화 ✅
```bash
cd /g/"내 드라이브"/Developement/PoliticianFinder
git init
git config user.name "PoliticianFinder"
git config user.email "politician-finder@example.com"
```
**상태**: 완료

### 2단계: .gitignore 설정
```gitignore
# Dependencies
node_modules/
frontend/node_modules/

# Next.js
frontend/.next/
frontend/out/
frontend/build/

# Vercel
.vercel
frontend/.vercel

# Environment
.env
.env*.local
frontend/.env.local
frontend/.env.production

# Database
supabase/.branches
supabase/.temp

# OS & IDE
.DS_Store
.vscode/
.idea/
```

### 3단계: GitHub 저장소 생성 및 연결
```bash
# GitHub CLI 사용 (권장)
gh repo create PoliticianFinder --public --source=. --remote=origin

# 또는 수동 연결
git remote add origin https://github.com/[username]/PoliticianFinder.git
```

### 4단계: 초기 커밋 및 Push
```bash
git add .
git commit -m "feat: Phase 1-5 완료 - 프로덕션 배포 준비

- Phase 1: Supabase 인증 시스템 ✅
- Phase 2: 정치인 목록/상세 페이지 ✅  
- Phase 3: 커뮤니티 기능 (알림, 댓글, 좋아요) ✅
- Phase 4: 테스트 & 최적화 (성능, 보안, 테스트) ✅
- Phase 5: 베타 런칭 준비 (피드백, 배포 설정) ✅

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

git branch -M main
git push -u origin main
```

### 5단계: Vercel 프로젝트 연결

**Vercel Dashboard 설정:**
1. https://vercel.com/dashboard 접속
2. "Add New Project" 클릭
3. GitHub 저장소 import
4. 프로젝트 설정:
   - Framework: Next.js
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Node Version: 18.x

### 6단계: 환경 변수 설정

**Vercel Dashboard → Settings → Environment Variables:**
```env
NEXT_PUBLIC_SUPABASE_URL=[your-supabase-url]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-key]
UPSTASH_REDIS_REST_URL=[your-redis-url]
UPSTASH_REDIS_REST_TOKEN=[your-redis-token]
NODE_ENV=production
```

### 7단계: 배포 확인

**자동 배포 트리거:**
- `main` 브랜치 push → 프로덕션 배포
- PR 생성 → 프리뷰 배포
- 커밋마다 자동 빌드

**확인사항:**
- [ ] 빌드 성공 (Vercel Dashboard)
- [ ] 배포 URL 접근 가능
- [ ] 홈페이지 정상 작동
- [ ] 로그인/회원가입 작동
- [ ] 정치인 목록 로드
- [ ] API 엔드포인트 응답
- [ ] Lighthouse 점수 90+

## 완료 기준
- [x] Git 저장소 초기화
- [ ] .gitignore 설정
- [ ] GitHub 저장소 생성
- [ ] 초기 커밋 및 push
- [ ] Vercel 프로젝트 연결
- [ ] 환경 변수 설정
- [ ] 자동 배포 파이프라인 작동
- [ ] 프로덕션 URL 정상 작동
- [ ] 전체 기능 테스트 통과

## 트러블슈팅

### 문제: npm install 실패 (Google Drive)
**원인**: Google Drive 파일 시스템 제약
**해결**: Vercel이 자체적으로 빌드하므로 로컬 npm install 불필요

### 문제: 빌드 실패
**해결**: Vercel 빌드 로그 확인, 환경 변수 재확인

---
**생성일**: 2025-10-18  
**방법론**: 13DGC-AODM v1.1
**담당**: devops-troubleshooter
