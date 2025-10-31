# PROJECT GRID V5.0

**최신 Skills 통합 버전 - 144개 작업**

---

## 📁 폴더 구조

```
PROJECT_GRID/
├── grid/                   # PROJECT GRID 데이터
│   ├── generated_grid_full_v4_10agents_with_skills.json  # 최신 144개 작업
│   ├── generated_grid_full_v4_10agents_with_skills.sql   # Supabase 업로드용
│   └── backup_data.json    # 백업
│
├── viewer/                 # PROJECT GRID 뷰어
│   ├── PROJECT_GRID_Latest_Viewer.html       # ⭐ 최신 뷰어 (Skills 강조)
│   ├── project_grid_최종통합뷰어_v4.html      # 기존 통합 뷰어
│   ├── open_latest_viewer.py                 # 최신 뷰어 실행
│   ├── run_viewer.py                         # 기존 뷰어 실행
│   └── generated_grid_full_v4_10agents_with_skills.json
│
└── manuals/                # 매뉴얼
    ├── PROJECT_GRID_매뉴얼_V4.0.md
    └── SUPABASE_연동가이드_V4.0.md
```

---

## 🚀 빠른 시작

### 1. 최신 뷰어 실행 (Skills 통합)

```bash
cd viewer
python open_latest_viewer.py
```

브라우저에서 자동으로 열립니다: `http://localhost:8083/PROJECT_GRID_Latest_Viewer.html`

### 2. 데이터 확인

**144개 작업 JSON:**
```bash
cd grid
# generated_grid_full_v4_10agents_with_skills.json
```

**3요소 통합 도구 형식:**
```
[Claude Tools] / [Tech Stack] / [Skills]
예: Bash, Glob, Edit, Write / GitHub Actions, Vercel CLI, npm / troubleshoot, deployment, cicd-setup
```

---

## 📊 데이터 정보

- **총 작업**: 144개
- **Phase**: 7개 (Phase 1~7)
- **Area**: 6개 (O, D, BI, BA, F, T)
- **Custom Agents**: 9개
- **Anthropic Skills**: 15개

---

## 📖 매뉴얼

### PROJECT GRID 매뉴얼
- 파일: `manuals/PROJECT_GRID_매뉴얼_V4.0.md`
- 내용: PROJECT GRID 구조, 사용법, Phase별 가이드

### Supabase 연동 가이드
- 파일: `manuals/SUPABASE_연동가이드_V4.0.md`
- 내용: Supabase 설정, 스키마 업로드, API 연동

---

## 🔧 뷰어 옵션

### 최신 뷰어 (권장)
- **파일**: `PROJECT_GRID_Latest_Viewer.html`
- **특징**: 3요소 통합 도구 명확히 표시
- **실행**: `python viewer/open_latest_viewer.py`

### 기존 통합 뷰어
- **파일**: `project_grid_최종통합뷰어_v4.html`
- **특징**: Supabase 연동 지원
- **실행**: `python viewer/run_viewer.py`

---

## 📦 데이터 파일

### JSON 파일
- **위치**: `grid/generated_grid_full_v4_10agents_with_skills.json`
- **용도**: 뷰어, 분석, 백업

### SQL 파일
- **위치**: `grid/generated_grid_full_v4_10agents_with_skills.sql`
- **용도**: Supabase 데이터베이스 업로드

---

**버전**: V5.0 (Skills 통합)
**생성일**: 2025-10-31
**상태**: ✅ 완료
