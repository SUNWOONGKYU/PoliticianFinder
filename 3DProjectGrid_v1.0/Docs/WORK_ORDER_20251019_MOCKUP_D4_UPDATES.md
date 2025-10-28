# 수정 작업 지시서 - mockup-d4.html 변경사항 반영

**작업 일자**: 2025-10-19
**작업 담당**: Claude Code
**작업 구분**: 디자인 변경 및 기능 추가
**관련 문서**: mockup-d4.html

---

## 📋 작업 개요

mockup-d4.html에 적용된 모든 디자인 변경사항과 신규 기능을 실제 프로젝트에 반영합니다.

### 주요 변경사항 요약

1. **정치인 상태(신분) 시스템 추가**
2. **평점 컬럼 헤더 개선**
3. **회원 평가 기능 추가**
4. **미래 AI 컬럼 가시성 향상**
5. **커뮤니티 레이아웃 재구성**
6. **사이드바 위젯 추가 및 재배치**

---

## 1. 데이터베이스 변경사항

### 1.1 politicians 테이블에 status 컬럼 추가

**작업 내용**: 정치인 신분(현직, 후보자, 예비후보자, 출마자) 구분 컬럼 추가

**마이그레이션 파일**:
- `supabase/migrations/20251019130029_add_status_to_politicians.sql` (이미 생성됨)
- `supabase/migrations/20251019130029_rollback_add_status_to_politicians.sql` (롤백용)

**실행 명령**:
```bash
cd "G:/내 드라이브/Developement/PoliticianFinder"
npx supabase db push
```

**검증 방법**:
```sql
-- Supabase SQL Editor에서 실행
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'politicians' AND column_name = 'status';

-- 인덱스 확인
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'politicians' AND indexname = 'idx_politicians_status';
```

**예상 결과**:
- `status` 컬럼: TEXT 타입, DEFAULT '현직'
- CHECK 제약조건: ('현직', '후보자', '예비후보자', '출마자')
- 인덱스 생성: `idx_politicians_status`

---

## 2. 프론트엔드 변경사항

### 2.1 정치인 목록 테이블 (PoliticianList 컴포넌트)

**파일**: `web/app/components/PoliticianList.tsx` (또는 유사 컴포넌트)

#### 2.1.1 신분(status) 컬럼 추가

**위치**: `이름` 컬럼 다음

**컴포넌트 코드**:
```tsx
// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
  const statusStyles = {
    '현직': 'bg-emerald-100 text-emerald-700',
    '후보자': 'bg-cyan-100 text-cyan-700',
    '예비후보자': 'bg-amber-100 text-amber-700',
    '출마자': 'bg-purple-100 text-purple-700'
  };

  return (
    <span className={`${statusStyles[status]} px-1.5 py-0.5 rounded-full text-[10px] font-medium`}>
      {status}
    </span>
  );
};

// 테이블 헤더에 추가
<th className="px-2 py-1.5 text-center font-bold text-gray-900">신분</th>

// 테이블 바디에 추가
<td className="px-2 py-1 text-center">
  <StatusBadge status={politician.status} />
</td>
```

#### 2.1.2 평점 컬럼 헤더 변경

**변경 전 → 변경 후**:
- `Claude` → `Claude<br>평점`
- `종합` → `AI종합<br>평점`
- `회원` → `회원<br>평점`

**코드**:
```tsx
<th className="px-2 py-1.5 text-center font-bold text-gray-900">
  Claude<br />평점
</th>
<th className="px-2 py-1.5 text-center font-bold text-gray-900">
  AI종합<br />평점
</th>
<th className="px-2 py-1.5 text-center font-bold text-gray-900">
  회원<br />평점
</th>
```

#### 2.1.3 미래 AI 컬럼 스타일 변경

**대상**: GPT, Gemini, Grok, Perplexity 컬럼

**변경사항**:
- 폰트 크기: `text-[10px]` → `text-xs`
- 투명도 제거: `opacity-40` 삭제
- 색상: `text-gray-500` 추가
- "추후 표시 예정" 메시지 추가

**코드**:
```tsx
<th className="px-2 py-1.5 text-center font-bold text-gray-500 text-xs">
  <div>GPT<br />평점</div>
  <div className="text-[9px] font-normal mt-0.5">
    추후 표시<br />예정
  </div>
</th>
```

#### 2.1.4 회원 평점에 "평가하기" 링크 추가

**코드**:
```tsx
<td className="px-2 py-1 text-center">
  <div className="flex flex-col items-center gap-0.5">
    <div className="flex items-center gap-0.5">
      <span className="text-amber-400 text-xs">⭐⭐⭐⭐⭐</span>
      <span className="text-[10px] text-gray-600">
        ({politician.avg_rating?.toFixed(1) || '0.0'})
      </span>
    </div>
    <a
      href={`/politicians/${politician.id}/rate`}
      className="text-[9px] text-purple-600 hover:text-purple-700"
    >
      평가하기
    </a>
  </div>
</td>
```

#### 2.1.5 Claude 평점에 "평가내역 보기" 링크 추가

**코드**:
```tsx
<td className="px-2 py-1 text-center">
  <div className="flex flex-col items-center gap-0.5">
    <span className="text-sm font-bold text-gray-900">
      {politician.claude_score?.toFixed(1) || '-'}
    </span>
    <a
      href={`/politicians/${politician.id}/ai-scores`}
      className="text-[9px] text-blue-600 hover:text-blue-700"
    >
      평가내역 보기
    </a>
  </div>
</td>
```

---

### 2.2 커뮤니티 섹션 레이아웃 재구성

**파일**: `web/app/components/Community.tsx` (또는 메인 페이지)

#### 2.2.1 그리드 레이아웃 변경

**구조**:
- 전체: `lg:grid-cols-3` (데스크톱에서 3열)
- 좌측: `lg:col-span-2` (2/3 폭, 커뮤니티 콘텐츠)
- 우측: `lg:col-span-1` (1/3 폭, 사이드바)

**코드**:
```tsx
<section className="py-4 bg-gray-50">
  <div className="max-w-full mx-auto px-3">
    {/* 메인 그리드: 좌측 2/3 + 우측 1/3 */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

      {/* 좌측: 커뮤니티 섹션 (2/3) */}
      <div className="lg:col-span-2 space-y-3">
        {/* 실시간 인기글 - 3열 유지 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {/* 인기글 카드들 */}
        </div>

        {/* 정치인 최근 글 - 2열 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {/* 정치인 글 카드들 */}
        </div>
      </div>

      {/* 우측: 사이드바 섹션 (1/3) */}
      <div className="space-y-3">
        {/* 사이드바 위젯들 */}
      </div>

    </div>
  </div>
</section>
```

---

### 2.3 사이드바 위젯 추가

**파일**: `web/app/components/Sidebar/` (각 위젯별 컴포넌트 생성 권장)

#### 2.3.1 트렌딩 토픽 (TrendingTopics.tsx)

**기능**: 인기 해시태그 표시

**데이터 소스**:
- 게시글의 해시태그 집계
- 또는 별도 `trending_topics` 테이블 생성

**코드**:
```tsx
export function TrendingTopics() {
  return (
    <div className="bg-white rounded-lg shadow p-2">
      <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-1 text-xs">
        <span className="text-sm">📊</span>
        트렌딩 토픽
      </h3>
      <div className="space-y-0.5 text-[10px]">
        <a href="#" className="flex items-center justify-between p-1 hover:bg-purple-50 rounded">
          <span className="text-gray-700">#의정활동</span>
          <span className="text-[9px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">234</span>
        </a>
        {/* 나머지 토픽들 */}
      </div>
    </div>
  );
}
```

#### 2.3.2 주간 핫이슈 (WeeklyHotIssues.tsx)

**기능**: 주간 조회수/댓글 TOP 3 게시글

**쿼리**:
```sql
SELECT id, title, view_count,
       (SELECT COUNT(*) FROM comments WHERE post_id = posts.id) as comment_count
FROM posts
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY view_count DESC, comment_count DESC
LIMIT 3;
```

**코드**:
```tsx
export function WeeklyHotIssues({ posts }: { posts: HotPost[] }) {
  return (
    <div className="bg-white rounded-lg shadow p-2">
      <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-1 text-xs">
        <span className="text-sm">🔥</span>
        주간 핫이슈
      </h3>
      <div className="space-y-1 text-[10px]">
        {posts.map((post, idx) => (
          <div key={post.id} className="p-1 hover:bg-amber-50 rounded cursor-pointer">
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-amber-500 font-bold text-[9px]">{idx + 1}위</span>
              <span className="font-medium text-gray-900 truncate">{post.title}</span>
            </div>
            <div className="text-[9px] text-gray-500">
              조회 {formatNumber(post.view_count)} • 댓글 {post.comment_count}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 2.3.3 공지사항/이벤트 (Announcements.tsx)

**기능**: 공지사항 표시 (관리자가 작성한 게시글)

**데이터 소스**:
```sql
SELECT p.*, pr.is_admin
FROM posts p
JOIN profiles pr ON p.user_id = pr.id
WHERE pr.is_admin = true
  AND p.category = 'general'
ORDER BY p.created_at DESC
LIMIT 3;
```

**코드**:
```tsx
export function Announcements({ announcements }: { announcements: Announcement[] }) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow p-2 border border-blue-200">
      <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-1 text-xs">
        <span className="text-sm">📢</span>
        공지사항
      </h3>
      <div className="space-y-1 text-[10px]">
        {announcements.map(ann => (
          <a key={ann.id} href={`/posts/${ann.id}`} className="block p-1 hover:bg-white/50 rounded">
            <div className="flex items-center gap-1 mb-0.5">
              {ann.is_new && (
                <span className="bg-red-500 text-white text-[8px] px-1 py-0.5 rounded font-medium">NEW</span>
              )}
              {ann.is_event && (
                <span className="bg-blue-500 text-white text-[8px] px-1 py-0.5 rounded font-medium">이벤트</span>
              )}
              <span className="font-medium text-gray-900 truncate">{ann.title}</span>
            </div>
            <div className="text-[9px] text-gray-500">{formatTimeAgo(ann.created_at)}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
```

#### 2.3.4 내 활동 요약 (ActivitySummary.tsx)

**기능**: 사용자 레벨, XP, 활동 통계 표시

**데이터 소스**: `profiles` 테이블 + 관련 통계

**코드**:
```tsx
export function ActivitySummary({ user }: { user: UserProfile }) {
  const levelInfo = getLevelInfo(user.user_level);
  const xpProgress = (user.points % levelInfo.xpRequired) / levelInfo.xpRequired * 100;

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg shadow p-2 border border-purple-200">
      <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-1 text-xs">
        <span className="text-sm">⭐</span>
        내 활동 요약
      </h3>
      <div className="space-y-1.5 text-[10px]">
        {/* 현재 레벨 */}
        <div className="flex items-center gap-1.5 p-1 bg-white/70 rounded">
          <div className={`w-6 h-6 ${levelInfo.bgColor} rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0`}>
            {user.user_level}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-900">LV.{user.user_level} {levelInfo.name}</span>
              <span className="text-[9px] text-gray-500">
                {user.points}/{levelInfo.xpRequired} XP
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-0.5">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* 활동 통계 */}
        <div className="flex justify-between items-center p-1 bg-white/50 rounded">
          <span className="text-gray-600">평가한 정치인</span>
          <span className="font-bold text-gray-900">{user.ratings_count}명</span>
        </div>
        <div className="flex justify-between items-center p-1 bg-white/50 rounded">
          <span className="text-gray-600">작성한 글</span>
          <span className="font-bold text-gray-900">{user.posts_count}개</span>
        </div>
        <div className="flex justify-between items-center p-1 bg-white/50 rounded">
          <span className="text-gray-600">받은 추천</span>
          <span className="font-bold text-orange-500">⬆️ {user.upvotes_received}</span>
        </div>

        {/* 7단계 레벨 시스템 */}
        <div className="pt-1 border-t border-purple-200">
          <div className="text-[9px] text-gray-600 mb-1 font-medium">레벨 시스템</div>
          <div className="grid grid-cols-7 gap-0.5">
            {LEVEL_SYSTEM.map(level => (
              <div key={level.level} className="text-center">
                <div className={`w-4 h-4 ${level.bgColor} rounded-full flex items-center justify-center text-[7px] font-bold mx-auto mb-0.5 ${level.level === user.user_level ? 'text-white' : ''}`}>
                  {level.level}
                </div>
                <div className={`text-[7px] ${level.level === user.user_level ? level.textColor + ' font-medium' : 'text-gray-500'}`}>
                  {level.shortName}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 레벨 시스템 정의 (constants.ts)
export const LEVEL_SYSTEM = [
  { level: 1, name: '시민', shortName: '시민', bgColor: 'bg-gray-200', textColor: 'text-gray-500', xpRequired: 100 },
  { level: 2, name: '활동자', shortName: '활동', bgColor: 'bg-gray-300', textColor: 'text-gray-500', xpRequired: 250 },
  { level: 3, name: '참여자', shortName: '참여', bgColor: 'bg-purple-500', textColor: 'text-purple-600', xpRequired: 500 },
  { level: 4, name: '기여자', shortName: '기여', bgColor: 'bg-blue-400', textColor: 'text-blue-500', xpRequired: 1000 },
  { level: 5, name: '전문가', shortName: '전문', bgColor: 'bg-green-500', textColor: 'text-green-600', xpRequired: 2000 },
  { level: 6, name: '리더', shortName: '리더', bgColor: 'bg-orange-500', textColor: 'text-orange-600', xpRequired: 5000 },
  { level: 7, name: '마스터', shortName: '마스터', bgColor: 'bg-gradient-to-br from-yellow-400 to-orange-500', textColor: 'text-yellow-600', xpRequired: 10000 },
];
```

#### 2.3.5 연결 서비스 (ConnectedServices.tsx)

**기능**: Phase 7 외부 서비스 연결 플랫폼 안내

**코드**:
```tsx
export function ConnectedServices() {
  const services = [
    { icon: '⚖️', name: '법률 컨설팅', desc: '정치인을 위한 법률 자문 서비스' },
    { icon: '📢', name: '홍보 마케팅', desc: 'SNS 관리, 브랜딩 전문 업체' },
    { icon: '💼', name: '정치 컨설팅', desc: '전략 수립, 선거 컨설팅' },
    { icon: '📊', name: '여론 조사', desc: '전문 리서치, 데이터 분석' },
  ];

  return (
    <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-lg shadow p-2 border border-green-200">
      <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-1 text-xs">
        <span className="text-sm">🔗</span>
        연결 서비스
        <span className="bg-green-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-medium ml-auto">
          COMING SOON
        </span>
      </h3>
      <div className="space-y-1 text-[10px]">
        {services.map(service => (
          <div key={service.name} className="p-1 bg-white/50 rounded">
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-gray-700">{service.icon}</span>
              <span className="font-medium text-gray-900">{service.name}</span>
            </div>
            <div className="text-[9px] text-gray-500">{service.desc}</div>
          </div>
        ))}
        <a
          href="/services/inquiry"
          className="block text-center mt-1 p-1 bg-green-500 hover:bg-green-600 text-white rounded text-[9px] font-medium transition-colors"
        >
          서비스 업체 등록 문의 →
        </a>
      </div>
    </div>
  );
}
```

---

### 2.4 정치인 최근 글에 신분 뱃지 추가

**파일**: `web/app/components/PoliticianPosts.tsx`

**변경 전**: 🏛️ 이모지 뱃지
**변경 후**: StatusBadge 컴포넌트 사용

**코드**:
```tsx
<div className="flex items-center gap-2 mb-2">
  <div className="w-7 h-7 bg-gradient-to-br from-amber-400 to-amber-600 rounded flex items-center justify-center text-white font-bold text-xs shadow">
    🏅
  </div>
  <div className="flex-1 min-w-0">
    <div className="flex items-center gap-1">
      <span className="font-bold text-gray-900 truncate text-xs">{post.politician.name}</span>
      <StatusBadge status={post.politician.status} />
    </div>
    <div className="text-[9px] text-gray-500">{formatTimeAgo(post.created_at)}</div>
  </div>
</div>
```

---

## 3. 타입 정의 추가

**파일**: `web/app/types/index.ts` (또는 적절한 타입 파일)

```typescript
// 정치인 상태
export type PoliticianStatus = '현직' | '후보자' | '예비후보자' | '출마자';

// 정치인 인터페이스에 status 추가
export interface Politician {
  id: number;
  name: string;
  party: string;
  region: string;
  position: string;
  profile_image_url?: string;
  biography?: string;
  avg_rating: number;
  avatar_enabled: boolean;
  status: PoliticianStatus;  // 새로 추가
  created_at: string;
  updated_at: string;
}

// 레벨 정보
export interface LevelInfo {
  level: number;
  name: string;
  shortName: string;
  bgColor: string;
  textColor: string;
  xpRequired: number;
}

// 사용자 프로필에 통계 필드 추가
export interface UserProfile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  is_admin: boolean;
  user_type: 'normal' | 'politician';
  user_level: number;
  points: number;
  // 통계 필드 (계산된 값)
  ratings_count?: number;
  posts_count?: number;
  upvotes_received?: number;
}

// 핫이슈 게시글
export interface HotPost {
  id: number;
  title: string;
  view_count: number;
  comment_count: number;
}

// 공지사항
export interface Announcement {
  id: number;
  title: string;
  created_at: string;
  is_new: boolean;
  is_event: boolean;
}
```

---

## 4. API 라우트 추가/수정

### 4.1 정치인 목록 API

**파일**: `api/app/routers/politicians.py`

**변경사항**: `status` 필드 포함하여 반환

```python
# Pydantic 모델에 status 필드 추가
class PoliticianResponse(BaseModel):
    id: int
    name: str
    party: str
    region: str
    position: str
    profile_image_url: Optional[str]
    biography: Optional[str]
    avg_rating: float
    avatar_enabled: bool
    status: str  # 새로 추가
    created_at: datetime
    updated_at: datetime
```

### 4.2 사용자 통계 API 추가

**파일**: `api/app/routers/users.py`

**새 엔드포인트**: `GET /api/users/{user_id}/stats`

```python
@router.get("/{user_id}/stats")
async def get_user_stats(
    user_id: str,
    db: Session = Depends(get_db)
):
    """사용자 활동 통계 조회"""

    # 평가한 정치인 수
    ratings_count = db.query(func.count(Rating.id)).filter(
        Rating.user_id == user_id
    ).scalar()

    # 작성한 글 수
    posts_count = db.query(func.count(Post.id)).filter(
        Post.user_id == user_id
    ).scalar()

    # 받은 추천 수 (게시글 + 댓글)
    posts_upvotes = db.query(func.sum(Post.upvotes)).filter(
        Post.user_id == user_id
    ).scalar() or 0

    comments_upvotes = db.query(func.sum(Comment.upvotes)).filter(
        Comment.user_id == user_id
    ).scalar() or 0

    return {
        "ratings_count": ratings_count,
        "posts_count": posts_count,
        "upvotes_received": posts_upvotes + comments_upvotes
    }
```

### 4.3 주간 핫이슈 API

**파일**: `api/app/routers/posts.py`

**새 엔드포인트**: `GET /api/posts/hot-weekly`

```python
@router.get("/hot-weekly")
async def get_hot_weekly_posts(
    limit: int = 3,
    db: Session = Depends(get_db)
):
    """주간 핫이슈 게시글 조회"""

    one_week_ago = datetime.now() - timedelta(days=7)

    posts = db.query(
        Post.id,
        Post.title,
        Post.view_count,
        func.count(Comment.id).label('comment_count')
    ).outerjoin(Comment).filter(
        Post.created_at >= one_week_ago
    ).group_by(Post.id).order_by(
        Post.view_count.desc(),
        func.count(Comment.id).desc()
    ).limit(limit).all()

    return posts
```

### 4.4 트렌딩 토픽 API

**파일**: `api/app/routers/posts.py`

**새 엔드포인트**: `GET /api/posts/trending-topics`

```python
@router.get("/trending-topics")
async def get_trending_topics(
    limit: int = 5,
    db: Session = Depends(get_db)
):
    """트렌딩 토픽(해시태그) 조회"""

    # 게시글 제목/내용에서 #해시태그 추출 (간단한 구현)
    # 실제로는 별도 hashtags 테이블 사용 권장

    topics = [
        {"tag": "의정활동", "count": 234},
        {"tag": "공약이행", "count": 189},
        {"tag": "지역개발", "count": 156},
        {"tag": "투명성", "count": 142},
        {"tag": "청년정책", "count": 128},
    ]

    return topics[:limit]
```

---

## 5. 유틸리티 함수 추가

**파일**: `web/app/utils/helpers.ts`

```typescript
// 숫자 포맷팅 (12300 → 12.3K)
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// 시간 경과 표시 (2시간 전, 3일 전 등)
export function formatTimeAgo(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins}분 전`;
  } else if (diffHours < 24) {
    return `${diffHours}시간 전`;
  } else if (diffDays < 7) {
    return `${diffDays}일 전`;
  } else {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks}주일 전`;
  }
}

// 레벨 정보 조회
export function getLevelInfo(level: number): LevelInfo {
  return LEVEL_SYSTEM.find(l => l.level === level) || LEVEL_SYSTEM[0];
}

// 다음 레벨까지 남은 XP 계산
export function getXpToNextLevel(currentLevel: number, currentXp: number): number {
  const nextLevel = LEVEL_SYSTEM.find(l => l.level === currentLevel + 1);
  if (!nextLevel) return 0;

  const currentLevelInfo = getLevelInfo(currentLevel);
  const xpInCurrentLevel = currentXp % currentLevelInfo.xpRequired;

  return nextLevel.xpRequired - xpInCurrentLevel;
}
```

---

## 6. 테스트 체크리스트

### 6.1 데이터베이스 테스트

- [ ] `status` 컬럼 생성 확인
- [ ] CHECK 제약조건 동작 확인 (잘못된 값 입력 시 에러)
- [ ] 인덱스 생성 확인
- [ ] 기존 데이터에 DEFAULT 값 적용 확인

### 6.2 API 테스트

- [ ] 정치인 목록 API에서 `status` 필드 반환 확인
- [ ] 사용자 통계 API 정상 동작 확인
- [ ] 주간 핫이슈 API 정상 동작 확인
- [ ] 트렌딩 토픽 API 정상 동작 확인

### 6.3 프론트엔드 테스트

- [ ] 정치인 목록 테이블에 신분 컬럼 표시 확인
- [ ] StatusBadge 컴포넌트 색상별 정상 표시 확인
- [ ] 평점 컬럼 헤더 변경 확인
- [ ] 회원 평점 "평가하기" 링크 동작 확인
- [ ] Claude 평점 "평가내역 보기" 링크 동작 확인
- [ ] 미래 AI 컬럼 "추후 표시 예정" 메시지 표시 확인
- [ ] 커뮤니티 섹션 레이아웃 (2/3 + 1/3) 확인
- [ ] 모바일에서 레이아웃 반응형 동작 확인
- [ ] 사이드바 위젯 5개 모두 표시 확인
- [ ] 내 활동 요약에서 레벨 시스템 7단계 표시 확인
- [ ] 정치인 최근 글에 신분 뱃지 표시 확인

### 6.4 성능 테스트

- [ ] 페이지 로딩 속도 확인 (목표: 3초 이내)
- [ ] API 응답 속도 확인 (목표: 500ms 이내)
- [ ] 사이드바 위젯 데이터 로딩 최적화 (필요시 캐싱)

---

## 7. 배포 절차

### 7.1 데이터베이스 마이그레이션

```bash
cd "G:/내 드라이브/Developement/PoliticianFinder"

# Supabase 마이그레이션 실행
npx supabase db push

# 검증
npx supabase db remote commit
```

### 7.2 프론트엔드 빌드 및 배포

```bash
cd web

# 의존성 설치 (새 컴포넌트/패키지 추가 시)
npm install

# 빌드
npm run build

# Vercel 배포
vercel --prod
```

### 7.3 백엔드 배포 (API 변경사항 있는 경우)

```bash
cd api

# 의존성 업데이트
pip install -r requirements.txt

# Railway/기타 플랫폼 배포
# (배포 방식에 따라 명령 조정)
```

---

## 8. 롤백 계획

### 8.1 데이터베이스 롤백

```bash
# status 컬럼 제거
psql -h <supabase-host> -U postgres -d postgres -f supabase/migrations/20251019130029_rollback_add_status_to_politicians.sql
```

### 8.2 코드 롤백

```bash
# Git 이전 커밋으로 되돌리기
git revert <commit-hash>
git push origin main

# 또는
git reset --hard <previous-commit>
git push --force origin main
```

---

## 9. 참고 문서

- **디자인 mockup**: `design/mockup-d4.html`
- **마이그레이션 파일**: `supabase/migrations/20251019130029_add_status_to_politicians.sql`
- **Phase 7 계획서**: `15DGC-AODM_Grid/backups/2025-10-15_cleanup/PHASE_6_7_8_PLAN_v2.md`
- **데이터베이스 스키마**: `15DGC-AODM_Grid/supabase_database_schema.sql`

---

## 10. 작업 완료 체크리스트

- [ ] 데이터베이스 마이그레이션 실행 완료
- [ ] 타입 정의 추가 완료
- [ ] StatusBadge 컴포넌트 생성 완료
- [ ] 정치인 목록 컴포넌트 수정 완료
- [ ] 커뮤니티 레이아웃 재구성 완료
- [ ] 사이드바 위젯 5개 생성 완료
- [ ] API 엔드포인트 추가 완료
- [ ] 유틸리티 함수 추가 완료
- [ ] 테스트 완료
- [ ] 프론트엔드 빌드 성공
- [ ] Vercel 배포 완료
- [ ] 프로덕션 환경 동작 확인

---

**작업 예상 소요 시간**: 4-6시간

**우선순위**:
1. 데이터베이스 마이그레이션 (필수)
2. StatusBadge 컴포넌트 및 정치인 목록 수정 (필수)
3. 커뮤니티 레이아웃 재구성 (필수)
4. 사이드바 위젯 추가 (중요)
5. API 엔드포인트 추가 (중요)

---

**문의 사항**: 작업 중 문제 발생 시 이 작업지시서를 참고하여 진행하세요.
