# Supabase 프로젝트 생성 가이드

## 📋 개요
PoliticianFinder 프로젝트를 위한 Supabase 프로젝트 생성 및 초기 설정 가이드입니다.

---

## 1단계: Supabase 계정 생성 및 로그인

### 1-1. Supabase 웹사이트 접속
- 브라우저에서 **https://supabase.com** 접속

### 1-2. 계정 생성 또는 로그인
**방법 1: GitHub 계정으로 로그인 (추천)**
1. "Start your project" 버튼 클릭
2. "Continue with GitHub" 선택
3. GitHub 계정으로 로그인
4. Supabase의 GitHub 앱 접근 권한 승인

**방법 2: 이메일로 가입**
1. "Sign Up" 클릭
2. 이메일 주소와 비밀번호 입력
3. 이메일 인증 완료

---

## 2단계: 새 프로젝트 생성

### 2-1. 대시보드 접속
- 로그인 후 자동으로 대시보드로 이동
- 처음 사용하는 경우 Organization 생성 화면이 나올 수 있음
  - Organization Name: `PoliticianFinder` 또는 본인 이름
  - "Create organization" 클릭

### 2-2. 새 프로젝트 생성
1. **"New Project"** 버튼 클릭 (녹색 버튼)

2. **프로젝트 정보 입력**:

   **Name (프로젝트 이름)**
   ```
   politician-finder
   ```
   - 소문자, 하이픈(-) 사용 가능
   - 공백이나 특수문자 사용 불가

   **Database Password (데이터베이스 비밀번호)**
   ```
   [강력한 비밀번호 생성]
   ```
   - "Generate a password" 버튼 클릭 (추천)
   - 생성된 비밀번호를 **반드시 안전한 곳에 저장**
   - 예: 1Password, LastPass, 메모장 등
   - ⚠️ **매우 중요**: 이 비밀번호는 나중에 복구 불가능!

   **Region (지역)**
   ```
   Northeast Asia (Seoul)
   ```
   - 한국에서 가장 가까운 서버
   - 낮은 지연시간(latency)을 위해 Seoul 선택 권장
   - 다른 옵션: Tokyo, Singapore

   **Pricing Plan (요금제)**
   ```
   Free (무료)
   ```
   - Free Tier 선택
   - 포함 사항:
     - 500MB 데이터베이스 용량
     - 1GB 파일 스토리지
     - 50,000 월간 활성 사용자
     - 무제한 API 요청
     - 소셜 로그인 (OAuth)

3. **"Create new project"** 버튼 클릭

4. **프로젝트 생성 대기**
   - 약 1~2분 소요
   - "Setting up project..." 메시지 표시
   - 완료되면 자동으로 프로젝트 대시보드로 이동

---

## 3단계: 프로젝트 정보 확인 및 복사

### 3-1. API Keys 확인
프로젝트 대시보드 좌측 메뉴에서:

1. **"Settings"** (톱니바퀴 아이콘) 클릭
2. **"API"** 메뉴 선택
3. 다음 정보를 확인하고 복사:

#### Project URL
```
https://xxxxxxxxxxxxx.supabase.co
```
- 형식: `https://[프로젝트ID].supabase.co`
- 예시: `https://abc123def456.supabase.co`

#### API Keys

**anon public (공개 키)**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4eHh4eHh4eCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjk5OTk5OTk5LCJleHAiOjIwMTU1NzU5OTl9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
- 매우 긴 문자열 (약 200자 이상)
- `eyJ`로 시작
- 프론트엔드에서 사용 (공개 가능)

**service_role secret (비밀 키) - ⚠️ 절대 공개 금지**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4eHh4eHh4eCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2OTk5OTk5OTksImV4cCI6MjAxNTU3NTk5OX0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
- Edge Functions나 관리자 작업에만 사용
- GitHub에 절대 업로드 금지

### 3-2. 정보 저장
다음 정보를 안전한 곳에 저장:

```
=== Supabase 프로젝트 정보 ===

프로젝트명: politician-finder
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (비밀)
Database Password: [생성한 강력한 비밀번호] (비밀)
Region: Northeast Asia (Seoul)
```

---

## 4단계: 프로젝트 생성 완료 확인

### 4-1. 대시보드 확인
좌측 메뉴에서 다음 항목들이 보이면 정상:
- 🏠 Home
- 📊 Table Editor
- 🔐 Authentication
- 📁 Storage
- ⚡ Edge Functions
- 📜 SQL Editor

### 4-2. 데이터베이스 연결 확인
1. **"Table Editor"** 클릭
2. 기본 테이블들이 보임:
   - `auth.users` (Supabase Auth 기본 테이블)
   - 기타 시스템 테이블

---

## 5단계: 다음 작업 안내

프로젝트 생성이 완료되었습니다! 이제 다음 작업을 진행합니다:

✅ **P1A1: Supabase 프로젝트 생성** - 완료!
⏭️ **P1A2: 환경 변수 설정** - 다음 단계
⏭️ **P1A3: Supabase Client 설치**
⏭️ **P1A4: Supabase Client 초기화**

---

## ⚠️ 중요 보안 사항

### 절대 공개하면 안 되는 정보:
1. ❌ Database Password
2. ❌ service_role secret key
3. ❌ Connection String (Direct)

### 공개 가능한 정보:
1. ✅ Project URL
2. ✅ anon public key (프론트엔드에서 사용)

### 환경변수 파일 (.env.local) 관리:
- `.gitignore`에 `.env.local` 추가 필수
- GitHub에 절대 업로드 금지
- 팀원과 공유 시 안전한 방법 사용 (1Password, 직접 전달 등)

---

## 🆘 문제 해결

### Q1: 프로젝트 생성이 실패했어요
**A**: 다시 시도하거나, 다른 프로젝트 이름을 사용하세요. 이미 사용 중인 이름일 수 있습니다.

### Q2: Database Password를 잊어버렸어요
**A**: 비밀번호는 복구 불가능합니다. 프로젝트를 삭제하고 새로 생성해야 합니다.
- Settings > General > "Delete Project"
- 새 프로젝트 생성 후 데이터 다시 입력

### Q3: Region을 잘못 선택했어요
**A**: Region은 생성 후 변경 불가능합니다. 새 프로젝트를 만들어야 합니다.

### Q4: Free Tier 제한이 궁금해요
**A**: Free Tier 제한:
- 500MB 데이터베이스
- 1GB 파일 스토리지
- 2GB 대역폭/월
- 초과 시 Pro Plan($25/월)으로 업그레이드 필요

---

## 📞 지원

- Supabase 공식 문서: https://supabase.com/docs
- Discord 커뮤니티: https://discord.supabase.com
- GitHub Issues: https://github.com/supabase/supabase/issues

---

**작성일**: 2024년 10월 16일
**작성자**: Claude
**프로젝트**: PoliticianFinder
