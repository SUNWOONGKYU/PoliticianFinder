# Frontend Redesign 마스터 플랜

## 개요
mockup-d4.html 디자인을 기반으로 전체 시스템을 재구축하는 거대한 작업

## Phase 1: 데이터베이스 스키마 재설계

### 1.1 AI 평점 시스템
**필요한 테이블:**
- `ai_scores` (기존) 확장
  - claude_score
  - gpt_score (추후)
  - gemini_score (추후)
  - grok_score (추후)
  - perplexity_score (추후)
  - composite_score (AI종합평점)

**새 인덱스:**
```sql
CREATE INDEX idx_ai_scores_composite ON ai_scores(composite_score DESC);
CREATE INDEX idx_ai_scores_politician_id ON ai_scores(politician_id);
```

### 1.2 실시간 인기글 시스템
**필요한 컬럼 추가:**
```sql
ALTER TABLE posts ADD COLUMN hot_score DECIMAL DEFAULT 0;
ALTER TABLE posts ADD COLUMN trending_rank INTEGER;
```

**Hot Score 계산 함수:**
```sql
CREATE OR REPLACE FUNCTION calculate_hot_score(
  view_count INTEGER,
  upvotes INTEGER,
  comment_count INTEGER,
  created_at TIMESTAMP
) RETURNS DECIMAL AS $$
DECLARE
  time_decay DECIMAL;
  base_score DECIMAL;
BEGIN
  -- 시간 감쇠 (24시간 기준)
  time_decay := EXP(-EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400);

  -- 기본 점수 계산
  base_score := (view_count * 0.1) + (upvotes * 2) + (comment_count * 1.5);

  RETURN base_score * time_decay;
END;
$$ LANGUAGE plpgsql;
```

### 1.3 정치인 최근 글
**필요한 테이블:**
- `politician_posts` (신규)
  - id
  - politician_id
  - content
  - category (공약, 활동, 입장표명 등)
  - created_at
  - view_count
  - comment_count
  - upvotes

### 1.4 사이드바 위젯 데이터
**필요한 테이블/뷰:**
- `politician_stats` (통계)
- `trending_politicians` (급상승 정치인)
- `user_levels` (레벨 시스템)
- `connected_services` (연결 서비스)

## Phase 2: API 엔드포인트 재설계

### 2.1 메인 페이지 API
**GET /api/home**
```typescript
{
  aiRanking: {
    top10: Politician[], // AI 평점 TOP 10
    filters: ['전체', '지역', '정당', '직종']
  },
  hotPosts: {
    posts: Post[15], // 실시간 인기글 15개
    algorithm: 'hot_score'
  },
  politicianPosts: {
    recent: PoliticianPost[9], // 정치인 최근 글 9개
    featured: boolean
  },
  sidebar: {
    stats: PoliticianStats,
    trendingPoliticians: Politician[3],
    hallOfFame: Politician[3],
    userProfile: UserProfile,
    realtimeStats: Stats,
    recentComments: Comment[5],
    connectedServices: Service[3],
    ad: AdContent
  }
}
```

### 2.2 필요한 새 엔드포인트
- `GET /api/politicians/ranking` - AI 평점 랭킹
- `GET /api/posts/hot` - 실시간 인기글
- `GET /api/politicians/posts/recent` - 정치인 최근 글
- `GET /api/sidebar/widgets` - 사이드바 위젯 데이터
- `GET /api/politicians/trending` - 급상승 정치인

## Phase 3: 프로젝트 그리드 v4.0 재구성

### 3.1 새로운 Phase 정의
**Phase 2: 메인 페이지 재구축** (현재 작업)
- P2F1: 메인 페이지 레이아웃 (3/4 + 1/4)
- P2F2: AI 평점 랭킹 테이블
- P2F3: 실시간 인기글 컴포넌트
- P2F4: 정치인 최근 글 컴포넌트
- P2F5: 사이드바 위젯 시스템
- P2B1: AI 평점 API
- P2B2: 실시간 인기글 API
- P2B3: 정치인 글 API
- P2B4: 사이드바 위젯 API
- P2D1: ai_scores 테이블 확장
- P2D2: posts hot_score 추가
- P2D3: politician_posts 테이블 생성
- P2D4: 사이드바 위젯 테이블

### 3.2 작업 순서
1. Database 작업 (P2D1-4)
2. Backend API 작업 (P2B1-4)
3. Frontend 컴포넌트 작업 (P2F1-5)
4. 통합 테스트
5. 배포

## Phase 4: 기존 페이지 재설계

### 4.1 커뮤니티 페이지
- 새 디자인 적용
- 실시간 인기글 통합
- 사이드바 일관성

### 4.2 정치인 목록 페이지
- AI 평점 랭킹 통합
- 필터링 시스템
- 카드 디자인 통일

### 4.3 정치인 상세 페이지
- AI 평가 상세 표시
- 최근 글 목록
- 시민 평점 통합

## Phase 5: 실행 계획

### 5.1 우선순위
1. **즉시 실행**: 데이터베이스 마이그레이션
2. **다음**: API 엔드포인트 구현
3. **그 다음**: Frontend 컴포넌트 연동
4. **마지막**: 기존 페이지 재설계

### 5.2 예상 작업 시간
- Database: 2시간
- API: 4시간
- Frontend 메인 페이지: 3시간
- 기존 페이지 재설계: 6시간
- **총 예상: 15시간**

## Phase 6: 작업지시서 목록

### 생성할 작업지시서
1. `TASK_P2D1_AI_SCORES_EXTENSION.md` - AI 평점 시스템 확장
2. `TASK_P2D2_HOT_POSTS_SYSTEM.md` - 실시간 인기글 시스템
3. `TASK_P2D3_POLITICIAN_POSTS.md` - 정치인 글 시스템
4. `TASK_P2D4_SIDEBAR_WIDGETS.md` - 사이드바 위젯
5. `TASK_P2B1_AI_RANKING_API.md` - AI 랭킹 API
6. `TASK_P2B2_HOT_POSTS_API.md` - 실시간 인기글 API
7. `TASK_P2B3_POLITICIAN_POSTS_API.md` - 정치인 글 API
8. `TASK_P2B4_SIDEBAR_API.md` - 사이드바 API
9. `TASK_P2F1_MAIN_LAYOUT.md` - 메인 레이아웃
10. `TASK_P2F2_AI_RANKING_TABLE.md` - AI 랭킹 테이블
11. `TASK_P2F3_HOT_POSTS_COMPONENT.md` - 인기글 컴포넌트
12. `TASK_P2F4_POLITICIAN_POSTS_COMPONENT.md` - 정치인 글 컴포넌트
13. `TASK_P2F5_SIDEBAR_WIDGETS.md` - 사이드바 위젯

## 다음 단계

1. ✅ 마스터 플랜 작성 (현재)
2. ⏳ 데이터베이스 마이그레이션 스크립트 작성
3. ⏳ API 엔드포인트 구현
4. ⏳ Frontend 컴포넌트 연동
5. ⏳ 프로젝트 그리드 v4.0 생성
6. ⏳ 작업지시서 13개 작성
7. ⏳ 순차 실행

## 완료 기준
- [ ] 메인 페이지 완전 동작 (실제 데이터 연동)
- [ ] 커뮤니티 페이지 재설계
- [ ] 정치인 목록 페이지 재설계
- [ ] 모든 API 엔드포인트 구현
- [ ] 데이터베이스 마이그레이션 완료
- [ ] 프로젝트 그리드 v4.0 완성
- [ ] Vercel 배포 완료
