# 프로덕션 환경 설정 (즉시 적용)

프로덕션 URL: **https://politician-finder.vercel.app**

---

## 🚨 즉시 설정해야 할 사항

### 1. Supabase 설정 (가장 중요!)

**URL**: https://supabase.com/dashboard/project/ooddlafwdpzgxfefgsrx
**경로**: Authentication > URL Configuration

#### Site URL
```
https://politician-finder.vercel.app
```

#### Redirect URLs (Add URL 버튼으로 2개 모두 추가)
```
http://localhost:3000/auth/callback
https://politician-finder.vercel.app/auth/callback
```

**✅ Save 버튼 클릭**

---

### 2. Vercel 환경 변수 확인

**URL**: https://vercel.com/dashboard
**경로**: 프로젝트 선택 > Settings > Environment Variables

다음 환경 변수가 설정되어 있는지 확인:

```env
NEXT_PUBLIC_SITE_URL=https://politician-finder.vercel.app
NEXT_PUBLIC_API_URL=https://politician-finder.vercel.app/api
```

**만약 설정되어 있지 않다면**:
1. Add New 버튼 클릭
2. 위의 환경 변수 추가
3. Environment: Production, Preview, Development 모두 선택
4. Save
5. Deployments 탭 > 최신 배포 > Redeploy 클릭

---

## 📋 현재 코드는 이미 준비됨

### ✅ 회원가입 API (`src/app/api/auth/signup/route.ts`)
```typescript
emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
```

**작동 방식**:
- 로컬: `http://localhost:3000/auth/callback`
- 프로덕션: `https://politician-finder.vercel.app/auth/callback`

### ✅ 콜백 핸들러 (`src/app/auth/callback/route.ts`)
이미 구현되어 있음 - 이메일 인증 처리

### ✅ 로그인 API (`src/app/api/auth/login/route.ts`)
미인증 사용자 차단 구현됨

---

## 🧪 테스트 시나리오

### 프로덕션 환경에서 테스트

1. **회원가입**
   - URL: https://politician-finder.vercel.app/auth/signup
   - 새로운 이메일로 회원가입
   - 성공 시 → 로그인 페이지로 리다이렉트
   - 메시지: "회원가입이 완료되었습니다. 이메일 인증을 완료해 주세요."

2. **이메일 확인**
   - 가입한 이메일 확인
   - "Confirm your email" 메일 수신
   - "이메일 확인하기" 버튼 클릭
   - → `https://politician-finder.vercel.app/auth/callback?code=...` 로 이동
   - → 인증 성공 시 로그인 페이지로 리다이렉트
   - 메시지: "이메일 인증이 완료되었습니다! 로그인해주세요."

3. **미인증 상태로 로그인 시도**
   - URL: https://politician-finder.vercel.app/auth/login
   - 미인증 계정으로 로그인 시도
   - 에러 메시지: "이메일 인증이 필요합니다. 가입하신 이메일에서 인증 링크를 클릭해 주세요."

4. **인증 완료 후 로그인**
   - 이메일 인증 완료
   - 로그인 성공
   - → 홈페이지로 이동

---

## 🔧 로컬 개발 환경

로컬은 그대로 사용하시면 됩니다:
- `.env.local`: `http://localhost:3000`
- Supabase Redirect URLs에 이미 `http://localhost:3000/auth/callback` 추가됨

---

## ⚠️ 트러블슈팅

### 문제: 이메일 인증 링크 클릭 시 여전히 404
**원인**: Supabase Redirect URLs에 프로덕션 URL이 없음
**해결**: 위의 Supabase 설정 확인

### 문제: 이메일 링크가 localhost로 연결됨
**원인**: Supabase Site URL이 localhost로 설정됨
**해결**: Site URL을 `https://politician-finder.vercel.app`로 변경

### 문제: Vercel 환경 변수 변경 후 적용 안됨
**원인**: 재배포 필요
**해결**: Deployments > Redeploy

---

## ✅ 설정 완료 체크리스트

설정 후 체크:

- [ ] Supabase Site URL: `https://politician-finder.vercel.app`
- [ ] Supabase Redirect URLs에 프로덕션 URL 추가
- [ ] Supabase Redirect URLs에 localhost URL 추가
- [ ] Vercel 환경 변수 확인 (NEXT_PUBLIC_SITE_URL)
- [ ] 프로덕션에서 회원가입 테스트
- [ ] 이메일 인증 링크 클릭 테스트
- [ ] 미인증 사용자 로그인 차단 테스트
- [ ] 인증 완료 후 로그인 테스트

---

## 🎯 요약

**지금 당장 해야 할 일**:

1. **Supabase Dashboard 접속**
   - https://supabase.com/dashboard/project/ooddlafwdpzgxfefgsrx

2. **Authentication > URL Configuration 이동**

3. **Site URL 설정**:
   ```
   https://politician-finder.vercel.app
   ```

4. **Redirect URLs 추가** (2개):
   ```
   http://localhost:3000/auth/callback
   https://politician-finder.vercel.app/auth/callback
   ```

5. **Save** 클릭

이것만 하면 프로덕션에서 이메일 인증이 정상 작동합니다!

**코드 변경은 필요 없습니다** - 이미 환경 변수를 사용하도록 구현되어 있습니다.
