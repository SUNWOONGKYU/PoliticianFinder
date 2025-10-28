# SortDropdown 컴포넌트

정치인 목록 정렬을 위한 커스텀 드롭다운 컴포넌트입니다.

## 특징

- **커스텀 디자인**: 네이티브 select를 대체하는 완전한 커스텀 UI
- **키보드 네비게이션**: ↑↓ 화살표, Enter, Space, Esc, Home, End 지원
- **외부 클릭 감지**: 드롭다운 외부 클릭 시 자동으로 닫힘
- **애니메이션**: 부드러운 열림/닫힘 애니메이션 효과
- **접근성**: ARIA 속성을 통한 스크린 리더 지원
- **포커스 관리**: 키보드 포커스 및 자동 스크롤
- **타입 안전성**: TypeScript로 완전한 타입 정의
- **반응형**: 모바일, 태블릿, 데스크톱 대응

## 사용법

### 기본 사용

```tsx
import { useState } from 'react';
import { SortDropdown, SortDropdownLabel } from '@/components/common';
import { SortValue } from '@/types/sort';

function MyComponent() {
  const [sortBy, setSortBy] = useState<SortValue>('rating_desc');

  return (
    <div>
      <SortDropdownLabel>정렬 방식</SortDropdownLabel>
      <SortDropdown
        value={sortBy}
        onChange={setSortBy}
      />
    </div>
  );
}
```

### 커스텀 옵션

```tsx
import { SortDropdown } from '@/components/common';
import { SortOption, SortValue } from '@/types/sort';

const customOptions: SortOption[] = [
  { value: 'rating_desc', label: '평점 높은 순' },
  { value: 'name_asc', label: '이름 가나다 순' },
];

function MyComponent() {
  const [sortBy, setSortBy] = useState<SortValue>('rating_desc');

  return (
    <SortDropdown
      value={sortBy}
      onChange={setSortBy}
      options={customOptions}
    />
  );
}
```

### 비활성화 상태

```tsx
<SortDropdown
  value={sortBy}
  onChange={setSortBy}
  disabled={true}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `SortValue` | - | 현재 선택된 정렬 값 (필수) |
| `onChange` | `(sortBy: SortValue) => void` | - | 정렬 값 변경 핸들러 (필수) |
| `options` | `SortOption[]` | `DEFAULT_SORT_OPTIONS` | 정렬 옵션 목록 (선택) |
| `className` | `string` | - | 추가 CSS 클래스 (선택) |
| `disabled` | `boolean` | `false` | 비활성화 여부 (선택) |

## 정렬 옵션 타입

### SortValue

```typescript
type SortValue =
  | 'rating_desc'      // 평점 높은 순
  | 'rating_asc'       // 평점 낮은 순
  | 'name_asc'         // 이름 가나다 순
  | 'election_desc'    // 당선 횟수 많은 순
  | 'recent_rating';   // 최신 평가 순
```

### SortOption

```typescript
interface SortOption {
  value: SortValue;
  label: string;
  description?: string;
}
```

## 기본 정렬 옵션

```typescript
import { DEFAULT_SORT_OPTIONS } from '@/types/sort';

// DEFAULT_SORT_OPTIONS:
// [
//   { value: 'rating_desc', label: '평점 높은 순' },
//   { value: 'rating_asc', label: '평점 낮은 순' },
//   { value: 'name_asc', label: '이름 가나다 순' },
//   { value: 'election_desc', label: '당선 횟수 많은 순' },
//   { value: 'recent_rating', label: '최신 평가 순' },
// ]
```

## 키보드 단축키

| 키 | 동작 |
|----|------|
| `Enter` / `Space` | 드롭다운 열기 또는 현재 포커스된 옵션 선택 |
| `↑` | 이전 옵션으로 이동 (순환) |
| `↓` | 다음 옵션으로 이동 (순환) |
| `Home` | 첫 번째 옵션으로 이동 |
| `End` | 마지막 옵션으로 이동 |
| `Esc` | 드롭다운 닫기 |
| `Tab` | 다음 요소로 포커스 이동 |

## 스타일 커스터마이징

```tsx
<SortDropdown
  value={sortBy}
  onChange={setSortBy}
  className="w-full md:w-64"
/>
```

## 접근성

- `role="listbox"` 및 `role="option"` 속성으로 스크린 리더 지원
- `aria-haspopup`, `aria-expanded`, `aria-selected` 속성 제공
- 키보드 전용 네비게이션 지원
- 포커스 관리 및 시각적 피드백

## 테스트

테스트 페이지에서 컴포넌트 동작 확인:

```
http://localhost:3000/test-sort
```

## 파일 구조

```
frontend/src/
├── components/
│   └── common/
│       ├── SortDropdown.tsx     # 드롭다운 컴포넌트
│       ├── SortDropdown.md      # 문서
│       └── index.ts             # 내보내기
└── types/
    └── sort.ts                  # 타입 정의
```

## 의존성

- `lucide-react`: ChevronDown, Check 아이콘
- `@/lib/utils`: cn 유틸리티 함수
- React hooks: useState, useRef, useEffect

## 브라우저 지원

- Chrome (최신)
- Firefox (최신)
- Safari (최신)
- Edge (최신)

## 향후 개선 사항

- [ ] 검색 기능 추가
- [ ] 그룹화된 옵션 지원
- [ ] 아이콘 포함 옵션
- [ ] 다국어 지원
