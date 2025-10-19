# 데이터베이스 마이그레이션 상태 확인 가이드

**작성 일시**: 2025-10-20 03:35
**목적**: 메인 페이지 데이터 로드 실패 원인 파악

---

## 🔍 확인 필요 사항

### 1. Supabase Dashboard에서 뷰 존재 여부 확인

**접속**: https://supabase.com/dashboard/project/ooddlafwdpzgxfefgsrx/editor

**확인할 뷰들**:
```sql
-- AI 랭킹 뷰
SELECT * FROM v_ai_ranking_top10 LIMIT 1;

-- 인기글 뷰
SELECT * FROM v_hot_posts_top15 LIMIT 1;

-- 정치인 글 뷰
SELECT * FROM v_politician_posts_recent9 LIMIT 1;

-- 실시간 통계 뷰
SELECT * FROM v_realtime_stats LIMIT 1;

-- 최근 댓글 뷰
SELECT * FROM v_recent_comments_widget LIMIT 1;
```

**확인할 함수**:
```sql
-- 사이드바 데이터 함수
SELECT get_sidebar_data(NULL);

-- HOT 점수 계산 함수
SELECT calculate_hot_score(1, 100, 10, 2, NOW());
```

### 2. 기본 테이블 존재 여부 확인

```sql
-- 정치인 테이블
SELECT * FROM politicians LIMIT 1;

-- 게시글 테이블
SELECT * FROM posts LIMIT 1;

-- AI 점수 테이블
SELECT * FROM ai_scores LIMIT 1;

-- 정치인 공식 글 테이블
SELECT * FROM politician_posts LIMIT 1;

-- 댓글 테이블
SELECT * FROM comments LIMIT 1;

-- 프로필 테이블
SELECT * FROM profiles LIMIT 1;
```

### 3. 마이그레이션 재실행이 필요한 경우

**파일**: `supabase/COMBINED_P2_MIGRATIONS_V2.sql`

**실행 방법**:
1. Supabase Dashboard → SQL Editor
2. "New query" 클릭
3. `COMBINED_P2_MIGRATIONS_V2.sql` 내용 복사/붙여넣기
4. "Run" 클릭

**참고**: 이 파일은 idempotent하므로 여러 번 실행해도 안전합니다 (`CREATE OR REPLACE` 사용)

---

## 💡 문제 해결 로드맵

### Case 1: 뷰가 존재하지 않음
→ `COMBINED_P2_MIGRATIONS_V2.sql` 재실행

### Case 2: 뷰는 있지만 데이터가 비어있음
→ 정상 동작 (샘플 데이터 없음)
→ 메인 페이지는 빈 배열로 표시됨 (에러 없음)

### Case 3: 기본 테이블이 없음
→ Phase 1 마이그레이션 먼저 실행 필요
→ 파일 확인: `supabase/migrations/` 디렉토리

### Case 4: 권한 문제 (RLS)
→ RLS 정책 확인
→ ANON_KEY로 접근 가능한지 확인

---

## 🚀 최신 변경사항 (2025-10-20 03:35)

### Fallback 로직 추가 ✅
- **파일**: `frontend/src/lib/api/home.ts`
- **변경**: 뷰가 없어도 에러 대신 빈 배열 반환
- **효과**: 메인 페이지가 빈 화면으로 표시되지만 에러는 발생하지 않음

### Commit: efc5af2
```
Add graceful fallback for missing database views

- console.warn()으로 경고만 출력
- 에러 발생 시 빈 데이터 객체 반환
- 완전 실패 방지
```

---

## 📝 다음 단계

1. ✅ **즉시 확인**: Supabase Dashboard에서 뷰 존재 여부
2. **필요시**: 마이그레이션 재실행
3. **테스트**: 메인 페이지 새로고침
4. **확인**: 브라우저 콘솔에서 경고 메시지 확인

**예상 결과**:
- 뷰가 있으면: 데이터 정상 표시
- 뷰가 없으면: 빈 화면 + 콘솔 경고 (에러 없음)

---

**보고**: 확인 후 결과를 Claude Code에 알려주세요.
