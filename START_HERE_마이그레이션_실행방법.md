# 🚀 데이터베이스 마이그레이션 실행 방법

## 📋 현재 상태

- ✅ **모든 코드 작업 완료** (Phase 2D: 10/13 완료)
- ✅ **Frontend 빌드 성공**
- ✅ **GitHub 푸시 완료**
- ✅ **Vercel 배포 완료** (자동)
- ⚠️ **데이터베이스 마이그레이션만 남음** (사용자 수동 실행 필요)

---

## ⚡ 빠른 실행 (5분 소요)

### 1단계: Supabase Dashboard 접속

https://supabase.com/dashboard

- 로그인 후 프로젝트 선택: `ooddlafwdpzgxfefgsrx`

### 2단계: SQL Editor 열기

- 좌측 메뉴에서 **"SQL Editor"** 클릭
- 우측 상단 **"New Query"** 버튼 클릭

### 3단계: 마이그레이션 SQL 복사

- 아래 파일을 텍스트 에디터로 열기:
  ```
  G:\내 드라이브\Developement\PoliticianFinder\supabase\COMBINED_P2_MIGRATIONS.sql
  ```

- 파일 내용 **전체 선택** (Ctrl+A) 후 **복사** (Ctrl+C)

### 4단계: SQL 실행

- Supabase SQL Editor에 **붙여넣기** (Ctrl+V)
- 우측 하단 **"Run"** 버튼 클릭 (또는 Ctrl+Enter)
- ✅ **"Success. No rows returned"** 메시지 확인

---

## ✅ 마이그레이션 성공 확인

SQL Editor에서 다음 쿼리 실행:

```sql
-- 1. 새 테이블 확인 (4개)
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('politician_posts', 'politician_score_history', 'connected_services', 'widget_ads');

-- 2. 새 View 확인 (7개)
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name LIKE 'v_%';

-- 3. AI Scores 컬럼 확인 (5개)
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'ai_scores'
AND column_name LIKE '%_score';

-- 4. Posts 인기글 컬럼 확인 (3개)
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'posts'
AND column_name IN ('hot_score', 'is_hot', 'trending_rank');
```

모두 정상적으로 표시되면 ✅ **마이그레이션 성공!**

---

## 🎉 마이그레이션 후 변화

### 메인 페이지
- ✅ AI 종합 평점 TOP 10 표시 (5개 AI 통합 점수)
- ✅ 실시간 인기글 TOP 15 (HOT 뱃지)
- ✅ 정치인 최근 글 9개 표시
- ✅ 사이드바 위젯 8개 작동

### 커뮤니티 페이지
- ✅ HOT 뱃지 자동 표시 (조회수 + 댓글 + 시간 감쇠 알고리즘)
- ✅ 실시간 통계 위젯
- ✅ 최근 댓글 위젯

### 정치인 상세 페이지
- ✅ AI 점수 이력 추적
- ✅ 복합 점수 자동 계산

---

## ⚠️ 문제 발생 시

### 에러: "relation already exists"
- **원인**: 이미 마이그레이션이 실행됨
- **해결**: 무시하고 진행 (중복 실행 방지 로직 있음)

### 에러: "permission denied"
- **원인**: 권한 부족
- **해결**: Supabase Dashboard 로그인 확인 (프로젝트 Owner 권한 필요)

### 에러: 기타
- **롤백 방법**: `supabase/EXECUTE_P2_MIGRATIONS.md` 파일 참조

---

## 📁 관련 파일

| 파일 | 설명 |
|------|------|
| `supabase/COMBINED_P2_MIGRATIONS.sql` | **실행할 SQL 파일** (이것만 복사) |
| `supabase/EXECUTE_P2_MIGRATIONS.md` | 상세 가이드 (문제 발생 시 참조) |
| `FINAL_PHASE_2D_COMPLETION_REPORT.md` | 전체 작업 완료 보고서 |

---

## 🚀 마이그레이션 완료 후

웹사이트 접속: https://politician-finder.vercel.app

- 메인 페이지에서 데이터가 정상 표시되는지 확인
- 커뮤니티 페이지에서 HOT 뱃지 확인
- 모든 기능 정상 작동 확인

**축하합니다! Phase 2D 완료!** 🎉

---

**작성일**: 2025-10-20
**작성자**: Claude (fullstack-developer)
**프로젝트**: PoliticianFinder Phase 2D - Mockup-D4 Full Implementation
