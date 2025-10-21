# SearchFilter Component

정치인 목록 페이지에서 사용하는 검색 및 필터링 UI 컴포넌트입니다.

## 파일 구조

```
frontend/src/
├── components/
│   ├── SearchFilter.tsx           # 메인 검색 필터 컴포넌트
│   └── SearchFilterDemo.tsx       # 데모 및 테스트 페이지
└── types/
    └── filter.ts                   # 필터 타입 정의
```

## 기능 개요

### 1. 검색 기능
- **이름 검색**: 정치인 이름으로 검색 (최소 2글자)
- **정당 검색**: 소속 정당명으로 검색 (최소 2글자)
- **지역구 검색**: 지역구명으로 검색 (최소 2글자)
- **Debounce**: 500ms 지연으로 API 호출 최적화
- **Clear 버튼**: 각 검색어 입력 필드에 삭제 버튼 제공

### 2. 필터 기능
- **정당 필터**: 다중 선택 가능한 정당 필터
  - 더불어민주당, 국민의힘, 정의당, 개혁신당, 진보당, 무소속
- **지역 필터**: 다중 선택 가능한 지역 필터
  - 17개 시·도 (서울, 부산, 대구, 인천, 광주, 대전, 울산, 세종, 경기, 강원, 충북, 충남, 전북, 전남, 경북, 경남, 제주)
- **직책 필터**: 다중 선택 가능한 직책 필터
  - 국회의원, 시·도지사, 시장, 군수, 구청장
- **당선 횟수 필터**: 단일 선택 필터
  - 1선, 2선, 3선, 4선 이상

### 3. 정렬 기능
- **정렬 기준**
  - 이름순 (name)
  - 평점 높은순 (avg_rating)
  - 평가 많은순 (total_ratings)
  - 최신순 (created_at)
- **정렬 순서**
  - 오름차순 (asc)
  - 내림차순 (desc)

### 4. UI/UX 기능
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 대응
- **접기/펼치기**: 모바일에서 필터 영역 토글
- **시각적 피드백**: 선택된 필터 하이라이트
- **접근성**: ARIA 레이블 및 키보드 네비게이션 지원
- **초기화 버튼**: 모든 필터를 초기 상태로 리셋

## 사용 방법

### 기본 사용법

```tsx
import { SearchFilter } from '@/components/SearchFilter'
import { SearchFilterParams } from '@/types/filter'

function PoliticianListPage() {
  const handleFilterChange = (filters: SearchFilterParams) => {
    console.log('Filters changed:', filters)
    // API 호출 또는 상태 업데이트
  }

  return (
    <div>
      <SearchFilter onFilterChange={handleFilterChange} />
      {/* 정치인 목록 표시 */}
    </div>
  )
}
```

### API 연동 예제

```tsx
import { SearchFilter } from '@/components/SearchFilter'
import { SearchFilterParams } from '@/types/filter'
import { useState, useEffect } from 'react'

function PoliticianListPage() {
  const [politicians, setPoliticians] = useState([])
  const [currentFilters, setCurrentFilters] = useState<SearchFilterParams>({})

  const fetchPoliticians = async (filters: SearchFilterParams) => {
    try {
      // API 쿼리 파라미터 구성
      const params = new URLSearchParams()

      if (filters.searchName) params.append('search', filters.searchName)
      if (filters.parties?.length) params.append('party', filters.parties.join(','))
      if (filters.regions?.length) params.append('region', filters.regions.join(','))
      if (filters.positions?.length) params.append('position', filters.positions.join(','))
      if (filters.sortBy) params.append('sort', filters.sortBy)
      if (filters.sortOrder) params.append('order', filters.sortOrder)

      const response = await fetch(`/api/politicians?${params}`)
      const data = await response.json()
      setPoliticians(data.data)
    } catch (error) {
      console.error('Failed to fetch politicians:', error)
    }
  }

  const handleFilterChange = (filters: SearchFilterParams) => {
    setCurrentFilters(filters)
    fetchPoliticians(filters)
  }

  return (
    <div className="space-y-6">
      <SearchFilter onFilterChange={handleFilterChange} />

      {/* 정치인 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {politicians.map((politician) => (
          <PoliticianCard key={politician.id} politician={politician} />
        ))}
      </div>
    </div>
  )
}
```

### 초기 필터 값 설정

```tsx
import { SearchFilter } from '@/components/SearchFilter'

function PoliticianListPage() {
  const initialFilters = {
    parties: ['더불어민주당', '국민의힘'],
    regions: ['서울'],
    sortBy: 'avg_rating' as const,
    sortOrder: 'desc' as const,
  }

  return (
    <SearchFilter
      initialFilters={initialFilters}
      onFilterChange={handleFilterChange}
    />
  )
}
```

## Props

### SearchFilter

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `onFilterChange` | `(filters: SearchFilterParams) => void` | Yes | - | 필터 변경 시 호출되는 콜백 함수 |
| `initialFilters` | `SearchFilterParams` | No | `{}` | 초기 필터 값 |
| `className` | `string` | No | `''` | 추가 CSS 클래스 |

## 타입 정의

### SearchFilterParams

```typescript
interface SearchFilterParams {
  // 검색 필드
  searchName?: string
  searchParty?: string
  searchRegion?: string

  // 필터 옵션
  parties?: string[]
  regions?: string[]
  positions?: string[]
  minElectionCount?: number

  // 정렬 옵션
  sortBy?: SortOption
  sortOrder?: 'asc' | 'desc'
}
```

### SortOption

```typescript
type SortOption =
  | 'name'           // 이름순
  | 'avg_rating'     // 평점순
  | 'total_ratings'  // 평가 수순
  | 'created_at'     // 등록일순
```

## 스타일링

컴포넌트는 Tailwind CSS를 사용하여 스타일링되어 있습니다. 필요에 따라 `className` prop을 통해 추가 스타일을 적용할 수 있습니다.

```tsx
<SearchFilter
  onFilterChange={handleFilterChange}
  className="my-custom-class"
/>
```

## 성능 최적화

### Debounce
검색 입력 필드는 500ms의 debounce가 적용되어 있어, 사용자가 타이핑을 멈춘 후 0.5초 뒤에 `onFilterChange` 콜백이 호출됩니다. 이를 통해 불필요한 API 호출을 방지합니다.

### 최소 검색어 길이
검색어는 최소 2글자 이상이어야 필터에 적용됩니다. 이를 통해 너무 짧은 검색어로 인한 과도한 결과를 방지합니다.

### 즉시 적용
필터 버튼(정당, 지역, 직책 등)은 클릭 즉시 적용되어 사용자에게 빠른 피드백을 제공합니다.

## 접근성

- 모든 입력 필드에 적절한 `Label` 컴포넌트 사용
- 버튼에 `aria-label` 속성 제공
- 키보드 네비게이션 지원
- 포커스 시각적 표시
- 스크린 리더 친화적

## 브라우저 지원

- Chrome (최신)
- Firefox (최신)
- Safari (최신)
- Edge (최신)
- 모바일 브라우저 (iOS Safari, Chrome)

## 테스트

데모 페이지를 통해 컴포넌트를 테스트할 수 있습니다:

```tsx
import { SearchFilterDemo } from '@/components/SearchFilterDemo'

// 데모 페이지 렌더링
<SearchFilterDemo />
```

## 의존성

- React 19+
- Tailwind CSS 4+
- lucide-react (아이콘)
- @radix-ui/react-label
- class-variance-authority

## 향후 개선 사항

- [ ] URL 쿼리 파라미터 동기화
- [ ] 필터 프리셋 저장/불러오기
- [ ] 고급 검색 모드 (AND/OR 조건)
- [ ] 필터 히스토리 저장
- [ ] 필터 적용 카운트 표시
- [ ] 애니메이션 효과 추가

## 문제 해결

### 필터가 적용되지 않음
- `onFilterChange` 콜백이 제대로 구현되어 있는지 확인
- 검색어가 2글자 이상인지 확인
- 브라우저 콘솔에서 필터 객체 확인

### 스타일이 올바르게 표시되지 않음
- Tailwind CSS가 제대로 설정되어 있는지 확인
- CSS 빌드 프로세스가 정상 작동하는지 확인

### Debounce가 작동하지 않음
- React 18+ 사용 확인
- 컴포넌트가 언마운트/리마운트되지 않는지 확인

## 라이선스

MIT License
