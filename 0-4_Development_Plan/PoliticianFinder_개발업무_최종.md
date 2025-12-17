# PoliticianFinder 개발 업무 최종

**작성일**: 2025-10-30
**기준**: HTML 목업 29개 파일 → 생성파일 기준 업무 분류
**원칙**: 1개 생성파일 = 1개 업무 (한 파일에서 처리 가능한 모든 기능 포함)

---

## 작업 분류 원칙

### ✅ 생성파일 기준
- **1개 파일 = 1개 업무**
- 한 파일에서 처리 가능한 모든 기능은 하나로 묶음
- 테스트 가능한 최소 단위
- 진도: 파일 생성 완료 = 100%

### 예시
```
업무: "회원가입 페이지"
생성파일: app/signup/page.tsx
포함 기능: 5개 필드 + 약관 모달 + 검증 + 구글 소셜로그인
테스트: 페이지 렌더링 + 회원가입 E2E
```

---

## 1단계(Phase 1): 인증 시스템 (20개)

**1단계(Phase 1) 개발 영역(Area) 순서**: DevOps → Database → Backend Infrastructure → Backend APIs → Frontend → Security → Test

### DevOps 영역(DevOps Area) (O) - 1개

**🔗 그룹 A: 프로젝트 기반**
1. ⚡ **프로젝트 초기화** - `package.json`, `next.config.js`, `tailwind.config.js`, `.env.local`
   - Next.js 14 설정
   - Tailwind CSS 설정
   - ESLint, Prettier
   - 환경변수 템플릿

### Database 영역(Database Area) (D) - 5개

**🔗 그룹 B: 인증 스키마**
2. ⬅️ **인증 스키마** - `supabase/migrations/001_auth_schema.sql` (← 1)
   - profiles 테이블
   - auth_tokens 테이블
   - email_verifications 테이블
   - password_resets 테이블
   - 인덱스 생성
   - RLS 정책

3. ⬅️ **트리거** - `supabase/migrations/002_auth_triggers.sql` (← 2)
   - profiles.updated_at 자동 갱신
   - auth.users 생성 시 profiles 자동 생성

4. ⬅️ **시드 데이터** - `supabase/seed_dev.sql` (← 2)
   - 테스트 계정 생성

5. ⬅️ **타입 생성** - `lib/database.types.ts` (← 2)
   - Supabase CLI로 타입 생성

6. ⬅️ **Supabase 프로젝트 설정** - Supabase 콘솔 설정 (← 2)
   - 프로젝트 생성
   - API 키 발급

### Backend Infrastructure 영역(Backend Infrastructure Area) (BI) - 3개

**🔗 그룹 C: 인프라 설정**
7. ⬅️ **Supabase 클라이언트** - `lib/supabase/client.ts` (← 2, 5, 6)
   - 클라이언트 설정
   - Auth 헬퍼 함수

8. ⚡ **API 미들웨어** - `middleware.ts`
   - JWT 검증
   - Rate Limiting
   - CORS 설정

18. ⚡ **인증 보안 설정** - `lib/security/auth.ts`
    - 비밀번호 강도 검증
    - Rate Limiting 규칙
    - CSRF 토큰

### Backend APIs 영역(Backend APIs Area) (BA) - 4개

**🔗 그룹 D: 인증 API**
9. ⬅️ **회원가입 API** - `app/api/auth/signup/route.ts` (← 7, 8)
   - 이메일 중복 체크
   - 비밀번호 해싱
   - 프로필 생성
   - 이메일 인증 발송

10. ⬅️ **로그인 API** - `app/api/auth/login/route.ts` (← 7, 8)
    - 이메일/비밀번호 검증
    - JWT 토큰 발급
    - Refresh Token 처리
    - 세션 생성

11. ⬅️ **구글 OAuth API** - `app/api/auth/google/route.ts` (← 7, 8)
    - 구글 OAuth 콜백
    - 계정 연동/생성
    - JWT 발급

12. ⬅️ **비밀번호 재설정 API** - `app/api/auth/reset-password/route.ts` (← 7, 8)
    - 재설정 이메일 발송
    - 토큰 검증
    - 비밀번호 업데이트

### Frontend 영역(Frontend Area) (F) - 5개

**🔗 그룹 E: 레이아웃 (기반)**
13. ⬅️ **전역 레이아웃** - `app/layout.tsx` (← 7)
    - 헤더 (네비게이션, 알림 아이콘, 로그인/회원가입 버튼)
    - 푸터
    - AuthContext Provider

14. ⬅️ **홈 페이지** - `app/page.tsx` (← 13)
    - 랜딩 페이지
    - 서비스 소개

**🔗 그룹 F: 인증 페이지**
15. ⬅️ **회원가입 페이지** - `app/signup/page.tsx` (← 9, 13)
    - 5개 필드 (이메일, 비밀번호, 비밀번호확인, 닉네임, 실명)
    - 3개 약관 모달 (이용약관, 개인정보, 마케팅)
    - 구글 소셜로그인
    - 클라이언트 검증

16. ⬅️ **로그인 페이지** - `app/login/page.tsx` (← 10, 11, 13)
    - 이메일/비밀번호
    - 로그인 상태 유지
    - 구글 소셜로그인
    - 비밀번호 찾기 링크

17. ⬅️ **비밀번호 재설정 페이지** - `app/password-reset/page.tsx` (← 12, 13)
    - 4단계 UI (이메일 입력 → 발송 확인 → 새 비밀번호 → 완료)
    - 비밀번호 강도 표시
    - 요구사항 체크
    - 보기/숨기기 토글

### Test 영역(Test Area) (T) - 2개

**🔗 그룹 H: 테스트**
19. ⬅️ **인증 E2E 테스트** - `e2e/auth.spec.ts` (← 15, 16, 17)
    - 회원가입 플로우
    - 로그인 플로우
    - 비밀번호 재설정

20. ⬅️ **인증 API 테스트** - `tests/api/auth.test.ts` (← 9, 10, 11, 12)
    - 회원가입 API
    - 로그인 API
    - 토큰 검증

**1단계(Phase 1) 완료 시 생성파일**: 20개

**의존성 체인**: 1(DevOps) → 2-6(Database) → 7-8(Infrastructure) → 9-12(APIs) → 13-17(Frontend) → 18(Security, 병렬) → 19-20(Test)

---

## 2단계(Phase 2): 정치인 시스템 (24개)

### Frontend 영역(Frontend Area) (F) - 3개

**🔗 그룹 E: 정치인 페이지**
21. ⬅️ **정치인 목록 페이지** - `app/politicians/page.tsx` (← 1단계(Phase 1))
    - 검색/필터 (10개 정당, 17개 지역, 6개 직책)
    - 정렬 (AI평점순, 회원평점순, 이름순)
    - 정치인 카드 (AI평점, 회원평점, 등급, 즐겨찾기)
    - 무한 스크롤

22. ⬅️ **정치인 상세 페이지** - `app/politicians/[id]/page.tsx` (← 21)
    - 기본 정보
    - AI 평가 정보 (5개 AI, 시계열 그래프 Chart.js)
    - AI 평가내역 모달 (10개 분야)
    - 상세보고서 구매 섹션 (본인 인증 필수)
    - 커뮤니티 활동 정보
    - 선관위 공식 정보

23. ⬅️ **관심 정치인 페이지** - `app/favorites/page.tsx` (← 21)
    - 관심 정치인 목록
    - 검색/추가/삭제

### Backend 영역(Backend Area) (B) - 11개

**🔗 그룹 F: 정치인 API**
24. ⬅️ **정치인 목록 API** - `app/api/politicians/route.ts` (← Database)
    - GET 목록
    - 검색
    - 필터링 (정당, 지역, 직책)
    - 정렬
    - 페이지네이션

25. ⬅️ **정치인 상세 API** - `app/api/politicians/[id]/route.ts` (← 24)
    - GET 상세 정보
    - 모든 관련 데이터 조인

26. ⚡ **관심 정치인 API** - `app/api/favorites/route.ts`
    - POST 추가
    - DELETE 제거
    - GET 목록

27. ⚡ **정치인 이메일 인증 API** - `app/api/politicians/verification/route.ts`
    - POST 이메일 인증 요청/확인

**🔗 그룹 G: AI 평가 연동**
28. ⬅️ **AI 평가 요청 API** - `app/api/evaluations/request/route.ts` (← 평가 엔진)
    - POST 평가 요청 (평가 엔진 호출)

29. ⬅️ **AI 평가 결과 API** - `app/api/evaluations/[id]/route.ts` (← 28)
    - GET 평가 결과
    - GET 시계열 데이터

**🔗 그룹 H: 데이터 수집**
30. ⚡ **선관위 크롤링 스크립트** - `scripts/crawl-nec.ts`
    - 선관위 API/크롤링
    - 정치인 기본 정보 수집

31. ⚡ **정치인 데이터 시딩** - `scripts/seed-politicians.ts`
    - 정치인 50명 데이터 삽입

32. ⚡ **정치인 이미지 업로드 헬퍼** - `lib/storage/politicians.ts`
    - Supabase Storage 업로드

33. ⚡ **정치인 데이터 유틸** - `lib/utils/politicians.ts`
    - 데이터 정규화
    - 검색 필터링 헬퍼

43. ⚡ **정치인 데이터 보안** - `lib/security/politicians.ts`
    - 크롤링 Rate Limiting
    - 이미지 업로드 검증

### Database 영역(Database Area) (D) - 7개

**🔗 그룹 I: 정치인 스키마**
34. ⚡ **정치인 스키마** - `supabase/migrations/003_politicians_schema.sql`
    - politicians 테이블
    - politician_details 테이블
    - political_parties 테이블
    - constituencies 테이블
    - positions 테이블
    - promises 테이블
    - voting_records 테이블
    - activity_logs 테이블
    - 인덱스 생성
    - Full-text search 인덱스
    - RLS 정책

35. ⚡ **관심 정치인 스키마** - `supabase/migrations/004_favorites_schema.sql`
    - favorite_politicians 테이블
    - 복합 인덱스
    - RLS 정책

36. ⚡ **AI 평가 스키마** - `supabase/migrations/005_evaluations_schema.sql`
    - ai_evaluations 테이블 (평가 엔진 연동용)
    - evaluation_cache 테이블
    - 인덱스
    - RLS 정책

37. ⚡ **정치인 시드 데이터** - `supabase/seed_politicians.sql`
    - 정당 데이터 (10개)
    - 지역 데이터 (17개)
    - 직책 데이터 (6개)

38. ⚡ **Supabase Storage 버킷** - Supabase 콘솔 설정
    - politicians-images 버킷 생성
    - RLS 정책

39. ⬅️ **정치인 트리거** - `supabase/migrations/006_politicians_triggers.sql` (← 34-35)
    - 통계 자동 업데이트

40. ⚡ **타입 업데이트** - `lib/database.types.ts`
    - 타입 재생성

### Test 영역(Test Area) (T) - 2개

41. ⬅️ **정치인 E2E 테스트** - `e2e/politicians.spec.ts` (← 21-26)
    - 목록 검색
    - 상세 페이지
    - 관심 등록

42. ⬅️ **정치인 API 테스트** - `tests/api/politicians.test.ts` (← 24-26)
    - 목록 API
    - 필터링
    - 검색

### DevOps 영역(DevOps Area) (O) - 1개

44. ⚡ **크롤링 스케줄러** - `.github/workflows/crawl-politicians.yml`
    - 주기적 데이터 수집

**2단계(Phase 2) 완료 시 생성파일**: 44개 (누적)

---

## 3단계(Phase 3): 커뮤니티 시스템 (32개)


**3단계(Phase 3) 개발 영역(Area) 순서**: Database → Backend Utilities → Backend APIs → Frontend → Test/Security/DevOps

### Database 영역(Database Area) (D) - 8개

**🔗 그룹 Q: 커뮤니티 스키마**
63. ⚡ **게시글 스키마** - `supabase/migrations/007_posts_schema.sql`
    - posts 테이블
    - board_types 테이블 (2개: 정치인/회원)
    - post_politician_tags 테이블
    - post_attachments 테이블
    - post_views 테이블
    - 인덱스
    - Full-text search
    - RLS 정책

64. ⚡ **댓글 스키마** - `supabase/migrations/008_comments_schema.sql`
    - comments 테이블 (author_type: 회원/정치인)
    - 인덱스
    - RLS 정책

65. ⚡ **공감/공유 스키마** - `supabase/migrations/009_votes_shares_schema.sql`
    - votes 테이블
    - shares 테이블
    - 복합 인덱스
    - RLS 정책

66. ⚡ **팔로우 스키마** - `supabase/migrations/010_follows_schema.sql`
    - follows 테이블
    - 복합 인덱스
    - RLS 정책

67. ⚡ **알림 스키마** - `supabase/migrations/011_notifications_schema.sql`
    - notifications 테이블 (7가지 type)
    - 인덱스
    - RLS 정책

68. ⬅️ **커뮤니티 트리거** - `supabase/migrations/012_community_triggers.sql` (← 63-67)
    - 댓글 수 자동 업데이트
    - 공감 수 자동 업데이트
    - 알림 자동 생성

69. ⚡ **Supabase Storage 버킷** - Supabase 콘솔
    - post-attachments 버킷
    - RLS 정책

70. ⚡ **타입 업데이트** - `lib/database.types.ts`


### Backend 영역(Backend Area) (B) - 13개

**🔗 그룹 K: 게시글 API**
51. ⬅️ **게시글 생성 API** - `app/api/posts/route.ts` (← Database)
    - POST 게시글 (회원/정치인 구분)
    - 정치인 태그 저장
    - 첨부파일 업로드

52. ⚡ **게시글 목록 API** - `app/api/posts/route.ts`
    - GET 목록
    - 카테고리 필터
    - 검색
    - 정렬

53. ⬅️ **게시글 상세 API** - `app/api/posts/[id]/route.ts` (← 51)
    - GET 상세
    - PATCH 수정
    - DELETE 삭제
    - 조회수 증가

**🔗 그룹 L: 댓글 API**
54. ⚡ **댓글 API** - `app/api/comments/route.ts`
    - POST 생성 (회원/정치인 모드)
    - GET 목록
    - 필터링 (전체/정치인/회원)

55. ⬅️ **댓글 수정/삭제 API** - `app/api/comments/[id]/route.ts` (← 54)
    - PATCH 수정
    - DELETE 삭제

**🔗 그룹 M: 공감/공유 API**
56. ⚡ **공감/비공감 API** - `app/api/votes/route.ts`
    - POST 공감/비공감
    - DELETE 취소

57. ⚡ **공유 API** - `app/api/shares/route.ts`
    - POST 공유 기록
    - 공유 수 집계

**🔗 그룹 N: 팔로우 API**
58. ⚡ **팔로우 API** - `app/api/follows/route.ts`
    - POST 팔로우
    - DELETE 언팔로우
    - GET 팔로워/팔로잉 목록
    - 포인트 +20p

**🔗 그룹 O: 알림 API**
59. ⚡ **알림 API** - `app/api/notifications/route.ts`
    - GET 목록 (7가지 유형 필터)
    - PATCH 읽음 처리
    - DELETE 삭제

60. ⚡ **알림 생성 헬퍼** - `lib/notifications/create.ts`
    - 댓글 알림
    - 공감 알림
    - 공유 알림
    - 팔로우 알림
    - 정치인 업데이트 알림

**🔗 그룹 P: 유틸**
61. ⚡ **욕설 필터** - `lib/utils/profanity-filter.ts`
    - 욕설/비방 필터링

62. ⚡ **파일 업로드 헬퍼** - `lib/storage/uploads.ts`
    - Supabase Storage 업로드 (이미지/PDF/DOC)
    - 10MB 제한

75. ⚡ **커뮤니티 보안** - `lib/security/community.ts`
    - XSS 방어 (DOMPurify)
    - 스팸 방지 (연속 작성 제한)
    - 파일 업로드 검증


### Frontend 영역(Frontend Area) (F) - 6개

**🔗 그룹 J: 커뮤니티 페이지**
45. ⬅️ **커뮤니티 메인 페이지** - `app/community/page.tsx` (← 1단계(Phase 1))
    - 2개 게시판 탭 (정치인/회원)
    - 검색
    - 정렬 (최신순, 공감순, 조회순)
    - 게시글 리스트
    - 카테고리 선택 모달

46. ⬅️ **회원 게시글 상세** - `app/posts/member/[id]/page.tsx` (← 45)
    - 게시글 내용
    - 공감/비공감
    - 공유 (링크복사, Facebook, X, 네이버, 모바일 네이티브)
    - 댓글 목록
    - 댓글 작성
    - 팔로우 버튼

47. ⬅️ **정치인 게시글 상세** - `app/posts/politician/[id]/page.tsx` (← 45)
    - 게시글 내용
    - 댓글 2가지 모드 (정치인/회원)
    - 정치인 댓글 본인 인증
    - 댓글 필터 (전체/정치인/회원)

48. ⬅️ **회원 글쓰기 페이지** - `app/posts/write/member/page.tsx` (← 45)
    - 정치인 태그 (검색, 자동완성 최대 20개)
    - 제목 (최대 100자)
    - 에디터 (Tiptap or Quill)
    - 태그 (최대 5개)
    - 첨부파일 (이미지/PDF/DOC, 최대 10MB, 드래그앤드롭)
    - 임시저장 (localStorage)

49. ⬅️ **정치인 글쓰기 페이지** - `app/posts/write/politician/page.tsx` (← 45)
    - 정치인 게시판용

50. ⬅️ **알림 페이지** - `app/notifications/page.tsx` (← 1단계(Phase 1))
    - 7가지 알림 유형
    - 필터 탭
    - 읽음 처리
    - 모두 읽음
    - 삭제


### Test 영역(Test Area) (T) - 4개

71. ⬅️ **커뮤니티 E2E 테스트** - `e2e/community.spec.ts` (← 45-50)
    - 게시글 작성
    - 댓글 작성
    - 공감
    - 팔로우

72. ⬅️ **게시글 API 테스트** - `tests/api/posts.test.ts` (← 51-53)

73. ⬅️ **댓글 API 테스트** - `tests/api/comments.test.ts` (← 54-55)

74. ⬅️ **알림 테스트** - `tests/api/notifications.test.ts` (← 59-60)


### DevOps 영역(DevOps Area) (O) - 1개

76. ⚡ **인기 게시글 집계 스케줄러** - `.github/workflows/aggregate-posts.yml`
    - 매 1시간 집계


**3단계(Phase 3) 완료 시 생성파일**: 76개 (누적)

---

## 4단계(Phase 4): 등급/포인트 시스템 (14개)


**4단계(Phase 4) 개발 영역(Area) 순서**: Database → Backend APIs → Frontend → Test/DevOps

### Database 영역(Database Area) (D) - 3개

85. ⚡ **포인트 스키마** - `supabase/migrations/013_points_schema.sql`
    - point_history 테이블
    - 인덱스
    - RLS 정책

86. ⚡ **등급 스키마** - `supabase/migrations/014_grades_schema.sql`
    - user_levels 테이블 (ML1-ML6 기준)
    - influence_grades 테이블 (무궁화~브론즈 기준)

87. ⬅️ **포인트 트리거** - `supabase/migrations/015_points_triggers.sql` (← 85)
    - 활동별 포인트 자동 적립
    - 등급 자동 업데이트


### Backend 영역(Backend Area) (B) - 5개

**🔗 그룹 S: 포인트 API**
80. ⚡ **포인트 API** - `app/api/points/route.ts`
    - GET 포인트 조회
    - GET 활동 내역

81. ⚡ **포인트 적립 헬퍼** - `lib/points/earn.ts`
    - 게시글 작성 +50p
    - 댓글 작성 +10p
    - 공감 받음 +5p
    - 팔로우 +20p
    - 로그인 +1p

**🔗 그룹 T: 등급 API**
82. ⚡ **등급 계산 API** - `app/api/grades/calculate/route.ts`
    - 활동 등급 계산 (ML1-ML6, 포인트 기반)
    - 영향력 등급 계산 (무궁화~브론즈, 팔로워+공감+공유)

83. ⚡ **프로필 API** - `app/api/profile/route.ts`
    - GET 프로필
    - PATCH 프로필 수정
    - DELETE 회원 탈퇴

84. ⚡ **타인 프로필 API** - `app/api/users/[id]/route.ts`
    - GET 타인 프로필 조회


### Frontend 영역(Frontend Area) (F) - 3개

**🔗 그룹 R: 사용자 페이지**
77. ⬅️ **마이페이지** - `app/mypage/page.tsx` (← 1단계(Phase 1))
    - 프로필 정보
    - 활동 등급 (ML1-ML6)
    - 통계 (게시글, 댓글, 포인트, 팔로워, 팔로잉)
    - 3개 탭 (내 게시글, 내 댓글, 활동 내역)

78. ⬅️ **프로필 수정** - `app/profile/edit/page.tsx` (← 77)
    - 프로필 이미지
    - 닉네임
    - 소개
    - 관심 지역
    - 생년월일

79. ⬅️ **설정 페이지** - `app/settings/page.tsx` (← 77)
    - 알림 설정 (4가지 토글)
    - 비밀번호 변경
    - 회원 탈퇴


### Test 영역(Test Area) (T) - 2개

88. ⬅️ **포인트/등급 E2E** - `e2e/points-grades.spec.ts` (← 77-79)

89. ⬅️ **포인트 API 테스트** - `tests/api/points.test.ts` (← 80-82)


### DevOps 영역(DevOps Area) (O) - 1개

90. ⚡ **등급 재계산 스케줄러** - `.github/workflows/recalculate-grades.yml`
    - 매일 등급 재계산


**4단계(Phase 4) 완료 시 생성파일**: 90개 (누적)

---

## 5단계(Phase 5): 결제/본인인증 (12개)


**5단계(Phase 5) 개발 영역(Area) 순서**: Database → Backend APIs → Frontend → Test/Security

### Database 영역(Database Area) (D) - 2개

98. ⚡ **결제 스키마** - `supabase/migrations/016_payments_schema.sql`
    - payments 테이블
    - orders 테이블
    - politician_verifications 테이블
    - 인덱스
    - RLS 정책

99. ⚡ **PDF 리포트 스키마** - `supabase/migrations/017_reports_schema.sql`
    - evaluation_reports 테이블


### Backend 영역(Backend Area) (B) - 6개

**🔗 그룹 V: 결제 API**
93. ⬅️ **결제 생성 API** - `app/api/payments/route.ts` (← 27, 91)
    - POST 결제 생성 (정치인 본인 인증 필수)
    - 계좌이체 정보 생성

94. ⬅️ **결제 확인 API** - `app/api/payments/[id]/confirm/route.ts` (← 93)
    - POST 입금 완료 확인 (관리자 수동)

95. ⚡ **주문 조회 API** - `app/api/orders/route.ts`
    - GET 주문 목록
    - GET 주문 상세

96. ⚡ **PDF 리포트 생성 API** - `app/api/reports/generate/route.ts`
    - POST PDF 생성 (Puppeteer)

97. ⚡ **PDF 다운로드 API** - `app/api/reports/[id]/download/route.ts`
    - GET PDF 다운로드 (결제 완료자만)

102. ⚡ **결제 보안** - `lib/security/payments.ts`
    - 결제 정보 암호화
    - 본인 인증 검증
    - PDF 다운로드 권한


### Frontend 영역(Frontend Area) (F) - 2개

**🔗 그룹 U: 결제 페이지**
91. ⬅️ **결제 페이지** - `app/payment/page.tsx` (← 22)
    - 주문자 정보
    - 정치인 본인 인증
    - 상품 정보 (AI 보고서)
    - 계좌이체 정보
    - 2개 약관 (이용약관, 개인정보)

92. ⬅️ **계좌이체 안내 페이지** - `app/payment/account-transfer/page.tsx` (← 91)
    - 계좌번호 표시
    - 입금자명
    - 입금 완료 확인


### Test 영역(Test Area) (T) - 2개

100. ⬅️ **결제 E2E** - `e2e/payment.spec.ts` (← 91-92)

101. ⬅️ **결제 API 테스트** - `tests/api/payments.test.ts` (← 93-97)


### DevOps 영역(DevOps Area) (O) - 0개


**5단계(Phase 5) 완료 시 생성파일**: 102개 (누적)

---

## 6단계(Phase 6): 관리자/부가기능 (24개)


**6단계(Phase 6) 개발 영역(Area) 순서**: Database → Backend Infrastructure → Backend APIs → Frontend → Test/Security/DevOps

### Database 영역(Database Area) (D) - 3개

119. ⚡ **관리자 스키마** - `supabase/migrations/018_admin_schema.sql`
    - admin_users 테이블
    - admin_activity_logs 테이블
    - reports 테이블
    - RLS 정책

120. ⚡ **검색 최적화** - `supabase/migrations/019_search_optimization.sql`
    - Full-text search 인덱스 최적화
    - 통합 검색 뷰

121. ⚡ **타입 최종 업데이트** - `lib/database.types.ts`


### Backend 영역(Backend Area) (B) - 10개

**🔗 그룹 Y: 관리자 API**
110. ⚡ **관리자 대시보드 API** - `app/api/admin/dashboard/route.ts`
    - GET 통계

111. ⚡ **회원 관리 API** - `app/api/admin/users/route.ts`
    - GET 목록
    - PATCH 수정
    - POST 차단

112. ⚡ **정치인 관리 API** - `app/api/admin/politicians/route.ts`
    - POST 추가
    - PATCH 수정
    - DELETE 삭제

113. ⚡ **신고 관리 API** - `app/api/admin/reports/route.ts`
    - GET 목록
    - PATCH 처리

114. ⚡ **활동 로그 API** - `app/api/admin/logs/route.ts`
    - GET 로그 조회

**🔗 그룹 Z: 검색 API**
115. ⚡ **통합 검색 API** - `app/api/search/route.ts`
    - GET 검색 (정치인, 게시글, 사용자)

**🔗 그룹 AA: 약관 페이지 (정적)**
116. ⚡ **이용약관 페이지** - `app/terms/page.tsx`

117. ⚡ **개인정보처리방침 페이지** - `app/privacy/page.tsx`

118. ⚡ **관리자 미들웨어** - `lib/middleware/admin.ts`
    - 관리자 권한 검증

125. ⚡ **관리자 보안** - `lib/security/admin.ts`
    - 관리자 권한 검증
    - 로그 기록


### Frontend 영역(Frontend Area) (F) - 7개

**🔗 그룹 W: 관리자**
103. ⬅️ **관리자 대시보드** - `app/admin/page.tsx` (← Phase 1, 관리자 권한)
    - 통계 카드 (회원, 정치인, 게시글, 신고)
    - 최근 활동 로그
    - 주요 공지사항

104. ⬅️ **회원 관리** - `app/admin/users/page.tsx` (← 103)
    - 검색
    - 등급 필터
    - 상태 필터
    - 수정/차단

105. ⬅️ **정치인 관리** - `app/admin/politicians/page.tsx` (← 103)
    - 추가
    - 수정
    - 인증계정 관리

106. ⬅️ **신고 관리** - `app/admin/reports/page.tsx` (← 103)
    - 신고 목록
    - 처리/반려

**🔗 그룹 X: 부가 페이지**
107. ⚡ **검색 결과 페이지** - `app/search/page.tsx`
    - 통합 검색 (정치인, 게시글, 사용자)

108. ⚡ **서비스 소개** - `app/services/page.tsx`

109. ⚡ **고객센터** - `app/support/page.tsx`


### Test 영역(Test Area) (T) - 3개

122. ⬅️ **관리자 E2E** - `e2e/admin.spec.ts` (← 103-106)

123. ⬅️ **검색 E2E** - `e2e/search.spec.ts` (← 107, 115)

124. ⬅️ **관리자 API 테스트** - `tests/api/admin.test.ts` (← 110-114)


### DevOps 영역(DevOps Area) (O) - 1개

126. ⚡ **로그 수집 설정** - Sentry, Vercel Logs 설정


**6단계(Phase 6) 완료 시 생성파일**: 126개 (누적)

---

## 7단계(Phase 7): 배포 및 최적화 (18개)


**7단계(Phase 7) 개발 영역(Area) 순서**: Backend Infrastructure/Frontend (병렬) → Database → Test/Security → DevOps

### Backend 영역(Backend Area) (B) - 4개

132. ⚡ **헬스 체크 API** - `app/api/health/route.ts`

133. ⚡ **캐싱 설정** - `lib/cache/redis.ts`
    - Redis (Upstash)

134. ⚡ **API 문서** - `public/api-docs.json`
    - OpenAPI 스펙

135. ⚡ **에러 핸들러** - `lib/errors/handler.ts`
    - 전역 에러 핸들링


### Frontend 영역(Frontend Area) (F) - 5개

127. ⚡ **PWA 설정** - `public/manifest.json`, `public/sw.js`
    - Service Worker
    - 오프라인 지원

128. ⚡ **SEO 설정** - `app/robots.txt`, `app/sitemap.xml`

129. ⚡ **OG 태그 설정** - `app/layout.tsx` 메타데이터

130. ⚡ **404 페이지** - `app/not-found.tsx`

131. ⚡ **500 페이지** - `app/error.tsx`


### Database 영역(Database Area) (D) - 2개

136. ⚡ **데이터베이스 최적화** - `supabase/migrations/020_optimization.sql`
    - 인덱스 최종 점검
    - 쿼리 최적화

137. ⚡ **백업 설정** - Supabase 백업 정책


### Test 영역(Test Area) (T) - 3개

138. ⬅️ **전체 E2E 테스트** - `e2e/full-flow.spec.ts` (← 모든 Phase)
    - 회원가입 → 게시글 → 정치인 → 평가

139. ⚡ **부하 테스트** - `tests/load/k6.js`
    - 동시 사용자 100명

140. ⚡ **보안 테스트** - OWASP ZAP 스캔


### DevOps 영역(DevOps Area) (O) - 4개

141. ⚡ **보안 최종 점검** - `lib/security/final-check.ts`
    - 보안 헤더
    - HTTPS 강제

142. ⚡ **의존성 스캔** - `npm audit`, Snyk

143. ⚡ **Vercel 배포 설정** - `vercel.json`
    - 환경변수
    - 리다이렉트
    - 헤더

144. ⚡ **CI/CD 파이프라인** - `.github/workflows/deploy.yml`
    - 테스트 → 빌드 → 배포


**7단계(Phase 7) 완료 시 생성파일**: 144개 (누적)

---

## 총 개발 업무

**1단계(Phase 1)**: 20개
**2단계(Phase 2)**: 24개
**3단계(Phase 3)**: 32개
**4단계(Phase 4)**: 14개
**5단계(Phase 5)**: 12개
**6단계(Phase 6)**: 24개
**7단계(Phase 7)**: 18개

**총 144개 생성파일**

---

## 기술 스택

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Chart.js (시계열 그래프)
- Tiptap or Quill (에디터)
- DOMPurify (XSS 방어)

### Backend
- Next.js API Routes
- Supabase (Auth, Database, Storage, Realtime)
- Puppeteer (PDF 생성)

### Database
- Supabase (PostgreSQL)
- Redis (Upstash) - 캐싱

### AI
- **평가 엔진 API** (별도 개발)

### 배포
- Vercel
- Supabase Cloud

### 모니터링
- Sentry
- Vercel Analytics

---

## HTML 목업 대조

**29개 HTML → 144개 생성파일**

### 페이지 (29개 HTML → Frontend 생성파일)
1. signup.html → app/signup/page.tsx ✅
2. login.html → app/login/page.tsx ✅
3. password-reset.html → app/password-reset/page.tsx ✅
4. index.html → app/page.tsx ✅
5. politicians.html → app/politicians/page.tsx ✅
6. politician-detail.html → app/politicians/[id]/page.tsx ✅
7. favorite-politicians.html → app/favorites/page.tsx ✅
8. community.html → app/community/page.tsx ✅
9. post-detail_member.html → app/posts/member/[id]/page.tsx ✅
10. post-detail_politician.html → app/posts/politician/[id]/page.tsx ✅
11. write-post_member.html → app/posts/write/member/page.tsx ✅
12. write-post_politician.html → app/posts/write/politician/page.tsx ✅
13. mypage.html → app/mypage/page.tsx ✅
14. profile-edit.html → app/profile/edit/page.tsx ✅
15. settings.html → app/settings/page.tsx ✅
16. user-profile.html → app/users/[id]/page.tsx (83번에 포함)
17. notifications.html → app/notifications/page.tsx ✅
18. search-results.html → app/search/page.tsx ✅
19. payment.html → app/payment/page.tsx ✅
20. account-transfer.html → app/payment/account-transfer/page.tsx ✅
21. admin.html → app/admin/page.tsx ✅
22. services.html → app/services/page.tsx ✅
23. support.html → app/support/page.tsx ✅
24. terms.html → app/terms/page.tsx ✅
25. privacy.html → app/privacy/page.tsx ✅
26. connection.html → (서비스 소개에 통합)
27. service-relay.html → (서비스 소개에 통합)
28. notice-detail.html → (관리자 공지사항에 통합)
29. 광고1_표지_디자인.html → (제외)

### 추가 기능 (HTML에서 확인)
- ✅ 소셜로그인: 구글만
- ✅ 결제: 계좌이체만
- ✅ AI: 5개 (평가 엔진 연동)
- ✅ 팔로우/팔로잉
- ✅ 공유 (4종)
- ✅ 등급 (활동/영향력 2종)
- ✅ 포인트 시스템
- ✅ 정치인 태그
- ✅ 임시저장
- ✅ 알림 7가지
- ✅ 첨부파일 (이미지/PDF/DOC)
- ✅ 정치인 본인 인증

---

**작성 완료**: 2025-10-30
**원칙**: 생성파일 기준 (1개 파일 = 1개 업무)
**총 업무 수**: 144개