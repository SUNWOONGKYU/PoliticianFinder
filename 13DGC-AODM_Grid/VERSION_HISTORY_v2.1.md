# 프로젝트 그리드 버전 히스토리

## v2.1 (2025-10-19 03:23)

### 주요 변경사항
**방법론 개선: 재실행 상태 시스템 도입**

### 변경 내용

#### 1. 재실행 상태 추가
기획 문서와 그리드 간 불일치 발견 시, "땜빵식" 추가가 아닌 **원래 위치에 작업 추가 + 기존 작업 재실행** 방식 도입

**새로운 상태 값**:
- **상태**: `재실행` (기존: 대기/진행중/완료)
- **테스트/검토**: `미통과` (재실행 필요 표시)
- **진도**: `0%` (재실행 필요 시 리셋)

#### 2. Phase 2 게시판 기능 추가
**배경**: 기획 문서 `개발_로드맵_Phase별.md`에는 Phase 2에 게시판 기능이 명시되어 있었으나, 프로젝트 그리드에는 누락됨

**추가된 작업 (5개)**:
- **P2D4**: posts 테이블 (Database)
- **P2B7**: 게시글 CRUD API (Backend)
- **P2B8**: 게시글 조회수/추천 (Backend)
- **P2F8**: 게시판 목록/상세 페이지 (Frontend)
- **P2F9**: 게시글 작성 폼 (Frontend)

#### 3. Phase 2 기존 작업 재실행 처리
게시판 기능과 통합하기 위해 Phase 2의 모든 완료 작업을 **재실행** 상태로 변경:

**재실행 대상 작업**:
- Frontend: P2F1~P2F7 (7개)
- Backend: P2B1~P2B6 (6개)
- Database: P2D1~P2D3 (3개)
- RLS Policies: P2E1~P2E2 (2개)
- Authentication: P2C1 (1개)
- Test & QA: P2T1~P2T3 (3개)
- DevOps: P2V1~P2V3 (3개)
- Security: P2S1~P2S2 (2개)

**총 27개 작업 재실행**

#### 4. 문서 업데이트
**README.md**:
- "작업 상태 표시 규칙" 섹션 추가
- 재실행 상태 설명 및 워크플로우 추가

**13DGC-AODM 방법론.md**:
- "재실행 상태 (그리드 보완 시)" 섹션 추가
- 속성 차원에 재실행/미통과 상태 추가
- Phase 2 게시판 예시 추가

#### 5. 버그 수정
- **P2B7 의존작업 오류**: `P2D2` (ratings 테이블) → `P2D4` (posts 테이블)로 수정

### 방법론 개선점

#### 변경 전 (잘못된 방식)
```
Phase 2에 게시판 누락 발견
→ Phase 5에 땜빵식으로 추가
→ Phase 2는 그대로 "완료" 유지
→ 결과: 게시판이 Phase 2 기능들과 통합되지 않음
```

#### 변경 후 (올바른 방식)
```
Phase 2에 게시판 누락 발견
→ Phase 2에 게시판 작업 추가 (P2D4, P2B7, P2B8, P2F8, P2F9)
→ Phase 2의 기존 완료 작업들을 "재실행"으로 변경
→ Phase 2 전체를 게시판과 통합하여 재실행
→ 결과: 게시판이 Phase 2의 정치인 목록/평가 기능과 완전히 통합됨
```

### 파일 변경사항
- ✅ `project_grid_v2.0_supabase.csv` → `project_grid_v2.1_supabase.csv`
- ✅ `README.md` 업데이트
- ✅ `13DGC-AODM 방법론.md` 업데이트
- ✅ `VERSION_HISTORY_v2.1.md` 생성

### 다음 단계
1. P2D4, P2B7, P2B8, P2F8, P2F9 작업지시서 작성
2. Phase 2 재실행 작업 순차 실행
3. 게시판 기능 구현 및 통합

---

## v2.0 (2025-10-16)

### 주요 변경사항
**FastAPI → Supabase 마이그레이션**

### 변경 내용
- Backend 아키텍처 변경: FastAPI → Next.js API Routes + Supabase
- Database: PostgreSQL (자체 호스팅) → Supabase (관리형 PostgreSQL)
- Authentication: 자체 구현 → Supabase Auth
- File Storage: 로컬 → Supabase Storage
- Phase 1 완료 (2025-10-16)

---

**작성일**: 2025-10-19 03:23
**방법론**: 13DGC-AODM v1.1
**작성자**: Claude Code (AI-Only Development)
