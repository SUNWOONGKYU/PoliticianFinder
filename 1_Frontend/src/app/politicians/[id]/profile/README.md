# 정치인 프로필 페이지 (P6F7)

## 개요
정치인의 상세 프로필 정보를 표시하는 페이지입니다. 인증 배지, 팔로우 기능, 탭 기반 정보 표시 등을 포함합니다.

## 파일 위치
```
1_Frontend/src/app/politicians/[id]/profile/page.tsx
```

## 주요 기능

### 1. 프로필 헤더
- **프로필 이미지**: 정치인 사진 또는 이니셜 표시
- **인증 배지**: 본인 인증 완료 시 체크마크 표시
- **기본 정보**: 이름, 직책, 정당, 지역구
- **소개글**: 정치인 자기소개
- **통계 정보**: 팔로워 수, 평가 수, 평균 평점, AI 점수

### 2. 액션 버튼
- **팔로우/언팔로우**: 정치인 팔로우 기능
- **공유하기**: 웹 공유 API 또는 클립보드 복사

### 3. 탭 네비게이션
4개의 탭으로 정보 구분:
- **기본정보**: 생년월일, 소속 정당, 지역구, 학력, 공식 웹사이트
- **경력**: 타임라인 형태의 주요 경력 표시
- **공약**: 주요 공약 및 이행 상태
- **평가**: 상세 평가 페이지로 이동

### 4. 반응형 디자인
- **모바일**: 1열 레이아웃, 세로 방향 정보 표시
- **태블릿/데스크톱**: 2열 그리드, 가로 정보 배치

## 색상 시스템

### Primary Color (Accent)
```css
/* 메인 색상: 어두운 에메랄드 그린 */
#064E3B - bg-[#064E3B]
#065F46 - hover:bg-[#065F46] (호버 상태)
```

### 적용 위치
- 팔로우 버튼
- 인증 배지
- 탭 활성 상태
- AI 점수 강조
- 타임라인 포인트

## 컴포넌트 구조

```
PoliticianProfilePage
├── Header (뒤로가기)
├── Profile Header
│   ├── Profile Image + Verification Badge
│   ├── Basic Info (Name, Position, Party, Region)
│   ├── Bio
│   ├── Action Buttons (Follow, Share)
│   └── Stats (Followers, Ratings, Avg Score, AI Score)
├── Tab Navigation (Info, Career, Pledges, Ratings)
└── Tab Content
    ├── 기본정보 탭
    │   ├── 기본 정보 카드
    │   ├── 학력 카드
    │   └── 공식 웹사이트 카드
    ├── 경력 탭 (타임라인)
    ├── 공약 탭 (상태별 공약 목록)
    └── 평가 탭 (상세 페이지 링크)
```

## 데이터 타입

### PoliticianProfile
```typescript
interface PoliticianProfile {
  id: number
  name: string
  profile_image_url: string | null
  party: string
  position: string
  region: string
  is_verified: boolean
  bio: string | null
  birth_date: string | null
  education: string[]
  career: CareerItem[]
  pledges: Pledge[]
  ai_score: number | null
  followers_count: number
  ratings_count: number
  avg_rating: number
  website_url: string | null
}
```

### CareerItem
```typescript
interface CareerItem {
  period: string        // 예: "2020 - 2024"
  title: string         // 예: "서울시의회 의원"
  description?: string  // 선택적 상세 설명
}
```

### Pledge
```typescript
interface Pledge {
  id: number
  title: string
  description: string
  category: string      // 예: "교통", "복지", "환경"
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
}
```

## API 엔드포인트

### 프로필 조회
```
GET /api/politicians/{id}/profile
```

**Response:**
```json
{
  "id": 1,
  "name": "홍길동",
  "profile_image_url": "https://...",
  "party": "더불어민주당",
  "position": "국회의원",
  "region": "서울 강남구",
  "is_verified": true,
  "bio": "국민을 위해 일하는 정치인입니다.",
  "birth_date": "1970-01-01",
  "education": ["서울대학교 법학과", "하버드 대학교 석사"],
  "career": [...],
  "pledges": [...],
  "ai_score": 850,
  "followers_count": 1234,
  "ratings_count": 567,
  "avg_rating": 4.5,
  "website_url": "https://example.com"
}
```

### 팔로우/언팔로우
```
POST /api/politicians/{id}/follow    # 팔로우
DELETE /api/politicians/{id}/follow  # 언팔로우
```

## 상태 관리

### Local State
```typescript
const [politician, setPolitician] = useState<PoliticianProfile | null>(null)
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)
const [isFollowing, setIsFollowing] = useState(false)
const [activeTab, setActiveTab] = useState<TabType>('info')
const [followLoading, setFollowLoading] = useState(false)
```

## 접근성 (Accessibility)

### WCAG 2.1 AA 준수
- [x] 시맨틱 HTML 사용 (`nav`, `button`, `dl`, `dt`, `dd`)
- [x] ARIA 속성 적용 (`aria-label`, `role="tab"`, `aria-selected`)
- [x] 키보드 내비게이션 지원
- [x] 포커스 인디케이터 표시
- [x] 색상 대비 AA 기준 충족 (#064E3B)
- [x] 적절한 버튼 크기 (최소 44x44px)

### 스크린 리더 지원
- 모든 아이콘 버튼에 `aria-label` 제공
- 인증 배지 레이블 ("인증됨")
- 탭 상태 표시 (`aria-selected`)

## 에러 처리

### 404 Not Found
- 정치인을 찾을 수 없을 때 친화적인 에러 메시지
- 홈으로 돌아가기 버튼 제공

### 네트워크 에러
- 로딩 스피너 표시
- 재시도 가능한 에러 메시지

### 빈 데이터 처리
- 경력 없음: "등록된 경력이 없습니다."
- 공약 없음: 빈 상태 UI 표시

## 반응형 브레이크포인트

### 모바일 (< 768px)
```css
/* 세로 레이아웃 */
flex-col
/* 프로필 이미지 크기 */
w-24 h-24
/* 전체 너비 버튼 */
w-full
```

### 태블릿/데스크톱 (>= 768px)
```css
/* 가로 레이아웃 */
md:flex-row
/* 프로필 이미지 크기 */
md:w-32 md:h-32
/* 2열 그리드 */
md:grid-cols-2
```

## 테스트 체크리스트

### 기능 테스트
- [ ] 정치인 정보 정상 로딩
- [ ] 프로필 이미지 표시 (있을 때/없을 때)
- [ ] 인증 배지 표시 (인증된 경우)
- [ ] 팔로우/언팔로우 동작
- [ ] 공유 기능 (웹 공유 API/클립보드)
- [ ] 탭 전환 동작
- [ ] 각 탭 콘텐츠 표시
- [ ] 공약 상태 배지 표시
- [ ] 타임라인 렌더링
- [ ] 404 에러 처리

### 반응형 테스트
- [ ] 모바일 (375px)
- [ ] 태블릿 (768px)
- [ ] 데스크톱 (1440px)
- [ ] 가로 스크롤 없음
- [ ] 탭 오버플로우 처리

### 접근성 테스트
- [ ] 키보드만으로 전체 내비게이션
- [ ] Tab 키 순서 적절
- [ ] 포커스 인디케이터 표시
- [ ] 스크린 리더 테스트
- [ ] 색상 대비 검사 (WCAG AA)

## 향후 개선사항

### 1. 통계 차트
- 팔로워 증가 추이 그래프
- 평가 점수 분포 차트

### 2. 소셜 기능
- 팔로워 목록 보기
- 정치인 활동 타임라인

### 3. 공약 추적
- 공약 이행률 시각화
- 공약별 상세 진행 상황

### 4. 성능 최적화
- 이미지 lazy loading
- 탭 콘텐츠 lazy loading
- 데이터 캐싱 (SWR/React Query)

### 5. 오프라인 지원
- Service Worker 등록
- 오프라인 데이터 캐싱

## 관련 파일

- **메인 페이지**: `1_Frontend/src/app/politicians/[id]/page.tsx`
- **타입 정의**: `1_Frontend/src/types/politician.ts`
- **API 클라이언트**: `1_Frontend/src/lib/api/politicians.ts`

## 디자인 참고

### 컬러 팔레트
- Primary (Accent): #064E3B
- Primary Hover: #065F46
- Success: #22c55e
- Warning: #f59e0b
- Error: #ef4444
- Gray Scale: Tailwind 기본 팔레트

### 타이포그래피
- Font Family: Noto Sans KR
- Heading 1: text-2xl md:text-3xl font-bold
- Heading 2: text-xl font-bold
- Heading 3: text-lg font-semibold
- Body: text-base text-gray-700
- Caption: text-sm text-gray-500

## 작업 정보

- **Task ID**: P6F7
- **작업명**: 정치인 프로필 페이지
- **Phase**: Phase 6
- **Agent**: ui-designer
- **작성일**: 2025-11-03
