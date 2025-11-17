# Supabase SMTP 설정 가이드 (Resend 연동)

## 목적
회원가입 시 이메일 인증 메일이 Resend를 통해 발송되도록 Supabase 설정

## 현재 상황
- ❌ 회원가입 시 "Error sending confirmation email" 발생
- ✅ Resend API 키 설정 완료 (`.env.local`)
- ✅ Resend 테스트 이메일 발송 성공 확인

## 설정 단계

### 1. Supabase 대시보드 접속
1. https://app.supabase.com 접속
2. PoliticianFinder 프로젝트 선택

### 2. SMTP 설정 페이지 이동
1. 왼쪽 메뉴에서 **Project Settings** (톱니바퀴 아이콘) 클릭
2. **Configuration** 섹션에서 **Auth** 클릭
3. 아래로 스크롤하여 **SMTP Settings** 섹션 찾기
4. **Enable Custom SMTP** 토글 활성화

### 3. SMTP 정보 입력

```
Host: smtp.resend.com
Port: 465 (SSL 사용) 또는 587 (TLS 사용 - 권장)
User: resend
Password: re_8hjt3JJR_5GD6Q8twLftC1LficQqkH9E7
Sender name: PoliticianFinder
Sender email: onboarding@resend.dev (임시 - 도메인 인증 전까지)
```

**도메인 인증 후 변경할 이메일:**
```
Sender email: noreply@politicianfinder.com
```

### 4. 이메일 템플릿 설정 (선택사항)
- **Email Templates** 섹션에서 회원가입 인증 메일 템플릿 커스터마이징 가능
- 기본 템플릿 사용해도 무방

### 5. 설정 저장
- **Save** 버튼 클릭
- 설정 적용까지 1-2분 소요

### 6. 테스트
1. 프론트엔드에서 회원가입 시도
2. 이메일 수신 확인
3. 이메일 내 인증 링크 클릭하여 인증 완료

## 문제 해결

### 문제 1: "SMTP connection failed"
**원인**: 잘못된 SMTP 정보 또는 네트워크 문제
**해결**:
- Port를 587로 변경 (465 대신)
- User가 정확히 `resend`인지 확인

### 문제 2: "Sender email not verified"
**원인**: 도메인 인증 전 politicianfinder.com 사용
**해결**:
- 임시로 `onboarding@resend.dev` 사용
- Resend 대시보드에서 도메인 인증 완료 후 변경

### 문제 3: 이메일이 스팸함으로 가는 경우
**원인**: SPF, DKIM, DMARC 레코드 미설정
**해결**:
- Resend 대시보드 → Domains → DNS 레코드 추가
- 도메인 등록 업체(가비아 등)에서 TXT 레코드 추가

## 현재 환경 변수 (.env.local)

```env
# Resend Email Service
RESEND_API_KEY=re_8hjt3JJR_5GD6Q8twLftC1LficQqkH9E7
RESEND_FROM_EMAIL=onboarding@resend.dev
```

## 참고 자료
- Supabase SMTP 문서: https://supabase.com/docs/guides/auth/auth-smtp
- Resend SMTP 문서: https://resend.com/docs/send-with-smtp

## 설정 완료 후 확인사항
- [ ] 회원가입 시 이메일 정상 발송
- [ ] 이메일 인증 링크 정상 작동
- [ ] Google OAuth 로그인 정상 작동
- [ ] 이메일이 스팸함이 아닌 받은편지함으로 수신

## 추가 작업 필요
1. **도메인 인증** (Resend): politicianfinder.com DNS 레코드 추가
2. **Google OAuth 콜백 URL** 확인: Supabase Auth → Providers → Google
