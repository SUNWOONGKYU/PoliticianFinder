# 📬 Inbox Server - 사용 가이드

Dashboard에서 작성한 작업 지시사항을 자동으로 `inbox/` 폴더에 저장하는 로컬 서버입니다.

## 🚀 빠른 시작

### 1. 서버 실행

```bash
cd Web_ClaudeCode_Bridge
node inbox_server.js
```

### 2. Dashboard 열기

브라우저에서 다음 파일을 엽니다:
```
C:\SSAL_Works\1_기획\1-2_UI_UX_Design\Mockup\dashboard-mockup.html
```

### 3. 작업 지시사항 작성 후 다운로드

1. Workspace 영역에 작업 내용 작성
2. "📥 Download to inbox/" 버튼 클릭
3. 자동으로 `Web_ClaudeCode_Bridge/inbox/` 폴더에 저장됨

---

## 📋 서버 정보

### 포트
- **3030** (http://localhost:3030)

### API 엔드포인트

#### 1. POST /save
작업 내용을 markdown 파일로 저장합니다.

**요청 예시:**
```javascript
fetch('http://localhost:3030/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        content: '# Task: 회원가입 API 구현\n\n...',
        filename: 'task_2025-11-17_15-30-00.md'  // 선택사항
    })
})
```

**응답 예시:**
```json
{
    "success": true,
    "filename": "task_2025-11-17_15-30-00.md",
    "path": "C:\\SSAL_Works\\Web_ClaudeCode_Bridge\\inbox\\task_2025-11-17_15-30-00.md",
    "message": "파일이 inbox/에 저장되었습니다."
}
```

#### 2. GET /files
inbox/ 폴더의 파일 목록을 조회합니다.

**요청:**
```
GET http://localhost:3030/files
```

**응답 예시:**
```json
{
    "success": true,
    "count": 5,
    "files": [
        {
            "filename": "task_2025-11-17_15-30-00.md",
            "size": 1234,
            "created": "2025-11-17T15:30:00.000Z",
            "modified": "2025-11-17T15:30:00.000Z"
        }
    ]
}
```

#### 3. GET /ping
서버 상태 확인 (Health Check)

**요청:**
```
GET http://localhost:3030/ping
```

**응답:**
```json
{
    "status": "ok",
    "message": "Inbox server is running"
}
```

---

## 🛠️ 설치 및 설정

### 필수 패키지 설치

서버를 처음 실행하기 전에 필요한 npm 패키지를 설치합니다:

```bash
cd Web_ClaudeCode_Bridge
npm install express cors
```

### 폴더 구조

```
Web_ClaudeCode_Bridge/
├── inbox/                    # 저장된 작업 파일들
│   ├── task_2025-11-17_15-30-00.md
│   └── ...
├── inbox_server.js          # 서버 코드
├── package.json
├── package-lock.json
└── README_INBOX_SERVER.md   # 이 파일
```

---

## 🔧 문제 해결

### 1. 서버가 실행되지 않아요
- Node.js가 설치되어 있는지 확인하세요: `node --version`
- 필수 패키지가 설치되어 있는지 확인하세요: `npm install express cors`
- 포트 3030이 이미 사용 중인지 확인하세요

### 2. Dashboard에서 저장이 안 돼요
- 서버가 실행 중인지 확인하세요 (콘솔에 "Inbox Server 실행 중" 메시지가 보여야 함)
- 브라우저 개발자 도구 Console 탭에서 에러 메시지를 확인하세요
- `http://localhost:3030/ping` 접속해서 서버 응답을 확인하세요

### 3. CORS 에러가 발생해요
- 서버 코드에 이미 CORS 설정이 포함되어 있습니다
- 브라우저 캐시를 삭제하고 다시 시도하세요

### 4. 파일명에 한글이 깨져요
- 서버는 UTF-8 인코딩을 사용합니다
- Windows 탐색기에서 정상적으로 표시되어야 합니다

---

## 📝 파일명 규칙

자동 생성되는 파일명 형식:
```
task_YYYY-MM-DD_HH-mm-ss.md
```

예시:
```
task_2025-11-17_15-30-45.md
task_2025-11-18_09-15-22.md
```

---

## 🔒 보안 참고사항

### 로컬 전용
이 서버는 **로컬 개발 전용**입니다. 외부에 노출하지 마세요.

### 포트 변경
필요시 `inbox_server.js`의 `PORT` 상수를 수정하세요:
```javascript
const PORT = 3030;  // 원하는 포트 번호로 변경
```

Dashboard의 fetch URL도 함께 변경해야 합니다:
```javascript
fetch('http://localhost:원하는포트/save', { ... })
```

---

## 🎯 사용 시나리오

### 시나리오 1: 새 작업 지시사항 작성
1. Dashboard에서 작업 내용 작성
2. "Download to inbox/" 클릭
3. 자동으로 inbox/에 저장됨
4. Claude Code가 inbox를 자동으로 확인하고 작업 시작

### 시나리오 2: 서버 없이 사용 (Fallback)
1. Dashboard에서 작업 내용 작성
2. "Download to inbox/" 클릭
3. 서버가 없으면 자동으로 수동 다운로드 모드로 전환
4. 파일 다운로드 후 수동으로 inbox/ 폴더로 이동

---

## 📌 추가 정보

### 서버 자동 시작 (Windows)
서버를 항상 실행하려면 시작 프로그램에 등록하거나 `pm2`를 사용하세요:

```bash
npm install -g pm2
pm2 start inbox_server.js --name inbox-server
pm2 save
```

### 로그 확인
서버 실행 중 모든 저장 작업이 콘솔에 표시됩니다:
```
✅ 파일 저장 완료: task_2025-11-17_15-30-00.md
```

---

## ✅ 체크리스트

서버 사용 전 확인사항:
- [ ] Node.js 설치 완료
- [ ] npm 패키지 설치 완료 (`express`, `cors`)
- [ ] 서버 실행 (`node inbox_server.js`)
- [ ] 서버 응답 확인 (`http://localhost:3030/ping`)
- [ ] Dashboard에서 테스트 저장 성공

---

**문제가 계속되면 콘솔 에러 메시지를 확인하세요!**
