/**
 * Project Grid Task ID: P1D1
 * 작업명: 인증 스키마
 * 생성시간: 2025-10-31 14:20
 * 생성자: Claude-Sonnet-4.5
 * 의존성: P1O1
 * 설명: 사용자 인증을 위한 데이터베이스 스키마 생성
 */

# P1D1 - 인증 스키마 완료

## ✅ 작업 완료 내용

### 1. profiles 테이블
- ✅ 사용자 프로필 정보 저장
- ✅ auth.users와 외래키 연결
- ✅ role 기반 권한 관리 (user, admin, moderator)
- ✅ email 인증 상태 추적

### 2. auth_tokens 테이블
- ✅ 인증 토큰 관리
- ✅ 토큰 타입별 구분 (access, refresh, reset_password, verify_email)
- ✅ 토큰 만료 및 폐기 관리

### 3. email_verifications 테이블
- ✅ 이메일 인증 코드 관리
- ✅ 인증 시도 횟수 제한 (최대 5회)
- ✅ 인증 코드 만료 시간 설정

### 4. password_resets 테이블
- ✅ 비밀번호 재설정 토큰 관리
- ✅ 일회용 토큰 시스템
- ✅ 토큰 만료 시간 설정

### 5. 인덱스 생성
- ✅ 각 테이블의 주요 컬럼에 인덱스 생성
- ✅ 쿼리 성능 최적화
- ✅ 15개 인덱스 생성 완료

### 6. RLS 정책
- ✅ Row Level Security 활성화
- ✅ 사용자별 데이터 접근 제어
- ✅ 관리자 권한 정책
- ✅ 10개 정책 생성 완료

### 7. 트리거 함수
- ✅ updated_at 자동 업데이트 트리거

## 📦 생성된 파일

### 4_Database/supabase/migrations/
- `001_auth_schema.sql` - 인증 스키마 마이그레이션

## 🗄️ 데이터베이스 구조

### 테이블 관계도
```
auth.users (Supabase Auth)
    ↓
profiles (사용자 프로필)
    ├─→ auth_tokens (인증 토큰)
    ├─→ email_verifications (이메일 인증)
    └─→ password_resets (비밀번호 재설정)
```

### 주요 컬럼

#### profiles
- id (UUID, PK): auth.users.id 참조
- email (VARCHAR): 이메일 주소
- role (VARCHAR): 사용자 역할
- is_email_verified (BOOLEAN): 이메일 인증 상태

#### auth_tokens
- token (TEXT): 토큰 문자열
- token_type (VARCHAR): 토큰 타입
- expires_at (TIMESTAMP): 만료 시간

#### email_verifications
- verification_code (VARCHAR): 인증 코드
- attempts (INT): 시도 횟수
- max_attempts (INT): 최대 시도 횟수

#### password_resets
- reset_token (TEXT): 재설정 토큰
- expires_at (TIMESTAMP): 만료 시간

## 🔒 보안 기능

### RLS 정책
1. **사용자 격리**: 각 사용자는 자신의 데이터만 조회/수정 가능
2. **관리자 권한**: 관리자는 모든 프로필 조회 가능
3. **토큰 보호**: 인증 토큰은 소유자만 관리 가능

### 인덱스 최적화
- 이메일 조회 최적화
- 토큰 검증 최적화
- 만료된 레코드 정리 최적화

## ✅ 완료 기준 체크

- [x] profiles 테이블 생성
- [x] auth_tokens 테이블 생성
- [x] email_verifications 테이블 생성
- [x] password_resets 테이블 생성
- [x] 인덱스 생성 (15개)
- [x] RLS 정책 설정 (10개)
- [x] 트리거 함수 생성
- [x] 작업 문서화 완료

## 📊 다음 작업과의 연계

이 작업의 완료로 다음 작업들이 진행 가능합니다:
- P1D2~P1D5: 추가 데이터베이스 스키마
- P1BI1: Supabase 클라이언트 (인증 스키마 활용)
- P1BA1~P1BA4: 백엔드 API (인증 기능 구현)

## ⏱️ 소요 시간

약 10분

---

**작업 완료일**: 2025-10-31
**상태**: ✅ 완료
