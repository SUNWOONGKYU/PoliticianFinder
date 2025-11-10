# PROJECT GRID 뷰어 배포 가이드

**생성일**: 2025-10-31
**버전**: V5.0

---

## 배포 옵션

### Option 1: GitHub Pages (추천) - 무료, 간편

#### 1단계: GitHub 저장소 생성
```bash
# 저장소 이름 예시: project-grid-viewer
# Public으로 설정 (Private도 가능하지만 GitHub Pro 필요)
```

#### 2단계: deploy 폴더를 GitHub에 푸시
```bash
cd C:/Development_PoliticianFinder/Developement_Real_PoliticianFinder/0-5_Development_ProjectGrid/action/PROJECT_GRID/viewer/deploy

# Git 초기화
git init
git add .
git commit -m "Initial commit: PROJECT GRID Viewer V5.0"

# GitHub 저장소 연결
git remote add origin https://github.com/YOUR_USERNAME/project-grid-viewer.git
git branch -M main
git push -u origin main
```

#### 3단계: GitHub Pages 활성화
1. GitHub 저장소 → Settings
2. 왼쪽 메뉴 → Pages
3. Source: Deploy from a branch
4. Branch: main, Folder: / (root)
5. Save

#### 4단계: 배포 URL 확인
- 약 1-2분 후 배포 완료
- URL: `https://YOUR_USERNAME.github.io/project-grid-viewer/`

#### 장점
- ✅ 무료
- ✅ 자동 HTTPS
- ✅ 업데이트 간편 (git push만)
- ✅ 영구 호스팅

---

### Option 2: Vercel - 초고속, 전문가용

#### 1단계: Vercel 계정 생성
- https://vercel.com
- GitHub 계정으로 로그인

#### 2단계: 배포
```bash
# Vercel CLI 설치
npm install -g vercel

# deploy 폴더로 이동
cd C:/Development_PoliticianFinder/Developement_Real_PoliticianFinder/0-5_Development_ProjectGrid/action/PROJECT_GRID/viewer/deploy

# 배포
vercel

# 프로덕션 배포
vercel --prod
```

#### 3단계: URL 확인
- 배포 완료 후 URL 자동 생성
- 예: `https://project-grid-viewer.vercel.app`

#### 장점
- ✅ 무료
- ✅ 초고속 CDN
- ✅ 자동 프리뷰 배포
- ✅ 커스텀 도메인 지원

---

### Option 3: Netlify - 드래그앤드롭

#### 1단계: Netlify 계정 생성
- https://netlify.com

#### 2단계: 배포
1. Netlify 대시보드 → Sites
2. "Add new site" → "Deploy manually"
3. deploy 폴더를 드래그앤드롭

#### 3단계: URL 확인
- 즉시 배포 완료
- 예: `https://random-name-123.netlify.app`
- Settings에서 커스텀 도메인 설정 가능

#### 장점
- ✅ 가장 간편 (드래그앤드롭만)
- ✅ 무료
- ✅ 자동 HTTPS
- ✅ 커스텀 도메인 지원

---

## 파일 구조

```
deploy/
├── index.html                           # 랜딩 페이지
├── project_grid_최종통합뷰어_v4.html    # 메인 뷰어
└── embedded_data_temp.js                # 데이터 (151개 작업)
```

**총 용량**: 약 180KB (매우 가볍습니다!)

---

## 업데이트 방법

### GitHub Pages
```bash
cd deploy
git add .
git commit -m "Update PROJECT GRID data"
git push
```

### Vercel
```bash
cd deploy
vercel --prod
```

### Netlify
- 새 파일을 드래그앤드롭하면 자동 업데이트

---

## 접근 제한 설정 (Private 배포)

### GitHub Pages (Pro 필요)
- Settings → Pages → Visibility → Private
- Organization 멤버만 접근 가능

### Vercel
- Settings → Environment Variables
- Password Protection 설정 가능

### Netlify
- Site settings → Access control
- Password protection 설정

---

## 권장 배포 방법

### 프로젝트 초기 (지금)
**→ GitHub Pages 추천**
- 가장 간단하고 안정적
- Git으로 버전 관리 동시 진행
- 팀원들과 쉽게 공유

### 프로젝트 완료 후
**→ Vercel로 업그레이드**
- 커스텀 도메인 연결
- 프로페셔널한 URL
- 더 빠른 성능

---

## Quick Start (30초 배포)

### 가장 빠른 방법: Netlify 드래그앤드롭

1. https://netlify.com 접속
2. 회원가입/로그인
3. "Add new site" 클릭
4. deploy 폴더 통째로 드래그앤드롭
5. **완료!** 즉시 URL 생성됨

---

## 커스텀 도메인 연결 (선택사항)

### 도메인 구매 후 연결
- Namecheap, GoDaddy 등에서 도메인 구매
- DNS 설정:
  ```
  A Record: @  →  192.0.2.1 (플랫폼 IP)
  CNAME: www → your-site.vercel.app
  ```

---

## 문제 해결

### 한글 깨짐 현상
- ✅ 이미 해결됨 (UTF-8 설정 완료)

### 데이터 로딩 안됨
- embedded_data_temp.js 파일 포함 확인
- 브라우저 콘솔에서 오류 확인

### 3D 뷰 작동 안됨
- Three.js CDN 로딩 확인
- HTTPS 사용 확인

---

## 배포 완료 후 공유

### URL 공유
```
PROJECT GRID V5.0 뷰어가 배포되었습니다! 🎉

🔗 URL: https://your-site.github.io/project-grid-viewer/

📊 통계:
- 총 151개 작업 (144개 + 7개 Phase Gates)
- 7개 Phase, 6개 Area
- 9개 AI Agents, 15개 Skills

✨ 기능:
- 2D 카드 뷰 & 3D 블록 뷰
- Phase별, Area별 필터링
- 실시간 작업지시서 링크
- 금색 Phase Gate 강조

📱 모바일 지원: ✓
🌐 오프라인 사용: ✓ (HTML 더블클릭)
```

---

**추천 배포 플랫폼**: GitHub Pages (무료, 안정적, 버전 관리)

**배포 소요 시간**: 5분 이내

**유지 비용**: 무료
