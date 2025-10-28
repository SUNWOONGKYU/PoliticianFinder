# 빠른 배포 가이드 (Quick Deploy)

5분 안에 Vercel에 배포하는 방법

---

## 1단계: Vercel 계정 준비 (1분)

1. https://vercel.com 접속
2. "Sign Up" 클릭
3. GitHub 계정으로 로그인
4. Vercel과 GitHub 연동 승인

---

## 2단계: 프로젝트 배포 (2분)

1. Vercel 대시보드에서 "Add New..." > "Project" 클릭
2. GitHub 저장소 목록에서 `PoliticianFinder` 선택
3. **중요**: Root Directory를 `frontend`로 설정
4. Framework Preset: `Next.js` (자동 감지)
5. 아직 "Deploy" 버튼 클릭하지 말고 다음 단계로

---

## 3단계: 환경 변수 설정 (2분)

"Environment Variables" 섹션에서 다음을 추가:

### 필수 변수 2개

**변수 1:**
- Name: `NEXT_PUBLIC_SUPABASE_URL`
- Value: `https://ooddlafwdpzgxfefgsrx.supabase.co`
- Environment: Production, Preview 모두 체크

**변수 2:**
- Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8`
- Environment: Production, Preview 모두 체크

이제 **"Deploy" 버튼 클릭!**

---

## 4단계: 배포 완료 대기 (1-3분)

1. 빌드 로그 화면이 나타남
2. 진행 상황 모니터링
3. "Congratulations" 메시지 확인
4. 배포된 URL 복사 (예: `https://your-project.vercel.app`)

---

## 5단계: Supabase 설정 업데이트 (1분)

배포가 완료되면 Supabase에 새 URL을 추가해야 합니다:

1. https://supabase.com 로그인
2. 프로젝트 선택
3. `Authentication` > `URL Configuration` 메뉴
4. **Site URL**에 입력:
   ```
   https://your-project.vercel.app
   ```
5. **Redirect URLs**에 추가:
   ```
   https://your-project.vercel.app/auth/callback
   https://your-project.vercel.app/**
   ```
6. "Save" 버튼 클릭

---

## 6단계: 테스트 (1분)

배포된 사이트에서 다음을 확인:

1. 사이트 접속: `https://your-project.vercel.app`
2. Google 로그인 버튼 클릭
3. 로그인 성공 확인
4. 정치인 목록 표시 확인

---

## 완료!

배포 성공! 이제 자동 배포가 설정되어:
- `main` 브랜치에 푸시하면 자동으로 Production 배포
- PR 생성하면 자동으로 Preview 배포

---

## 문제가 발생했나요?

### 빌드 실패
- Vercel 대시보드 > Deployments > 실패한 배포 클릭
- 빌드 로그에서 에러 확인
- 대부분 환경 변수 누락 문제

### 로그인 안됨
- Supabase Redirect URLs 확인
- 브라우저 콘솔에서 에러 확인

### 상세 가이드
전체 배포 가이드는 `DEPLOYMENT.md` 참조

---

**팁**: Vercel URL을 팀원들과 공유하세요!
