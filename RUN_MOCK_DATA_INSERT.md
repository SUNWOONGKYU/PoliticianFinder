# 🎭 모의 데이터 삽입 실행 가이드

**작성 일시**: 2025-10-20 03:45
**Phase**: 5D6
**목적**: 전체 기능 검증을 위한 모의 데이터 생성

---

## 📦 포함된 모의 데이터

### 정치인 30명
- **정당**: 국민의힘 (10), 민주당 (12), 무소속 (4), 정의당 (4)
- **지역**: 전국 17개 시도
- **직책**: 국회의원, 시장, 도지사
- **Status**: incumbent, candidate, prospective

### AI 평점 150개
- 5개 AI (Claude, GPT, Gemini, Grok, Perplexity) × 30명
- 점수 범위: 85-95점
- 각 AI별 평가 이유 포함

### 게시글 50개
- **카테고리**: 자유게시판, 정책토론, 뉴스, 질문답변
- **HOT 게시글**: 10개 (높은 view_count, upvotes)
- **일반 게시글**: 40개

### 댓글 100개
- 게시글에 랜덤 배분
- 다양한 의견 표현

### 정치인 공식 글 90개
- 30명 × 3개씩
- **플랫폼**: Twitter, Facebook, Blog
- 최근 3일간 발행

### 연결 서비스 5개
- 국회의원 현황, 선거관리위원회, 정치자금넷, 정부24, 정책브리핑

---

## 🚀 실행 방법

### Step 1: Supabase Dashboard 접속
```
https://supabase.com/dashboard/project/ooddlafwdpzgxfefgsrx
```

### Step 2: SQL Editor 열기
1. 좌측 메뉴에서 **SQL Editor** 클릭
2. **New query** 버튼 클릭

### Step 3: 파일 내용 복사
```bash
# 로컬 파일 경로
G:\내 드라이브\Developement\PoliticianFinder\supabase\MOCK_DATA_INSERT.sql
```

1. 위 파일 열기
2. 전체 내용 복사 (Ctrl+A, Ctrl+C)

### Step 4: 붙여넣기 및 실행
1. SQL Editor에 붙여넣기 (Ctrl+V)
2. **Run** 버튼 클릭 (또는 Ctrl+Enter)

### Step 5: 결과 확인
성공 시 메시지:
```
✅ 모의 데이터 삽입 완료!
📊 정치인: 30명
📊 AI 평점: 150개
📊 게시글: 50개
📊 댓글: 100개
📊 정치인 글: 90개
📊 연결 서비스: 5개
```

---

## ✅ 검증 체크리스트

### 1. 데이터베이스 확인
```sql
-- 정치인 수 확인
SELECT COUNT(*) FROM politicians;  -- 예상: 30

-- AI 평점 수 확인
SELECT COUNT(*) FROM ai_scores;  -- 예상: 150

-- 게시글 수 확인
SELECT COUNT(*) FROM posts;  -- 예상: 50

-- 댓글 수 확인
SELECT COUNT(*) FROM comments;  -- 예상: 100

-- 정치인 글 수 확인
SELECT COUNT(*) FROM politician_posts;  -- 예상: 90
```

### 2. 뷰 데이터 확인
```sql
-- AI 랭킹 TOP 10
SELECT * FROM v_ai_ranking_top10 LIMIT 10;

-- HOT 게시글 TOP 15
SELECT * FROM v_hot_posts_top15 LIMIT 15;

-- 정치인 최근 글 9개
SELECT * FROM v_politician_posts_recent9 LIMIT 9;

-- 실시간 통계
SELECT * FROM v_realtime_stats;
```

### 3. 웹사이트 확인
- **메인 페이지**: https://frontend-7sc7vhgza-finder-world.vercel.app
  - [ ] AI 랭킹 10개 표시
  - [ ] 인기글 15개 표시
  - [ ] 정치인 글 9개 표시
  - [ ] 사이드바 통계 표시

- **정치인 목록**: /politicians
  - [ ] 30명 정치인 카드 표시
  - [ ] 필터링 작동
  - [ ] 페이지네이션 (3페이지)

- **정치인 상세**: /politicians/1
  - [ ] 프로필 정보
  - [ ] AI 평점 5개
  - [ ] Composite score

- **커뮤니티**: /community
  - [ ] 게시글 50개
  - [ ] HOT 배지 10개
  - [ ] 검색/필터 작동

---

## 🔧 트러블슈팅

### 에러 1: "foreign key constraint"
**원인**: profiles 테이블에 user_id 없음
**해결**: user_id를 NULL로 설정 (이미 적용됨)

### 에러 2: "duplicate key value"
**원인**: 이미 데이터 존재
**해결**:
```sql
-- 기존 데이터 삭제 후 재실행
DELETE FROM politician_posts;
DELETE FROM comments;
DELETE FROM posts;
DELETE FROM ai_scores;
DELETE FROM politicians;
```

### 에러 3: "view does not exist"
**원인**: 마이그레이션 미실행
**해결**: `COMBINED_P2_MIGRATIONS_V2.sql` 먼저 실행

### 에러 4: "function update_all_hot_scores does not exist"
**원인**: 함수 미생성
**해결**: `COMBINED_P2_MIGRATIONS_V2.sql` 먼저 실행

---

## 📝 실행 후 작업

### 1. 스크린샷 촬영
- 메인 페이지
- 정치인 목록 페이지
- 정치인 상세 페이지
- 커뮤니티 페이지

### 2. 검증 보고서 작성
`MOCK_DATA_VERIFICATION.md`에 결과 기록

### 3. 프로젝트 그리드 업데이트
- P5D6 상태: 완료
- 완료 시간: 기록

---

## ⏱️ 예상 소요 시간

- **파일 열기 및 복사**: 1분
- **Supabase Dashboard 접속**: 1분
- **SQL 실행**: 30초
- **검증**: 5분
- **총**: 약 8분

---

## 🎯 성공 기준

1. ✅ 모든 데이터 삽입 완료 (에러 없음)
2. ✅ 뷰에서 데이터 조회 가능
3. ✅ 메인 페이지 정상 표시
4. ✅ 모든 페이지 데이터 로드 성공

---

**다음 단계**: 검증 완료 후 P5D6 작업을 완료로 표시하고 프로젝트 그리드 업데이트

**작성자**: Claude Code (AI)
