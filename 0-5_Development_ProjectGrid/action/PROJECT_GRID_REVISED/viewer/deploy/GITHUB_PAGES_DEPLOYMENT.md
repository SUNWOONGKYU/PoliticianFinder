# GitHub Pages 배포 가이드 (기존 index.html 충돌 해결)

**문제**: 메인 브랜치에 이미 index.html이 있는데 PROJECT GRID 뷰어도 배포하고 싶음

**해결책**: gh-pages 브랜치를 사용하여 별도로 배포

---

## 🎯 추천 방법: gh-pages 브랜치 배포

### 장점
- ✅ 메인 브랜치의 기존 index.html을 전혀 건드리지 않음
- ✅ 뷰어만 별도로 관리 가능
- ✅ 업데이트 간편 (gh-pages 브랜치만 푸시)
- ✅ 메인 프로젝트와 완전히 분리

---

## 📝 배포 단계

### 1단계: deploy 폴더로 이동
```bash
cd "C:/Development_PoliticianFinder/Developement_Real_PoliticianFinder/0-5_Development_ProjectGrid/action/PROJECT_GRID/viewer/deploy"
```

### 2단계: Git 초기화 (이 폴더만)
```bash
# Git 초기화
git init

# 모든 파일 추가
git add .

# 커밋
git commit -m "PROJECT GRID Viewer V5.0 배포"
```

### 3단계: GitHub 저장소 연결
```bash
# 기존 저장소의 원격 URL 연결 (YOUR_USERNAME과 YOUR_REPO 수정)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# 확인
git remote -v
```

### 4단계: gh-pages 브랜치로 푸시
```bash
# gh-pages 브랜치 생성 및 푸시
git branch -M gh-pages
git push -u origin gh-pages
```

### 5단계: GitHub Pages 설정
1. GitHub 저장소 페이지 접속
2. **Settings** 클릭
3. 왼쪽 메뉴에서 **Pages** 클릭
4. **Source**:
   - Branch: `gh-pages` 선택
   - Folder: `/ (root)` 선택
5. **Save** 클릭

### 6단계: 배포 URL 확인 (1-2분 후)
```
https://YOUR_USERNAME.github.io/YOUR_REPO/
```

---

## 🔄 업데이트 방법 (나중에 데이터 변경 시)

### 간단 업데이트
```bash
cd deploy

# 파일 수정 후
git add .
git commit -m "Update PROJECT GRID data"
git push origin gh-pages
```

---

## 📊 최종 결과

### 메인 브랜치 (main)
- 기존 index.html 그대로 유지
- 프로젝트 소스코드
- URL: https://YOUR_USERNAME.github.io/YOUR_REPO/ (기존과 동일)

### gh-pages 브랜치
- PROJECT GRID 뷰어만 배포
- deploy 폴더 내용만 포함
- URL: **동일한 URL이지만 gh-pages 브랜치 내용 표시**

⚠️ **주의**: gh-pages 브랜치로 배포하면 해당 URL은 gh-pages 브랜치의 index.html을 표시합니다.
따라서 메인 브랜치의 기존 index.html은 표시되지 않습니다.

---

## 🎯 대안: 두 개의 URL을 모두 유지하려면

### Option A: 서브디렉터리 배포
메인 브랜치에 `/project-grid/` 폴더 생성:
```bash
# 메인 프로젝트 루트로 이동
cd YOUR_PROJECT_ROOT

# project-grid 폴더 생성
mkdir project-grid

# deploy 폴더 내용 복사
cp -r "0-5_Development_ProjectGrid/action/PROJECT_GRID/viewer/deploy/"* project-grid/

# Git 커밋
git add project-grid/
git commit -m "Add PROJECT GRID viewer"
git push origin main
```

**결과**:
- 기존 사이트: `https://YOUR_USERNAME.github.io/YOUR_REPO/`
- 뷰어: `https://YOUR_USERNAME.github.io/YOUR_REPO/project-grid/`

### Option B: 별도 저장소 생성
새 저장소 `project-grid-viewer` 생성:
```bash
cd deploy

git init
git add .
git commit -m "PROJECT GRID Viewer V5.0"

# 새 저장소 연결
git remote add origin https://github.com/YOUR_USERNAME/project-grid-viewer.git
git branch -M main
git push -u origin main

# GitHub Pages 활성화 (Settings → Pages → main branch)
```

**결과**:
- 기존 사이트: `https://YOUR_USERNAME.github.io/YOUR_REPO/`
- 뷰어: `https://YOUR_USERNAME.github.io/project-grid-viewer/`

---

## ✅ 권장 솔루션 비교

| 방법 | 장점 | 단점 | 추천도 |
|------|------|------|--------|
| **gh-pages 브랜치** | 간단, 깔끔 | 메인 URL이 뷰어로 변경됨 | ⭐⭐⭐ |
| **서브디렉터리** | 두 URL 모두 유지 | 메인 저장소 크기 증가 | ⭐⭐⭐⭐⭐ |
| **별도 저장소** | 완전 분리, 가장 깔끔 | 저장소 2개 관리 | ⭐⭐⭐⭐ |

---

## 🚀 Quick Start (가장 빠른 방법)

### 서브디렉터리 배포 (30초)
```bash
# 메인 프로젝트 루트로 이동
cd "C:/Development_PoliticianFinder/Developement_Real_PoliticianFinder"

# project-grid 폴더 생성 및 복사
mkdir -p project-grid
cp -r "0-5_Development_ProjectGrid/action/PROJECT_GRID/viewer/deploy/"* project-grid/

# Git 커밋
git add project-grid/
git commit -m "Add PROJECT GRID Viewer V5.0"
git push origin main
```

**완료!** 5분 후 접속:
```
https://YOUR_USERNAME.github.io/YOUR_REPO/project-grid/
```

---

## 📝 요약

**상황**: 메인 브랜치에 이미 index.html이 있음

**해결책**:
1. **서브디렉터리 배포** (가장 추천) → 두 사이트 모두 유지
2. **gh-pages 브랜치** → 뷰어만 별도 관리
3. **별도 저장소** → 완전 분리

**추천**: **서브디렉터리 배포** - 가장 간단하고 두 사이트 모두 유지됨

---

**다음 단계**: 위의 "Quick Start" 명령어를 복사해서 실행하면 즉시 배포 완료!
