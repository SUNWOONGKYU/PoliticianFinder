# GitHub Pages 배포 트러블슈팅 가이드

**작성일**: 2026-03-07
**증상**: 새 HTML 파일을 gh-pages 브랜치에 push해도 사이트에 반영되지 않고 404 발생

---

## 원인 분석

### 구조

```
저장소: SUNWOONGKYU/PoliticianFinder
GitHub Pages 설정: gh-pages 브랜치 / /docs 폴더
URL: https://sunwoongkyu.github.io/PoliticianFinder/
```

### 왜 안 됐나?

GitHub Pages는 기본적으로 **Jekyll**을 통해 파일을 빌드한다.
Jekyll 빌드는 내부적으로 **GitHub Actions**를 사용한다.
Actions가 비활성화되면 Jekyll 빌드가 실행되지 않고, 사이트가 업데이트되지 않는다.

```
[gh-pages push] → [Jekyll 빌드 시도] → [Actions 필요] → [Actions 비활성화] → ❌ 빌드 실패
```

### 증거

- 마지막 성공 빌드: **2026-02-26** (그 이후로 Actions 비활성화됨)
- GitHub 저장소 상단 경고: *"Actions is currently unavailable for your repository, and your Pages site requires a Jekyll build step."*
- API 오류: `"Actions has been disabled for this user."`

---

## 해결책 (영구 적용 완료)

### `.nojekyll` 파일 추가

`docs/.nojekyll` 파일(빈 파일)을 추가하면 GitHub Pages가 Jekyll 빌드를 **완전히 건너뛴다**.
Jekyll 없이 파일을 그대로 서빙하므로 Actions 없이도 배포된다.

```
[gh-pages push] → [.nojekyll 감지] → [Jekyll 스킵] → [파일 직접 서빙] → ✅ 즉시 반영
```

**이미 적용됨**: `docs/.nojekyll` 파일이 gh-pages 브랜치에 커밋됨 (2026-03-07)

---

## 앞으로 새 보고서 배포 방법

### 1. HTML 파일을 gh-pages 브랜치 docs/reports/ 에 복사

```python
# Python으로 복사 (한글 파일명 인코딩 안전)
import shutil, os

src = r'C:\Development_PoliticianFinder_com\...\V40\보고서\홍길동_20260401_B.html'
dst = r'C:\Users\home\AppData\Local\Temp\gh-pages-work\docs\reports\홍길동_20260401_B.html'
shutil.copy2(src, dst)
```

### 2. worktree 생성 → 복사 → 커밋 → push → 삭제

```bash
# worktree 생성
cd C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder
git worktree add /tmp/gh-pages-work gh-pages

# Python으로 파일 복사 (한글 파일명 처리)
python3 -c "
import shutil, os
src_dir = r'C:\...\V40\보고서'
dst_dir = '/tmp/gh-pages-work/docs/reports'
for f in os.listdir(src_dir):
    if '20260401' in f and f.endswith('.html'):
        shutil.copy2(os.path.join(src_dir, f), os.path.join(dst_dir, f))
        print('Copied:', f)
"

# index.html 업데이트 (후보 카드 추가)
# → Edit 툴로 직접 수정

# 커밋 & push
cd /tmp/gh-pages-work
git add docs/reports/
git commit -m "feat: 홍길동 평가보고서 배포"
git push origin gh-pages

# worktree 삭제
cd C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder
git worktree remove /tmp/gh-pages-work
```

### 3. index.html 카드 형식

```html
<a class="card" href="%ED%99%8D%EA%B8%B8%EB%8F%99_20260401_B.html">
  <div class="badge" style="background:#1565C0;">홍</div>
  <div class="info">
    <div class="name">홍길동</div>
    <div class="meta">더불어민주당 · 전 OO시장</div>
  </div>
  <div class="score">
    <div class="score-val e-grade">800점</div>
    <div class="grade">E등급 · 1위</div>
  </div>
</a>
```

**URL 인코딩 규칙:**
- 한글 파일명은 URL에서 percent-encode 필요
- 브라우저 주소창에 한글 파일명 입력 후 엔터 치면 자동 변환됨
- 또는 Python: `urllib.parse.quote('홍길동_20260401_B.html')`

---

## 주의사항

### ❌ 하지 말 것

| 행동 | 이유 |
|------|------|
| `docs/.nojekyll` 파일 삭제 | Jekyll 빌드 재활성화 → Actions 없으면 배포 중단 |
| GitHub Pages 설정을 "Actions" 모드로 변경 | Actions가 비활성화된 상태에서는 배포 불가 |
| bash의 `cp` 명령으로 한글 파일명 복사 | MSYS/Windows 인코딩 충돌 → 파일명 깨짐 |

### ✅ 반드시 지킬 것

- 파일 복사는 항상 **Python `shutil.copy2()`** 사용
- `docs/.nojekyll` 파일은 gh-pages 브랜치에 영구 유지
- worktree 경로는 Windows 경로(`C:\Users\home\AppData\Local\Temp\gh-pages-work`) 사용

---

## 현재 배포된 보고서 목록

### 2026 서울시장 후보군 (2026-02-21)

| 이름 | 정당 | 점수 | URL |
|------|------|------|-----|
| 정원오 | 더불어민주당 | 785점 E | `%EC%A0%95%EC%9B%90%EC%98%A4_20260221_B.html` |
| 오준환 | 국민의힘 | 776점 E | `%EC%98%A4%EC%A4%80%ED%99%98_20260219_B.html` |
| 박주민 | 더불어민주당 | 753점 P | `%EB%B0%95%EC%A3%BC%EB%AF%BC_20260221_B.html` |
| 조은희 | 국민의힘 | 745점 P | `%EC%A1%B0%EC%9D%80%ED%9D%AC_20260221_B.html` |
| 오세훈 | 국민의힘 | 732점 P | `%EC%98%A4%EC%84%B8%ED%9B%88_20260221_B.html` |

### 2026 고양특례시장 후보군 (2026-03-06)

| 이름 | 정당 | 점수 | URL |
|------|------|------|-----|
| 명재성 | 더불어민주당 | 778점 E | `%EB%AA%85%EC%9E%AC%EC%84%B1_20260306_B.html` |
| 이동환 | 국민의힘 | 770점 E | `%EC%9D%B4%EB%8F%99%ED%99%98_20260306_B.html` |
| 오준환 | 국민의힘 | 765점 E | `%EC%98%A4%EC%A4%80%ED%99%98_20260306_B.html` |
| 이재준 | 더불어민주당 | 758점 P | `%EC%9D%B4%EC%9E%AC%EC%A4%80_20260306_B.html` |

**베이스 URL**: `https://sunwoongkyu.github.io/PoliticianFinder/reports/`
