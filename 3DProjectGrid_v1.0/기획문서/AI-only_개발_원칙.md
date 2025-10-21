# AI-only 개발 원칙 및 가이드

**프로젝트**: PoliticianFinder
**작성일**: 2025-10-16
**원칙 버전**: 1.0

---

## 📜 AI-only 개발이란?

사용자(PM)는 **작업 관리 및 승인만** 담당하고, 모든 개발/테스트/배포 작업은 **AI 에이전트가 자동으로 수행**하는 개발 방식입니다.

---

## 🎯 핵심 원칙

### 원칙 1: Zero Manual Intervention
**사용자가 직접 해야 하는 작업 = 0**

#### ❌ 금지 사항
- Dashboard/Console 수동 클릭
- GUI 기반 설정 변경
- 수동 SQL 실행
- 파일 업로드/다운로드
- 수동 배포 버튼 클릭
- 터미널 명령어 직접 입력

#### ✅ 허용 사항
- 작업 승인/거부 판단
- 최종 결과물 검토
- 방향성 결정

---

### 원칙 2: Code-First Configuration
**모든 설정은 코드/파일로 관리**

#### ❌ 금지
- Web UI 설정
- 클릭으로 생성되는 리소스
- Export/Import 필요한 데이터

#### ✅ 필수
- `.env` 파일
- `config.json`
- Migration 파일
- Infrastructure as Code (Terraform, etc.)

---

### 원칙 3: CLI/API Only
**모든 작업은 CLI 또는 API로 수행 가능해야 함**

#### ✅ 예시
```bash
# Good: CLI 명령어
supabase db push
npm run build
vercel deploy

# Good: API 호출
POST /api/auth/signup
POST /api/admin/create-user
```

#### ❌ 반례
```
1. Supabase Dashboard → SQL Editor → Run
2. Firebase Console → Authentication → Enable Email
3. Vercel Dashboard → Environment Variables → Add
```

---

## 🔍 기술 선택 체크리스트

새로운 기술/서비스를 도입할 때 **반드시 확인**:

### 필수 요건
- [ ] CLI 도구 제공?
- [ ] API 완전 제공?
- [ ] 설정 파일 지원?
- [ ] Migration 시스템?
- [ ] 자동화 가능?

### 경고 신호 (도입 금지)
- ⚠️ "Dashboard에서 설정하세요"
- ⚠️ "웹 콘솔에서 활성화하세요"
- ⚠️ "수동으로 업로드하세요"
- ⚠️ "GUI에서 생성하세요"

---

## 📋 각 분야별 AI-only 기준

### Backend
- ✅ FastAPI/Express (코드 기반)
- ✅ Supabase (API + CLI)
- ❌ Firebase (Console 필수)
- ❌ AWS Console 의존 서비스

### Database
- ✅ PostgreSQL + Migration 도구
- ✅ Supabase (SQL API)
- ❌ GUI 필수 DB 도구
- ❌ 수동 Schema 변경

### Frontend
- ✅ Next.js (설정 파일)
- ✅ React (코드 기반)
- ❌ No-code 플랫폼
- ❌ Drag & Drop 빌더

### 배포
- ✅ Vercel CLI
- ✅ GitHub Actions
- ✅ Docker + CI/CD
- ❌ 수동 FTP 업로드
- ❌ Dashboard 배포 버튼

### 테스트
- ✅ Jest/Vitest (자동화)
- ✅ Playwright (스크립트)
- ❌ 수동 QA
- ❌ Manual E2E

---

## 🚨 AI-only 위반 대응

### 위반 발견 시
1. **즉시 중단**: 해당 작업 멈춤
2. **대안 검색**: AI-only 가능한 다른 방법 탐색
3. **기술 변경**: 필요시 다른 기술로 교체
4. **문서화**: 거부 사유 및 대안 기록

### 예시: Phase 1F 사례
**문제**: Database Trigger가 수동 SQL 실행 필요
**대응**: API Route 방식으로 변경
**결과**: ✅ AI-only 준수

---

## 🎓 에이전트 교육

모든 AI 에이전트는 작업 시작 전 다음을 확인:

### 질문 체크리스트
1. 이 작업이 사용자 수동 개입을 요구하는가?
2. CLI/API로 자동화 가능한가?
3. 설정이 코드로 관리되는가?
4. 테스트가 자동화되는가?

### 하나라도 "No"면 → ❌ 거부

---

## 📊 Phase별 AI-only 달성 현황

### Phase 1 ✅ 완료
- Supabase 설정: CLI + 환경변수
- Database: Migration 파일
- 인증: API Route
- 테스트: 자동화 스크립트

### Phase 2 (예정)
- CRUD API: Route handlers
- 파일 업로드: API + Storage SDK
- 검색: API 기반

### Phase 3 (예정)
- 테스트: 완전 자동화
- CI/CD: GitHub Actions

---

## 🏆 성공 기준

프로젝트가 **AI-only 성공**으로 인정되려면:

1. ✅ 전체 개발 과정에서 사용자 수동 작업 0건
2. ✅ 모든 설정이 코드/파일로 관리됨
3. ✅ 재현 가능 (새 환경에서 스크립트로 복원)
4. ✅ 배포 자동화 (One-click or CI/CD)

---

## 📞 문의 및 검토

AI-only 원칙 위반이 의심되면:
1. 작업 즉시 중단
2. PM에게 보고
3. 대안 논의

**원칙 준수 > 개발 속도**

---

**이 원칙은 모든 작업지시서, 기획 문서, 에이전트 프롬프트에 우선합니다.**
