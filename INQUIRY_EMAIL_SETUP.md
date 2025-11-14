# 문의 답변 이메일 자동 발송 설정 가이드

## 개요

관리자가 문의에 답변을 작성하면, 자동으로 문의자의 이메일로 답변이 발송됩니다.

## 이메일 서비스: Resend

Resend는 개발자 친화적인 트랜잭션 이메일 서비스입니다.
- 공식 사이트: https://resend.com
- 무료 플랜: 월 3,000통 무료
- 가격: https://resend.com/pricing

## 설정 방법

### 1. Resend 계정 생성

1. https://resend.com 접속
2. "Get Started" 클릭하여 회원가입
3. 이메일 인증 완료

### 2. API Key 발급

1. Resend Dashboard 로그인
2. 좌측 메뉴에서 "API Keys" 선택
3. "Create API Key" 클릭
4. 키 이름 입력 (예: "PoliticianFinder Production")
5. 권한 선택: "Full Access" 또는 "Sending Access"
6. 생성된 API Key 복사 (한 번만 표시됨!)

### 3. 도메인 인증 (중요!)

이메일을 발송하려면 도메인을 인증해야 합니다.

#### 옵션 1: 자체 도메인 사용 (권장)

1. Resend Dashboard > "Domains" 선택
2. "Add Domain" 클릭
3. 도메인 입력 (예: `politicianfinder.com`)
4. DNS 레코드 설정:
   ```
   Type: TXT
   Name: resend._domainkey
   Value: [Resend에서 제공하는 값]
   ```
5. DNS 전파 대기 (최대 48시간, 보통 몇 분)
6. "Verify DNS" 클릭하여 인증 완료

#### 옵션 2: Resend 테스트 도메인 사용 (개발용)

- 도메인 없이도 `onboarding@resend.dev`에서 이메일 발송 가능
- **제한**: 본인의 이메일로만 발송 가능 (테스트용)
- 프로덕션에서는 반드시 자체 도메인 사용 필요

### 4. 환경변수 설정

`1_Frontend/.env.local` 파일에 다음 내용 추가:

```bash
# Resend API Key (Dashboard > API Keys에서 발급)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxx

# 발신 이메일 주소
# 자체 도메인: noreply@yourdomain.com
# 테스트 도메인: onboarding@resend.dev
RESEND_FROM_EMAIL=noreply@politicianfinder.com

# 앱 URL (이메일 템플릿에 표시)
NEXT_PUBLIC_APP_URL=https://politicianfinder.com
```

### 5. 개발 서버 재시작

환경변수 변경 후 Next.js 개발 서버 재시작:

```bash
cd 1_Frontend
npm run dev
```

## 작동 방식

### 1. 사용자가 문의 제출
- Connection 페이지에서 문의 작성
- 데이터베이스 `inquiries` 테이블에 저장
- 상태: `pending` (대기중)

### 2. 관리자가 답변 작성
- `/admin/inquiries` 페이지 접속
- 문의 선택 → 상세보기 모달
- 답변 작성 후 "답변 저장" 클릭

### 3. 자동 이메일 발송
- API가 답변을 데이터베이스에 저장
- Resend API를 통해 이메일 발송
- 문의자 이메일로 답변 내용 전송

### 4. 이메일 내용
- **제목**: `[PoliticianFinder] 문의 답변: {문의 제목}`
- **내용**:
  - 원래 문의 내용
  - 관리자 답변
  - 사이트 링크

## 이메일 템플릿 미리보기

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏛️ PoliticianFinder
문의하신 내용에 대한 답변이 도착했습니다
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

안녕하세요,
고객님께서 문의하신 내용에 대한 답변을 보내드립니다.

┌───────────────────────────────┐
│ 📝 원래 문의 내용               │
├───────────────────────────────┤
│ 제목: 회원가입이 안 됩니다      │
│                                │
│ 내용:                          │
│ 회원가입 버튼을 클릭해도        │
│ 계속 오류가 발생합니다.         │
└───────────────────────────────┘

┌───────────────────────────────┐
│ 💬 관리자 답변                  │
├───────────────────────────────┤
│ 안녕하세요.                     │
│ 해당 문제는 수정 완료되었습니다. │
│ 다시 시도해 주시기 바랍니다.    │
└───────────────────────────────┘

추가 문의사항이 있으시면
언제든지 연락 주시기 바랍니다.

        [사이트 방문하기]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
© 2025 PoliticianFinder
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 테스트 방법

### 1. 로컬 테스트

```bash
# 1. Resend API Key 설정 확인
cat 1_Frontend/.env.local | grep RESEND

# 2. 개발 서버 실행
cd 1_Frontend
npm run dev

# 3. 관리자 페이지 접속
open http://localhost:3000/admin/inquiries

# 4. 테스트 문의 생성 (Supabase SQL Editor)
INSERT INTO inquiries (email, title, content, status, priority)
VALUES ('your-email@example.com', '테스트 문의', '테스트 내용입니다.', 'pending', 'normal');

# 5. 관리자 답변 작성 및 이메일 확인
```

### 2. 이메일 발송 확인

1. Resend Dashboard > "Emails" 메뉴
2. 발송된 이메일 목록 확인
3. 상세 내용, 발송 상태, 에러 로그 확인

## 문제 해결

### 이메일이 발송되지 않는 경우

#### 1. API Key 확인
```bash
# .env.local 파일 확인
cat 1_Frontend/.env.local | grep RESEND_API_KEY

# 환경변수 로드 확인 (Next.js 콘솔)
console.log(process.env.RESEND_API_KEY ? "✅ API Key 설정됨" : "❌ API Key 없음");
```

#### 2. 도메인 인증 확인
- Resend Dashboard > Domains > 도메인 상태 확인
- 상태가 "Verified"인지 확인
- DNS 레코드가 올바르게 설정되었는지 확인

#### 3. 발신 이메일 주소 확인
```bash
# .env.local 확인
cat 1_Frontend/.env.local | grep RESEND_FROM_EMAIL

# 발신 주소가 인증된 도메인과 일치하는지 확인
# 예: noreply@politicianfinder.com → politicianfinder.com 도메인 인증 필요
```

#### 4. 서버 로그 확인
```bash
# Next.js 콘솔에서 이메일 발송 로그 확인
# 성공: "Email notification sent successfully to: xxx@example.com"
# 실패: "Failed to send email, but inquiry was updated: [error]"
```

#### 5. Resend 대시보드 확인
- Resend Dashboard > Emails
- 발송 실패한 이메일 확인
- 에러 메시지 및 상태 코드 확인

### 일반적인 에러

| 에러 메시지 | 원인 | 해결 방법 |
|-----------|------|---------|
| `Invalid API key` | API Key 오류 | Resend에서 새 API Key 발급 |
| `Domain not verified` | 도메인 미인증 | DNS 레코드 설정 후 도메인 인증 |
| `From address not authorized` | 발신 주소 불일치 | 인증된 도메인의 이메일 주소 사용 |
| `Rate limit exceeded` | 발송 한도 초과 | Resend 플랜 업그레이드 |

## 프로덕션 배포 체크리스트

- [ ] Resend 계정 생성 완료
- [ ] API Key 발급 완료
- [ ] 자체 도메인 인증 완료
- [ ] 환경변수 설정 완료 (`.env.production` 또는 호스팅 환경변수)
- [ ] 발신 이메일 주소가 인증된 도메인과 일치
- [ ] 테스트 이메일 발송 성공
- [ ] 이메일 템플릿 디자인 확인
- [ ] 스팸 폴더 테스트 (Gmail, Outlook 등)
- [ ] DKIM, SPF 레코드 확인
- [ ] Resend 플랜 확인 (무료: 월 3,000통)

## 비용 예상

### Resend 가격 (2025년 기준)

| 플랜 | 월 발송량 | 가격 |
|-----|----------|------|
| Free | 3,000통 | $0 |
| Pro | 50,000통 | $20 |
| Business | 100,000통 | $80 |

### 예상 사용량
- 문의 답변 1건 = 이메일 1통
- 월 300건 문의 = 월 300통
- **무료 플랜으로 충분**

## 참고 자료

- **Resend 공식 문서**: https://resend.com/docs
- **Next.js 통합 가이드**: https://resend.com/docs/send-with-nextjs
- **이메일 템플릿 예제**: https://resend.com/docs/examples
- **React Email**: https://react.email (이메일 템플릿 빌더)

## 지원

문제가 발생하면:
1. Resend Support: support@resend.com
2. Resend Discord: https://discord.gg/resend
3. 프로젝트 이슈: GitHub Issues

---

**작성일**: 2025-11-15
**작성자**: Claude Code
**Task ID**: P3BA24 (문의 관리 시스템)
