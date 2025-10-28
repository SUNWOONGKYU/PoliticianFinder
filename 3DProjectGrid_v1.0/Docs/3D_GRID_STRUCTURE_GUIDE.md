# 3D 프로젝트 그리드 (3DProjectGrid_v1.0) - 폴더 구조 가이드

**생성일**: 2025-10-21
**버전**: v1.0
**목적**: 3차원 프로젝트 관리 그리드의 새로운 폴더 구조 및 파일 조직화 방법론

---

## 📊 3D 프로젝트 그리드의 3차원 구조

### 3개 축으로 정의된 프로젝트 관리

```
      Phase (X축: 8개 단계)
       ↑ Phase 1-8
       │
       ├─── Area (Y축: 8개 영역)
       │     ├─ Frontend
       │     ├─ Backend
       │     ├─ Database
       │     ├─ RLS Policies
       │     ├─ Authentication
       │     ├─ Test & QA
       │     ├─ DevOps & Infra
       │     └─ Security
       │
       └─── Task (Z축: 개별 작업)
             ├─ Task ID (P1F1, P2B1, etc.)
             ├─ Description
             ├─ Status
             └─ Dependencies
```

### 각 축의 의미

| 축 | 범위 | 의미 | 예시 |
|----|------|------|------|
| **X축 (Phase)** | 1~8 | 개발 단계/시간 | Phase 1: Supabase 인증, Phase 2: 정치인 목록 |
| **Y축 (Area)** | Frontend~Security | 기술 영역 | Frontend: UI, Backend: API 개발 |
| **Z축 (Task)** | P*F*, P*B*, etc. | 개별 작업 항목 | P1F1: AuthContext 생성 |

---

## 📁 새로운 폴더 구조

### 최상위 구조

```
3DProjectGrid_v1.0/
├── Core/                          # 핵심 그리드 파일
│   ├── project_grid_v5.0_phase2d_complete.csv
│   ├── project_grid_v5.0_phase2d_complete.xlsx
│   └── PROJECT_GRID_CSV_EXCEL_GUIDE.md
│
├── Tasks/                         # 작업 폴더 (Phase별 조직화)
│   ├── Phase1_Supabase/
│   ├── Phase2_PoliticianList/
│   ├── Phase3_Community/
│   ├── Phase4_TestOptimize/
│   ├── Phase5_BetaLaunch/
│   ├── Phase6_MultiAI/
│   ├── Phase7_ServicePlatform/
│   └── Phase8_AIAvatar/
│
├── Docs/                          # 문서 폴더
│   ├── 13DGC-AODM 방법론.md       # 기본 방법론
│   ├── 15DGC-AODM 방법론.md       # 업그레이드 방법론
│   ├── 특허출원/                  # 특허 관련 문서
│   ├── 3D_GRID_STRUCTURE_GUIDE.md # 이 파일
│   └── [기타 프로젝트 문서]
│
├── Archive/                       # 아카이브 (이전 버전, 백업)
│   ├── project_grid_v*.csv        # 이전 버전들
│   ├── project_grid_v*.xlsx
│   └── *.backup*
│
└── [기타 Python 스크립트, 설정 파일]
    ├── csv_to_excel.py
    ├── auto_sync.py
    └── run_sync.bat
```

### 각 폴더의 역할

#### 1️⃣ **Core/** - 핵심 그리드 파일
- **용도**: 프로젝트 관리의 중심
- **파일**:
  - `project_grid_v5.0_phase2d_complete.csv`: 메인 그리드 (AI 에이전트용)
  - `project_grid_v5.0_phase2d_complete.xlsx`: 시각화 그리드 (사용자 확인용)
  - `PROJECT_GRID_CSV_EXCEL_GUIDE.md`: 사용 방법

#### 2️⃣ **Tasks/** - 작업 파일 폴더
- **용도**: Phase별 작업지시서 및 관련 파일
- **구조**: 각 Phase 폴더에 작업 파일 저장
  ```
  Phase1_Supabase/
  ├── P1F1_AuthContext생성.md
  ├── P1F2_회원가입페이지.md
  ├── P1B1_API기본구조.md
  └── ...
  ```

#### 3️⃣ **Docs/** - 문서 폴더
- **용도**: 프로젝트 설계, 방법론, 가이드 문서
- **주요 파일**:
  - 방법론 문서 (13DGC-AODM, 15DGC-AODM)
  - 특허출원 관련 문서
  - 프로젝트 관련 모든 문서

#### 4️⃣ **Archive/** - 아카이브 폴더
- **용도**: 이전 버전, 백업, 히스토리 관리
- **파일**:
  - 이전 버전 CSV/Excel 파일
  - 백업 파일 (.backup_*)
  - 사용하지 않는 구버전 파일

---

## 🔄 파일 관리 전략

### 파일 위치 규칙

| 파일 유형 | 위치 | 목적 |
|----------|------|------|
| 프로젝트 그리드 | `Core/` | 메인 관리 파일 |
| Phase별 작업 | `Tasks/Phase[N]_*/` | 작업지시서 |
| 방법론 문서 | `Docs/` | 설계 및 가이드 |
| 이전 버전 | `Archive/` | 버전 히스토리 |
| 특허 관련 | `Docs/특허출원/` | 특허 신청 자료 |

### 파일 네이밍 규칙

```
# 프로젝트 그리드
project_grid_v[VERSION]_[PHASE].csv/xlsx

# 작업지시서
tasks/[Phase]/[TaskID]_[TaskName].md

# 문서
[DOCUMENT_NAME]_[VERSION].md

# 백업
[FILENAME].backup_[TIMESTAMP]
```

---

## 💾 데이터 흐름

```
사용자 요청
    ↓
Core/project_grid_v5.0_phase2d_complete.csv (메인 그리드)
    ↓
Tasks/Phase[N]_*/*.md (작업지시서)
    ↓
작업 수행 및 완료
    ↓
Core/project_grid_v5.0_phase2d_complete.csv (상태 업데이트)
    ↓
이전 버전 → Archive/ (버전 관리)
```

---

## 🎯 3DProjectGrid의 장점

### 1. **명확한 조직화**
- X축(Phase): 시간 순서대로 개발 단계 관리
- Y축(Area): 기술 분야별로 작업 분류
- Z축(Task): 개별 작업의 상태 추적

### 2. **확장성**
- Phase 추가 가능 (Phase 9, 10 등)
- 새로운 Area 추가 가능
- 폴더 구조로 쉽게 확장

### 3. **추적 가능성**
- 모든 작업의 의존성 관계 명확
- 버전 히스토리 유지 (Archive)
- CSV/Excel 양형식 지원

### 4. **협업 효율성**
- 각 Phase별 담당자 명확화
- 작업 상태 실시간 업데이트
- AI 에이전트와 사람 모두 이해 가능

---

## 📋 폴더 유지 관리 체크리스트

### 월간 유지보수
- [ ] 완료된 작업 파일 정리
- [ ] 아카이브된 파일 확인
- [ ] 버전 번호 업데이트 검토

### 분기별 검토
- [ ] 폴더 구조 적절성 평가
- [ ] 네이밍 규칙 일관성 확인
- [ ] 아카이브 폴더 정리

### 연간 검토
- [ ] 구버전 삭제 여부 결정
- [ ] 폴더 구조 최적화 검토
- [ ] 새로운 Phase 준비

---

## 🚀 마이그레이션 완료

### ✅ 완료된 작업
1. ✅ 폴더명 변경: `15DGC-AODM_Grid` → `3DProjectGrid_v1.0`
2. ✅ 폴더 구조 생성 (Core, Tasks, Docs, Archive)
3. ✅ 파일 정렬 (핵심 파일 Core에 배치)
4. ✅ CSV 데이터 정제 및 수정
5. ✅ 문서 업데이트

### 📝 업데이트 사항
- **프로젝트 그리드**: v5.0 (Phase 2D 완료)
- **CSV 오류 수정**:
  - ✅ 의존작업 "+" → ";" 변경
  - ✅ 상태-테스트 모순 해결
  - ✅ 타이핑 오류 수정
  - ✅ 불완전한 타임스탬프 수정

---

**작성일**: 2025-10-21
**버전**: v1.0
**방법론**: 3DProjectGrid (3차원 프로젝트 관리)
