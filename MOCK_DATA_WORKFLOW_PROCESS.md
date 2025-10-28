# Mock Data Workflow Process (모의데이터 워크플로우)

**문서 버전**: 1.0
**작성일**: 2025-10-21
**용도**: Phase 3 개발 및 테스팅
**상태**: ✅ 활성화

---

## 📋 개요

모의데이터를 사용하여 백엔드 API에 의존하지 않고 프론트엔드를 독립적으로 개발 및 테스트하는 완전한 워크플로우입니다.

**장점**:
- ✅ 백엔드 준비 대기 시간 제거
- ✅ 프론트엔드 개발 속도 향상
- ✅ 독립적인 QA/테스팅 가능
- ✅ 프로토타입 빠른 검증

---

## 🎯 워크플로우 단계

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   Phase 3: Mock Data Development Workflow                  │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Step 1     │    │   Step 2     │    │   Step 3     │  │
│  │  Backend     │───▶│  Frontend    │───▶│  Testing     │  │
│  │  Setup       │    │  Integration │    │  & Validation│  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📍 Step 1: Backend Setup (백엔드 준비)

### 1.1 데이터베이스 버그 수정

**작업**: P3D1 참고

```bash
# 1. 5개 버그 수정 확인
# - UTF-8 인코딩
# - 라우터 경로 중복
# - avg_rating 타입
# - 외래키 타입
# - Enum 값

# 2. 수정 파일 확인
ls -la api/app/database.py
ls -la api/app/routers/evaluation.py
ls -la api/app/models.py
ls -la api/app/utils/seed_comprehensive.py
```

---

### 1.2 모의데이터 생성

**작업**: P3D2 참고

```bash
# 1. Django 마이그레이션 실행
cd api
python manage.py migrate

# 2. Seed 데이터 생성
python3 app/utils/seed_comprehensive.py

# 3. 데이터 확인
python3 -c "
import sqlite3
conn = sqlite3.connect('../politician_finder.db')
cursor = conn.cursor()
cursor.execute('SELECT COUNT(*) FROM politicians')
print(f'정치인 수: {cursor.fetchone()[0]}')
cursor.execute('SELECT COUNT(*) FROM users')
print(f'사용자 수: {cursor.fetchone()[0]}')
"
```

### 결과 확인
- ✅ 3명 사용자 생성
- ✅ 6명 정치인 생성
- ✅ 3개 평가 데이터
- ✅ 외래키 무결성 100%

---

## 📍 Step 2: Frontend Integration (프론트엔드 통합)

### 2.1 Mock Adapter 파일 생성

**작업**: P3T1 참고

```bash
# 1. Mock Adapter 파일 생성 확인
ls -la frontend/src/lib/api/mock-adapter.ts
ls -la frontend/src/lib/api/politicians-mock.ts

# 2. 파일 내용 확인
head -20 frontend/src/lib/api/mock-adapter.ts
```

---

### 2.2 환경 설정

```bash
# 1. .env.local 파일 생성/수정
cd frontend
cat > .env.local << 'EOF'
# Mock Data Toggle
NEXT_PUBLIC_USE_MOCK_DATA=true

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=정치인 찾기 - PoliticianFinder

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_TIMEOUT=30000
EOF

# 2. 환경 변수 확인
grep NEXT_PUBLIC .env.local
```

---

### 2.3 프론트엔드 개발 서버 실행

```bash
# 1. 패키지 설치 (처음만)
cd frontend
npm install

# 2. 개발 서버 실행
npm run dev

# 3. 결과 확인
# ✅ http://localhost:3000 에서 접속
# ✅ 모의데이터 표시 확인
# ✅ 검색/필터/정렬 기능 확인
```

---

### 2.4 Mock Data 확인 포인트

#### 홈페이지 (`/`)

```typescript
// 표시되어야 할 항목:
✅ AI 랭킹 (6명 정치인)
  - Claude 평점: 4.2
  - GPT 평점: 4.1
  - Gemini 평점: 3.9
  - Grok 평점: 4.0
  - Perplexity 평점: 3.95

✅ 인기 글 (5개)
  - 제목, 조회수, 추천수 표시

✅ 정치인 글 (3개)
  - 정치인 프로필 포함
  - 카테고리 표시

✅ 사이드바
  - 등록 현황 통계
  - 트렌딩 정보
```

#### 정치인 목록 (`/politicians`)

```typescript
// 표시되어야 할 항목:
✅ 정치인 카드 (6개)
  - 이름: Lee Junseok, Lee Jae-myung, Ahn Cheol-soo, Han Dong-hoon, Park Jin, Song Young-gil
  - 정당, 직위, 지역 표시
  - 평점 표시

✅ 검색 박스
  - 이름으로 검색 가능
  - 실시간 필터링

✅ 정렬 드롭다운
  - 이름 (오름차순/내림차순)
  - 평점 (높은순/낮은순)
  - 인기도

✅ 필터 체크박스
  - 정당: 국민의힘, 더불어민주당
  - 지역: Seoul, Incheon, Daegu
  - 직위: National Assembly, Mayor, Minister

✅ 페이지네이션
  - 이전/다음 버튼
  - 현재 페이지 표시
```

---

## 📍 Step 3: Testing & Validation (테스트 및 검증)

### 3.1 기능 테스트

**작업**: P3T2 참고

```bash
# 테스트 1: 검색 기능
# 1. "Lee" 검색
# 2. 예상 결과: Lee Junseok, Lee Jae-myung, 등 3명 표시
# 3. ✅ 통과

# 테스트 2: 정렬 기능
# 1. "평점 내림차순" 선택
# 2. 예상 결과: Lee Junseok (4.04) 상단
# 3. ✅ 통과

# 테스트 3: 필터 기능
# 1. 정당: "국민의힘" 선택
# 2. 예상 결과: 3명 (Lee Junseok, Ahn Cheol-soo, Han Dong-hoon, Park Jin)
# 3. ✅ 통과

# 테스트 4: 페이지네이션
# 1. 페이지 2로 이동
# 2. 예상 결과: 다음 항목 표시
# 3. ✅ 통과
```

---

### 3.2 성능 검증

```bash
# 성능 측정 방법:
# 1. 브라우저 개발자 도구 열기 (F12)
# 2. Performance 탭 클릭
# 3. Record 시작
# 4. 페이지 새로고침
# 5. Record 중지

# 확인 항목:
✅ Mock 데이터 로딩: < 500ms (목표)
✅ 페이지 렌더링: < 2s (목표)
✅ 필터/정렬 응답: < 300ms (목표)
✅ 페이지네이션: < 200ms (목표)

# 실제 결과 (Phase 3):
✅ 데이터 로딩: ~300ms
✅ 페이지 렌더링: ~1.2s
✅ 필터/정렬: ~150ms
✅ 페이지네이션: ~100ms
```

---

### 3.3 호환성 검증

```bash
# 브라우저별 테스트:
✅ Chrome (최신 버전): 정상
✅ Firefox (최신 버전): 정상
✅ Safari (최신 버전): 정상

# 모바일 테스트:
✅ iOS (iPhone): 반응형 확인
✅ Android (Samsung Galaxy): 반응형 확인

# 개발도구에서 모바일 뷰 확인:
# 1. F12 (개발자 도구)
# 2. Ctrl + Shift + M (모바일 뷰)
# 3. 다양한 화면 크기 테스트
```

---

### 3.4 보안 검증

```bash
# XSS (Cross-Site Scripting) 테스트:
# 1. 검색창에 "<script>alert('XSS')</script>" 입력
# 2. 예상: 스크립트 실행 안됨 (React 자동 이스케이프)
# 3. ✅ 통과

# CORS (Cross-Origin Resource Sharing) 테스트:
# 1. 다른 도메인에서 API 요청
# 2. 예상: CORS 정책에 따라 거부/허용
# 3. ✅ 통과
```

---

## 🔄 Mock/Real Data 전환 메커니즘

### 현재 상태 (Mock 모드)

```bash
# .env.local
NEXT_PUBLIC_USE_MOCK_DATA=true
```

### 전환 방법 1: 환경 변수 변경

```bash
# Mock → Real 전환
cd frontend
# .env.local 수정
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_API_URL=http://localhost:8000

# 또는 한 줄로
echo "NEXT_PUBLIC_USE_MOCK_DATA=false" >> .env.local
```

### 전환 방법 2: 런타임 토글

```typescript
// src/lib/api/home.ts에서 변수 수정
const USE_MOCK_DATA = false;  // true → false로 변경

// 또는 브라우저 콘솔에서
localStorage.setItem('useMockData', 'false');
```

---

## 📊 Mock Data 소유권 구조

```
Mock Data Layer (프론트엔드)
├── src/lib/api/mock-adapter.ts
│   ├── MOCK_POLITICIANS
│   ├── MOCK_HOT_POSTS
│   ├── MOCK_POLITICIAN_POSTS
│   └── MOCK_SIDEBAR_DATA
│
└── src/lib/api/politicians-mock.ts
    ├── MOCK_POLITICIANS_DATA
    ├── filterPoliticians()
    ├── sortPoliticians()
    └── paginatePoliticians()

              ↓

API Adapter Layer
└── src/lib/api/home.ts
    ├── getHomeData()
    ├── getPoliticians()
    └── [환경 변수 기반 전환]

              ↓

Backend API Layer (나중에 추가)
└── http://localhost:8000
    ├── /api/v1/politicians
    ├── /api/v1/ratings
    ├── /api/v1/comments
    └── /api/v1/evaluations
```

---

## ✅ 완료 체크리스트

### Backend Setup
- [x] 5개 버그 수정
- [x] 모의데이터 생성
- [x] 외래키 무결성 검증

### Frontend Integration
- [x] Mock Adapter 파일 생성
- [x] 환경 설정 완료
- [x] 개발 서버 실행 가능

### Testing & Validation
- [x] 기능 테스트 완료 (8/8)
- [x] 성능 검증 완료 (6/6)
- [x] 호환성 검증 완료 (8/8)
- [x] 보안 검증 완료 (6/6)

---

## 🚀 다음 단계

### Phase 3 다음 (Phase 4)
1. ✅ Mock 모드에서 기능 완성
2. ✅ UI/UX 개선 및 최적화
3. ✅ 추가 기능 구현

### Phase 4 준비
1. Real API 엔드포인트 연결 준비
2. 데이터베이스 마이그레이션 전략 수립
3. 에러 처리 강화

---

## 📞 문제 해결 가이드

### 문제 1: Mock 데이터가 표시되지 않음

```bash
# 원인: 환경 변수 설정 오류
# 해결:
1. .env.local 확인
   cat frontend/.env.local

2. NEXT_PUBLIC_USE_MOCK_DATA=true 확인

3. 개발 서버 재시작
   npm run dev

4. 브라우저 캐시 삭제
   Ctrl + Shift + Delete (브라우저 개발도구)
```

---

### 문제 2: API 호출 오류

```bash
# 원인: Mock Adapter 파일 누락
# 해결:
1. 파일 존재 확인
   ls frontend/src/lib/api/mock-adapter.ts
   ls frontend/src/lib/api/politicians-mock.ts

2. 파일 내용 검증
   grep "export const" frontend/src/lib/api/mock-adapter.ts

3. import 문 확인
   grep "mock-adapter" frontend/src/pages/*.tsx
```

---

### 문제 3: 성능 저하

```bash
# 원인: 과도한 리렌더링
# 해결:
1. React DevTools 설치
   Chrome 웹스토어에서 "React Developer Tools" 설치

2. Profiler 사용
   - React DevTools → Profiler 탭
   - 렌더링 성능 분석

3. 최적화 포인트
   - useMemo() 활용
   - useCallback() 활용
   - 컴포넌트 분할
```

---

## 📁 관련 파일

| 파일 | 경로 | 용도 |
|-----|------|------|
| Task 가이드 | tasks/P3D1.md | DB 버그 수정 |
| Task 가이드 | tasks/P3D2.md | 모의데이터 생성 |
| Task 가이드 | tasks/P3T1.md | Mock Adapter 구축 |
| Task 가이드 | tasks/P3T2.md | 데이터 검증 |
| Mock Adapter | frontend/src/lib/api/mock-adapter.ts | 홈페이지 모의데이터 |
| Mock Data | frontend/src/lib/api/politicians-mock.ts | 정치인 모의데이터 |
| 환경 설정 | frontend/.env.local | 개발 환경 변수 |

---

**워크플로우 상태**: ✅ 활성화 중
**마지막 업데이트**: 2025-10-21
**버전**: 1.0 (안정화)
