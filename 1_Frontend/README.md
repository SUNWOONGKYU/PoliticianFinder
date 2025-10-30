# PoliticianFinder Frontend

AI 기반 정치인 평가 커뮤니티 플랫폼 - 프론트엔드

## 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks, Context API (예정)

## 개발 방식

**목업 디자인과 프론트엔드 개발을 동시 진행**

1. HTML 프로토타입 완성 (`UIUX_Design/prototypes/html`)
2. 즉시 React 컴포넌트로 변환 (`frontend/src`)
3. 반복

## 디자인 시스템

### 컬러
- **정치인**: 주황색 `primary-500` (#f97316)
- **회원**: 보라색 `purple-600` (#9333ea)
- **AI 점수**: 녹색 `green-500` (#22c55e)

## 폴더 구조

```
frontend/
├── src/
│   ├── app/              # Next.js App Router 페이지
│   ├── components/       # React 컴포넌트
│   │   ├── ui/          # 기본 UI 컴포넌트 (Button, Card 등)
│   │   ├── politicians/ # 정치인 관련 컴포넌트
│   │   ├── posts/       # 게시글/댓글 컴포넌트
│   │   └── layout/      # 레이아웃 컴포넌트 (Navbar 등)
│   ├── lib/             # 유틸리티 함수
│   └── types/           # TypeScript 타입 정의
├── public/              # 정적 파일
└── README.md
```

## 설치 및 실행

```bash
# 패키지 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build
```

## 현재 상태

✅ **환경 설정 완료**
- Next.js 14 설정
- TypeScript 설정
- Tailwind CSS 커스텀 컬러 설정
- 폴더 구조 생성

⏸️ **대기 중**
- 컴포넌트 개발 (목업 디자인 진행하면서)
- 페이지 구현 (목업 디자인 진행하면서)

## 다음 단계

목업 디자인(HTML) 완성 후:
1. UI 컴포넌트 개발 (Button, Card, Input 등)
2. 페이지별 컴포넌트 변환
3. 상태 관리 구현
4. API 연동
