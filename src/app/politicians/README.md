# 정치인 목록 페이지 (P2F7)

## 개요
정치인 목록을 표시하고 검색/필터링/정렬 기능을 통합하는 메인 페이지입니다.

## 기능

### 1. 검색 및 필터링
- **이름 검색**: 정치인 이름으로 실시간 검색 (300ms debounce)
- **정당 필터**: 다중 선택 가능 (더불어민주당, 국민의힘, 정의당, 개혁신당, 진보당, 무소속)
- **지역 필터**: 다중 선택 가능 (서울, 부산, 대구, 인천, 광주, 대전, 울산, 세종, 경기, 강원, 충북, 충남, 전북, 전남, 경북, 경남, 제주)
- **직급 필터**: 다중 선택 가능 (국회의원, 시·도지사, 시장, 군수, 구청장)
- **필터 초기화**: 모든 검색/필터 조건을 한번에 초기화

### 2. 정렬 옵션
- 평점 높은 순 (기본값)
- 평점 낮은 순
- 이름 가나다 순
- 당선 횟수 많은 순
- 최신 평가 순

### 3. 페이지네이션
- 페이지당 12개 항목 표시
- 페이지 번호 직접 선택
- 이전/다음 페이지 이동
- 첫/마지막 페이지 이동
- 현재 페이지 및 전체 결과 수 표시

### 4. 반응형 레이아웃
- 모바일: 1열 그리드
- 태블릿: 2열 그리드
- 데스크톱: 3열 그리드

## 컴포넌트 구조

```
PoliticiansPage
├── Header
│   ├── 제목 및 설명
├── SearchFilter (P2F3)
│   ├── 검색 입력
│   ├── 필터 버튼
│   ├── 초기화 버튼
│   └── 필터 패널 (토글)
│       ├── 정당 필터
│       ├── 지역 필터
│       └── 직급 필터
├── Results Header
│   ├── 결과 카운트
│   ├── 활성 필터 표시
│   └── SortDropdown (P2F5)
├── Content Area
│   ├── LoadingSpinner (로딩 상태)
│   ├── Error Message (에러 상태)
│   ├── PoliticianCard Grid (P2F1)
│   │   └── PoliticianCard × N
│   ├── EmptyState (빈 결과)
│   └── Pagination (P2F4)
```

## 상태 관리

### usePoliticians Hook
모든 데이터 및 필터 상태를 통합 관리합니다.

```typescript
const {
  // 데이터
  politicians,      // 정치인 목록
  pagination,       // 페이지네이션 정보

  // 상태
  isLoading,        // 로딩 중 여부
  isError,          // 에러 발생 여부
  error,            // 에러 객체

  // 필터 상태
  searchQuery,      // 검색어
  selectedParties,  // 선택된 정당들
  selectedRegions,  // 선택된 지역들
  selectedPositions,// 선택된 직급들
  sortBy,           // 정렬 기준

  // 액션
  setSearchQuery,
  setSelectedParties,
  setSelectedRegions,
  setSelectedPositions,
  setSortBy,
  setPage,
  refetch,
  reset,
} = usePoliticians({
  initialPage: 1,
  initialLimit: 12,
  autoFetch: true,
});
```

## API 통합

### GET /api/politicians (P2B1)

**요청 파라미터:**
```typescript
{
  search?: string,      // 검색어
  party?: string[],     // 정당 필터 (쉼표 구분)
  region?: string[],    // 지역 필터 (쉼표 구분)
  position?: string[],  // 직급 필터 (쉼표 구분)
  page?: number,        // 페이지 번호 (기본: 1)
  limit?: number,       // 페이지당 항목 수 (기본: 12)
  sort?: string,        // 정렬 필드
  order?: 'asc' | 'desc' // 정렬 방향
}
```

**응답:**
```typescript
{
  data: Politician[],
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}
```

## 성능 최적화

### 1. 검색어 Debouncing
- 검색어 입력 시 300ms 딜레이 후 API 호출
- 불필요한 API 요청 최소화

### 2. 자동 페이지 리셋
- 검색어/필터 변경 시 자동으로 첫 페이지로 이동
- 일관된 사용자 경험 제공

### 3. API 캐싱
- Next.js의 fetch 캐싱 활용
- 30초간 결과 캐시

### 4. 조건부 렌더링
- 로딩/에러/빈 결과/정상 상태 분리
- 불필요한 렌더링 방지

## 사용자 경험

### 로딩 상태
- 전체 페이지 로딩 스피너 표시
- 로딩 중 텍스트: "정치인 목록을 불러오는 중..."

### 에러 처리
- 빨간색 배경의 에러 메시지 표시
- 에러 아이콘 및 상세 메시지 포함

### 빈 결과 처리
- 검색 결과 없음: "검색 결과가 없습니다"
  - 필터 초기화 버튼 제공
- 데이터 없음: "등록된 정치인이 없습니다"

### 활성 필터 표시
- 헤더에 활성화된 필터 개수 표시
- 예: "총 150명 • 3개 필터 적용"

## 라우팅

### 페이지 경로
- `/politicians` - 정치인 목록 페이지

### 상세 페이지 이동
- 카드 클릭 시 `/politicians/[id]`로 이동

### URL 쿼리 스트링 (선택사항)
추후 구현 가능:
```
/politicians?search=홍길동&party=더불어민주당&sort=rating_desc&page=1
```

## 의존성

### 컴포넌트
- SearchFilter (P2F3)
- SortDropdown (P2F5)
- PoliticianCard (P2F1)
- Pagination (P2F4)
- LoadingSpinner
- EmptyState

### Hooks
- usePoliticians
- useRouter (Next.js)

### API
- getPoliticians (searchClient)

### UI 라이브러리
- shadcn/ui (Button, Input, Card)
- lucide-react (Icons)
- Tailwind CSS

## 파일 구조

```
frontend/src/
├── app/
│   └── politicians/
│       ├── page.tsx           # 메인 페이지 (이 파일)
│       ├── [id]/
│       │   └── page.tsx       # 상세 페이지
│       └── README.md          # 이 문서
├── components/
│   ├── features/
│   │   ├── SearchFilter.tsx   # 검색 및 필터 컴포넌트
│   │   └── PoliticianCard.tsx # 정치인 카드
│   └── common/
│       ├── SortDropdown.tsx   # 정렬 드롭다운
│       ├── Pagination.tsx     # 페이지네이션
│       ├── LoadingSpinner.tsx # 로딩 스피너
│       └── EmptyState.tsx     # 빈 상태 컴포넌트
├── hooks/
│   └── usePoliticians.ts      # 정치인 데이터 Hook
├── lib/
│   └── api/
│       └── searchClient.ts    # API 클라이언트
└── types/
    ├── database.ts            # 데이터베이스 타입
    ├── filter.ts              # 필터 타입
    └── sort.ts                # 정렬 타입
```

## 테스트

### 수동 테스트 체크리스트

#### 검색 기능
- [ ] 이름 검색이 정상 작동하는가?
- [ ] 검색어 입력 후 300ms 후에 API가 호출되는가?
- [ ] 검색어 지우기 버튼이 작동하는가?

#### 필터 기능
- [ ] 정당 필터가 정상 작동하는가?
- [ ] 지역 필터가 정상 작동하는가?
- [ ] 직급 필터가 정상 작동하는가?
- [ ] 여러 필터를 동시에 적용할 수 있는가?
- [ ] 필터 초기화가 정상 작동하는가?

#### 정렬 기능
- [ ] 정렬 드롭다운이 정상 작동하는가?
- [ ] 각 정렬 옵션이 정상 작동하는가?
- [ ] 정렬 변경 시 첫 페이지로 이동하는가?

#### 페이지네이션
- [ ] 페이지 번호 클릭이 정상 작동하는가?
- [ ] 이전/다음 버튼이 정상 작동하는가?
- [ ] 첫/마지막 페이지 버튼이 정상 작동하는가?
- [ ] 페이지 정보가 정확하게 표시되는가?

#### 반응형 디자인
- [ ] 모바일에서 1열 그리드가 표시되는가?
- [ ] 태블릿에서 2열 그리드가 표시되는가?
- [ ] 데스크톱에서 3열 그리드가 표시되는가?

#### 상태 관리
- [ ] 로딩 상태가 정상 표시되는가?
- [ ] 에러 상태가 정상 표시되는가?
- [ ] 빈 결과 상태가 정상 표시되는가?
- [ ] 정상 결과가 정상 표시되는가?

#### 네비게이션
- [ ] 카드 클릭 시 상세 페이지로 이동하는가?
- [ ] URL이 올바르게 변경되는가?

## 향후 개선 사항

### 1. URL 쿼리 스트링 동기화
- 검색/필터 상태를 URL에 반영
- 뒤로가기/앞으로가기 지원
- URL 공유 가능

### 2. 무한 스크롤
- 페이지네이션 대신 무한 스크롤 옵션 제공
- 사용자 선호도에 따라 전환 가능

### 3. 저장된 필터
- 자주 사용하는 필터 조합 저장
- localStorage 또는 사용자 설정에 저장

### 4. 고급 필터
- 평점 범위 필터
- 당선 횟수 범위 필터
- 나이 범위 필터

### 5. 북마크 기능
- 관심 정치인 북마크
- 북마크한 정치인만 보기 필터

### 6. 비교 기능
- 여러 정치인 선택
- 비교 페이지로 이동

## 트러블슈팅

### 문제: API 요청이 너무 자주 발생
**해결책**: 검색어 debounce 시간을 늘리거나, 필터 변경 시 즉시 요청하지 않고 "적용" 버튼 추가

### 문제: 페이지 로딩이 느림
**해결책**:
- API 캐싱 시간 증가
- 페이지당 항목 수 감소
- 이미지 lazy loading 적용
- 서버 사이드 렌더링 고려

### 문제: 필터 변경 시 첫 페이지로 이동하지 않음
**해결책**: usePoliticians Hook 내부의 useEffect 의존성 배열 확인

## 참고 자료

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Lucide Icons](https://lucide.dev)

## 작성자
- **작업 코드**: P2F7
- **작성일**: 2024-10-17
- **의존 작업**: P2F1, P2F3, P2F4, P2F5, P2B1, P2B4
