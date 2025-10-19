# P2 Database Migrations Execution Guide

## Overview
4개의 마이그레이션 파일을 Supabase에 실행해야 합니다.

## Migration Files (실행 순서대로)
1. `20251020_P2D1_ai_scores_extension.sql` - AI 평점 시스템 확장
2. `20251020_P2D2_hot_posts_system.sql` - 실시간 인기글 시스템
3. `20251020_P2D3_politician_posts_system.sql` - 정치인 글 시스템
4. `20251020_P2D4_sidebar_widgets.sql` - 사이드바 위젯 시스템

## 실행 방법

### Option 1: Supabase Dashboard (권장)
1. Supabase Dashboard 접속: https://supabase.com/dashboard
2. Project: ooddlafwdpzgxfefgsrx 선택
3. 좌측 메뉴에서 "SQL Editor" 클릭
4. "New Query" 버튼 클릭
5. `COMBINED_P2_MIGRATIONS.sql` 파일 내용을 복사하여 붙여넣기
6. "Run" 버튼 클릭
7. 에러 없이 완료되면 성공

### Option 2: Supabase CLI
```bash
cd "G:/내 드라이브/Developement/PoliticianFinder"
npx supabase link --project-ref ooddlafwdpzgxfefgsrx
npx supabase db push
```

### Option 3: psql 직접 실행
```bash
psql "postgresql://postgres:[password]@db.ooddlafwdpzgxfefgsrx.supabase.co:5432/postgres" < supabase/COMBINED_P2_MIGRATIONS.sql
```

## 실행 후 확인사항

### 1. 새 테이블 생성 확인
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('politician_posts', 'politician_score_history', 'connected_services', 'widget_ads');
```

### 2. 새 뷰 생성 확인
```sql
SELECT table_name FROM information_schema.views
WHERE table_schema = 'public'
AND table_name LIKE 'v_%';
```

### 3. 새 함수 생성 확인
```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('calculate_composite_score', 'calculate_hot_score', 'get_sidebar_data');
```

### 4. AI Scores 컬럼 확인
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'ai_scores'
AND column_name IN ('gpt_score', 'gemini_score', 'grok_score', 'perplexity_score');
```

### 5. Posts 컬럼 확인
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'posts'
AND column_name IN ('hot_score', 'is_hot', 'trending_rank');
```

## 예상 실행 시간
- 전체 마이그레이션: ~2-3분
- 기존 데이터 업데이트: ~1-2분

## 에러 발생 시
1. 에러 메시지 복사
2. Claude Code에게 에러 메시지 전달
3. 문제 해결 후 재실행

## 롤백 방법
문제 발생 시 롤백이 필요한 경우:
```sql
-- AI Scores 컬럼 제거
ALTER TABLE ai_scores DROP COLUMN IF EXISTS gpt_score;
ALTER TABLE ai_scores DROP COLUMN IF EXISTS gemini_score;
ALTER TABLE ai_scores DROP COLUMN IF EXISTS grok_score;
ALTER TABLE ai_scores DROP COLUMN IF EXISTS perplexity_score;

-- Posts 컬럼 제거
ALTER TABLE posts DROP COLUMN IF EXISTS hot_score;
ALTER TABLE posts DROP COLUMN IF EXISTS is_hot;
ALTER TABLE posts DROP COLUMN IF EXISTS trending_rank;

-- 새 테이블 삭제
DROP TABLE IF EXISTS politician_posts CASCADE;
DROP TABLE IF EXISTS politician_score_history CASCADE;
DROP TABLE IF EXISTS connected_services CASCADE;
DROP TABLE IF EXISTS widget_ads CASCADE;

-- 뷰 삭제
DROP VIEW IF EXISTS v_ai_ranking_top10;
DROP VIEW IF EXISTS v_hot_posts_top15;
DROP VIEW IF EXISTS v_politician_posts_recent9;
-- ... (기타 뷰들)

-- 함수 삭제
DROP FUNCTION IF EXISTS calculate_composite_score;
DROP FUNCTION IF EXISTS calculate_hot_score;
DROP FUNCTION IF EXISTS get_sidebar_data;
-- ... (기타 함수들)
```

## 완료 후
마이그레이션 완료 후 Claude Code에게 알려주시면 다음 단계로 진행합니다.
