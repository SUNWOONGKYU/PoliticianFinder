# PROJECT_GRID_REVISED 작업지시서 색인

빠른 탐색을 위한 작업지시서 색인입니다.

---

## 📂 문서 구조

| 파일명 | 설명 |
|--------|------|
| **README.md** | 작업지시서 개요 및 사용 방법 |
| **INDEX.md** | 작업지시서 색인 (현재 문서) |
| **GENERATION_REPORT.md** | 생성 보고서 및 품질 검증 |

---

## 🔍 Phase별 색인

### Phase 1: Frontend + Infrastructure + Mock APIs (27개)

#### Frontend (1개)
- [P1F1](P1F1.md) - React 전체 페이지 변환 (33개 페이지)

#### Backend Infrastructure (3개)
- [P1BI1](P1BI1.md) - Supabase 클라이언트 설정
- [P1BI2](P1BI2.md) - API 미들웨어 (의존: P1BI1)
- [P1BI3](P1BI3.md) - Database Types 생성 (의존: P1BI1, P2D1)

#### Backend APIs - Mock (23개)

**인증 관련 (6개)**
- [P1BA1](P1BA1.md) - 회원가입 API (Mock) (의존: P1BI1, P1BI2)
- [P1BA2](P1BA2.md) - Google OAuth API (Mock) (의존: P1BI1, P1BI2)
- [P1BA3](P1BA3.md) - 로그인 API (Mock) (의존: P1BI1, P1BI2)
- [P1BA4](P1BA4.md) - 비밀번호 재설정 API (Mock) (의존: P1BI1, P1BI2)
- [P1BA5](P1BA5.md) - 토큰 갱신 API (Mock) (의존: P1BI1, P1BI2)
- [P1BA6](P1BA6.md) - 로그아웃 API (Mock) (의존: P1BI1, P1BI2)

**정치인 관련 (4개)**
- [P1BA7](P1BA7.md) - 정치인 목록 API (Mock) (의존: P1BI1, P1BI2)
- [P1BA8](P1BA8.md) - 정치인 상세 API (Mock) (의존: P1BI1, P1BI2)
- [P1BA9](P1BA9.md) - 정치인 관심 등록 API (Mock) (의존: P1BI1, P1BI2)
- [P1BA10](P1BA10.md) - 정치인 본인 인증 API (Mock) (의존: P1BI1, P1BI2)

**AI 평가 관련 (2개)**
- [P1BA11](P1BA11.md) - AI 평가 조회 API (Mock) (의존: P1BI1, P1BI2)
- [P1BA12](P1BA12.md) - AI 평가 생성 API (Mock) (의존: P1BI1, P1BI2)

**게시글/댓글 관련 (6개)**
- [P1BA13](P1BA13.md) - 게시글 목록 API (Mock) (의존: P1BI1, P1BI2)
- [P1BA14](P1BA14.md) - 게시글 상세 API (Mock) (의존: P1BI1, P1BI2)
- [P1BA15](P1BA15.md) - 게시글 작성 API (Mock) (의존: P1BI1, P1BI2)
- [P1BA16](P1BA16.md) - 댓글 작성 API (Mock) (의존: P1BI1, P1BI2)
- [P1BA17](P1BA17.md) - 좋아요 API (Mock) (의존: P1BI1, P1BI2)
- [P1BA18](P1BA18.md) - 공유 API (Mock) (의존: P1BI1, P1BI2)

**소셜 기능 (2개)**
- [P1BA19](P1BA19.md) - 팔로우 API (Mock) (의존: P1BI1, P1BI2)
- [P1BA20](P1BA20.md) - 알림 조회 API (Mock) (의존: P1BI1, P1BI2)

**관리자 기능 (3개)**
- [P1BA21](P1BA21.md) - 관리자 통계 API (Mock) (의존: P1BI1, P1BI2)
- [P1BA22](P1BA22.md) - 사용자 관리 API (Mock) (의존: P1BI1, P1BI2)
- [P1BA23](P1BA23.md) - 콘텐츠 신고 API (Mock) (의존: P1BI1, P1BI2)

---

### Phase 2: Database (1개)

- [P2D1](P2D1.md) - 전체 Database 스키마 (통합)
  - 모든 테이블 + 트리거 + 타입 + Storage + 최적화

---

### Phase 3: Real APIs (23개)

**인증 관련 (6개)**
- [P3BA1](P3BA1.md) - 회원가입 API (Real) (의존: P2D1, P1BA1)
- [P3BA2](P3BA2.md) - Google OAuth API (Real) (의존: P2D1, P1BA2)
- [P3BA3](P3BA3.md) - 로그인 API (Real) (의존: P2D1, P1BA3)
- [P3BA4](P3BA4.md) - 비밀번호 재설정 API (Real) (의존: P2D1, P1BA4)
- [P3BA5](P3BA5.md) - 토큰 갱신 API (Real) (의존: P2D1, P1BA5)
- [P3BA6](P3BA6.md) - 로그아웃 API (Real) (의존: P2D1, P1BA6)

**정치인 관련 (4개)**
- [P3BA7](P3BA7.md) - 정치인 목록 API (Real) (의존: P2D1, P1BA7)
- [P3BA8](P3BA8.md) - 정치인 상세 API (Real) (의존: P2D1, P1BA8)
- [P3BA9](P3BA9.md) - 정치인 관심 등록 API (Real) (의존: P2D1, P1BA9)
- [P3BA10](P3BA10.md) - 정치인 본인 인증 API (Real) (의존: P2D1, P1BA10)

**AI 평가 관련 (2개)**
- [P3BA11](P3BA11.md) - AI 평가 조회 API (Real) (의존: P2D1, P1BA11)
- [P3BA12](P3BA12.md) - AI 평가 생성 API (Real) (의존: P2D1, P1BA12)

**게시글/댓글 관련 (6개)**
- [P3BA13](P3BA13.md) - 게시글 목록 API (Real) (의존: P2D1, P1BA13)
- [P3BA14](P3BA14.md) - 게시글 상세 API (Real) (의존: P2D1, P1BA14)
- [P3BA15](P3BA15.md) - 게시글 작성 API (Real) (의존: P2D1, P1BA15)
- [P3BA16](P3BA16.md) - 댓글 작성 API (Real) (의존: P2D1, P1BA16)
- [P3BA17](P3BA17.md) - 좋아요 API (Real) (의존: P2D1, P1BA17)
- [P3BA18](P3BA18.md) - 공유 API (Real) (의존: P2D1, P1BA18)

**소셜 기능 (2개)**
- [P3BA19](P3BA19.md) - 팔로우 API (Real) (의존: P2D1, P1BA19)
- [P3BA20](P3BA20.md) - 알림 조회 API (Real) (의존: P2D1, P1BA20)

**관리자 기능 (3개)**
- [P3BA21](P3BA21.md) - 관리자 통계 API (Real) (의존: P2D1, P1BA21)
- [P3BA22](P3BA22.md) - 사용자 관리 API (Real) (의존: P2D1, P1BA22)
- [P3BA23](P3BA23.md) - 콘텐츠 신고 API (Real) (의존: P2D1, P1BA23)

---

### Phase 4: Utilities & Schedulers (9개)

#### Utility Functions (6개)
- [P4BA1](P4BA1.md) - 선관위 크롤링 스크립트 (의존: P2D1)
- [P4BA2](P4BA2.md) - 정치인 데이터 시딩 (의존: P4BA1)
- [P4BA3](P4BA3.md) - 이미지 업로드 헬퍼 (의존: P2D1)
- [P4BA4](P4BA4.md) - 파일 업로드 헬퍼 (의존: P2D1)
- [P4BA5](P4BA5.md) - 욕설 필터
- [P4BA6](P4BA6.md) - 알림 생성 헬퍼 (의존: P2D1)

#### Schedulers (3개)
- [P4O1](P4O1.md) - 크롤링 스케줄러 (의존: P4BA1)
- [P4O2](P4O2.md) - 인기 게시글 집계 스케줄러 (의존: P2D1)
- [P4O3](P4O3.md) - 등급 재계산 스케줄러 (의존: P2D1)

---

### Phase 5: Testing (3개)

- [P5T1](P5T1.md) - Unit Tests (의존: P1F1, P3BA1, P3BA2, P3BA3)
- [P5T2](P5T2.md) - E2E Tests (의존: P1F1, P3BA1, P3BA2, P3BA3)
- [P5T3](P5T3.md) - Integration Tests (의존: P3BA1, P3BA2, P3BA3, P2D1)

---

### Phase 6: Deployment & Operations (4개)

- [P6O1](P6O1.md) - CI/CD 파이프라인 (의존: P5T1, P5T2, P5T3)
- [P6O2](P6O2.md) - Vercel 배포 설정 (의존: P5T1, P5T2, P5T3)
- [P6O3](P6O3.md) - 모니터링 설정 (의존: P6O2)
- [P6O4](P6O4.md) - 보안 설정 (의존: P6O2)

---

## 🏷️ Area별 색인

### Frontend (F) - 1개
- Phase 1: [P1F1](P1F1.md)

### Backend Infrastructure (BI) - 3개
- Phase 1: [P1BI1](P1BI1.md), [P1BI2](P1BI2.md), [P1BI3](P1BI3.md)

### Backend APIs (BA) - 52개
- Phase 1 Mock: [P1BA1](P1BA1.md) ~ [P1BA23](P1BA23.md)
- Phase 3 Real: [P3BA1](P3BA1.md) ~ [P3BA23](P3BA23.md)
- Phase 4 Utils: [P4BA1](P4BA1.md) ~ [P4BA6](P4BA6.md)

### Database (D) - 1개
- Phase 2: [P2D1](P2D1.md)

### Testing (T) - 3개
- Phase 5: [P5T1](P5T1.md), [P5T2](P5T2.md), [P5T3](P5T3.md)

### Operations (O) - 7개
- Phase 4: [P4O1](P4O1.md), [P4O2](P4O2.md), [P4O3](P4O3.md)
- Phase 6: [P6O1](P6O1.md), [P6O2](P6O2.md), [P6O3](P6O3.md), [P6O4](P6O4.md)

---

## 🔗 기능별 색인

### 인증/사용자 관리
- Mock: [P1BA1](P1BA1.md) ~ [P1BA6](P1BA6.md), [P1BA22](P1BA22.md)
- Real: [P3BA1](P3BA1.md) ~ [P3BA6](P3BA6.md), [P3BA22](P3BA22.md)

### 정치인 관리
- Mock: [P1BA7](P1BA7.md) ~ [P1BA10](P1BA10.md)
- Real: [P3BA7](P3BA7.md) ~ [P3BA10](P3BA10.md)
- Utils: [P4BA1](P4BA1.md), [P4BA2](P4BA2.md)
- Scheduler: [P4O1](P4O1.md)

### AI 평가
- Mock: [P1BA11](P1BA11.md), [P1BA12](P1BA12.md)
- Real: [P3BA11](P3BA11.md), [P3BA12](P3BA12.md)

### 게시글/댓글/소셜
- Mock: [P1BA13](P1BA13.md) ~ [P1BA20](P1BA20.md)
- Real: [P3BA13](P3BA13.md) ~ [P3BA20](P3BA20.md)
- Utils: [P4BA3](P4BA3.md), [P4BA4](P4BA4.md), [P4BA5](P4BA5.md), [P4BA6](P4BA6.md)
- Scheduler: [P4O2](P4O2.md), [P4O3](P4O3.md)

### 관리자
- Mock: [P1BA21](P1BA21.md) ~ [P1BA23](P1BA23.md)
- Real: [P3BA21](P3BA21.md) ~ [P3BA23](P3BA23.md)

### 인프라/DevOps
- Infrastructure: [P1BI1](P1BI1.md), [P1BI2](P1BI2.md), [P1BI3](P1BI3.md)
- Database: [P2D1](P2D1.md)
- Testing: [P5T1](P5T1.md), [P5T2](P5T2.md), [P5T3](P5T3.md)
- Deployment: [P6O1](P6O1.md), [P6O2](P6O2.md), [P6O3](P6O3.md), [P6O4](P6O4.md)

---

## 📊 의존성 그래프

### 주요 의존성 체인

```
독립 작업:
- P1F1 (Frontend)
- P1BI1 (Supabase 클라이언트)
- P2D1 (Database)
- P4BA5 (욕설 필터)

Phase 1 체인:
P1BI1 → P1BI2 → P1BA1~P1BA23

Phase 2-3 체인:
P2D1 + P1BA* → P3BA*
P1BI1 + P2D1 → P1BI3

Phase 4 체인:
P2D1 → P4BA1 → P4BA2
P2D1 → P4BA3, P4BA4, P4BA6
P4BA1 → P4O1
P2D1 → P4O2, P4O3

Phase 5 체인:
P1F1 + P3BA1,2,3 → P5T1, P5T2
P3BA1,2,3 + P2D1 → P5T3

Phase 6 체인:
P5T1,2,3 → P6O1, P6O2
P6O2 → P6O3, P6O4
```

---

## 🚀 빠른 시작 가이드

### 1. 개요 확인
```bash
cat README.md
```

### 2. 특정 Phase 작업 목록 확인
```bash
# Phase 1
ls P1*.md

# Phase 3
ls P3*.md
```

### 3. 작업 순서대로 진행
```bash
# 1. Frontend 시작
cat P1F1.md

# 2. Infrastructure 설정
cat P1BI1.md
cat P1BI2.md

# 3. Mock API 구현
cat P1BA1.md
# ... 계속
```

### 4. 의존성 확인
```bash
# 각 작업지시서의 "의존성 정보" 섹션 참고
```

---

**생성일**: 2025-11-06
**PROJECT GRID Version**: v4.0
**총 작업지시서**: 67개
