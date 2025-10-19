# mockup-d4.html → Web 구현 작업지시서

## 개요
`design/mockup-d4.html`의 최종 디자인을 `web/` Next.js 프로젝트에 반영하여 Vercel 배포

## 주요 변경사항 요약

### 1. 전역 레이아웃 변경
- **페이지 여백**: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` 적용
- **통합 그리드**: AI 랭킹 + 커뮤니티 (좌측 2/3) + 사이드바 (우측 1/3)

### 2. Header (네비게이션)
**파일**: `web/src/components/Header.tsx` (또는 `Layout.tsx`)

**구조**:
- 좌측: PoliticianFinder 브랜드명
- 우측: Home, 정치인 목록, 커뮤니티, 검색, 로그인, 회원가입, 알림 아이콘
- 컨테이너: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- 높이: `h-12`

**삭제된 요소**:
- "Why PoliticianFinder?" 텍스트 제거

### 3. AI 평가 랭킹 섹션
**위치**: 메인 컨텐츠 좌측 2/3 영역

**테이블 구조**:
- 10개 행 (TOP 10)
- 컬럼: 순위, 이름, 신분, 당, 지역, Claude 평점, GPT/Gemini/Grok/Perp (추후 표시 예정)

**Claude 평점 표시**:
```tsx
<div className="flex flex-col items-center gap-0.5">
  <span className="text-sm font-bold text-gray-900">92.0</span>
  <a href="#ai-detail" className="text-[9px] text-blue-600 hover:text-blue-700">
    평가내역 보기
  </a>
</div>
```
- **중요**: 소수점 첫째 자리까지 표시 (92.0 형식)

**회원 평점 표시**:
```tsx
<div className="flex flex-col items-center gap-0.5">
  <span className="text-amber-400 text-xs">⭐⭐⭐⭐⭐</span>
  <a href="#rate" className="text-[9px] text-purple-600 hover:text-purple-700">
    평가하기
  </a>
</div>
```
- **중요**: 숫자 점수 제거, 별점만 표시

**정치인 최근 글**:
- **3열 그리드**: `grid-cols-1 md:grid-cols-3`
- 각 카드: 정치인 정보 + 최근 글 제목

### 4. 커뮤니티 섹션
**실시간 인기글**:
- **3열 × 5줄 = 총 15개**
- 1열: 1~5번
- 2열: 6~10번
- 3열: 11~15번
- 각 항목: 순위 뱃지, 제목, 조회수, 댓글수, 추천수

### 5. 사이드바 (우측 1/3)
**시작 라인 정렬**:
- `mt-4` 제거하여 AI 평가 랭킹과 같은 라인에서 시작

**포함 섹션** (순서대로):
1. 📊 정치인 등록 현황
2. 📈 평점 급상승 중인 정치인 (TOP 3)
3. 👤 내 프로필 (레벨, XP, 작성글, 받은 추천)
4. 🔗 연결 서비스 (법률 자문, 홍보, 컨설팅)
5. 📺 광고 영역

**제거된 섹션**:
- ⚡ 실시간 통계 (정치인 등록 현황과 중복)
- 레벨 시스템 상세 표시 (프로필 카드에 이미 표시)

### 6. Footer
**구조**:
```tsx
<footer className="bg-gray-900 text-gray-300 py-6 text-xs">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-center items-center gap-6 mb-4">
      <a href="#">서비스 소개</a>
      <a href="#">이용약관</a>
      <a href="#">개인정보처리방침</a>
      <a href="#">고객센터</a>
    </div>
    <div className="border-t border-gray-800 pt-4 text-center text-[10px] text-gray-500">
      © 2025 PoliticianFinder. All rights reserved.
    </div>
  </div>
</footer>
```
- 4개 메뉴만 횡렬 배치
- 중앙 정렬

## 구현 단계

### Phase 1: 컴포넌트 구조 분석
1. `web/src` 폴더의 현재 컴포넌트 구조 확인
2. 필요한 새 컴포넌트 파일 목록 작성

### Phase 2: 공통 컴포넌트 수정
1. Header/Navigation 컴포넌트
2. Footer 컴포넌트
3. Layout 컴포넌트 (페이지 여백 적용)

### Phase 3: 메인 페이지 섹션별 구현
1. AI 평가 랭킹 테이블
2. 정치인 최근 글 (3열)
3. 실시간 인기글 (3열 × 5줄)
4. 사이드바 위젯들

### Phase 4: 스타일링 및 반응형
1. Tailwind CSS 클래스 적용
2. 반응형 브레이크포인트 (`sm:`, `md:`, `lg:`) 확인
3. 모바일/태블릿/데스크톱 레이아웃 테스트

### Phase 5: 배포
1. 로컬 빌드 테스트 (`npm run build`)
2. Git 커밋 및 푸시
3. Vercel 자동 배포 확인

## 데이터 연동 방침
- 현재는 **목업 데이터**로 구현
- 실제 Supabase 연동은 이후 단계에서 진행
- 컴포넌트 구조만 완성하여 디자인 검증

## 체크리스트
- [ ] Header: 브랜드명 좌측, 메뉴 우측
- [ ] AI 랭킹: Claude 평점 소수점 표시, 회원 평점 별점만
- [ ] 정치인 최근 글: 3열 그리드
- [ ] 실시간 인기글: 3열 × 5줄 = 15개
- [ ] 사이드바: 정치인 등록 현황 + 평점 급상승 + 프로필 + 연결서비스 + 광고
- [ ] Footer: 4개 메뉴 횡렬 중앙 배치
- [ ] 전체 페이지: max-w-7xl 여백 적용
- [ ] 통합 그리드: 2/3 + 1/3 레이아웃
- [ ] 로컬 빌드 성공
- [ ] Vercel 배포 성공
