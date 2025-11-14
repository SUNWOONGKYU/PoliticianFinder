# P3F4: 정치인 데이터 스키마 완성 작업

## 작업 개요
정치인 상세 페이지에서 표시하는 모든 정보가 데이터베이스에 저장될 수 있도록 스키마를 완성하고, API와 프론트엔드 간의 필드명 불일치를 해결합니다.

## 현재 상태 (2025-11-14 분석 결과)

### 문제점
1. **필드명 불일치 (Snake Case vs Camel Case)**: 20개 필드
2. **누락된 필드**: 선관위 공식 정보 9개 필드
3. **계산 필드**: age, postCount, likeCount 등은 실시간 계산 필요

### 분석 결과
- **존재하는 필드**: 14개
- **누락된 필드**: 20개
- **DB에만 있는 필드**: 26개

## 작업 목표

### 1. 데이터베이스 스키마 정리
필드를 3가지 카테고리로 분류:

#### A. 저장 필드 (Storage Fields)
데이터베이스에 실제로 저장되는 필드

**기본 정보**:
- `id` ✅ (이미 존재)
- `name` ✅
- `name_kanji` ❌ (추가 필요) - 한자 이름
- `name_en` ✅
- `identity` ✅ (신분)
- `title` ✅ (직책)
- `position` ✅ (출마직종)
- `party` ✅
- `region` ✅
- `district` ✅
- `birth_date` ✅
- `gender` ✅

**AI 평가 정보**:
- `ai_score` ✅ (Claude 평점)
- `evaluation_score` ✅ (종합평점)
- `evaluation_grade` ✅ (평가등급)
- `updated_at` ✅ (최종 갱신일시)

**선거관리위원회 공식 정보** (모두 추가 필요):
- `education` ✅ (JSONB) - 학력
- `career` ❌ (JSONB) - 경력
- `election_history` ❌ (JSONB) - 당선 이력
- `military_service` ❌ (VARCHAR) - 병역
- `assets` ❌ (JSONB) - 재산 공개
- `tax_arrears` ❌ (VARCHAR) - 세금 체납
- `criminal_record` ❌ (VARCHAR) - 범죄 경력
- `military_service_issue` ❌ (VARCHAR) - 병역 의혹
- `residency_fraud` ❌ (VARCHAR) - 위장전입
- `pledges` ❌ (JSONB) - 주요 공약
- `legislative_activity` ❌ (JSONB) - 의정 활동

**기타**:
- `profile_image_url` ✅
- `website_url` ✅
- `facebook_url` ✅
- `twitter_url` ✅
- `instagram_url` ✅
- `youtube_url` ✅
- `phone` ✅
- `email` ✅
- `office_address` ✅
- `is_verified` ✅
- `view_count` ✅
- `favorite_count` ✅
- `user_rating` ✅
- `rating_count` ✅
- `created_at` ✅

#### B. 계산 필드 (Computed Fields)
API에서 실시간으로 계산되는 필드

- `age` - `birth_date`로부터 계산
- `postCount` - `community_posts` 테이블에서 COUNT
- `likeCount` - `community_posts`의 `like_count` 합계
- `taggedCount` - 태깅된 게시글 수 (community_posts에서 tagged_politicians 포함)

#### C. 프론트엔드 전용 필드 (Frontend-only Fields)
샘플 데이터로만 표시되는 필드 (실제 기능 구현 시 추가)

- `nameKanji` - 실제 데이터 수집 전까지는 `name_kanji` 또는 빈 값

## 해결 방안

### Phase 1: 데이터베이스 스키마 추가

```sql
-- Add missing columns for Election Commission official information
ALTER TABLE politicians
  ADD COLUMN IF NOT EXISTS name_kanji VARCHAR(200),
  ADD COLUMN IF NOT EXISTS career JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS election_history JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS military_service VARCHAR(500),
  ADD COLUMN IF NOT EXISTS assets JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS tax_arrears VARCHAR(500) DEFAULT '없음',
  ADD COLUMN IF NOT EXISTS criminal_record VARCHAR(500) DEFAULT '없음',
  ADD COLUMN IF NOT EXISTS military_service_issue VARCHAR(500) DEFAULT '없음',
  ADD COLUMN IF NOT EXISTS residency_fraud VARCHAR(500) DEFAULT '없음',
  ADD COLUMN IF NOT EXISTS pledges JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS legislative_activity JSONB DEFAULT '{}'::jsonb;

-- Add comments
COMMENT ON COLUMN politicians.name_kanji IS '한자 이름';
COMMENT ON COLUMN politicians.career IS '경력 (배열)';
COMMENT ON COLUMN politicians.election_history IS '당선 이력 (배열)';
COMMENT ON COLUMN politicians.military_service IS '병역';
COMMENT ON COLUMN politicians.assets IS '재산 공개 (객체)';
COMMENT ON COLUMN politicians.tax_arrears IS '세금 체납';
COMMENT ON COLUMN politicians.criminal_record IS '범죄 경력';
COMMENT ON COLUMN politicians.military_service_issue IS '병역 의혹';
COMMENT ON COLUMN politicians.residency_fraud IS '위장전입';
COMMENT ON COLUMN politicians.pledges IS '주요 공약 (배열)';
COMMENT ON COLUMN politicians.legislative_activity IS '의정 활동 (객체: 출석률, 발의 법안 등)';
```

### Phase 2: API Response 필드명 매핑

API에서 snake_case → camelCase 변환 함수 생성:

```typescript
// utils/fieldMapper.ts
export function mapPoliticianFields(dbRecord: any) {
  // Calculate age from birth_date
  const age = dbRecord.birth_date
    ? new Date().getFullYear() - new Date(dbRecord.birth_date).getFullYear()
    : 0;

  return {
    // Basic info (snake_case → camelCase)
    id: dbRecord.id,
    name: dbRecord.name,
    nameKanji: dbRecord.name_kanji || '',
    nameEn: dbRecord.name_en,
    identity: dbRecord.identity,
    title: dbRecord.title,
    position: dbRecord.position,
    party: dbRecord.party,
    region: dbRecord.region,
    district: dbRecord.district,
    birthDate: dbRecord.birth_date,
    age: age,
    gender: dbRecord.gender,

    // AI evaluation
    claudeScore: dbRecord.ai_score,
    totalScore: dbRecord.evaluation_score,
    grade: dbRecord.evaluation_grade,
    lastUpdated: dbRecord.updated_at,

    // Community activity (computed fields)
    postCount: dbRecord.post_count || 0, // Will be computed in API
    likeCount: dbRecord.like_count || 0, // Will be computed in API
    taggedCount: dbRecord.tagged_count || 0, // Will be computed in API

    // Election Commission info
    education: dbRecord.education || [],
    career: dbRecord.career || [],
    electionHistory: dbRecord.election_history || [],
    militaryService: dbRecord.military_service || '없음',
    assets: dbRecord.assets || {},
    taxArrears: dbRecord.tax_arrears || '없음',
    criminalRecord: dbRecord.criminal_record || '없음',
    militaryServiceIssue: dbRecord.military_service_issue || '없음',
    residencyFraud: dbRecord.residency_fraud || '없음',
    pledges: dbRecord.pledges || [],
    legislativeActivity: dbRecord.legislative_activity || {},

    // Other fields
    profileImageUrl: dbRecord.profile_image_url,
    websiteUrl: dbRecord.website_url,
    facebookUrl: dbRecord.facebook_url,
    twitterUrl: dbRecord.twitter_url,
    instagramUrl: dbRecord.instagram_url,
    youtubeUrl: dbRecord.youtube_url,
    phone: dbRecord.phone,
    email: dbRecord.email,
    officeAddress: dbRecord.office_address,
    isVerified: dbRecord.is_verified,
    viewCount: dbRecord.view_count,
    favoriteCount: dbRecord.favorite_count,
    userRating: dbRecord.user_rating,
    ratingCount: dbRecord.rating_count,
    createdAt: dbRecord.created_at,
    updatedAt: dbRecord.updated_at,
  };
}
```

### Phase 3: API 수정 (커뮤니티 통계 계산 포함)

**GET /api/politicians/[id]/route.ts**:
```typescript
import { mapPoliticianFields } from '@/utils/fieldMapper';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  // Fetch politician data
  const { data: politician, error } = await supabase
    .from('politicians')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !politician) {
    return NextResponse.json({ success: false, error: 'Politician not found' }, { status: 404 });
  }

  // Calculate community statistics
  const { data: posts } = await supabase
    .from('community_posts')
    .select('like_count')
    .eq('author_id', id)
    .eq('author_type', 'politician');

  const postCount = posts?.length || 0;
  const likeCount = posts?.reduce((sum, post) => sum + (post.like_count || 0), 0) || 0;

  // Count tagged posts
  const { count: taggedCount } = await supabase
    .from('community_posts')
    .select('*', { count: 'exact', head: true })
    .contains('tagged_politicians', [politician.name]);

  // Map fields and add computed values
  const mappedData = mapPoliticianFields({
    ...politician,
    post_count: postCount,
    like_count: likeCount,
    tagged_count: taggedCount || 0,
  });

  return NextResponse.json({ success: true, data: mappedData });
}
```

### Phase 4: 프론트엔드 인터페이스 정리

**Interface 정의 (types/politician.ts)**:
```typescript
export interface Politician {
  // Basic info
  id: string;
  name: string;
  nameKanji: string;
  nameEn?: string;
  identity: string;
  title?: string;
  position: string;
  party: string;
  region: string;
  district?: string;
  birthDate: string;
  age: number;
  gender: string;

  // AI evaluation
  claudeScore: number;
  totalScore: number;
  grade: string;
  lastUpdated: string;

  // Community activity
  postCount: number;
  likeCount: number;
  taggedCount: number;

  // Election Commission info
  education: string[];
  career: string[];
  electionHistory: string[];
  militaryService: string;
  assets: {
    total?: string;
    real_estate?: string;
    financial?: string;
  };
  taxArrears: string;
  criminalRecord: string;
  militaryServiceIssue: string;
  residencyFraud: string;
  pledges: string[];
  legislativeActivity: {
    attendance_rate?: string;
    bills_proposed?: number;
    bills_passed?: number;
  };

  // Other fields
  profileImageUrl?: string;
  websiteUrl?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  phone?: string;
  email?: string;
  officeAddress?: string;
  isVerified: boolean;
  viewCount: number;
  favoriteCount: number;
  userRating: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
}
```

## 작업 순서

### Step 1: 데이터베이스 마이그레이션 (30분)
1. SQL 스크립트 작성
2. 로컬 DB 적용 및 테스트
3. Vercel Postgres 적용

### Step 2: 필드 매핑 유틸리티 작성 (30분)
1. `utils/fieldMapper.ts` 생성
2. snake_case → camelCase 변환 로직
3. 계산 필드 추가 로직

### Step 3: API 수정 (1시간)
1. GET /api/politicians/[id] - 커뮤니티 통계 계산 추가
2. GET /api/politicians - 목록 조회 시에도 적용
3. 모든 응답에 `mapPoliticianFields` 적용

### Step 4: 타입 정의 및 프론트엔드 수정 (1시간)
1. `types/politician.ts` 생성
2. 모든 컴포넌트에서 타입 임포트
3. TypeScript 에러 수정

### Step 5: 테스트 및 검증 (30분)
1. 정치인 상세 페이지 확인
2. 정치인 목록 페이지 확인
3. 빌드 테스트

## 예상 소요 시간
- **총 3.5시간**

## 성공 기준
1. ✅ 모든 필드가 데이터베이스에 저장 가능
2. ✅ API Response가 프론트엔드 인터페이스와 일치
3. ✅ camelCase 필드명으로 통일
4. ✅ 커뮤니티 통계가 실시간으로 계산됨
5. ✅ TypeScript 타입 에러 없음
6. ✅ 빌드 성공

## 관련 작업
- **선행 작업**: P3F3 (status 필드 제거 및 identity/title 분리)
- **병행 가능**: P3F3와 동시 진행 가능

## 비고
- 이 작업은 **데이터 구조의 완성**이므로 신중하게 진행
- snake_case ↔ camelCase 변환을 API 레이어에서 처리하여 DB와 Frontend 간 일관성 유지
- 계산 필드는 캐싱 전략 고려 (view_count, favorite_count는 DB 저장, postCount는 실시간 계산)
