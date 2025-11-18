# 📬 Inbox Server 빠른 시작 가이드

Dashboard에서 작업 지시사항을 작성하면 자동으로 `inbox/` 폴더에 저장되는 로컬 서버입니다.

## 🚀 빠른 시작 (3단계)

### 1️⃣ 서버 실행
```bash
cd Web_ClaudeCode_Bridge
node inbox_server.js
```

**서버 시작 확인:**
```
╔══════════════════════════════════════════════╗
║   📬 Inbox Server 실행 중                     ║
║   포트: 3030                                 ║
╚══════════════════════════════════════════════╝
```

### 2️⃣ Dashboard 열기
브라우저에서 다음 파일을 엽니다:
```
C:\SSAL_Works\1_기획\1-2_UI_UX_Design\Mockup\dashboard-mockup.html
```

### 3️⃣ 작업 지시사항 작성 및 저장
1. Workspace 영역에 작업 내용 작성
2. "📥 Download to inbox/" 버튼 클릭
3. 자동으로 `Web_ClaudeCode_Bridge/inbox/` 폴더에 저장됨 ✅

---

## ✅ 검증 완료 (테스트 결과)

### 테스트 1: 서버 Health Check
```bash
$ curl http://localhost:3030/ping
{"status":"ok","message":"Inbox server is running"}
```
**결과:** ✅ 정상

### 테스트 2: 파일 저장 기능
```bash
$ curl -X POST http://localhost:3030/save \
  -H "Content-Type: application/json" \
  -d '{"content":"# Test\n\nContent","filename":"test.md"}'

{"success":true,"filename":"test.md","path":"...inbox/test.md"}
```
**결과:** ✅ 파일 정상 생성

### 테스트 3: 반복 저장 테스트
- 3회 연속 저장 테스트 실행
- 모든 파일이 정상적으로 inbox/ 폴더에 저장됨
**결과:** ✅ 안정성 확인

---

## 🎯 사용 시나리오

### 시나리오 1: 정상 작동 (서버 실행 중)
1. Dashboard에서 작업 내용 작성
2. "Download to inbox/" 버튼 클릭
3. 🟢 서버 연결 → 자동 저장
4. ✅ "inbox/에 저장 완료!" 메시지 표시
5. Claude Code가 inbox를 확인하고 작업 시작

### 시나리오 2: 서버 미실행 (Fallback)
1. Dashboard에서 작업 내용 작성
2. "Download to inbox/" 버튼 클릭
3. 🔴 서버 미실행 감지
4. ❌ 서버 실행 안내 메시지 표시
5. 사용자가 "확인" 클릭 → 수동 다운로드로 전환
6. 파일 다운로드 후 수동으로 inbox/ 폴더로 이동

---

## 🛠️ 파일 구조

```
Web_ClaudeCode_Bridge/
├── inbox/                    # 저장된 작업 파일들
│   ├── task_2025-11-17_15-30-00.md
│   └── task_2025-11-17_16-45-12.md
├── inbox_server.js          # 서버 코드
├── package.json
├── package-lock.json
├── README_INBOX_SERVER.md   # 상세 문서
└── START_INBOX_SERVER.md    # 이 파일 (빠른 시작)
```

---

## 📋 체크리스트

서버 사용 전 확인:
- [x] Node.js 설치 완료
- [x] npm 패키지 설치 완료 (`express`, `cors`)
- [x] 서버 실행 (`node inbox_server.js`)
- [x] 서버 응답 확인 (`http://localhost:3030/ping`)
- [x] Dashboard에서 테스트 저장 성공

---

## 🔧 문제 해결

### Q1: 서버가 실행되지 않아요
**확인사항:**
- Node.js 설치 여부: `node --version`
- 패키지 설치: `npm install express cors`
- 포트 3030 사용 여부 확인

### Q2: Dashboard에서 저장이 안 돼요
**확인사항:**
1. 서버가 실행 중인지 확인 (콘솔 메시지 확인)
2. 브라우저에서 `http://localhost:3030/ping` 접속 테스트
3. 브라우저 개발자 도구 Console 탭에서 에러 확인

### Q3: 페이지 로드 시 상태 표시는?
- 🟢 "Inbox 서버 연결됨" → 정상 작동
- 🔴 "Inbox 서버 미실행" → 서버를 실행하세요

---

## 🎉 완료!

이제 Dashboard에서 작업 지시사항을 작성하면 자동으로 inbox/에 저장됩니다!

**다음 단계:**
1. 서버를 백그라운드로 실행 (선택사항)
2. Claude Code가 자동으로 inbox 확인
3. 작업 자동 시작

**자세한 문서:** `README_INBOX_SERVER.md` 참고
