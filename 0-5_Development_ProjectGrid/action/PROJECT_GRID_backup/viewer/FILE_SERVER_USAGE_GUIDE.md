# 📁 File Server 사용 가이드

## 개요
`file_server.js`는 Project Grid 웹 뷰어와 로컬 파일 시스템을 연결하는 Node.js HTTP 서버입니다. 생성 파일("열기" 버튼)을 Windows 탐색기에서 열거나 조회할 수 있습니다.

---

## 🚀 빠른 시작

### 1단계: 터미널 열기
```powershell
# Windows PowerShell 또는 cmd 열기
```

### 2단계: 디렉토리 이동
```bash
cd C:\Development_PoliticianFinder_copy\Developement_Real_PoliticianFinder\0-5_Development_ProjectGrid\action\PROJECT_GRID\viewer
```

### 3단계: 서버 시작
```bash
node file_server.js
```

### 4단계: 웹 뷰어 접속
브라우저에서 다음 주소 접속:
```
http://localhost:3000
```

---

## ✅ 서버 실행 확인

서버가 정상적으로 시작되면 다음과 같이 표시됩니다:

```
📂 프로젝트 루트: C:\Development_PoliticianFinder_copy\Developement_Real_PoliticianFinder
🚀 파일 서버 시작: http://localhost:3000
✅ 서버 실행 중: http://localhost:3000
❌ 종료: Ctrl+C
```

---

## 📖 사용 방법

### 웹 뷰어에서 파일 열기

1. **PROJECT GRID 웹 뷰어** (`http://localhost:3000`) 접속
2. 각 Task Card에서 **📦 생성파일** 섹션 확인
3. 파일 옆의 **"열기"** 버튼 클릭
4. 확인 대화창에서 **[확인]** 선택
5. Windows 탐색기가 자동으로 열리고 파일이 강조됨

### 경로 복사하기

1. 파일 옆의 **"열기"** 버튼 클릭
2. 확인 대화창에서 **[취소]** 선택
3. 파일의 전체 경로가 클립보드에 복사됨

---

## 🔧 서버 기능

### 1. 파일 탐색기 통합 (`/api/open-file`)

**요청:**
```javascript
POST /api/open-file
Content-Type: application/json

{
  "path": "C:\\Development_PoliticianFinder_copy\\Developement_Real_PoliticianFinder\\1_Frontend\\src\\app\\layout.tsx"
}
```

**응답:**
```json
{
  "success": true
}
```

**동작:**
- **Windows**: `explorer /select, "<파일경로>"` 실행
  - Windows 탐색기 열림
  - 해당 파일 자동 강조
- **macOS**: `open -R "<파일경로>"` 실행
  - Finder 열림
  - 해당 파일 자동 선택
- **Linux**: `xdg-open "<디렉토리경로>"` 실행
  - 파일 매니저 열림
  - 해당 디렉토리 표시

### 2. 파일 콘텐츠 제공 (`/files/`)

**요청:**
```
GET /files/1_Frontend/src/app/layout.tsx
```

**응답:**
- 파일 콘텐츠 (UTF-8 텍스트)
- Content-Type: `text/plain; charset=utf-8`

**보안:**
- 프로젝트 루트 이외의 파일 접근 차단
- 경로 순회(Path Traversal) 공격 방지

### 3. 정적 파일 서빙

**홈페이지 (`/`):**
- `project_grid_최종통합뷰어_v4_with_gate.html` 제공

**기타 정적 파일:**
- CSS, JavaScript, JSON 등 자동 MIME 타입 설정

---

## ⚠️ 서버가 실행 중이 아닌 경우

웹 뷰어에 다음 배너가 표시됩니다:

```
⚠️ 📂 생성 파일을 열려면 file_server.js가 실행 중이어야 합니다

터미널에서 다음 명령을 실행하세요:
  cd C:\Development_PoliticianFinder_copy\Developement_Real_PoliticianFinder\0-5_Development_ProjectGrid\action\PROJECT_GRID\viewer
  node file_server.js

[🔄 다시 확인] 버튼 클릭하여 서버 상태 재확인
```

---

## 🐛 문제 해결

### 문제: "파일을 열 수 없습니다" 오류

**원인:** 서버가 실행 중이 아님

**해결:**
1. 새 터미널 창 열기
2. 위의 "빠른 시작" 섹션 참조
3. 웹 뷰어에서 **[🔄 다시 확인]** 클릭

### 문제: "포트 3000이 이미 사용 중" 오류

**원인:** 이미 다른 프로세스가 포트 3000을 사용 중

**해결 방법 1: 기존 프로세스 중단**
```bash
# Windows PowerShell (관리자 권한)
Get-Process -Name node | Stop-Process -Force

# 또는 cmd
taskkill /IM node.exe /F
```

**해결 방법 2: 다른 포트 사용**
```bash
# file_server.js 수정 (line 17)
const PORT = 3001;  # 3000 대신 3001 사용
```

### 문제: 클립보드 복사 실패

**해결:** 브라우저 콘솔에 표시되는 전체 경로를 수동으로 복사

---

## 📋 웹 뷰어 상태 배너

웹 뷰어는 자동으로 file_server.js 상태를 감지합니다:

### ✅ 서버 실행 중
- 배너 **숨김** (정상)
- "열기" 버튼 정상 작동
- 콘솔에 `✅ file_server.js가 실행 중입니다` 출력

### ❌ 서버 실행 중이 아님
- 배너 **표시** (주황색 경고)
- "열기" 버튼 클릭 시 오류 알림
- 설정 명령 안내 표시
- **[🔄 다시 확인]** 버튼으로 재확인 가능

---

## 🔐 보안 고려사항

### CORS 설정
- 모든 출처에서 요청 허용 (`Access-Control-Allow-Origin: *`)
- 개발 환경 전용 (프로덕션에서는 제한 권장)

### 경로 검증
- 프로젝트 루트 이외의 파일 접근 차단
- 경로 순회 공격 방지
- 상대 경로 정규화

### 사용 가능한 작업
- **파일 읽기**: `/files/{상대경로}` GET 요청
- **파일 열기**: `/api/open-file` POST 요청
- **쓰기 작업**: 미지원 (읽기 전용)

---

## 📝 API 응답 예제

### 성공 응답
```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true
}
```

### 오류 응답

**접근 거부 (403):**
```json
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "error": "접근 거부"
}
```

**파일 없음 (404):**
```json
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "error": "파일을 찾을 수 없습니다"
}
```

---

## 🎯 워크플로우 예제

### 예1: TypeScript 파일 편집

1. PROJECT GRID 웹 뷰어에서 Task 검색
   - 예: `P1BA1` (회원가입 API)

2. 생성파일 섹션에서 "열기" 클릭
   - 파일: `3_Backend_APIs/auth/P1BA1_signup.ts`

3. Windows 탐색기에서 파일 위치 확인

4. VS Code 또는 에디터에서 파일 열기 및 편집

5. 웹 뷰어에서 Task 상태 업데이트

### 예2: 여러 파일 한번에 보기

1. Task Card의 생성파일 목록 확인
   - 일반적으로 Backend API + Frontend 컴포넌트

2. 각 파일별로 "열기" 버튼 클릭
   - 서로 다른 탐색기 창에서 열림
   - 관련 파일들 한눈에 비교 가능

---

## 📞 추가 정보

### 관련 파일
- **웹 뷰어**: `project_grid_최종통합뷰어_v4_with_gate.html`
- **서버**: `file_server.js`
- **프로젝트 데이터**: `embedded_data_temp.js`

### 포트 정보
- 기본 포트: **3000**
- 수정 위치: `file_server.js` line 17
- 변경 후 웹 뷰어에서 해당 포트로 접속

### 프로젝트 루트
```
C:\Development_PoliticianFinder_copy\Developement_Real_PoliticianFinder\
  ├─ 1_Frontend\
  ├─ 2_Mobile_Frontend\
  ├─ 3_Backend_APIs\
  ├─ 4_Database_Schema\
  ├─ 5_DevOps_Infra\
  ├─ 6_Testing\
  ├─ 7_Documentation\
  └─ 0-5_Development_ProjectGrid\
      └─ action\PROJECT_GRID\viewer\
          ├─ file_server.js ◄─── 이 파일
          ├─ project_grid_최종통합뷰어_v4_with_gate.html
          └─ embedded_data_temp.js
```

---

## ✅ 체크리스트

웹 뷰어 사용 전 확인:

- [ ] Node.js 설치 확인 (`node --version`)
- [ ] file_server.js 파일 존재 확인
- [ ] 터미널에서 서버 실행
- [ ] 브라우저에서 `http://localhost:3000` 접속
- [ ] 배너에서 ✅ 또는 ⚠️ 표시 확인
- [ ] 샘플 파일 "열기" 버튼 테스트

---

**최종 업데이트**: 2025-11-03
**버전**: v1.0
**상태**: ✅ 정상 작동 중
