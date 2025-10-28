# PoliticianFinder 프로젝트 그리드 변경 이력

이 파일은 프로젝트 그리드(6D-GCDM)의 모든 변경 사항을 기록합니다.

버전 번호 규칙:
- **Major 버전** (x.0.0): 전체 구조 변경, 단계 재구성
- **Minor 버전** (1.x.0): 작업 추가/삭제, 영역 변경
- **Patch 버전** (1.0.x): 진도 업데이트, 오타 수정

---

## [v1.0.0] - 2025-01-14

### ✨ 초기 생성
- PoliticianFinder 프로젝트 그리드 초안 생성
- 6차원 그리드 시스템 적용
  - 영역: Frontend, Backend, Database, Test, DevOps, AI/ML
  - 단계: Phase 1~5 (8주 로드맵)
  - 업무: 106개 작업 정의
  - 담당AI: Claude Code, ChatGPT API, Gemini API, Perplexity API
  - 진도: 0% (전체 미착수)
  - 검증: 미완료
  - 자동화: 수동/API자동 구분

### 📊 작업 통계
- **총 작업 수**: 106개
- **영역별 분포**:
  - Frontend: 29개 (28%)
  - Backend: 32개 (30%)
  - Database: 16개 (15%)
  - Test: 11개 (10%)
  - DevOps: 11개 (10%)
  - AI/ML: 7개 (7%)
- **단계별 분포**:
  - Phase 1 (초기 설정): 33개 (31%)
  - Phase 2 (핵심 기능): 30개 (28%)
  - Phase 3 (커뮤니티 강화): 16개 (15%)
  - Phase 4 (테스트 & 최적화): 19개 (18%)
  - Phase 5 (베타 런칭): 8개 (8%)
- **자동화 가능**: 25개 (24%)

### 📁 생성된 파일
```
6D-GCDM_Grid/
├── project_grid_v1.0.csv
├── project_grid_v1.0.md
├── CHANGELOG.md (본 파일)
└── tasks/ (작업 지시서 폴더 - 향후 생성 예정)
```

### 🎯 다음 단계
- [ ] Phase별 작업 지시서 생성 (106개)
- [ ] 자동화 스크립트 구축
  - automation_manager.py
  - ai_api_wrapper.py
  - grid_updater.py
- [ ] Phase 1 작업 시작 및 진도 업데이트

---

## [v3.0.0] - 2025-01-14

### Changed (구조 변경)
- **10D-GCDM으로 확장**: 기존 6차원에서 10차원으로 확장
  - 기존: 영역, 단계, 업무, 담당AI, 진도, 완료
  - 추가: 작업ID, 작업지시서링크, 테스트/검토, 자동화방식
- **XY 그리드 구조 적용**:
  - X축(가로): Phase 1 ~ Phase 5
  - Y축(세로): Frontend, Backend, Database, Test, DevOps, AI/ML
  - 각 Phase-Area 교차점에 작업들이 세로로 쌓임
- 각 작업은 8개 속성을 8개 행에 표시
- 작업 간 구분선(---) 추가

### Added (추가)
- `project_grid_v3.0_XY.csv` 생성 (XY 그리드 구조)
- 작업ID 명명 규칙: P{phase}{area}{number}
  - 예: P1F1 (Phase1-Frontend-Task1)
  - 예: P2B3 (Phase2-Backend-Task3)

### Fixed (수정)
- CSV 파일을 LibreOffice Calc에서 색상 구분 가능하도록 텍스트 기반으로 유지
- Python 스크립트를 통한 Excel 생성 방식 제거 (Claude가 Excel 파일 읽기 불가)

### Notes (비고)
- v1.0: 전통적 행 기반 구조 (각 작업이 한 행)
- v2.0: 10D 전환 시도 (구조 오류)
- v3.0: 완전한 XY 그리드 구조 구현 ✅

---

## 변경 이력 템플릿 (향후 업데이트용)

```markdown
## [v1.1.0] - 2025-01-XX

### Added (추가)
- Frontend에 "소셜 로그인 버튼" 작업 추가

### Changed (변경)
- Backend "게시글 API"의 담당을 Claude Code → ChatGPT API로 변경
- Phase 2 일정을 3주 → 4주로 조정

### Updated (진도 업데이트)
- Frontend > Phase 1 > Next.js 초기화: 0% → 100% 완료 ✅
- Backend > Phase 1 > FastAPI 구조 생성: 0% → 50% 진행중 ⏳
- Database > Phase 1 > SQLAlchemy 모델 (User): 0% → 100% 완료 ✅

### Removed (제거)
- AI/ML > Phase 4 > "Grok API 통합" 작업 제거 (API 접근 불가)

### Fixed (수정)
- 오타 수정: "정치인 인증 요처" → "정치인 인증 요청"
- 작업 지시서 링크 경로 수정

### Notes (비고)
- Phase 1 전체 진행률: 0% → 24%
- Frontend 팀 피드백 반영: UI 컴포넌트 3개 추가 필요
```

---

## [v1.2.1] - 2025-10-15

### ✨ Added (추가 기능)
- **작업지시서 하이퍼링크 자동화**: Excel 파일에서 작업지시서 셀 클릭 시 해당 .md 파일 자동 열기
  - 파란색 밑줄: 작업지시서 파일 존재 (file:// 링크)
  - 주황색: 작업지시서 미작성 (작성 필요)
  - 연한 초록색 배경: 작업지시서 행 구분
  - 통계 표시: `하이퍼링크: 1개 연결됨, 246개 미작성 (총 247개)`

- **블로커 자동화 로직**: 의존작업 기반 블로커 자동 업데이트
  - 의존작업이 '완료' 아니면 → 블로커에 '의존성 대기' 자동 설정
  - 의존작업이 모두 '완료'되면 → 블로커 '없음'으로 자동 변경
  - 223개 작업 자동 처리

### 🔧 Changed (변경)
- `csv_to_excel_with_colors.py`: 작업지시서 행 처리 로직 추가
  - `hyperlink_stats` 통계 추적
  - 파일 존재 여부에 따른 동적 폰트 색상 적용
  - `.resolve()`로 절대 경로 변환 후 `as_uri()` 호출

- `colors.json`: 작업지시서 배경색 추가
  - `"작업지시서_배경": "E8F5E9"` (연한 초록색)

### 📊 Statistics
- 총 작업지시서: 247개
- 작성 완료: 1개 (P1F1.md)
- 작성 필요: 246개

---

## 버전 이력 요약

| 버전 | 날짜 | 변경 유형 | 설명 |
|------|------|-----------|------|
| v1.0.0 | 2025-01-14 | 초기 생성 | 프로젝트 그리드 초안 완성 (106개 작업) |
| v3.0.0 | 2025-01-14 | 구조 변경 | 10D-GCDM + XY 그리드 구조 적용 |
| v1.2.0 | 2025-10-15 | Phase 확장 | Phase 6-8 추가 (153개 작업) |
| v1.2.1 | 2025-10-15 | 기능 추가 | 작업지시서 하이퍼링크 + 블로커 자동화 |

---

**마지막 업데이트**: 2025-10-15
**현재 버전**: v1.2.1
**다음 예정 버전**: v1.3.0 (Phase 1 작업 시작)
