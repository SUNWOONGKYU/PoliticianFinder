# PoliticianFinder 모바일 최적화 마스터 플랜

## 개요
- **프로젝트**: PoliticianFinder (정치인 평가 플랫폼)
- **위치**: `C:\Development_PoliticianFinder_com\Developement_Real_PoliticianFinder\1_Frontend`
- **기술 스택**: Next.js 14+ (App Router), Tailwind CSS, TypeScript
- **목표**: 완벽한 모바일 최적화 (20% → 100%)

## 현재 상태 분석

### 발견된 문제점 (80% 개선 필요)

| 카테고리 | 문제 | 심각도 |
|---------|------|--------|
| 터치 타겟 크기 | 입력 필드, 버튼, 체크박스 44px 미달 | 높음 |
| 테이블 모바일 대응 | 320-768px에서 카드 변환 부족 | 높음 |
| 커뮤니티 페이지 | 모바일 레이아웃 전혀 없음 | 심각 |
| 320px-480px 대응 | xs, sm-md breakpoint 부재 | 높음 |
| Desktop-First 설계 | Mobile-First 전환 필요 | 중간 |
| Typography 반응형 | breakpoint별 크기 조정 없음 | 중간 |
| 프로토타입 누락 기능 | 게시글 작성/상세, 필터 초기화 등 | 중간 |

---

## Phase 1: 기반 작업 (Foundation)

### 1.1 Tailwind Config 확장
**파일**: `tailwind.config.ts`

```typescript
// 추가할 breakpoints
screens: {
  'xs': '320px',    // 소형 모바일 (iPhone SE)
  'sm': '480px',    // 대형 모바일
  'md': '768px',    // 태블릿
  'lg': '1024px',   // 데스크탑
  'xl': '1280px',
  '2xl': '1536px',
},

// 추가할 spacing
spacing: {
  'touch': '44px',
  'touch-lg': '48px',
},

// Safe area inset
spacing: {
  'safe-top': 'env(safe-area-inset-top)',
  'safe-bottom': 'env(safe-area-inset-bottom)',
},
```

### 1.2 전역 CSS 추가
**파일**: `src/app/globals.css`

```css
@layer components {
  .touch-target {
    @apply min-h-touch min-w-touch flex items-center justify-center;
  }

  .container-responsive {
    @apply w-full px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl;
  }

  .mobile-card {
    @apply bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 mb-3;
  }

  .input-mobile {
    @apply w-full min-h-touch px-4 py-3 text-base border rounded-lg;
  }
}

@layer utilities {
  .safe-area-bottom {
    padding-bottom: env(safe-area-inset-bottom, 0);
  }

  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }

  .touch-manipulation {
    touch-action: manipulation;
  }
}
```

### 1.3 공통 컴포넌트 수정

#### Button.tsx
```typescript
const sizeStyles = {
  sm: 'px-3 py-2 text-sm min-h-[40px] sm:min-h-[32px]',
  md: 'px-4 py-2.5 text-base min-h-touch',
  lg: 'px-6 py-3 text-lg min-h-touch',
};
```

#### Input.tsx
```typescript
const baseStyles = 'flex h-11 sm:h-12 w-full rounded-lg border px-3 sm:px-4 py-2 text-base';
// text-base (16px) = iOS 자동 확대 방지
```

---

## Phase 2: 핵심 페이지 개선

### 2.1 Header (`app/components/header.tsx`)

**수정 사항**:
1. 캐치프레이즈 모바일 표시 (sm 이상)
2. 모바일 메뉴 터치 영역 확대 (min-h-touch)
3. 알림 배지 위치 통일

**추가 사항**:
- 모바일 하단 탭바 신규 생성 (`components/ui/MobileTabBar.tsx`)

```tsx
// 모바일 메뉴 아이템 수정
<Link
  href="/"
  className="text-gray-900 font-medium px-4 py-3 min-h-touch flex items-center touch-manipulation active:bg-gray-100 rounded-lg"
>
```

### 2.2 Footer (`app/components/footer.tsx`)

**수정 사항**:
1. 터치 영역 확대 (min-h-touch, px-4 py-3)
2. 모바일 세로 레이아웃 (flex-col sm:flex-row)
3. Admin 링크 모바일 숨김 (hidden sm:inline-block)
4. 하단 여백 추가 (pb-20 md:pb-0 - 탭바 고려)

### 2.3 홈페이지 (`app/page.tsx`)

**수정 사항**:
1. 통계 그리드: `grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6`
2. 사이드바: 모바일 토글 가능한 아코디언
3. 정치인 랭킹 테이블: 카드 레이아웃 개선
4. 플로팅 버튼: `bottom-4 right-4 sm:bottom-6 sm:right-6`

### 2.4 정치인 목록 (`app/politicians/page.tsx`)

**수정 사항**:
1. 검색 입력: `min-h-touch text-base`
2. 필터 select: `min-h-touch`
3. 모바일 카드에 프로필 이미지 추가
4. 페이지네이션 터치 영역: `min-h-touch min-w-touch`
5. 필터 초기화 버튼 개선

### 2.5 정치인 상세 (`app/politicians/[id]/page.tsx`)

**수정 사항**:
1. 탭 네비게이션: `overflow-x-auto snap-x snap-mandatory`
2. 프로필 영역: 모바일 세로 스택
3. 차트: 반응형 높이 조정
4. 플로팅 버튼: safe-area-bottom 적용

---

## Phase 3: 추가 페이지 개선

### 3.1 커뮤니티 (`app/community/page.tsx`)

**수정 사항**:
1. 탭 버튼: `overflow-x-auto scrollbar-hide min-h-touch`
2. 게시글 목록: 모바일 카드 레이아웃
3. 메타정보: 2줄 분리 (flex-col sm:flex-row)
4. 검색 & 정렬: 모바일 세로 스택

### 3.2 마이페이지 (`app/mypage/page.tsx`)

**수정 사항**:
1. 탭 네비게이션: `overflow-x-auto scrollbar-hide min-w-max`
2. 통계 그리드: `grid-cols-3 sm:grid-cols-5`
3. 액션 버튼: `min-h-touch flex items-center justify-center`
4. 프로필 사이드바: 모바일에서 sticky 제거

### 3.3 Auth 페이지 (로그인/회원가입)

**수정 사항**:
1. 입력 필드: `min-h-touch text-base`
2. 체크박스: `h-5 w-5` (20px)
3. 버튼: `min-h-touch touch-manipulation`
4. 소셜 로그인 버튼 터치 영역 확보

---

## Phase 4: 프로토타입 누락 기능

### 4.1 게시글 작성 페이지
- **위치 (신규)**: `app/community/posts/create/page.tsx`
- 제목 입력 (min-h-touch)
- 본문 에디터 (모바일 친화적 textarea)
- 이미지 업로드 버튼 (큰 터치 타겟)
- 카테고리 선택, 게시 버튼

### 4.2 게시글 상세 페이지 개선
- **위치**: `app/community/posts/[id]/page.tsx`
- 댓글 입력 영역 고정 (bottom: 0)
- 좋아요/공유 버튼 터치 타겟
- 이미지 갤러리 스와이프

### 4.3 필터 초기화 버튼 통일
- 정치인 페이지, 커뮤니티 페이지에 동일 패턴 적용

### 4.4 모바일 Bottom Navigation (선택)
- **위치 (신규)**: `components/layout/MobileTabBar.tsx`
- 5개 이하 메인 메뉴, 각 아이템 min-h-touch
- safe-area-bottom 적용

---

## Phase 5: 테스트 및 검증

### 디바이스 테스트 매트릭스
| 디바이스 | 화면 너비 | 테스트 항목 |
|----------|-----------|-------------|
| iPhone SE | 320px | 최소 너비 대응 |
| iPhone 14 | 390px | 일반 모바일 |
| iPhone 14 Pro Max | 430px | 대형 모바일 |
| iPad Mini | 768px | 태블릿 세로 |
| iPad Pro | 1024px | 태블릿 가로 |

### 테스트 체크리스트
- [ ] 모든 터치 타겟 44px 이상
- [ ] 입력 필드 font-size 16px 이상 (iOS 자동 줌 방지)
- [ ] 가로 스크롤 없음 (의도된 캐러셀 제외)
- [ ] 테이블 → 카드 변환 정상
- [ ] 다크모드 전환 정상
- [ ] Safe area 대응 (노치, 홈바)

### Lighthouse 모바일 점수 목표
| 지표 | 목표 |
|------|------|
| Performance | 80+ |
| Accessibility | 95+ |
| Best Practices | 90+ |
| SEO | 90+ |

---

## Critical Files (수정 대상)

### 설정 파일
1. `tailwind.config.ts` - breakpoint, spacing 확장
2. `src/app/globals.css` - 전역 유틸리티 클래스

### 공통 컴포넌트
3. `src/components/ui/Button.tsx` - 터치 타겟 크기
4. `src/components/ui/Input.tsx` - 모바일 폰트/높이
5. `src/components/ui/Card.tsx` - 반응형 패딩

### 레이아웃 컴포넌트
6. `src/app/components/header.tsx` - 모바일 네비게이션
7. `src/app/components/footer.tsx` - 터치 영역, 레이아웃

### 페이지
8. `src/app/page.tsx` - 홈페이지
9. `src/app/politicians/page.tsx` - 정치인 목록
10. `src/app/politicians/[id]/page.tsx` - 정치인 상세
11. `src/app/community/page.tsx` - 커뮤니티
12. `src/app/mypage/page.tsx` - 마이페이지
13. `src/app/auth/login/page.tsx` - 로그인
14. `src/app/auth/signup/page.tsx` - 회원가입

### 신규 생성
15. `src/components/layout/MobileTabBar.tsx` - 하단 탭바 (선택)

---

## 작업 일정

| Phase | 내용 | 예상 시간 |
|-------|------|----------|
| Phase 1 | 기반 작업 (Tailwind, CSS, 공통 컴포넌트) | 6시간 |
| Phase 2 | 핵심 페이지 (Header, Footer, 홈, 정치인) | 16시간 |
| Phase 3 | 추가 페이지 (커뮤니티, 마이페이지, Auth) | 9시간 |
| Phase 4 | 프로토타입 누락 기능 | 16시간 |
| Phase 5 | 테스트 및 검증 | 4시간 |
| **총계** | | **51시간 (6-7일)** |

---

## Git 브랜치 전략 (안전한 배포)

### 브랜치 워크플로우

```
main (프로덕션)
  │
  └── feature/mobile-optimization (작업 브랜치)
        │
        ├── Phase 1 커밋 → Vercel Preview 확인 → 문제 없으면 계속
        ├── Phase 2 커밋 → Vercel Preview 확인 → 문제 없으면 계속
        ├── Phase 3 커밋 → Vercel Preview 확인 → 문제 없으면 계속
        ├── Phase 4 커밋 → Vercel Preview 확인 → 문제 없으면 계속
        └── Phase 5 커밋 → 최종 Vercel Preview 확인
              │
              └── ✅ 모든 테스트 통과 → main 브랜치에 병합
```

### 작업 프로세스

**1단계: 서브 브랜치 생성**
```bash
git checkout main
git pull origin main
git checkout -b feature/mobile-optimization
```

**2단계: Phase별 작업 및 커밋**
```bash
# Phase 1 완료 후
git add .
git commit -m "feat(mobile): Phase 1 - Tailwind 설정 및 전역 CSS 추가"
git push origin feature/mobile-optimization

# Vercel Preview URL 확인 → 문제 없으면 다음 Phase 진행
```

**3단계: Vercel Preview 확인**
- 각 커밋마다 Vercel이 자동으로 Preview 배포 생성
- Preview URL에서 모바일 디바이스로 직접 테스트
- 문제 발견 시 해당 브랜치에서 수정

**4단계: 최종 병합**
```bash
# 모든 테스트 통과 후
git checkout main
git merge feature/mobile-optimization
git push origin main
```

### 롤백 전략

문제 발생 시:
```bash
# main 브랜치에서 이전 상태로 롤백
git revert HEAD
git push origin main

# 또는 서브 브랜치에서 계속 수정 후 재배포
```

### 커밋 컨벤션

```
feat(mobile): Phase 1 - Tailwind 설정 확장
feat(mobile): Phase 2.1 - Header 모바일 최적화
feat(mobile): Phase 2.2 - Footer 터치 영역 확대
fix(mobile): 정치인 페이지 카드 레이아웃 버그 수정
```

---

## 권장 작업 순서

1. **1일차**: Phase 1 전체 (Tailwind config, globals.css, 공통 컴포넌트)
2. **2일차**: Phase 2.1-2.3 (Header, Footer, 홈페이지)
3. **3일차**: Phase 2.4-2.5 (정치인 목록, 정치인 상세)
4. **4일차**: Phase 3 전체 (커뮤니티, 마이페이지, Auth)
5. **5-6일차**: Phase 4 (게시글 작성/상세, 필터 초기화)
6. **7일차**: Phase 5 (테스트 및 버그 수정)

### 각 일차별 Vercel Preview 확인

| 일차 | 작업 완료 후 | Preview 확인 항목 |
|------|-------------|------------------|
| 1일차 | Phase 1 커밋 | 기본 스타일 적용 여부 |
| 2일차 | Phase 2.1-2.3 커밋 | Header, Footer, 홈페이지 모바일 뷰 |
| 3일차 | Phase 2.4-2.5 커밋 | 정치인 페이지 모바일 뷰 |
| 4일차 | Phase 3 커밋 | 커뮤니티, 마이페이지, Auth 모바일 뷰 |
| 5-6일차 | Phase 4 커밋 | 신규 페이지 기능 테스트 |
| 7일차 | Phase 5 커밋 | **최종 전체 테스트** → main 병합
