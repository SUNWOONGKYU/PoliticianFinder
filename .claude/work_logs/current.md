# 작업 로그 (Work Log) - Current

**목적**: 세션이 끊어져도 작업 내용을 추적할 수 있도록 모든 주요 작업을 기록

**📌 이 파일은 활성 로그입니다**
- 최신 작업만 기록 (50KB 제한)
- 50KB 초과 시 자동으로 날짜별 파일로 순환됨
- 이전 로그: `work_logs/YYYY-MM-DD.md`
- 오래된 로그: `work_logs/archive/`

---

## 🔗 이전 로그

- [2025-11-17.md](./2025-11-17.md) - CLAUDE.md 6대 원칙 추가, Memory MCP 설정

---

## 작업 기록 시작

## 2025-11-19 08:37

### 작업: Admin Inquiries 페이지 완전 수정 완료 ✅

**문제 발견 및 해결 과정**:

1. **프론트엔드 필드명 불일치 문제**
   - 문제: API 응답의 `user.name` vs 프론트엔드 기대 `user.username`
   - 해결: 인터페이스 및 표시 로직 수정
   - 파일: `1_Frontend/src/app/admin/inquiries/page.tsx`
   - Commit: a356477

2. **CSP (Content Security Policy) 문제**
   - 문제: Google Fonts 로드 차단
   - 해결: `style-src`에 `https://fonts.googleapis.com` 추가, `font-src`에 `https://fonts.gstatic.com` 추가
   - 파일: `1_Frontend/src/middleware.ts`
   - Commit: e31d196

3. **API 500 에러 - JOIN 쿼리 실패** (핵심 문제)
   - 문제: Foreign key constraint를 명시한 JOIN이 NULL 값에서 실패
     - `user_id`: NULL 가능 (익명 문의)
     - `politician_id`: NULL 가능 (정치인 무관 문의)
     - `admin_id`: NULL 가능 (답변 전 문의)
   - 해결: Foreign key JOIN → 수동 조인으로 변경
     1. inquiries 테이블만 먼저 조회
     2. 각 필드가 NULL이 아닐 때만 관련 데이터 조인
     3. GET, PATCH 메서드 모두 수정
   - 파일: `1_Frontend/src/app/api/admin/inquiries/route.ts`
   - Commit: e93664a

**수정된 파일**:
- ✅ `1_Frontend/src/app/admin/inquiries/page.tsx` - 필드명 매핑 수정
- ✅ `1_Frontend/src/middleware.ts` - Google Fonts CSP 허용
- ✅ `1_Frontend/src/app/api/admin/inquiries/route.ts` - JOIN 쿼리 수동 조인으로 변경

**배포 정보**:
- 최종 Commit: e93664a
- Production URL: https://politician-finder-ou2d9ntid-finder-world.vercel.app
- Status: ✅ 완전 해결

**검증 결과**:
- ✅ 문의 목록 정상 표시 (6개 샘플 데이터)
- ✅ 익명 문의 (user_id NULL) 정상 처리
- ✅ Google Fonts 정상 로드
- ✅ 500 에러 해결

**기술적 교훈**:
- Supabase의 foreign key JOIN은 NULL 값에 안전하지 않음
- NULL이 허용되는 필드는 수동 조인으로 처리해야 함
- CSP 설정 시 외부 리소스 도메인 명시 필요

---

## 2025-11-18 22:10

### 작업: Admin API user_id 필드명 일괄 수정 완료

**작업 내용**:
- 모든 admin API에서 users 테이블 쿼리 시 `id` → `user_id` 수정
- 핵심 문제: checkIsAdmin(), checkUserRestrictions()에서 잘못된 필드명 사용
- 이로 인해 모든 admin API가 작동하지 않았음

**수정된 파일**:
- ✅ `1_Frontend/src/lib/auth/helpers.ts` - checkUserRestrictions, checkIsAdmin
- ✅ `1_Frontend/src/app/api/admin/users/route.ts` - GET, PATCH 메서드
- ✅ `1_Frontend/src/app/api/admin/action-logs/route.ts`
- ✅ `1_Frontend/src/app/api/admin/action-logs/stats/route.ts`
- ✅ `1_Frontend/src/app/api/admin/audit-logs/route.ts`

**배포 정보**:
- Commit: 2f94a48
- Production URL: https://politician-finder-akgxbvu1d-finder-world.vercel.app
- Status: ✅ 배포 완료

**검증 필요**:
- wksun999@gmail.com 계정으로 admin 기능 정상 작동 확인

---

## 2025-11-18 22:02

### 작업: Google OAuth nickname 필드 추가 및 Admin 권한 부여 완료

**작업 내용**:
- users 테이블 nickname 필드 NOT NULL 제약조건 발견
- OAuth callback에 nickname 필드 추가 (email의 @ 앞부분 사용)
- create_user_profile.py 스크립트로 wksun999@gmail.com 수동 생성
- grant_admin_role.py로 admin 권한 부여 완료

**생성/수정된 파일**:
- ✅ `1_Frontend/src/app/api/auth/google/callback/route.ts` (수정) - nickname 필드 추가
- ✅ `create_user_profile.py` (생성) - auth.users에서 public.users로 프로필 생성

**실행 결과**:
```
User ID: 6a000ddb-5cb5-4a24-85e5-5789d9b93b6a
Email: wksun999@gmail.com
Role: admin ✅
```

**배포 정보**:
- Commit: 87cbb91
- Production URL: https://politician-finder-c8cs1bjyd-finder-world.vercel.app
- GitHub Push: 503 에러 (로컬에 커밋됨)

---

## 2025-11-18 21:55

### 작업: Google OAuth 사용자 삽입 로직 수정

**작업 내용**:
- Google OAuth 콜백에서 사용자가 public.users 테이블에 삽입되지 않는 문제 해결
- 문제: `if (!existingUser && !userCheckError)` 조건으로 인해 신규 사용자 삽입 안됨
- 원인: Supabase `.single()`이 결과 없을 때 PGRST116 에러 반환하여 userCheckError가 truthy됨
- 해결: 조건을 `if (!existingUser)`로 변경하여 사용자가 없으면 무조건 삽입되도록 수정

**생성/수정된 파일**:
- ✅ `1_Frontend/src/app/api/auth/google/callback/route.ts` (수정) - Line 133

**배포 정보**:
- Commit: c698bba
- Production URL: https://politician-finder-c0xooda1r-finder-world.vercel.app
- 배포 완료

---

## 작업 기록 시작

**작업 로그 작성 규칙:**
1. 최신 작업이 맨 위에 오도록 역순 정렬
2. 작업 완료 시마다 즉시 기록
3. 파일 크기 주기적 확인 (50KB 제한)

---

## 작업 로그 작성 템플릿

새 작업 추가 시 아래 템플릿을 복사하여 "작업 기록 시작" 아래에 추가:

```markdown
## YYYY-MM-DD HH:MM

### 작업: [작업 제목]

**작업 내용**:
- [작업 항목 1]
- [작업 항목 2]

**생성/수정된 파일**:
- ✅ `경로/파일명` (생성/수정)

**검증 결과**:
- ✅ [검증 항목 1]
- ✅ [검증 항목 2]

**다음 작업**:
- [다음에 할 일]

**참고**:
- [중요 메모]

---
```

## 파일 순환 방법

**현재 파일이 50KB 초과 시:**
```bash
# 1. 현재 파일명을 날짜로 변경
mv current.md YYYY-MM-DD.md

# 2. 새로운 current.md 생성

# 3. 새 파일에 이전 로그 링크 추가
```

**30일 이상 된 파일 아카이빙:**
```bash
mv YYYY-MM-DD.md archive/
```
