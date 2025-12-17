# PROJECT_GRID_REVISED 작업지시서 목록

## 개요

PROJECT_GRID_REVISED의 전체 67개 작업에 대한 상세한 작업지시서입니다.

생성일: 2025-11-06
PROJECT GRID Version: v4.0

---

## 작업 통계

| Phase | Area | 작업 수 | 설명 |
|-------|------|---------|------|
| Phase 1 | Frontend (F) | 1 | React 페이지 변환 |
| Phase 1 | Backend Infrastructure (BI) | 3 | Supabase 설정, 미들웨어 |
| Phase 1 | Backend APIs (BA) | 23 | Mock API 구현 |
| Phase 2 | Database (D) | 1 | 전체 데이터베이스 스키마 |
| Phase 3 | Backend APIs (BA) | 23 | Real API 구현 (Mock 교체) |
| Phase 4 | Backend APIs (BA) | 6 | 유틸리티 함수 |
| Phase 4 | Operations (O) | 3 | 스케줄러 |
| Phase 5 | Testing (T) | 3 | 단위/E2E/통합 테스트 |
| Phase 6 | Operations (O) | 4 | 배포 및 운영 |
| **합계** | | **67** | |

---

## Phase 1: Frontend + Infrastructure + Mock APIs (27개)

### Frontend (1개)
- **P1F1.md** - React 전체 페이지 변환 (33개 페이지)

### Backend Infrastructure (3개)
- **P1BI1.md** - Supabase 클라이언트 설정
- **P1BI2.md** - API 미들웨어
- **P1BI3.md** - Database Types 생성

### Backend APIs - Mock (23개)
- **P1BA1.md** - 회원가입 API (Mock)
- **P1BA2.md** - Google OAuth API (Mock)
- **P1BA3.md** - 로그인 API (Mock)
- **P1BA4.md** - 비밀번호 재설정 API (Mock)
- **P1BA5.md** - 토큰 갱신 API (Mock)
- **P1BA6.md** - 로그아웃 API (Mock)
- **P1BA7.md** - 정치인 목록 API (Mock)
- **P1BA8.md** - 정치인 상세 API (Mock)
- **P1BA9.md** - 정치인 관심 등록 API (Mock)
- **P1BA10.md** - 정치인 본인 인증 API (Mock)
- **P1BA11.md** - AI 평가 조회 API (Mock)
- **P1BA12.md** - AI 평가 생성 API (Mock)
- **P1BA13.md** - 게시글 목록 API (Mock)
- **P1BA14.md** - 게시글 상세 API (Mock)
- **P1BA15.md** - 게시글 작성 API (Mock)
- **P1BA16.md** - 댓글 작성 API (Mock)
- **P1BA17.md** - 공감 API (Mock)
- **P1BA18.md** - 공유 API (Mock)
- **P1BA19.md** - 팔로우 API (Mock)
- **P1BA20.md** - 알림 조회 API (Mock)
- **P1BA21.md** - 관리자 통계 API (Mock)
- **P1BA22.md** - 사용자 관리 API (Mock)
- **P1BA23.md** - 콘텐츠 신고 API (Mock)

---

## Phase 2: Database (1개)

- **P2D1.md** - 전체 Database 스키마 (통합)
  - 모든 테이블, 트리거, 타입, Storage, 최적화 포함

---

## Phase 3: Real APIs (23개)

Mock API를 실제 데이터베이스 연동 API로 교체

- **P3BA1.md** - 회원가입 API (Real)
- **P3BA2.md** - Google OAuth API (Real)
- **P3BA3.md** - 로그인 API (Real)
- **P3BA4.md** - 비밀번호 재설정 API (Real)
- **P3BA5.md** - 토큰 갱신 API (Real)
- **P3BA6.md** - 로그아웃 API (Real)
- **P3BA7.md** - 정치인 목록 API (Real)
- **P3BA8.md** - 정치인 상세 API (Real)
- **P3BA9.md** - 정치인 관심 등록 API (Real)
- **P3BA10.md** - 정치인 본인 인증 API (Real)
- **P3BA11.md** - AI 평가 조회 API (Real)
- **P3BA12.md** - AI 평가 생성 API (Real)
- **P3BA13.md** - 게시글 목록 API (Real)
- **P3BA14.md** - 게시글 상세 API (Real)
- **P3BA15.md** - 게시글 작성 API (Real)
- **P3BA16.md** - 댓글 작성 API (Real)
- **P3BA17.md** - 공감 API (Real)
- **P3BA18.md** - 공유 API (Real)
- **P3BA19.md** - 팔로우 API (Real)
- **P3BA20.md** - 알림 조회 API (Real)
- **P3BA21.md** - 관리자 통계 API (Real)
- **P3BA22.md** - 사용자 관리 API (Real)
- **P3BA23.md** - 콘텐츠 신고 API (Real)

---

## Phase 4: Utilities & Schedulers (9개)

### Utility Functions (6개)
- **P4BA1.md** - 선관위 크롤링 스크립트
- **P4BA2.md** - 정치인 데이터 시딩
- **P4BA3.md** - 이미지 업로드 헬퍼
- **P4BA4.md** - 파일 업로드 헬퍼
- **P4BA5.md** - 욕설 필터
- **P4BA6.md** - 알림 생성 헬퍼

### Schedulers (3개)
- **P4O1.md** - 크롤링 스케줄러
- **P4O2.md** - 인기 게시글 집계 스케줄러
- **P4O3.md** - 등급 재계산 스케줄러

---

## Phase 5: Testing (3개)

- **P5T1.md** - Unit Tests (Jest)
- **P5T2.md** - E2E Tests (Playwright)
- **P5T3.md** - Integration Tests

---

## Phase 6: Deployment & Operations (4개)

- **P6O1.md** - CI/CD 파이프라인
- **P6O2.md** - Vercel 배포 설정
- **P6O3.md** - 모니터링 설정
- **P6O4.md** - 보안 설정

---

## 작업지시서 형식

각 작업지시서는 다음 섹션을 포함합니다:

1. **기본 정보** - Task ID, 업무명, Phase, Area, 서브 에이전트, 작업 방식
2. **작업 목표** - 작업의 목적과 범위
3. **사용 도구** - Claude 도구, 기술 스택, 전문 스킬
4. **의존성 정보** - 선행 작업 목록
5. **기대 결과물** - 생성되어야 할 파일 목록
6. **작업 지시사항** - 준비/구현/검증/완료 단계별 가이드
7. **완료 기준** - 작업 완료를 판단하는 체크리스트

---

## 사용 방법

1. **작업 선택**: Phase와 Area에 따라 적절한 작업지시서 선택
2. **의존성 확인**: 선행 작업 완료 여부 확인
3. **작업 수행**: 작업지시서의 단계별 가이드 따라 구현
4. **완료 검증**: 완료 기준 체크리스트 확인
5. **PROJECT GRID 업데이트**: 작업 상태 업데이트

---

## 주요 특징

### 1. 체계적인 의존성 관리
- 각 작업의 선행 작업이 명확히 정의됨
- 순차적 진행으로 안정성 확보

### 2. 상세한 구현 가이드
- 단계별 상세 지침 제공
- 기술 스택별 구체적인 도구 명시

### 3. 명확한 완료 기준
- 체크리스트 형태의 완료 조건
- 품질 보증을 위한 검증 항목 포함

### 4. Phase 기반 개발
- Phase 1: 프론트엔드 + Mock API (빠른 프로토타입)
- Phase 2: 데이터베이스 스키마 (통합 설계)
- Phase 3: Real API (Mock → Real 전환)
- Phase 4: 유틸리티 & 스케줄러
- Phase 5: 종합 테스트
- Phase 6: 배포 & 운영

---

## 생성 스크립트

모든 작업지시서는 다음 스크립트로 자동 생성되었습니다:
- **경로**: `../scripts/generate_task_instructions.js`
- **실행**: `node generate_task_instructions.js`

---

## 참고 문서

- **CSV 원본**: `../grid/task_list_revised_63.csv`
- **템플릿 참고**: `../../PROJECT_GRID/viewer/deploy/tasks/P1BA1.md`
- **프로젝트 매뉴얼**: `../docs/manuals/PROJECT_GRID_매뉴얼_V4.0.md`

---

**문서 생성일**: 2025-11-06
**PROJECT GRID Version**: v4.0
**총 작업 수**: 67개
