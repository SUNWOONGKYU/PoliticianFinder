# Quick Start Guide - Politician Profile Page

## 빠른 시작

### 1. 페이지 접근
```
URL: /politicians/{id}/profile

예시:
/politicians/1/profile
/politicians/123/profile
```

### 2. 파일 구조
```
1_Frontend/src/
├── app/politicians/[id]/profile/
│   ├── page.tsx                    # 메인 페이지 컴포넌트
│   ├── README.md                   # 상세 문서
│   ├── IMPLEMENTATION_SUMMARY.md   # 구현 보고서
│   └── QUICK_START.md             # 이 파일
├── types/
│   └── politician.ts               # 타입 정의
└── lib/mock/
    └── politician-data.ts          # Mock 데이터
```

### 3. 주요 Props 없음
- URL 파라미터로 `id` 자동 전달
- 내부에서 useParams() 사용

---

## 개발 모드에서 테스트

### Mock 데이터 사용
```typescript
// page.tsx 내부에서
import { getMockProfile, simulateApiDelay } from '@/lib/mock/politician-data'

// fetchProfile 함수 수정
const fetchProfile = async () => {
  try {
    setLoading(true)
    await simulateApiDelay(500) // 0.5초 지연
    const data = getMockProfile(politicianId)
    if (!data) throw new Error('정치인을 찾을 수 없습니다.')
    setPolitician(data)
  } catch (err) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}
```

### 테스트 시나리오
```
1. 인증된 정치인: /politicians/1/profile
2. 미인증 정치인: /politicians/2/profile
3. 최소 정보: /politicians/3/profile
4. 404 에러: /politicians/999/profile
```

---

## API 연동

### 프로필 조회 API
```typescript
// Replace this in page.tsx
const response = await fetch(`/api/politicians/${politicianId}/profile`)

// With your actual API endpoint
const response = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/politicians/${politicianId}/profile`
)
```

### 팔로우 API
```typescript
// handleFollowToggle 함수 내부
const response = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/politicians/${politicianId}/follow`,
  {
    method: isFollowing ? 'DELETE' : 'POST',
    headers: {
      'Authorization': `Bearer ${token}`, // 인증 토큰 추가
    }
  }
)
```

---

## 색상 변경

### Accent 색상 교체
현재 Accent: `#064E3B`

```typescript
// 전체 검색 후 교체
// 검색: #064E3B
// 교체: #YOUR_COLOR

// 또는 Tailwind config 활용
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#064E3B',
          hover: '#065F46',
        }
      }
    }
  }
}

// 사용
className="bg-accent hover:bg-accent-hover"
```

---

## 커스터마이징

### 탭 추가
```typescript
// 1. TabType 수정
type TabType = 'info' | 'career' | 'pledges' | 'ratings' | 'news' // 'news' 추가

// 2. Tab 네비게이션 추가
{[
  // ... 기존 탭들
  { id: 'news', label: '뉴스', icon: Newspaper },
].map((tab) => { /* ... */ })}

// 3. Tab Content 추가
{activeTab === 'news' && (
  <div>뉴스 콘텐츠</div>
)}
```

### 통계 항목 추가
```typescript
<div className="flex items-center gap-2">
  <YourIcon className="w-5 h-5 text-gray-400" />
  <span className="text-sm text-gray-600">
    라벨 <strong className="text-gray-900 ml-1">값</strong>
  </span>
</div>
```

---

## 스타일링

### Tailwind 클래스 패턴

#### 카드
```typescript
className="bg-white rounded-lg shadow-sm border p-6"
```

#### 버튼 (Primary)
```typescript
className="inline-flex items-center gap-2 px-4 py-2 bg-[#064E3B] text-white rounded-lg hover:bg-[#065F46] transition-colors"
```

#### 버튼 (Secondary)
```typescript
className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
```

#### 배지
```typescript
className="inline-block px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full"
```

---

## 트러블슈팅

### 이미지가 표시되지 않음
```typescript
// Next.js Image 사용 시
import Image from 'next/image'

<Image
  src={politician.profile_image_url || '/default-avatar.png'}
  alt={politician.name}
  width={128}
  height={128}
  className="rounded-full"
/>
```

### 팔로우 버튼이 작동하지 않음
1. API 엔드포인트 확인
2. 인증 토큰 전달 확인
3. CORS 설정 확인
4. 네트워크 탭에서 응답 확인

### 탭 전환이 안됨
```typescript
// activeTab 상태 확인
console.log('Active Tab:', activeTab)

// 클릭 이벤트 확인
<button onClick={() => {
  console.log('Clicked:', tab.id)
  setActiveTab(tab.id as TabType)
}}>
```

---

## 성능 최적화

### 이미지 Lazy Loading
```typescript
{politician.profile_image_url && (
  <img
    src={politician.profile_image_url}
    alt={politician.name}
    loading="lazy"
    className="w-full h-full object-cover"
  />
)}
```

### 탭 콘텐츠 Lazy Loading
```typescript
const CareerTab = lazy(() => import('./tabs/CareerTab'))
const PledgesTab = lazy(() => import('./tabs/PledgesTab'))

{activeTab === 'career' && (
  <Suspense fallback={<LoadingSpinner />}>
    <CareerTab career={politician.career} />
  </Suspense>
)}
```

### 메모이제이션
```typescript
const stats = useMemo(() => ({
  followers: politician.followers_count,
  ratings: politician.ratings_count,
  avgScore: politician.avg_rating,
  aiScore: politician.ai_score
}), [politician])

const handleFollowToggle = useCallback(async () => {
  // ... 기존 코드
}, [politicianId, isFollowing])
```

---

## 디버깅 팁

### 로그 추가
```typescript
// 개발 모드에서만
if (process.env.NODE_ENV === 'development') {
  console.log('Politician Data:', politician)
  console.log('Active Tab:', activeTab)
  console.log('Follow Status:', isFollowing)
}
```

### React DevTools
1. Components 탭에서 `PoliticianProfilePage` 찾기
2. Props와 State 확인
3. Hooks 상태 실시간 모니터링

---

## 체크리스트

### 배포 전 확인사항
- [ ] Mock 데이터 제거
- [ ] 실제 API 연동
- [ ] 환경변수 설정 (.env)
- [ ] 에러 핸들링 테스트
- [ ] 404 페이지 테스트
- [ ] 모바일 반응형 테스트
- [ ] 접근성 테스트 (키보드, 스크린 리더)
- [ ] 성능 테스트 (Lighthouse)
- [ ] 크로스 브라우저 테스트

---

## 도움말

### 문서
- [README.md](./README.md) - 상세 문서
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - 구현 보고서

### 타입 정의
- `1_Frontend/src/types/politician.ts`

### Mock 데이터
- `1_Frontend/src/lib/mock/politician-data.ts`

---

**최종 업데이트**: 2025-11-03
**문의**: Project Grid System 참조
