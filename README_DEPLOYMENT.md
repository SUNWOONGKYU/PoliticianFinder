# Vercel 배포 문서 가이드

이 디렉토리에는 PoliticianFinder 프론트엔드를 Vercel에 배포하기 위한 모든 문서와 설정 파일이 포함되어 있습니다.

---

## 문서 구조

### 빠르게 시작하기
처음 배포하시나요? 이 순서로 읽으세요:

1. **QUICK_DEPLOY.md** - 5분 안에 배포하는 방법
   - 가장 빠른 시작 가이드
   - 핵심 단계만 포함
   - 초보자 친화적

2. **DEPLOYMENT_CHECKLIST.md** - 배포 전 확인사항
   - 80+ 체크 항목
   - 놓치기 쉬운 사항 방지
   - 배포 품질 보장

3. **DEPLOYMENT.md** - 상세 배포 가이드
   - 완전한 배포 프로세스
   - 트러블슈팅 포함
   - 고급 설정 및 최적화

### 기술 문서

4. **P2V1_IMPLEMENTATION_REPORT.md** - 구현 상세 보고서
   - 모든 설정 파일 설명
   - 기술적 의사결정 기록
   - 성능 최적화 내역

---

## 설정 파일 위치

배포를 위해 다음 파일들이 생성되었습니다:

### frontend/ 디렉토리
- **vercel.json** - Vercel 프로젝트 설정
- **.env.example** - 환경 변수 템플릿
- **.vercelignore** - 배포 제외 파일 목록
- **next.config.ts** - Next.js 빌드 최적화 (수정됨)

---

## 빠른 참조

### 환경 변수 (필수)

Vercel 대시보드에서 설정해야 할 환경 변수:

```
NEXT_PUBLIC_SUPABASE_URL=https://ooddlafwdpzgxfefgsrx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### 배포 명령어

```bash
# Vercel CLI로 배포
vercel

# Production 배포
vercel --prod
```

### 로컬 빌드 테스트

```bash
cd frontend
npm run build
npm run start
```

---

## 문서 사용 가이드

### 시나리오별 추천 문서

| 상황 | 추천 문서 |
|------|----------|
| 처음 배포 | QUICK_DEPLOY.md |
| 배포 전 체크 | DEPLOYMENT_CHECKLIST.md |
| 문제 해결 | DEPLOYMENT.md (트러블슈팅 섹션) |
| 성능 최적화 | DEPLOYMENT.md (성능 최적화 섹션) |
| 기술 이해 | P2V1_IMPLEMENTATION_REPORT.md |
| 도메인 설정 | DEPLOYMENT.md (도메인 설정 섹션) |

---

## 배포 프로세스 요약

### 1단계: 준비
```bash
cd frontend
npm run build  # 로컬 빌드 테스트
```

### 2단계: Vercel 설정
- Vercel 계정 생성
- GitHub 저장소 연결
- Root Directory: `frontend` 설정

### 3단계: 환경 변수
- `NEXT_PUBLIC_SUPABASE_URL` 추가
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` 추가

### 4단계: 배포
- Deploy 버튼 클릭
- 빌드 로그 확인

### 5단계: Supabase 업데이트
- Redirect URLs에 Vercel URL 추가
- Site URL 업데이트

### 6단계: 테스트
- 사이트 접속
- Google 로그인
- 기능 확인

---

## 지원 및 도움말

### 문제 해결 순서

1. **빌드 실패**
   - DEPLOYMENT.md > 트러블슈팅 > 빌드 실패 섹션

2. **환경 변수 문제**
   - DEPLOYMENT.md > 트러블슈팅 > 환경 변수 문제 섹션

3. **Google OAuth 문제**
   - DEPLOYMENT.md > 트러블슈팅 > Google OAuth 문제 섹션

4. **기타 문제**
   - DEPLOYMENT.md > 트러블슈팅 섹션 전체 참조

### 추가 리소스

- [Vercel 공식 문서](https://vercel.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [Supabase 문서](https://supabase.com/docs)

---

## 문서 업데이트 이력

| 날짜 | 버전 | 변경사항 |
|------|------|----------|
| 2025-10-17 | 1.0 | 초기 배포 문서 생성 |

---

## 라이센스 및 기여

이 문서는 PoliticianFinder 프로젝트의 일부입니다.

---

**도움이 필요하신가요?**
- QUICK_DEPLOY.md부터 시작하세요!
- 문제가 발생하면 DEPLOYMENT.md의 트러블슈팅을 확인하세요.
- 여전히 문제가 해결되지 않으면 GitHub Issues에 문의하세요.
