# Supabase 이메일 인증 설정 가이드

## 개발/테스트 환경 (이메일 인증 비활성화)

### 단계 1: Supabase Dashboard 접속
1. https://supabase.com/dashboard 로그인
2. `politician-finder` 프로젝트 선택

### 단계 2: 이메일 인증 비활성화
1. 좌측 메뉴 **Authentication** 클릭
2. **Providers** 탭 선택
3. **Email** 섹션에서 설정 아이콘 클릭
4. **"Confirm email"** 토글을 OFF로 변경
5. **Save** 버튼 클릭

### 단계 3: 확인
- 회원가입 후 즉시 로그인 가능해짐
- 이메일 확인 링크 클릭 불필요
- 테스트 계정으로 회원가입 시도하여 정상 작동 확인

## 주의사항

### 개발 환경 설정
**개발/테스트 환경에서만 이메일 인증을 비활성화하세요.**

장점:
- 빠른 테스트 가능
- 이메일 서버 설정 불필요
- 즉시 계정 사용 가능

단점:
- 보안 수준 낮음
- 실제 이메일 주소 검증 불가
- 스팸 계정 생성 가능

### 프로덕션 환경 설정
**프로덕션 환경에서는 반드시 이메일 인증을 활성화하세요!**

프로덕션 배포 전 체크리스트:
- [ ] "Confirm email" 토글 ON으로 변경
- [ ] 이메일 템플릿 커스터마이징
- [ ] SMTP 설정 확인 (선택사항)
- [ ] 회원가입 플로우 전체 테스트
- [ ] 이메일 재전송 기능 테스트
- [ ] 비밀번호 재설정 플로우 테스트

## 이메일 템플릿 커스터마이징 (선택사항)

### 템플릿 수정 방법
1. Authentication > **Email Templates** 탭 이동
2. 수정할 템플릿 선택:
   - **Confirm signup**: 회원가입 확인 이메일
   - **Magic Link**: 매직 링크 로그인
   - **Change Email Address**: 이메일 변경
   - **Reset Password**: 비밀번호 재설정

### 템플릿 변수
사용 가능한 변수:
- `{{ .ConfirmationURL }}`: 확인 링크
- `{{ .Email }}`: 사용자 이메일
- `{{ .Token }}`: 인증 토큰
- `{{ .SiteURL }}`: 사이트 URL

### 예제 템플릿 (한국어)
```html
<h2>PoliticianFinder 회원가입을 환영합니다!</h2>
<p>안녕하세요,</p>
<p>PoliticianFinder 서비스 가입을 위해 아래 버튼을 클릭하여 이메일을 인증해주세요:</p>
<p><a href="{{ .ConfirmationURL }}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">이메일 인증하기</a></p>
<p>이 링크는 24시간 동안 유효합니다.</p>
<p>감사합니다,<br>PoliticianFinder 팀</p>
```

## SMTP 설정 (선택사항)

### Resend 사용 (추천)
1. https://resend.com 가입
2. API Key 생성
3. Supabase Dashboard > Settings > Auth
4. SMTP 설정에 Resend 정보 입력

### 커스텀 SMTP 서버
1. Settings > Auth > SMTP Settings
2. 다음 정보 입력:
   - Host: SMTP 서버 주소
   - Port: 587 (TLS) 또는 465 (SSL)
   - Username: SMTP 계정
   - Password: SMTP 비밀번호
   - Sender email: 발신자 이메일
   - Sender name: 발신자 이름

## 문제 해결

### 이메일이 도착하지 않는 경우
1. 스팸 폴더 확인
2. SMTP 설정 재확인
3. Supabase Logs에서 오류 확인
4. 이메일 주소 철자 확인

### 인증 링크가 작동하지 않는 경우
1. 링크 유효기간(24시간) 확인
2. Site URL 설정 확인 (Settings > API)
3. Redirect URL 설정 확인
4. 브라우저 쿠키 설정 확인

## 보안 권장사항

### 이메일 인증 외 추가 보안
1. **2단계 인증(2FA)** 구현 검토
2. **Rate Limiting** 설정
3. **Captcha** 추가 (봇 방지)
4. **IP 화이트리스트** 설정 (관리자용)
5. **세션 타임아웃** 설정

### 모니터링
- 회원가입 실패율 모니터링
- 이메일 반송률 확인
- 비정상적인 가입 패턴 감지
- 보안 로그 정기 검토

## 참고 링크
- [Supabase Auth 문서](https://supabase.com/docs/guides/auth)
- [이메일 템플릿 가이드](https://supabase.com/docs/guides/auth/email-templates)
- [SMTP 설정 가이드](https://supabase.com/docs/guides/auth/smtp)
- [RLS 정책 가이드](https://supabase.com/docs/guides/auth/row-level-security)