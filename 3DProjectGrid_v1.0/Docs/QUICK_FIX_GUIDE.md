# Phase 1F 테스트 실패 긴급 수정 가이드

## 즉시 실행 필요한 작업 (우선순위 순)

### 1. Supabase SQL 실행 (5분 소요)
1. Supabase Dashboard 접속: https://supabase.com/dashboard
2. `politician-finder` 프로젝트 선택
3. 좌측 메뉴 **SQL Editor** 클릭
4. `supabase_profile_trigger.sql` 파일 내용 전체 복사/붙여넣기
5. **Run** 버튼 클릭
6. "Success: No rows returned" 메시지 확인

### 2. 이메일 인증 비활성화 (2분 소요)
1. 같은 Dashboard에서 좌측 메뉴 **Authentication** 클릭
2. **Providers** 탭 선택
3. **Email** 섹션의 설정 아이콘 클릭
4. **"Confirm email"** 토글 OFF
5. **Save** 클릭

### 3. 테스트 실행
```bash
# Frontend 디렉토리로 이동
cd C:\Users\home\PoliticianFinder_Supabase\frontend

# 개발 서버 재시작
npm run dev

# 테스트 계정으로 회원가입 시도
# Email: test@example.com
# Password: Test1234!
# Username: testuser
```

## 수정 내용 요약

### Problem 1: RLS 정책 위반 해결
- **원인**: 클라이언트에서 profiles 테이블에 직접 INSERT 시도
- **해결**: Database Trigger로 자동 프로필 생성
- **파일**: `AuthContext.tsx` 수정 완료

### Problem 2: 이메일 인증 문제 해결
- **원인**: Supabase 기본 설정이 이메일 인증 필수
- **해결**: 개발 환경에서 이메일 인증 비활성화
- **주의**: 프로덕션 배포 전 다시 활성화 필요

## 확인 방법

### 성공 시나리오
1. 회원가입 폼 제출
2. 즉시 로그인 상태로 전환
3. Dashboard 페이지로 리디렉션
4. 프로필 정보 정상 표시

### 실패 시 체크포인트
- [ ] SQL 트리거가 정상 실행되었는가?
- [ ] 이메일 인증이 비활성화되었는가?
- [ ] Frontend 코드가 최신 버전인가?
- [ ] Supabase 프로젝트가 활성 상태인가?

## 롤백 방법 (필요시)

### SQL 트리거 제거
```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
```

### AuthContext.tsx 원복
프로필 생성 코드를 다시 추가 (권장하지 않음)

## 프로덕션 체크리스트

배포 전 반드시 확인:
- [ ] 이메일 인증 다시 활성화
- [ ] SMTP 설정 완료
- [ ] 이메일 템플릿 커스터마이징
- [ ] Rate Limiting 설정
- [ ] 보안 정책 검토

## 문의사항
문제 발생 시 다음 정보와 함께 보고:
- Supabase Logs (Authentication 탭)
- Browser Console 에러 메시지
- Network 탭 응답 내용