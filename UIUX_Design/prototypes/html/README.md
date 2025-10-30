# PoliticianFinder HTML 프로토타입

## 📁 디렉토리 구조

```
html/
├── README.md                    # 이 파일
├── base-template.html           # HTML 템플릿 베이스
├── pages/                       # 개별 페이지 파일들
│   ├── index.html              # 랜딩 페이지
│   ├── signup.html             # 회원가입
│   ├── login.html              # 로그인
│   └── ...                     # 기타 페이지들
├── components/                  # 공통 컴포넌트 HTML
│   ├── header.html             # 헤더
│   ├── footer.html             # 푸터
│   └── ...                     # 기타 컴포넌트
└── assets/                      # 에셋 파일들
    ├── mock-data.json          # Mock 데이터
    ├── images/                 # 이미지 파일
    └── icons/                  # 아이콘 파일
```

## 🎨 디자인 시스템

### 색상 팔레트
- **Primary Blue**: `#2563eb` (primary-600)
- **Dark Blue**: `#1d4ed8` (primary-700)
- **Light Blue**: `#dbeafe` (primary-100)

### 타이포그래피
- **Font Family**: Noto Sans KR
- **제목**: text-3xl (30px), text-2xl (24px)
- **본문**: text-base (16px)
- **보조**: text-sm (14px)

### 간격 (Spacing)
- **섹션 간격**: py-12 (48px), py-16 (64px)
- **카드 패딩**: p-6 (24px), p-8 (32px)
- **요소 간격**: gap-4 (16px), gap-6 (24px)

### 반응형 브레이크포인트
- **sm**: 640px (모바일)
- **md**: 768px (태블릿)
- **lg**: 1024px (작은 데스크톱)
- **xl**: 1280px (데스크톱)

## 📄 페이지 목록 (총 15개)

### Phase 1: MVP 핵심 페이지 (9개)
1. ✅ **랜딩 페이지** - 대기 중
2. ⏳ **회원가입 페이지** - 미작성
3. ⏳ **로그인 페이지** - 미작성
4. ⏳ **대시보드** - 미작성
5. ⏳ **정치인 목록 페이지** - 미작성
6. ⏳ **정치인 상세 페이지** - 미작성
7. ⏳ **커뮤니티 메인** - 미작성
8. ⏳ **게시글 상세 페이지** - 미작성
9. ⏳ **마이페이지** - 미작성

### Phase 2: 추가 페이지 (6개)
10. ⏳ **베스트글 페이지** - 미작성
11. ⏳ **개념글 페이지** - 미작성
12. ⏳ **알림 페이지** - 미작성
13. ⏳ **검색 결과 페이지** - 미작성
14. ⏳ **연결 서비스 페이지** - 미작성
15. ⏳ **설정 페이지** - 미작성

## 🚀 사용 방법

### 1. 파일 열기
각 HTML 파일을 브라우저에서 직접 열어서 확인:
```bash
# Windows
start pages/index.html

# Mac
open pages/index.html

# Linux
xdg-open pages/index.html
```

### 2. 반응형 테스트
- Chrome DevTools (F12) > Toggle Device Toolbar (Ctrl+Shift+M)
- 모바일 (375px), 태블릿 (768px), 데스크톱 (1440px) 확인

### 3. 수정 및 저장
- HTML 파일 수정 후 브라우저 새로고침 (F5)
- Tailwind CSS 클래스 참고: https://tailwindcss.com/docs

## ✅ 준비 작업 완료 항목

- [x] 디렉토리 구조 생성
- [x] HTML 템플릿 베이스 (`base-template.html`)
- [x] Mock 데이터 (`assets/mock-data.json`)
- [x] README 문서

## 📝 다음 단계

**첫 번째 페이지: 랜딩 페이지 (index.html) 생성**
- 승인 후 다음 페이지 진행
- 페이지별 순차 작업

---

*작성일: 2025-10-24*
*버전: V1.0*
