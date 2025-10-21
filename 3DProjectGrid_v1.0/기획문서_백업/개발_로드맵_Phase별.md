# Politician Finder 개발 로드맵 (Phase별)

## 🏗️ Phase 1: 프로젝트 기반 구축

**목표**: 개발 환경 완벽 세팅 + 인증 시스템 완성

### 📦 순차적 작업 (반드시 순서대로)

#### 1-1. 환경 구축
```
1. 프로젝트 폴더 생성
2. Git 저장소 초기화
3. Frontend: Next.js 14 + TypeScript 프로젝트 생성
4. Backend: FastAPI 프로젝트 구조 생성
5. 의존성 설치 (package.json, requirements.txt)
```

**체크포인트**: 프로젝트 실행 확인 (`npm run dev`, `uvicorn main:app --reload`)

---

#### 1-2. 인프라 설정
```
1. Supabase 계정 생성 → PostgreSQL DB 프로비저닝
2. Vercel 프로젝트 생성 (Frontend)
3. Railway/Render 프로젝트 생성 (Backend)
4. 환경 변수 파일 생성 (.env.local, .env)
5. DB 연결 테스트
```

**체크포인트**: DB 연결 성공, 빈 테이블 조회 가능

---

#### 1-3. 데이터베이스 설계
```
1. SQLAlchemy Base 모델 작성
2. 테이블 모델 작성 (순서 중요):
   ① User 모델
   ② Politician 모델
   ③ Post 모델
   ④ Comment 모델 (Post 참조)
   ⑤ Vote 모델
   ⑥ Rating 모델
   ⑦ AIScore 모델 (다중 AI 지원 구조)
   ⑧ Notification 모델
   ⑨ Bookmark 모델
   ⑩ Report 모델
3. 관계(Relationship) 정의
4. 인덱스 설계
5. Alembic 초기화 및 마이그레이션
```

**체크포인트**: `alembic upgrade head` 실행 성공, 모든 테이블 생성 확인

---

### 🔀 병렬 작업 (DB 완성 후 동시 진행 가능)

#### 1-A. Backend: 인증 시스템 (Backend Agent)
```
✅ app/core/security.py
   - 비밀번호 해싱 (bcrypt)
   - JWT 토큰 생성/검증
   - 토큰 만료 시간 설정

✅ app/schemas/user.py
   - UserCreate (회원가입)
   - UserLogin (로그인)
   - UserResponse (응답)
   - Token (토큰)

✅ app/services/auth_service.py
   - register_user()
   - login_user()
   - verify_token()
   - get_current_user()

✅ app/api/v1/auth.py
   - POST /api/v1/auth/register
   - POST /api/v1/auth/login
   - GET /api/v1/auth/me
   - POST /api/v1/auth/refresh
```

---

#### 1-B. Frontend: 인증 UI (Frontend Agent)
```
✅ src/lib/api.ts
   - Axios 인스턴스 생성
   - Request 인터셉터 (토큰 자동 추가)
   - Response 인터셉터 (에러 처리)

✅ src/store/authStore.ts (Zustand)
   - 로그인 상태 관리
   - 사용자 정보 저장
   - 토큰 저장/삭제
   - 로그아웃

✅ src/components/auth/SignupForm.tsx
   - React Hook Form + Zod
   - 이메일, 닉네임, 비밀번호 입력
   - 클라이언트 검증

✅ src/components/auth/LoginForm.tsx
   - 이메일, 비밀번호 입력
   - 로그인 처리

✅ src/app/signup/page.tsx
✅ src/app/login/page.tsx
```

---

#### 1-C. 공통 컴포넌트 (Frontend Agent)
```
✅ src/components/layout/Header.tsx
✅ src/components/layout/Footer.tsx
✅ src/components/layout/Navigation.tsx
✅ src/components/shared/Loading.tsx
✅ src/components/shared/ErrorBoundary.tsx
✅ Tailwind 전역 스타일 설정
```

---

### ✅ Phase 1 완료 기준
- [ ] 회원가입 작동 (DB에 사용자 저장)
- [ ] 로그인 작동 (JWT 토큰 발급)
- [ ] 토큰으로 보호된 API 호출 가능
- [ ] 데이터베이스 모든 테이블 생성 완료
- [ ] Vercel/Railway 배포 파이프라인 구축

---

## 🚀 Phase 2: 핵심 기능 개발

**목표**: 정치인 시스템 + 커뮤니티 기본 기능

### 📦 순차적 작업

#### 2-1. 정치인 기본 데이터 준비
```
1. 테스트용 정치인 데이터 50명 준비
2. scripts/seed_politicians.py 작성
3. 정치인 프로필 이미지 수집 (또는 placeholder)
4. Claude AI 평가 점수 더미 데이터 생성
5. DB 시딩 실행
```

**체크포인트**: DB에 정치인 50명 + AI 점수 저장 확인

---

### 🔀 병렬 작업 (시딩 후 동시 진행)

#### 2-A. Backend: 정치인 API (Backend Agent)
```
✅ app/schemas/politician.py
   - PoliticianResponse
   - PoliticianDetail
   - PoliticianRanking

✅ app/schemas/ai_score.py
   - AIScoreResponse
   - AIScoreDetail

✅ app/services/politician_service.py
   - get_politicians() (필터링, 정렬, 페이징)
   - get_politician_detail()
   - get_politician_ranking() (전체/지역/당/직급)

✅ app/services/ai_score_service.py
   - get_ai_score()
   - calculate_ranking()
   - get_score_details()

✅ app/api/v1/politicians.py
   - GET /api/v1/politicians (목록)
   - GET /api/v1/politicians/{id} (상세)
   - GET /api/v1/politicians/{id}/ai-score (AI 점수)
   - GET /api/v1/politicians/ranking (랭킹)
```

---

#### 2-B. Frontend: 정치인 페이지 (Frontend Agent)
```
✅ src/types/politician.ts
   - Politician 인터페이스
   - AIScore 인터페이스

✅ src/hooks/usePoliticians.ts (TanStack Query)
   - useGetPoliticians()
   - useGetPoliticianDetail()
   - useGetRanking()

✅ src/components/politician/PoliticianCard.tsx
   - 사진, 이름, 당, 지역, AI 점수
   - 클릭 시 상세 페이지 이동

✅ src/components/politician/AIScoreDisplay.tsx
   - 종합 점수 (숫자 + 별점)
   - 간단한 항목별 점수

✅ src/components/politician/AIScoreChart.tsx
   - Recharts 바 차트
   - 항목별 점수 시각화

✅ src/app/page.tsx (메인 페이지 개선)
   - AI 랭킹 섹션 (탭: 전체/지역/당/직급)
   - 정치인 카드 그리드

✅ src/app/politician/[id]/page.tsx
   - 정치인 프로필
   - AI 평가 상세
   - 시민 평가 섹션
   - 관련 게시글 섹션
```

---

#### 2-C. Backend: 게시글 API (Backend Agent)
```
✅ app/schemas/post.py
   - PostCreate
   - PostUpdate
   - PostResponse
   - PostDetail

✅ app/services/post_service.py
   - create_post()
   - get_posts() (필터링, 정렬, 페이징)
   - get_post_detail()
   - update_post()
   - delete_post()
   - increment_view_count()

✅ app/api/v1/posts.py
   - POST /api/v1/posts
   - GET /api/v1/posts (쿼리: category, politician_id, sort)
   - GET /api/v1/posts/{id}
   - PUT /api/v1/posts/{id}
   - DELETE /api/v1/posts/{id}
```

---

#### 2-D. Frontend: 커뮤니티 게시판 (Frontend Agent)
```
✅ src/types/post.ts
   - Post 인터페이스
   - PostCategory enum

✅ src/hooks/usePosts.ts (TanStack Query)
   - useGetPosts()
   - useGetPostDetail()
   - useCreatePost()
   - useUpdatePost()
   - useDeletePost()

✅ src/components/community/PostCard.tsx
   - 제목, 작성자, 작성일
   - 조회수 👁️, 댓글수 💬, 추천수 ⬆️
   - 정치인 뱃지 🏛️ (조건부)
   - HOT 🔥, 개념글 ⭐ 배지 (조건부)

✅ src/components/community/PostList.tsx
   - PostCard 배열 렌더링
   - 로딩/에러 상태

✅ src/components/community/PostDetail.tsx
   - 게시글 본문
   - 작성자 정보
   - 작성일시

✅ src/components/community/PostForm.tsx
   - 제목, 내용 입력
   - 카테고리 선택
   - 정치인 선택 (옵션)

✅ src/app/community/page.tsx
   - 카테고리 탭
   - 정렬 옵션 드롭다운 (최신/추천/조회)
   - PostList
   - 페이지네이션

✅ src/app/post/[id]/page.tsx
   - PostDetail
   - (댓글은 Phase 2 후반에 추가)

✅ src/app/write/page.tsx
   - PostForm
   - 인증 가드 (미로그인 시 리다이렉트)
```

---

#### 2-E. Backend: 댓글 & 투표 API (Backend Agent)
```
✅ app/schemas/comment.py
   - CommentCreate
   - CommentResponse
   - CommentTree (계층 구조)

✅ app/schemas/vote.py
   - VoteCreate
   - VoteResponse

✅ app/services/comment_service.py
   - create_comment()
   - get_comments_tree() (계층 구조)
   - update_comment()
   - delete_comment()

✅ app/services/vote_service.py
   - upvote() (게시글/댓글)
   - downvote()
   - cancel_vote()
   - get_vote_count()
   - update_best_status() (베스트글 자동 마킹)
   - update_concept_status() (개념글 자동 마킹)

✅ app/api/v1/comments.py
   - POST /api/v1/comments
   - GET /api/v1/posts/{post_id}/comments
   - PUT /api/v1/comments/{id}
   - DELETE /api/v1/comments/{id}

✅ app/api/v1/votes.py
   - POST /api/v1/votes (target_type, target_id, vote_type)
   - DELETE /api/v1/votes/{id}
   - GET /api/v1/votes/my
```

---

#### 2-F. Frontend: 댓글 & 투표 UI (Frontend Agent)
```
✅ src/types/comment.ts
   - Comment 인터페이스
   - CommentTree 타입

✅ src/hooks/useComments.ts
   - useGetComments()
   - useCreateComment()
   - useUpdateComment()
   - useDeleteComment()

✅ src/hooks/useVotes.ts
   - useUpvote()
   - useDownvote()
   - useCancelVote()

✅ src/components/community/VoteButtons.tsx
   - ⬆️ Upvote 버튼
   - ⬇️ Downvote 버튼
   - 투표수 표시
   - 낙관적 업데이트 (Optimistic Update)
   - 애니메이션 효과

✅ src/components/community/CommentItem.tsx
   - 댓글 내용
   - 작성자 (+ 🏛️ 뱃지)
   - VoteButtons
   - 답글 버튼
   - 수정/삭제 (본인만)

✅ src/components/community/CommentTree.tsx
   - 계층 구조 렌더링 (재귀)
   - 들여쓰기 표시

✅ src/components/community/CommentForm.tsx
   - 댓글 입력
   - 답글 입력 (parent_id)

✅ src/app/post/[id]/page.tsx 업데이트
   - VoteButtons 추가
   - CommentForm 추가
   - CommentTree 추가
```

---

#### 2-G. Backend: 평가 시스템 (Backend Agent)
```
✅ app/schemas/rating.py
   - RatingCreate
   - RatingResponse

✅ app/services/rating_service.py
   - rate_politician()
   - get_average_rating()
   - get_user_rating()
   - update_politician_avg_rating()

✅ app/api/v1/ratings.py
   - POST /api/v1/ratings
   - GET /api/v1/politicians/{id}/ratings
   - GET /api/v1/ratings/my
```

---

#### 2-H. Frontend: 평가 UI (Frontend Agent)
```
✅ src/components/politician/RatingStars.tsx
   - 별 5개 (1-5점)
   - 클릭 가능
   - 현재 점수 표시

✅ src/components/politician/RatingForm.tsx
   - RatingStars
   - 평가하기 버튼

✅ src/app/politician/[id]/page.tsx 업데이트
   - 시민 평가 섹션 추가
   - 평균 별점 표시
   - RatingForm 추가
```

---

### ✅ Phase 2 완료 기준
- [ ] 정치인 목록/상세 페이지 작동
- [ ] Claude AI 평가 점수 표시
- [ ] 게시글 작성/조회/수정/삭제 작동
- [ ] 댓글/답글 작성 작동
- [ ] 추천/비추천 작동
- [ ] 베스트글 🔥, 개념글 ⭐ 자동 마킹
- [ ] 시민 평가 (별점) 작동

---

## 💎 Phase 3: 커뮤니티 고급 기능

**목표**: 클리앙 스타일 기능 + 정치인 전용 + 관리자

### 🔀 병렬 작업 (모두 동시 진행 가능)

#### 3-A. Backend: 알림 시스템 (Backend Agent)
```
✅ app/schemas/notification.py
   - NotificationResponse

✅ app/services/notification_service.py
   - create_notification()
   - get_user_notifications()
   - mark_as_read()
   - mark_all_as_read()
   - delete_notification()
   - 자동 알림 생성:
     • 내 글에 댓글 (on_comment_created)
     • 내 댓글에 답글 (on_reply_created)
     • 멘션 (@username)

✅ app/api/v1/notifications.py
   - GET /api/v1/notifications
   - PUT /api/v1/notifications/{id}/read
   - PUT /api/v1/notifications/read-all
   - DELETE /api/v1/notifications/{id}
```

---

#### 3-B. Frontend: 알림 UI (Frontend Agent)
```
✅ src/components/layout/NotificationBell.tsx
   - 🔔 아이콘 (Header에 배치)
   - 읽지 않은 알림 개수 배지
   - 드롭다운 목록
   - 클릭 시 해당 게시글/댓글로 이동

✅ src/hooks/useNotifications.ts
   - useGetNotifications()
   - useMarkAsRead()
   - 폴링 (30초마다 새 알림 확인) 또는 WebSocket

✅ src/app/mypage/page.tsx
   - 알림 내역 탭 추가
```

---

#### 3-C. Backend: 북마크 시스템 (Backend Agent)
```
✅ app/schemas/bookmark.py
   - BookmarkResponse

✅ app/services/bookmark_service.py
   - add_bookmark()
   - remove_bookmark()
   - get_my_bookmarks()
   - is_bookmarked()

✅ app/api/v1/bookmarks.py
   - POST /api/v1/bookmarks
   - DELETE /api/v1/bookmarks/{id}
   - GET /api/v1/bookmarks/my
```

---

#### 3-D. Frontend: 북마크 UI (Frontend Agent)
```
✅ src/components/community/BookmarkButton.tsx
   - ⭐ 아이콘
   - 북마크 추가/제거 토글
   - 낙관적 업데이트

✅ src/app/post/[id]/page.tsx 업데이트
   - BookmarkButton 추가

✅ src/app/mypage/page.tsx 업데이트
   - 북마크한 글 탭 추가
```

---

#### 3-E. Backend: 신고 시스템 (Backend Agent)
```
✅ app/schemas/report.py
   - ReportCreate
   - ReportResponse
   - ReportReason enum

✅ app/services/report_service.py
   - create_report()
   - get_reports() (관리자 전용)
   - resolve_report()
   - dismiss_report()

✅ app/api/v1/reports.py
   - POST /api/v1/reports
   - GET /api/v1/admin/reports (관리자)
   - PUT /api/v1/admin/reports/{id}/resolve
   - PUT /api/v1/admin/reports/{id}/dismiss
```

---

#### 3-F. Frontend: 신고 UI (Frontend Agent)
```
✅ src/components/community/ReportDialog.tsx
   - 🚨 신고하기 버튼
   - 신고 사유 선택 (spam, abuse, inappropriate, etc.)
   - 상세 설명 입력
   - shadcn/ui Dialog 사용

✅ src/app/post/[id]/page.tsx 업데이트
   - ReportDialog 추가 (게시글용)

✅ src/components/community/CommentItem.tsx 업데이트
   - ReportDialog 추가 (댓글용)
```

---

#### 3-G. Backend: 정치인 인증 시스템 (Backend Agent)
```
✅ app/schemas/politician_auth.py
   - PoliticianAuthRequest
   - PoliticianAuthResponse

✅ app/services/politician_auth_service.py
   - request_auth()
   - approve_auth() (관리자)
   - reject_auth() (관리자)
   - verify_phone/email() (간단한 인증)

✅ app/api/v1/auth.py 업데이트
   - POST /api/v1/auth/politician/request
   - POST /api/v1/auth/politician/verify
   - PUT /api/v1/admin/politician-auth/{id}/approve
   - PUT /api/v1/admin/politician-auth/{id}/reject
```

---

#### 3-H. Frontend: 정치인 인증 UI (Frontend Agent)
```
✅ src/app/politician/auth/page.tsx
   - 정치인 선택 (드롭다운)
   - 본인 인증 (휴대폰/이메일)
   - 인증 대기 상태 표시
   - 승인/거부 알림
```

---

#### 3-I. Backend: 관리자 API (Backend Agent)
```
✅ app/api/deps.py 업데이트
   - require_admin() 의존성

✅ app/api/v1/admin.py
   - GET /api/v1/admin/dashboard (통계)
   - GET /api/v1/admin/posts (게시글 관리)
   - DELETE /api/v1/admin/posts/{id}
   - GET /api/v1/admin/users (회원 관리)
   - PUT /api/v1/admin/users/{id}/ban
   - GET /api/v1/admin/politicians (정치인 관리)
   - POST /api/v1/admin/politicians (정치인 추가)
   - PUT /api/v1/admin/politicians/{id}
   - DELETE /api/v1/admin/politicians/{id}
   - PUT /api/v1/admin/ai-scores/{politician_id} (AI 점수 수정)
```

---

#### 3-J. Frontend: 관리자 페이지 (Frontend Agent)
```
✅ src/app/admin/layout.tsx
   - 관리자 전용 레이아웃
   - 사이드바 네비게이션
   - 권한 체크 (관리자 아니면 리다이렉트)

✅ src/app/admin/page.tsx (대시보드)
   - 통계 카드 (일일 가입자, 게시글, 댓글)
   - Recharts 차트 (일별 추이)

✅ src/app/admin/posts/page.tsx
   - 게시글 목록 테이블
   - 삭제 버튼 (사유 입력)
   - 검색/필터링

✅ src/app/admin/users/page.tsx
   - 회원 목록 테이블
   - 차단 버튼 (IP 차단 옵션)

✅ src/app/admin/politicians/page.tsx
   - 정치인 목록 테이블
   - 추가/수정/삭제
   - 이미지 업로드

✅ src/app/admin/reports/page.tsx
   - 신고 목록 테이블
   - 처리 (해결/기각)
   - 신고 대상 바로가기

✅ src/app/admin/ai-scores/page.tsx
   - 정치인별 AI 점수 입력/수정
   - 항목별 점수 입력
```

---

#### 3-K. Frontend: 마이페이지 완성 (Frontend Agent)
```
✅ src/app/mypage/page.tsx 완성
   - 프로필 정보
   - 내가 쓴 글 탭
   - 내가 쓴 댓글 탭
   - 북마크한 글 탭
   - 알림 내역 탭
   - 회원 등급 & 포인트 표시
   - 정보 수정 버튼
```

---

#### 3-L. Backend: 검색 기능 (Backend Agent)
```
✅ app/services/search_service.py
   - search_posts() (제목, 내용)
   - search_politicians() (이름, 지역, 당)
   - PostgreSQL Full-text search 또는 LIKE 쿼리

✅ app/api/v1/search.py
   - GET /api/v1/search/posts?q=검색어
   - GET /api/v1/search/politicians?q=검색어
```

---

#### 3-M. Frontend: 검색 UI (Frontend Agent)
```
✅ src/components/shared/SearchBar.tsx
   - Header에 배치
   - 검색어 입력
   - 자동완성 (옵션)

✅ src/app/search/page.tsx
   - 검색 결과 페이지
   - 게시글 결과
   - 정치인 결과
   - 탭으로 구분
```

---

### ✅ Phase 3 완료 기준
- [ ] 알림 시스템 작동 (댓글/답글 알림)
- [ ] 북마크 기능 작동
- [ ] 신고 기능 작동
- [ ] 정치인 인증 시스템 작동
- [ ] 관리자 페이지 모든 기능 작동
- [ ] 마이페이지 완성
- [ ] 검색 기능 작동

---

## 🧪 Phase 4: 테스트 & 배포

**목표**: 품질 보증 + 프로덕션 배포

### 🔀 병렬 작업

#### 4-A. Backend 테스트 (Test Agent)
```
✅ app/tests/test_auth.py
   - 회원가입 성공/실패
   - 로그인 성공/실패
   - 토큰 검증
   - 권한 체크

✅ app/tests/test_posts.py
   - 게시글 CRUD
   - 필터링/정렬
   - 권한 검증
   - 조회수 증가

✅ app/tests/test_comments.py
   - 댓글 CRUD
   - 계층 구조
   - 대댓글

✅ app/tests/test_votes.py
   - 투표 생성/취소
   - 중복 투표 방지
   - 투표수 업데이트
   - 베스트글/개념글 자동 마킹

✅ app/tests/test_admin.py
   - 관리자 권한 체크
   - 게시글/회원 관리

✅ 커버리지 70% 이상 목표
```

---

#### 4-B. Frontend 테스트 (Test Agent)
```
✅ 컴포넌트 단위 테스트 (Vitest)
   - PoliticianCard.test.tsx
   - PostCard.test.tsx
   - VoteButtons.test.tsx
   - CommentItem.test.tsx

✅ E2E 테스트 (Playwright)
   - 회원가입 → 로그인 플로우
   - 게시글 작성 → 댓글 → 투표 플로우
   - 정치인 상세 → 평가 플로우
   - 관리자 로그인 → 게시글 삭제 플로우
```

---

#### 4-C. 성능 최적화 (Backend Agent + Frontend Agent)
```
Backend:
✅ 데이터베이스 인덱스 추가
   - posts(category, created_at)
   - posts(upvotes DESC)
   - comments(post_id, created_at)
   - votes(target_type, target_id, user_id)
✅ N+1 쿼리 해결 (SQLAlchemy eager loading)
✅ API 응답 캐싱 (Redis - 선택)
✅ Rate Limiting (slowapi)

Frontend:
✅ next/image 사용 (모든 이미지)
✅ 동적 임포트 (큰 컴포넌트)
✅ 번들 크기 최적화 (@next/bundle-analyzer)
✅ Lighthouse 점수 90+ 달성
```

---

#### 4-D. 보안 강화 (Backend Agent)
```
✅ CORS 설정 (허용 도메인만)
✅ SQL Injection 방지 (SQLAlchemy ORM 사용)
✅ XSS 방지 (입력 검증, 출력 이스케이프)
✅ CSRF 방지 (CSRF 토큰)
✅ Rate Limiting (API 요청 제한)
✅ 비밀번호 강도 검증
✅ JWT 토큰 만료 시간 설정
✅ HTTPS 강제 (프로덕션)
```

---

#### 4-E. 배포 준비 (DevOps Agent)
```
✅ 환경 변수 프로덕션 설정
   - DB 연결 문자열
   - JWT 시크릿 키
   - API 키 (향후 AI API용)
   - CORS 허용 도메인

✅ Vercel 배포 (Frontend)
   - GitHub 연동
   - 자동 배포 설정
   - 환경 변수 설정

✅ Railway/Render 배포 (Backend)
   - Dockerfile 작성
   - 데이터베이스 마이그레이션 자동화
   - 헬스 체크 엔드포인트 (/health)

✅ PostgreSQL 백업 설정
   - 자동 백업 스케줄 (매일)
   - 백업 보관 정책 (7일)

✅ 도메인 연결 (선택)
   - 도메인 구매
   - DNS 설정
   - SSL 인증서 (Let's Encrypt)
```

---

#### 4-F. 모니터링 & 로깅 (DevOps Agent)
```
✅ Sentry 에러 트래킹
   - Frontend Sentry SDK
   - Backend Sentry SDK
   - 에러 알림 설정

✅ 로그 수집
   - Logflare/Logtail
   - 로그 레벨 설정 (INFO, WARNING, ERROR)

✅ Uptime 모니터링
   - UptimeRobot (5분 간격)
   - 다운타임 알림 (이메일/SMS)

✅ 애널리틱스 (선택)
   - Google Analytics 4
   - 주요 이벤트 트래킹
```

---

#### 4-G. 프로덕션 데이터 준비
```
✅ 실제 정치인 데이터 50-100명 입력
   - 이름, 당, 지역, 직급, 사진
✅ Claude AI 평가 점수 입력
   - Phase 1: 더미 데이터 또는 간단한 평가
   - 100개 항목 평가는 Phase 2+에서
✅ 공지사항 게시글 작성
✅ 이용약관/개인정보처리방침 페이지
```

---

#### 4-H. 베타 테스트
```
✅ 내부 테스트 (개발자 + 지인 5-10명)
   - 모든 기능 동작 확인
   - 버그 리포트 수집
   - 긴급 버그 핫픽스

✅ 베타 사용자 초대 (10-20명)
   - 피드백 폼 생성 (Typeform/Google Forms)
   - 피드백 수집 및 분석
   - 중요 피드백 반영

✅ 성능 테스트
   - 동시 접속자 100명 테스트
   - API 응답 시간 측정 (목표: <200ms)
   - 병목 지점 파악 및 개선
```

---

### ✅ Phase 4 완료 기준
- [ ] 모든 핵심 기능 테스트 통과
- [ ] 테스트 커버리지 70% 이상
- [ ] Lighthouse 점수 90 이상
- [ ] 프로덕션 배포 완료
- [ ] 모니터링 시스템 작동
- [ ] 베타 테스트 완료 (치명적 버그 0개)

---

## 🎯 향후 로드맵 (MVP 이후)

### Phase 5: 다중 AI 평가 시스템

```
⬜ GPT API 연동
⬜ Gemini API 연동
⬜ Perplexity API 연동
⬜ Grok API 연동
⬜ 5개 AI 평가 점수 수집 로직
⬜ 종합 점수 계산 알고리즘 (가중 평균)
⬜ AI별 가중치 조정 기능
⬜ AI 비교 차트/그래프 (Recharts)
⬜ AI별 상세 분석 페이지
```

**병렬 작업**:
- Backend Agent: AI API 호출 로직
- Frontend Agent: 비교 차트 UI
- Database Agent: ai_scores 테이블 확장

---

### Phase 6: 연결 서비스 플랫폼

```
⬜ 서비스 업체 등록 시스템
⬜ 카테고리별 업체 리스트 페이지
⬜ 업체 상세 정보 페이지
⬜ 문의 시스템 (정치인 → 업체)
⬜ 수수료 정산 시스템
⬜ 업체 관리 (관리자)
```

**새로운 테이블**:
- services (서비스 업체)
- service_categories (카테고리)
- service_inquiries (문의)

---

### Phase 7: AI 아바타 소통 기능

```
⬜ Claude/GPT API 기반 챗봇
⬜ 정치인별 학습 데이터 구축
⬜ 실시간 채팅 (WebSocket)
⬜ 음성 대화 (TTS/STT - 선택)
⬜ 대화 히스토리 관리
⬜ 아바타 활성화 승인 시스템 (관리자)
```

**새로운 테이블**:
- avatar_chats (대화 로그)
- avatar_settings (아바타 설정)

---

## 🔧 에이전트 작업 프로토콜

### 순차적 작업 규칙
1. **의존성 확인**: 이전 단계 완료 후 시작
2. **체크포인트 검증**: 각 단계 완료 기준 확인
3. **다음 단계 준비**: 필요한 데이터/파일 준비

### 병렬 작업 규칙
1. **독립성 확인**: 서로 의존하지 않는 작업만 병렬
2. **통합 시점 명확화**: 언제 통합할지 미리 정의
3. **충돌 방지**: 같은 파일 동시 수정 금지

### Master Claude 역할
1. **작업 분배**: Phase별 작업을 에이전트에게 할당
2. **진행 상황 모니터링**: 각 에이전트 진행률 확인
3. **통합 및 검증**: 에이전트 결과물 통합 후 테스트
4. **외부 AI 활용**: 막힐 때 ChatGPT/Gemini 의견 참고
5. **최종 의사결정**: 기술 선택, 우선순위 결정

---

## ✅ 최종 체크리스트 (MVP 출시 전)

### 기능
- [ ] 회원가입/로그인 작동
- [ ] 정치인 목록/상세 작동
- [ ] Claude AI 평가 표시
- [ ] 게시글 CRUD 작동
- [ ] 댓글/답글 작동
- [ ] 추천/비추천 작동
- [ ] 알림 작동
- [ ] 북마크 작동
- [ ] 신고 작동
- [ ] 관리자 페이지 작동

### 품질
- [ ] 모바일 반응형 완벽
- [ ] Lighthouse 90+
- [ ] 테스트 커버리지 70%+
- [ ] 보안 체크 (OWASP Top 10)
- [ ] 주요 API 응답 < 200ms

### 배포
- [ ] Vercel 배포 성공
- [ ] Railway/Render 배포 성공
- [ ] DB 백업 설정
- [ ] 모니터링 설정
- [ ] 에러 트래킹 작동

### 콘텐츠
- [ ] 정치인 50명+ 데이터
- [ ] AI 평가 점수 입력
- [ ] 이용약관/개인정보처리방침
- [ ] 공지사항

---

**슬로건**: 훌륭한 정치인을 찾아드립니다 🏛️

작성일: 2025-10-11
작성자: Claude (Master Agent)
버전: 2.0 (Phase별 정리)
