# AI 도구 완전 배치 계획 (Phase 1-5 MVP)

**작성일**: 2025-10-15
**목표**: 1차 개발(MVP) 완료를 위한 모든 AI 도구 및 서브에이전트 배치

---

## 📋 전체 AI 도구 구성

### 1️⃣ Claude Code 서브에이전트 (5개)

| 서브에이전트 | 역할 | 연결 방식 | 주 담당 영역 |
|------------|------|----------|-------------|
| **fullstack-developer** | 프론트엔드, 백엔드, DB 개발 | 내장 | Frontend, Backend, Database |
| **security-auditor** | 보안, 인증, 암호화 | 내장 | Backend (인증), DevOps (보안) |
| **devops-troubleshooter** | 배포, 최적화, 모니터링 | 내장 | DevOps, 성능 최적화 |
| **code-reviewer** | 테스트, 코드 리뷰, QA | 내장 | Test 영역 전체 |
| **general-purpose** | 복잡한 분석, 연구 | 내장 | 아키텍처 설계, 요구사항 분석 |

### 2️⃣ 외부 협력 AI (6개)

| AI 도구 | 역할 | 연결 방식 | 주 용도 |
|---------|------|----------|---------|
| **Gemini (웹)** | 음성 입력 인터페이스 | 🔵 수동 | 음성 → 텍스트 명령 정제 |
| **Claude (웹)** | 메인 에이전트, 핵심 로직 | 🔵 수동 | 그리드 관리, 복잡한 로직 설계 |
| **ChatGPT (웹)** | 실시간 Q&A | 🔵 수동 | 기술 용어 설명, 즉각 지원 |
| **ChatGPT API** | 코드 생성 자동화 | 🟢 API | AI 평가, 자동 코드 리뷰 |
| **Perplexity** | 팩트 체크, 최신 정보 | 🔵 수동 | 기술 트렌드 리서치 |
| **Python Converter** | CSV → Excel 자동 변환 | 🟢 API | 그리드 시각화 |

**연결 방식 구분**:
- 🔵 **수동**: 사용자가 직접 복붙하여 사용
- 🟢 **API**: 자동 연동 (코드로 호출)

---

## 🎯 Phase 1-5 작업별 도구 배치

### Phase 1: 프로젝트 초기 설정

#### Frontend (7개 작업)

| 작업ID | 업무 | 서브에이전트 | 외부 협력 AI | 자동화 |
|--------|------|-------------|-------------|--------|
| P1F1 | Next.js 14 초기화 | fullstack-developer | - | 수동 |
| P1F2 | TypeScript & Tailwind | fullstack-developer | - | 수동 |
| P1F3 | shadcn/ui 설치 | fullstack-developer | - | 수동 |
| P1F4 | 폴더 구조 생성 | fullstack-developer | - | 수동 |
| P1F5 | Zustand 상태 관리 | fullstack-developer | - | 수동 |
| P1F6 | 회원가입 페이지 | fullstack-developer | - | 수동 |
| P1F7 | 로그인 페이지 | fullstack-developer | - | 수동 |

#### Backend (8개 작업)

| 작업ID | 업무 | 서브에이전트 | 외부 협력 AI | 자동화 |
|--------|------|-------------|-------------|--------|
| P1B1 | FastAPI 초기화 | fullstack-developer | - | 수동 |
| P1B2 | requirements.txt | fullstack-developer | - | 수동 |
| P1B3 | 환경 변수 설정 | security-auditor | - | 수동 |
| P1B4 | FastAPI 기본 구조 | fullstack-developer | - | 수동 |
| P1B5 | JWT 인증 시스템 | security-auditor | - | 수동 |
| P1B6 | 회원가입 API | fullstack-developer | - | 수동 |
| P1B7 | 로그인 API | fullstack-developer | - | 수동 |
| P1B8 | 현재 사용자 조회 API | fullstack-developer | - | 수동 |

#### Database (13개 작업)

| 작업ID | 업무 | 서브에이전트 | 외부 협력 AI | 자동화 |
|--------|------|-------------|-------------|--------|
| P1D1 | User 모델 | fullstack-developer | - | 수동 |
| P1D2 | Politician 모델 | fullstack-developer | - | 수동 |
| P1D3 | Post 모델 | fullstack-developer | - | 수동 |
| P1D4 | Comment 모델 | fullstack-developer | - | 수동 |
| P1D5 | Vote 모델 | fullstack-developer | - | 수동 |
| P1D6 | Rating 모델 | fullstack-developer | - | 수동 |
| P1D7 | AIScore 모델 | fullstack-developer | - | 수동 |
| P1D8 | Notification 모델 | fullstack-developer | - | 수동 |
| P1D9 | Bookmark 모델 | fullstack-developer | - | 수동 |
| P1D10 | Report 모델 | fullstack-developer | - | 수동 |
| P1D11 | Alembic 초기화 | fullstack-developer | - | 수동 |
| P1D12 | 초기 마이그레이션 | fullstack-developer | - | 수동 |
| P1D13 | 테스트 데이터 시딩 | fullstack-developer | - | API자동 |

#### DevOps (4개 작업)

| 작업ID | 업무 | 서브에이전트 | 외부 협력 AI | 자동화 |
|--------|------|-------------|-------------|--------|
| P1V1 | Supabase DB 설정 | devops-troubleshooter | - | 수동 |
| P1V2 | Vercel 프로젝트 생성 | devops-troubleshooter | - | 수동 |
| P1V3 | Railway 배포 설정 | devops-troubleshooter | - | 수동 |
| P1V4 | 환경 변수 배포 설정 | devops-troubleshooter | - | 수동 |

#### AI/ML (1개 작업)

| 작업ID | 업무 | 서브에이전트 | 외부 협력 AI | 자동화 |
|--------|------|-------------|-------------|--------|
| P1A1 | Claude API 연동 준비 | fullstack-developer | Claude (웹) | 수동 |

---

### Phase 2: 핵심 기능 개발

#### Frontend (10개 작업)

| 작업ID | 업무 | 서브에이전트 | 외부 협력 AI | 자동화 |
|--------|------|-------------|-------------|--------|
| P2F1 | 정치인 카드 컴포넌트 | fullstack-developer | - | 수동 |
| P2F2 | 시민 평가 UI | fullstack-developer | - | 수동 |
| P2F3 | 검색 필터링 UI | fullstack-developer | - | 수동 |
| P2F4 | 페이지네이션 | fullstack-developer | - | 수동 |
| P2F5 | 정렬 옵션 드롭다운 | fullstack-developer | - | 수동 |
| P2F6 | 정치인 상세 페이지 | fullstack-developer | - | 수동 |
| P2F7 | 정치인 목록 페이지 | fullstack-developer | - | 수동 |
| P2F8 | AI 평가 점수 표시 | fullstack-developer | - | 수동 |
| P2F9 | AI 평가 차트 | fullstack-developer | - | 수동 |
| P2F10 | 메인 페이지 랭킹 | fullstack-developer | - | 수동 |

#### Backend (8개 작업)

| 작업ID | 업무 | 서브에이전트 | 외부 협력 AI | 자동화 |
|--------|------|-------------|-------------|--------|
| P2B1 | 정치인 목록 API | fullstack-developer | - | 수동 |
| P2B2 | 시민 평가 API | fullstack-developer | - | 수동 |
| P2B3 | 평가 집계 로직 | fullstack-developer | - | 수동 |
| P2B4 | 검색/필터링 API | fullstack-developer | - | 수동 |
| P2B5 | 정치인 상세 API | fullstack-developer | - | 수동 |
| P2B6 | 페이지네이션 로직 | fullstack-developer | - | 수동 |
| P2B7 | 정치인 랭킹 API | fullstack-developer | - | 수동 |
| P2B8 | 조회수 증가 로직 | fullstack-developer | - | 수동 |

#### Database (4개 작업)

| 작업ID | 업무 | 서브에이전트 | 외부 협력 AI | 자동화 |
|--------|------|-------------|-------------|--------|
| P2D1 | 정치인 테이블 스키마 | fullstack-developer | - | 수동 |
| P2D2 | ratings 테이블 | fullstack-developer | - | 수동 |
| P2D3 | 평가 인덱스 설정 | fullstack-developer | - | 수동 |
| P2D4 | 정치인 인덱스 설정 | fullstack-developer | - | 수동 |

#### Test (2개 작업)

| 작업ID | 업무 | 서브에이전트 | 외부 협력 AI | 자동화 |
|--------|------|-------------|-------------|--------|
| P2T1 | 인증 API 테스트 | code-reviewer | - | API자동 |
| P2T2 | 평가 시스템 E2E 테스트 | code-reviewer | - | API자동 |

#### AI/ML (2개 작업)

| 작업ID | 업무 | 서브에이전트 | 외부 협력 AI | 자동화 |
|--------|------|-------------|-------------|--------|
| P2A1 | AI 평가 점수 계산 | fullstack-developer | ChatGPT API | 수동 |
| P2A2 | 정치인 랭킹 알고리즘 | fullstack-developer | - | 수동 |

---

### Phase 3: 커뮤니티 기능 강화

#### Frontend (12개 작업)

| 작업ID | 업무 | 서브에이전트 | 외부 협력 AI | 자동화 |
|--------|------|-------------|-------------|--------|
| P3F1 | 알림 벨 컴포넌트 | fullstack-developer | - | 수동 |
| P3F2 | 댓글 작성 컴포넌트 | fullstack-developer | - | 수동 |
| P3F3 | 댓글 목록 (계층형) | fullstack-developer | - | 수동 |
| P3F4 | 대댓글 UI | fullstack-developer | - | 수동 |
| P3F5 | 알림 드롭다운 UI | fullstack-developer | - | 수동 |
| P3F6 | 좋아요 버튼 | fullstack-developer | - | 수동 |
| P3F7 | 멘션(@) 입력 UI | fullstack-developer | - | 수동 |
| P3F8 | 북마크 버튼 | fullstack-developer | - | 수동 |
| P3F9 | 신고 다이얼로그 | fullstack-developer | - | 수동 |
| P3F10 | 마이페이지 | fullstack-developer | - | 수동 |
| P3F11 | 정치인 인증 요청 페이지 | fullstack-developer | - | 수동 |
| P3F12 | 관리자 대시보드 | fullstack-developer | - | 수동 |

#### Backend (12개 작업)

| 작업ID | 업무 | 서브에이전트 | 외부 협력 AI | 자동화 |
|--------|------|-------------|-------------|--------|
| P3B1 | 알림 생성/조회 API | fullstack-developer | - | 수동 |
| P3B2 | 댓글 CRUD API | fullstack-developer | - | 수동 |
| P3B3 | 대댓글 API | fullstack-developer | - | 수동 |
| P3B4 | 알림 조회 API | fullstack-developer | - | 수동 |
| P3B5 | 좋아요 API | fullstack-developer | - | 수동 |
| P3B6 | 알림 읽음 처리 API | fullstack-developer | - | 수동 |
| P3B7 | 알림 자동 생성 트리거 | fullstack-developer | - | API자동 |
| P3B8 | 정치인 인증 요청 API | fullstack-developer | - | 수동 |
| P3B9 | 회원 등급/포인트 API | fullstack-developer | - | 수동 |
| P3B10 | 관리자 게시글 관리 API | fullstack-developer | - | 수동 |
| P3B11 | 관리자 회원 차단 API | fullstack-developer | - | 수동 |
| P3B12 | 관리자 신고 처리 API | fullstack-developer | - | 수동 |

#### Database (4개 작업)

| 작업ID | 업무 | 서브에이전트 | 외부 협력 AI | 자동화 |
|--------|------|-------------|-------------|--------|
| P3D1 | notifications 테이블 | fullstack-developer | - | 수동 |
| P3D2 | comments 테이블 | fullstack-developer | - | 수동 |
| P3D3 | likes 테이블 | fullstack-developer | - | 수동 |
| P3D4 | user_points 테이블 | fullstack-developer | - | 수동 |

#### Test (5개 작업)

| 작업ID | 업무 | 서브에이전트 | 외부 협력 AI | 자동화 |
|--------|------|-------------|-------------|--------|
| P3T1 | 알림 API 테스트 | code-reviewer | - | API자동 |
| P3T2 | 북마크 API 테스트 | code-reviewer | - | API자동 |
| P3T3 | 댓글 시스템 통합 테스트 | code-reviewer | - | API자동 |
| P3T4 | 알림 트리거 테스트 | code-reviewer | - | API자동 |
| P3T5 | 관리자 권한 테스트 | security-auditor | - | API자동 |

#### AI/ML (1개 작업)

| 작업ID | 업무 | 서브에이전트 | 외부 협력 AI | 자동화 |
|--------|------|-------------|-------------|--------|
| P3A1 | 댓글 감정 분석 | fullstack-developer | ChatGPT API | API자동 |

---

### Phase 4: 테스트 & 최적화

#### Frontend (8개 작업)

| 작업ID | 업무 | 서브에이전트 | 외부 협력 AI | 자동화 |
|--------|------|-------------|-------------|--------|
| P4F1 | 성능 최적화 (코드 스플리팅) | devops-troubleshooter | - | 수동 |
| P4F2 | Lighthouse 점수 90+ | devops-troubleshooter | - | 수동 |
| P4F3 | SEO 메타 태그 | fullstack-developer | - | 수동 |
| P4F4 | 로딩 스피너 | fullstack-developer | - | 수동 |
| P4F5 | 토스트 알림 | fullstack-developer | - | 수동 |
| P4F6 | 에러 바운더리 | fullstack-developer | - | 수동 |
| P4F7 | 404/500 에러 페이지 | fullstack-developer | - | 수동 |
| P4F8 | 폼 유효성 검사 | fullstack-developer | - | 수동 |

#### Backend (11개 작업)

| 작업ID | 업무 | 서브에이전트 | 외부 협력 AI | 자동화 |
|--------|------|-------------|-------------|--------|
| P4B1 | 쿼리 최적화 | devops-troubleshooter | - | 수동 |
| P4B2 | N+1 쿼리 해결 | fullstack-developer | - | 수동 |
| P4B3 | Redis 캐싱 | fullstack-developer | - | 수동 |
| P4B4 | Rate Limiting | security-auditor | - | 수동 |
| P4B5 | 에러 로깅 시스템 | devops-troubleshooter | - | 수동 |
| P4B6 | CORS 설정 | security-auditor | - | 수동 |
| P4B7 | 전역 에러 핸들러 | fullstack-developer | - | 수동 |
| P4B8 | API 표준화 응답 | fullstack-developer | - | 수동 |
| P4B9 | 비밀번호 해싱 | security-auditor | - | 수동 |
| P4B10 | SQL Injection 방어 | security-auditor | - | 수동 |
| P4B11 | 타임아웃 처리 | fullstack-developer | - | 수동 |

#### Database (4개 작업)

| 작업ID | 업무 | 서브에이전트 | 외부 협력 AI | 자동화 |
|--------|------|-------------|-------------|--------|
| P4D1 | 인덱스 추가 | fullstack-developer | - | 수동 |
| P4D2 | 관계형 쿼리 최적화 | fullstack-developer | - | 수동 |
| P4D3 | DB 연결 풀링 | fullstack-developer | - | 수동 |
| P4D4 | 댓글 인덱스 설정 | fullstack-developer | - | 수동 |

#### Test (12개 작업)

| 작업ID | 업무 | 서브에이전트 | 외부 협력 AI | 자동화 |
|--------|------|-------------|-------------|--------|
| P4T1 | 단위 테스트 커버리지 80% | code-reviewer | - | API자동 |
| P4T2 | E2E 테스트 시나리오 | code-reviewer | - | API자동 |
| P4T3 | 보안 테스트 | security-auditor | - | API자동 |
| P4T4 | 성능 테스트 (부하) | devops-troubleshooter | - | API자동 |
| P4T5 | pytest 환경 설정 | code-reviewer | - | 수동 |
| P4T6 | 테스트 DB 설정 | code-reviewer | - | 수동 |
| P4T7 | 필터링/정렬 테스트 | code-reviewer | - | API자동 |
| P4T8 | 알림 실시간 전송 테스트 | code-reviewer | - | API자동 |
| P4T9 | 캐시 무효화 테스트 | code-reviewer | - | API자동 |
| P4T10 | 동시 접속 테스트 | devops-troubleshooter | - | API자동 |
| P4T11 | 모바일 반응형 테스트 | code-reviewer | - | 수동 |
| P4T12 | 테스트 커버리지 검증 | code-reviewer | - | API자동 |

#### DevOps (3개 작업)

| 작업ID | 업무 | 서브에이전트 | 외부 협력 AI | 자동화 |
|--------|------|-------------|-------------|--------|
| P4V1 | 모니터링 시스템 구축 | devops-troubleshooter | - | 수동 |
| P4V2 | 로드 밸런싱 설정 | devops-troubleshooter | - | 수동 |
| P4V3 | 프로덕션 환경 점검 | devops-troubleshooter | - | 수동 |

#### AI/ML (1개 작업)

| 작업ID | 업무 | 서브에이전트 | 외부 협력 AI | 자동화 |
|--------|------|-------------|-------------|--------|
| P4A1 | LLM 응답 캐싱 최적화 | fullstack-developer | - | API자동 |

---

### Phase 5: 베타 런칭

#### Frontend (3개 작업)

| 작업ID | 업무 | 서브에이전트 | 외부 협력 AI | 자동화 |
|--------|------|-------------|-------------|--------|
| P5F1 | 사용자 피드백 수집 UI | fullstack-developer | - | 수동 |
| P5F2 | 사용자 가이드 페이지 | fullstack-developer | - | 수동 |
| P5F3 | 공지사항 팝업 | fullstack-developer | - | 수동 |

#### Backend (4개 작업)

| 작업ID | 업무 | 서브에이전트 | 외부 협력 AI | 자동화 |
|--------|------|-------------|-------------|--------|
| P5B1 | 피드백 수집 API | fullstack-developer | - | 수동 |
| P5B2 | 헬스 체크 엔드포인트 | devops-troubleshooter | - | 수동 |
| P5B3 | API 버전 관리 | fullstack-developer | - | 수동 |
| P5B4 | 로그 수집 시스템 | devops-troubleshooter | - | 수동 |

#### Database (2개 작업)

| 작업ID | 업무 | 서브에이전트 | 외부 협력 AI | 자동화 |
|--------|------|-------------|-------------|--------|
| P5D1 | 데이터베이스 백업 설정 | devops-troubleshooter | - | 수동 |
| P5D2 | 프로덕션 DB 마이그레이션 | devops-troubleshooter | - | 수동 |

#### Test (2개 작업)

| 작업ID | 업무 | 서브에이전트 | 외부 협력 AI | 자동화 |
|--------|------|-------------|-------------|--------|
| P5T1 | 베타 테스터 초대 시스템 | fullstack-developer | - | 수동 |
| P5T2 | 최종 사용자 시나리오 테스트 | code-reviewer | - | 수동 |

#### DevOps (10개 작업)

| 작업ID | 업무 | 서브에이전트 | 외부 협력 AI | 자동화 |
|--------|------|-------------|-------------|--------|
| P5V1 | 프로덕션 배포 (Frontend) | devops-troubleshooter | - | 수동 |
| P5V2 | 프로덕션 배포 (Backend) | devops-troubleshooter | - | 수동 |
| P5V3 | SSL 인증서 설정 | security-auditor | - | 수동 |
| P5V4 | 도메인 연결 및 DNS | devops-troubleshooter | - | 수동 |
| P5V5 | 백업 자동화 스크립트 | devops-troubleshooter | - | 수동 |
| P5V6 | 모니터링 대시보드 (Grafana) | devops-troubleshooter | - | 수동 |
| P5V7 | Sentry 에러 트래킹 | devops-troubleshooter | - | 수동 |
| P5V8 | Uptime 모니터링 | devops-troubleshooter | - | 수동 |
| P5V9 | CI/CD 파이프라인 | devops-troubleshooter | - | 수동 |
| P5V10 | 롤백 계획 수립 | devops-troubleshooter | - | 수동 |

#### AI/ML (2개 작업)

| 작업ID | 업무 | 서브에이전트 | 외부 협력 AI | 자동화 |
|--------|------|-------------|-------------|--------|
| P5A1 | 사용자 행동 분석 | fullstack-developer | ChatGPT API | API자동 |
| P5A2 | 정치인 유사도 추천 | fullstack-developer | - | API자동 |

---

## 📊 전체 통계

### 서브에이전트별 작업 수 (Phase 1-5)

| 서브에이전트 | 작업 수 | 비율 |
|------------|---------|------|
| **fullstack-developer** | 88개 | 72% |
| **devops-troubleshooter** | 24개 | 20% |
| **code-reviewer** | 14개 | 11% |
| **security-auditor** | 8개 | 7% |
| **general-purpose** | 0개 | 0% (분석 단계에서만 사용) |

### 자동화 방식별 분류

| 자동화 방식 | 작업 수 | 비율 |
|-----------|---------|------|
| **수동** | 118개 | 97% |
| **API자동** | 15개 | 12% |

### 외부 협력 AI 사용 현황

| AI 도구 | 사용 작업 수 | 용도 |
|---------|------------|------|
| **Claude (웹)** | 전체 | 그리드 관리, 핵심 로직 |
| **Gemini (웹)** | 전체 | 음성 명령 입력 |
| **ChatGPT API** | 3개 | AI 평가, 감정 분석, 행동 분석 |
| **Perplexity** | 필요시 | 최신 기술 정보 |
| **Python Converter** | 자동 | CSV → Excel 변환 |

---

## 🚀 실행 방법

### 1단계: 서브에이전트 호출
```
"P1F1 작업을 fullstack-developer 서브에이전트로 실행해줘"
```

### 2단계: 외부 AI 협력 (필요시)
```
[Gemini] 음성 명령 → 텍스트 정제
[Claude] 복잡한 로직 설계
[ChatGPT] 기술 용어 확인
```

### 3단계: 자동화 트리거 (API자동)
```python
# 예: P1D13 테스트 데이터 시딩 (API자동)
def seed_test_data():
    # 자동으로 실행되는 스크립트
    pass
```

---

## 🎯 다음 단계

1. ✅ CSV에 "담당AI" 컬럼 업데이트
2. ✅ Excel 재생성
3. 🔜 Phase 1 작업 시작
4. 🔜 실시간 진행 현황 추적

---

**작성 완료일**: 2025-10-15
**적용 대상**: Phase 1-5 (MVP)
**총 작업 수**: 61개

**철학**: "AI 수십 개가 동시에 일한다 - 기간은 의미 없음"
