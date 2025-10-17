# Politician Finder Web

정치인 평가 및 커뮤니티 플랫폼 Frontend

## 기술 스택

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- TanStack Query (React Query)
- Zustand (상태 관리)
- React Hook Form + Zod

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

```bash
cp .env.local.example .env.local
# .env.local 파일을 열어 필요한 값 수정
```

### 3. 개발 서버 실행

```bash
npm run dev
```

개발 서버 실행 후 http://localhost:3000 에서 확인

### 4. 빌드

```bash
npm run build
npm start
```

## 프로젝트 구조

```
web/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── layout.tsx       # 루트 레이아웃
│   │   ├── page.tsx         # 메인 페이지
│   │   ├── politician/      # 정치인 페이지
│   │   ├── community/       # 커뮤니티 페이지
│   │   └── ...
│   ├── components/          # 재사용 컴포넌트
│   │   ├── layout/          # 레이아웃 컴포넌트
│   │   ├── politician/      # 정치인 관련
│   │   ├── community/       # 커뮤니티 관련
│   │   └── shared/          # 공통 컴포넌트
│   ├── lib/                 # 유틸리티 함수
│   ├── hooks/               # 커스텀 훅
│   ├── store/               # Zustand 스토어
│   ├── types/               # TypeScript 타입
│   └── styles/              # 전역 스타일
├── public/                  # 정적 파일
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

## 개발 가이드

### 새로운 페이지 추가

1. `src/app/` 폴더에 새 경로 생성
2. `page.tsx` 파일 작성
3. 필요한 컴포넌트 작성

### 새로운 컴포넌트 추가

1. 적절한 카테고리 폴더에 컴포넌트 생성
2. TypeScript 타입 정의
3. Tailwind CSS로 스타일링

### API 호출

1. `src/lib/api.ts`에 API 클라이언트 함수 작성
2. `src/hooks/`에 커스텀 훅 작성 (TanStack Query 사용)

## 라이센스

MIT
