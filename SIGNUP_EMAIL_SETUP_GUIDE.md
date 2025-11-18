# 회원가입 이메일 설정 가이드

**작성일**: 2025-11-18
**상태**: 🔴 **설정 필요**

---

## ⚠️ 현재 상태

**Supabase 기본 SMTP 사용 중** → 하루 3~4통 제한

회원가입 시 이메일 인증 링크를 발송해야 하지만, Supabase 기본 SMTP는 제한이 있어 실제 서비스에 사용할 수 없습니다.

---

## 🚀 해결 방법 (2가지 옵션)

### 옵션 1: Supabase 커스텀 SMTP 설정 (권장)

Supabase에서 직접 SMTP를 설정하면 회원가입 이메일을 자동으로 발송합니다.

#### 1.1 SMTP 서비스 선택

**추천 서비스**:
- **Gmail SMTP** (무료, 하루 500통)
- **SendGrid** (무료 플랜 하루 100통)
- **AWS SES** (저렴, 월 62,000통 무료)
- **Mailgun** (무료 플랜 월 5,000통)

#### 1.2 Gmail SMTP 설정 예시 (가장 간단)

**Gmail 앱 비밀번호 생성**:
1. https://myaccount.google.com/security 접속
2. "2단계 인증" 활성화 (필수)
3. "앱 비밀번호" 검색
4. "앱 비밀번호" 생성:
   - 앱 선택: 메일
   - 기기 선택: 기타 (사용자 설정 이름)
   - 이름: `Supabase SMTP`
5. 생성된 16자리 비밀번호 복사 (예: `abcd efgh ijkl mnop`)

**Supabase SMTP 설정**:
1. https://supabase.com/dashboard 접속
2. 프로젝트 선택: `ooddlafwdpzgxfefgsrx`
3. 왼쪽 메뉴 → **Project Settings** → **Auth**
4. 아래로 스크롤 → **SMTP Settings** 섹션
5. "Enable Custom SMTP" 토글 ON
6. 정보 입력:
   ```
   SMTP Host: smtp.gmail.com
   SMTP Port: 587
   SMTP Username: [본인 Gmail 주소]
   SMTP Password: [앱 비밀번호 16자리 - 공백 제거]
   SMTP Sender Name: PoliticianFinder
   SMTP Sender Email: [본인 Gmail 주소]
   ```
7. "Save" 클릭
8. "Send Test Email" 클릭하여 테스트

#### 1.3 SendGrid SMTP 설정 예시 (프로덕션 권장)

**SendGrid 계정 생성**:
1. https://signup.sendgrid.com/ 회원가입
2. 무료 플랜 선택 (하루 100통)
3. 이메일 인증 완료

**API Key 생성**:
1. Settings → API Keys
2. "Create API Key" 클릭
3. 이름: `Supabase SMTP`
4. Permissions: **Full Access**
5. API Key 복사 (한 번만 표시됨!)

**Sender 인증**:
1. Settings → Sender Authentication
2. "Verify a Single Sender" 클릭
3. 발신자 정보 입력:
   ```
   From Name: PoliticianFinder
   From Email Address: [본인 이메일]
   Reply To: [본인 이메일]
   Company Address: [주소]
   ```
4. 이메일 인증 링크 클릭

**Supabase SMTP 설정**:
1. Supabase Dashboard → Project Settings → Auth → SMTP Settings
2. 정보 입력:
   ```
   SMTP Host: smtp.sendgrid.net
   SMTP Port: 587
   SMTP Username: apikey
   SMTP Password: [SendGrid API Key]
   SMTP Sender Name: PoliticianFinder
   SMTP Sender Email: [인증된 발신자 이메일]
   ```
3. "Save" 클릭

---

### 옵션 2: Resend API 사용 (이미 .env.local에 설정됨)

`.env.local`에 Resend API Key가 이미 있지만 사용되지 않고 있습니다:

```bash
RESEND_API_KEY=re_8hjt3JJR_5GD6Q8twLftC1LficQqkH9E7
RESEND_FROM_EMAIL=onboarding@resend.dev
```

**⚠️ 이 옵션은 추가 개발 필요**:
- 회원가입 API (`/api/auth/signup/route.ts`)를 수정하여 Resend로 직접 이메일 발송
- Supabase Auth의 기본 이메일 발송 비활성화
- 이메일 템플릿 직접 관리 필요

**→ 옵션 1 (Supabase SMTP)을 권장합니다.**

---

## 🧪 테스트 방법

### 로컬 테스트
1. 개발 서버 실행:
   ```bash
   cd 1_Frontend
   npm run dev
   ```

2. 회원가입 페이지 접속:
   ```
   http://localhost:3001/auth/signup
   ```

3. 테스트 계정으로 회원가입:
   ```
   이메일: [본인 이메일]
   비밀번호: Test1234!@#$
   이름: 테스트 사용자
   ```

4. 이메일 수신 확인:
   - 제목: "Confirm your signup"
   - 발신자: PoliticianFinder
   - 인증 링크 클릭

5. 로그인 테스트

---

## 📧 이메일 템플릿 커스터마이징 (선택사항)

### Supabase에서 이메일 템플릿 수정
1. Supabase Dashboard → **Authentication** → **Email Templates**
2. **Confirm signup** 템플릿 선택
3. 템플릿 편집:
   ```html
   <h2>PoliticianFinder 회원가입을 환영합니다!</h2>
   <p>아래 버튼을 클릭하여 이메일 인증을 완료해주세요:</p>
   <a href="{{ .ConfirmationURL }}">이메일 인증하기</a>
   ```
4. "Save" 클릭

---

## ❓ 문제 해결

### 이메일이 도착하지 않음
1. **스팸 폴더 확인**
2. **SMTP 설정 재확인**:
   - Host, Port, Username, Password 정확한지 확인
   - "Send Test Email" 테스트
3. **발신자 이메일 인증 상태 확인** (SendGrid 사용 시)

### Gmail SMTP 오류: "Username and Password not accepted"
→ Gmail 앱 비밀번호가 아닌 일반 비밀번호를 사용했을 가능성
→ 2단계 인증 활성화 및 앱 비밀번호 재생성

### SendGrid 오류: "Sender Identity Required"
→ Sender Authentication 미완료
→ Settings → Sender Authentication에서 인증 완료

### Supabase 오류: "email_send_rate_limit"
→ 기본 SMTP 사용 중 (하루 3~4통 제한)
→ 커스텀 SMTP 설정 필요

---

## ✅ 완료 체크리스트

### 옵션 1: Supabase 커스텀 SMTP
- [ ] SMTP 서비스 선택 (Gmail or SendGrid)
- [ ] 발신자 인증 완료
- [ ] Supabase SMTP Settings 설정
- [ ] "Send Test Email" 테스트 성공
- [ ] 회원가입 테스트 성공
- [ ] 이메일 인증 링크 동작 확인

### 옵션 2: Resend API (고급)
- [ ] Resend API 유효성 확인
- [ ] 회원가입 API 수정 (Resend 연동)
- [ ] 이메일 템플릿 작성
- [ ] 테스트 완료

---

## 📊 SMTP 서비스 비교

| 서비스 | 무료 한도 | 장점 | 단점 |
|--------|----------|------|------|
| **Gmail** | 500통/일 | 설정 간단, 무료 | 발신자가 Gmail |
| **SendGrid** | 100통/일 | 전문 서비스, 통계 | 발신자 인증 필요 |
| **AWS SES** | 62,000통/월 | 저렴, 대용량 | 설정 복잡 |
| **Mailgun** | 5,000통/월 | 대용량 무료 | 카드 등록 필요 |
| **Resend** | 3,000통/월 | 개발자 친화적 | 추가 코드 필요 |

**권장**:
- **개발/테스트**: Gmail SMTP
- **프로덕션**: SendGrid 또는 AWS SES

---

**작성자**: Claude Code
**참고**:
- Supabase SMTP 공식 문서: https://supabase.com/docs/guides/auth/auth-smtp
- SendGrid 가이드: https://sendgrid.com/docs/ui/account-and-settings/mail/
