# Supabase 이메일 인증 설정 가이드

## 🔴 문제 발견

회원가입 시 `email_confirmed: true`로 즉시 표시됩니다.
→ **이메일 인증이 비활성화되어 있습니다!**

## ✅ 해결 방법

### 1단계: Supabase Dashboard 접속

1. https://app.supabase.com 접속
2. PoliticianFinder 프로젝트 선택

### 2단계: 이메일 인증 활성화

1. 왼쪽 메뉴에서 **Authentication** 클릭
2. **Settings** 탭 클릭
3. 아래로 스크롤하여 **Email Auth** 섹션 찾기
4. **Enable email confirmations** 옵션 찾기
5. ✅ **체크박스 활성화**
6. **Save** 버튼 클릭

### 3단계: Site URL 설정 확인

같은 Settings 페이지에서:

1. **Site URL** 확인:
   ```
   https://politician-finder.vercel.app
   ```

2. **Redirect URLs** 확인:
   ```
   https://politician-finder.vercel.app/auth/callback
   http://localhost:3000/auth/callback
   ```

### 4단계: 이메일 템플릿 확인

1. **Authentication** → **Email Templates** 클릭
2. **Confirm signup** 템플릿 선택
3. 템플릿에 `{{ .ConfirmationURL }}` 링크가 포함되어 있는지 확인
4. 기본 템플릿:
   ```html
   <h2>Confirm your signup</h2>
   <p>Follow this link to confirm your user:</p>
   <p><a href="{{ .ConfirmationURL }}">Confirm your mail</a></p>
   ```

### 5단계: 이메일 발송 제한 확인

무료 플랜 제한:
- **시간당 이메일 발송 제한**: 매우 적음 (정확한 수치는 Supabase 문서 참조)
- 테스트 중 제한 초과 시 이메일이 발송되지 않음

**해결책**:
- 테스트 간격을 두고 진행
- 또는 Pro 플랜으로 업그레이드

### 6단계: SMTP 설정 (선택 사항)

더 안정적인 이메일 발송을 원한다면:

1. **Authentication** → **Settings** → **SMTP Settings**
2. 자체 SMTP 서버 설정 (Gmail, SendGrid 등)
3. 이렇게 하면 Supabase의 발송 제한에서 자유로워집니다

## 🧪 테스트 방법

설정 변경 후:

1. 모든 테스트 계정 삭제:
   ```bash
   node scripts/delete_all_users.mjs
   ```

2. 새로운 이메일로 회원가입 테스트

3. 이메일 확인:
   - 받은편지함
   - 스팸함
   - 발신자: `noreply@mail.app.supabase.io`

4. 인증 링크 클릭 → 로그인 페이지로 이동 확인

## 📋 현재 상태 확인

사용자 상태 확인:
```bash
node scripts/check_signup_status.mjs
```

정상적으로 설정되었다면:
- `email_confirmed: false` (회원가입 직후)
- `email_confirmed: true` (인증 링크 클릭 후)

## ⚠️ 주의사항

- **Enable email confirmations** 활성화 후에는 이메일 인증 없이 로그인 불가
- 이전에 가입한 사용자들은 이미 `email_confirmed: true`이므로 영향 없음
- 새로운 가입자부터 이메일 인증 필수

## 🔗 참고 문서

- Supabase Email Auth: https://supabase.com/docs/guides/auth/auth-email
- Email Templates: https://supabase.com/docs/guides/auth/auth-email-templates
