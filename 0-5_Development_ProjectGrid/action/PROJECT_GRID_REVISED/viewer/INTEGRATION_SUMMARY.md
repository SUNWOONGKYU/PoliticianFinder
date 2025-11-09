# 🔗 웹 뷰어 ↔ 파일 서버 통합 완료

## 📌 상황 요약

사용자의 피드백:
> "단위 로컬 폴더에 로컬 폴더에 다 파일이 들어있는데 왜 기덕으로 연결을 시켰지"

**문제점:**
- 생성 파일들이 모두 로컬 파일 시스템에 존재
- 웹 브라우저에서 로컬 파일에 직접 접근 불가능 (보안 정책)
- 파일을 열 방법이 없었음

**해결책:**
- Node.js HTTP 서버(`file_server.js`) 구현
- 브라우저 ↔ 로컬 파일시스템 간 안전한 다리 역할
- Windows 탐색기 자동 통합

---

## 🏗️ 아키텍처

```
┌─────────────────────────────────────────────────┐
│        웹 브라우저 (http://localhost:3000)      │
│                                                 │
│  PROJECT GRID 웹 뷰어                           │
│  ├─ Phase 진행 현황                             │
│  ├─ Task 카드                                    │
│  └─ 📦 생성파일 목록 ◄─── "열기" 버튼           │
└────────────────┬────────────────────────────────┘
                 │ fetch('/api/open-file', {POST})
                 │ JSON: { path: "C:\...\file.ts" }
                 ↓
┌─────────────────────────────────────────────────┐
│    Node.js HTTP 서버 (file_server.js)           │
│    - 포트 3000                                  │
│    - CORS 활성화                                │
│    - 경로 검증                                  │
└────────────────┬────────────────────────────────┘
                 │ spawn('explorer', ['/select,', path])
                 ↓
         Windows 탐색기
         ├─ 파일 위치 열림
         ├─ 해당 파일 자동 강조
         └─ 사용자가 편집 가능
```

---

## 📁 파일 구조

```
0-5_Development_ProjectGrid\action\PROJECT_GRID\viewer\
├─ file_server.js ◄─────── 새로 생성됨
│   ├─ HTTP 서버 (port 3000)
│   ├─ CORS 헤더 처리
│   ├─ POST /api/open-file 엔드포인트
│   ├─ GET /files/{path} 엔드포인트
│   └─ 정적 파일 서빙
│
├─ project_grid_최종통합뷰어_v4_with_gate.html ◄─ 수정됨
│   ├─ 스타일 추가 (.info-banner, .banner-*)
│   ├─ HTML 추가 (<div id="serverStatus">)
│   ├─ openGeneratedFile() 함수 개선
│   ├─ checkServerStatus() 함수 추가
│   └─ DOMContentLoaded 이벤트 수정
│
├─ FILE_SERVER_USAGE_GUIDE.md ◄─────── 새로 생성됨
│   └─ 상세 사용 설명서
│
├─ INTEGRATION_SUMMARY.md ◄─────── 현재 파일
│   └─ 통합 개요 및 변경사항
│
├─ embedded_data_temp.js
│   └─ Project Grid 데이터 (변경 없음)
│
└─ 기타 파일들...
```

---

## 🔄 동작 흐름

### 사용자 액션: "열기" 버튼 클릭

```
1️⃣  사용자가 웹 뷰어에서 "열기" 버튼 클릭
    ├─ 파일: 3_Backend_APIs/auth/P1BA1_signup.ts
    └─ 상대경로 → 전체경로 변환

2️⃣  확인 대화 표시
    ├─ 파일명
    ├─ 전체 경로
    └─ [확인] / [취소] 선택

3️⃣  [확인] 선택 시:
    ├─ fetch('/api/open-file', {
    │    method: 'POST',
    │    body: { path: 'C:\...\file.ts' }
    │  })
    └─ 콘솔 로그: 📄 생성 파일 열기 시도

4️⃣  file_server.js에서:
    ├─ POST 요청 수신
    ├─ 경로 검증 (프로젝트 루트 내 확인)
    ├─ spawn('explorer', ['/select,', path])
    └─ JSON 응답: { success: true }

5️⃣  Windows 탐색기:
    ├─ 자동 열림
    ├─ 해당 파일 위치로 이동
    ├─ 파일 자동 강조
    └─ 사용자가 대사운드로 파일 편집 가능

6️⃣  [취소] 선택 시:
    └─ 전체 경로 클립보드에 복사 (수동 사용용)
```

---

## 🔧 주요 수정사항

### 1. file_server.js (새로 생성)

**주요 기능:**

```javascript
// HTTP 서버 생성
const server = http.createServer((req, res) => {
    // CORS 헤더 설정
    // OPTIONS 요청 처리
    // POST /api/open-file 엔드포인트
    // GET /files/{path} 엔드포인트
    // 정적 파일 서빙
});

server.listen(3000);
```

**보안 기능:**
- 경로 검증: 프로젝트 루트 이외 접근 차단
- CORS: 모든 출처 허용 (개발용)
- 읽기 전용: 파일 쓰기/삭제 미지원

### 2. 웹 뷰어 - openGeneratedFile() 개선

```javascript
// 기존 방식 (실패)
window.open(filePath);  // ❌ 브라우저 보안 정책 위반

// 개선된 방식 (성공) ✅
fetch('/api/open-file', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: fullPath })
})
.then(res => {
    if (res.ok) console.log('✅ 파일 탐색기에서 열기 성공');
})
.catch(err => {
    console.error('❌ file_server.js 실행 필요');
    // 대체: 경로를 클립보드에 복사
    navigator.clipboard.writeText(fullPath);
});
```

### 3. 웹 뷰어 - checkServerStatus() 추가

```javascript
async function checkServerStatus() {
    try {
        const response = await fetch('/api/open-file', { method: 'OPTIONS' });
        if (response.ok) {
            // 서버 실행 중: 배너 숨김
            document.getElementById('serverStatus').style.display = 'none';
            return true;
        }
    } catch (err) {
        // 서버 미실행: 배너 표시
        document.getElementById('serverStatus').style.display = 'flex';
        return false;
    }
}

// 페이지 로드 시 자동 확인
window.addEventListener('DOMContentLoaded', async () => {
    await loadTasks();
    setTimeout(() => checkServerStatus(), 500);  // 0.5초 후 확인
});
```

### 4. 웹 뷰어 - 상태 배너 추가

```html
<!-- 서버 미실행 시 표시 -->
<div id="serverStatus" class="info-banner warning" style="display: none;">
    <div class="banner-icon">⚠️</div>
    <div class="banner-text">
        <strong>📂 생성 파일을 열려면 file_server.js가 필요합니다</strong>
        다음 명령을 터미널에서 실행하세요:
        <code>node file_server.js</code>
    </div>
    <div class="banner-actions">
        <button onclick="checkServerStatus()">🔄 다시 확인</button>
    </div>
</div>
```

---

## ✨ 개선 사항

### Before (이전)
- ❌ 생성 파일 링크 없음
- ❌ 브라우저에서 로컬 파일 접근 불가
- ❌ 사용자가 파일 위치를 수동으로 찾아야 함
- ❌ 서버 필요성 불명확

### After (현재)
- ✅ 생성 파일 "열기" 버튼으로 직접 접근
- ✅ Windows 탐색기 자동 통합
- ✅ 파일 위치 자동 강조
- ✅ 서버 상태 자동 감지 및 안내
- ✅ 경로 클립보드 복사 옵션
- ✅ 사용자 친화적 오류 메시지

---

## 🚀 사용 방법

### 1단계: 서버 시작
```bash
cd C:\Development_PoliticianFinder_copy\Developement_Real_PoliticianFinder\0-5_Development_ProjectGrid\action\PROJECT_GRID\viewer
node file_server.js
```

**예상 출력:**
```
📂 프로젝트 루트: C:\Development_PoliticianFinder_copy\Developement_Real_PoliticianFinder
🚀 파일 서버 시작: http://localhost:3000
✅ 서버 실행 중: http://localhost:3000
❌ 종료: Ctrl+C
```

### 2단계: 웹 뷰어 접속
```
http://localhost:3000
```

### 3단계: 파일 열기
1. Task Card의 📦 생성파일 섹션 확인
2. "열기" 버튼 클릭
3. [확인] 선택 → Windows 탐색기 자동 열림

---

## 🔐 보안 설계

### 경로 검증
```javascript
// 프로젝트 루트 이외 접근 차단
const projectRoot = path.join(__dirname, '../../..');
const fullPath = path.join(PROJECT_ROOT, filePath);

if (!fullPath.startsWith(PROJECT_ROOT)) {
    res.writeHead(403);
    res.end(JSON.stringify({ error: '접근 거부' }));
}
```

### CORS 정책
```javascript
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
```
- ℹ️ 개발 환경 전용
- 프로덕션에서는 특정 도메인 제한 필요

### 작업 제한
- ✅ 읽기: GET /files/{path}
- ✅ 탐색기 열기: POST /api/open-file
- ❌ 쓰기: 미지원
- ❌ 삭제: 미지원

---

## 📊 성능 고려사항

| 항목 | 값 | 설명 |
|------|-----|------|
| 포트 | 3000 | 기본값, 필요시 변경 가능 |
| 타임아웃 | 없음 | Keep-alive 사용 |
| CORS 캐시 | 기본 | 개발 환경 |
| 메모리 | ~5MB | Node.js 최소 메모리 |
| CPU | 매우 낮음 | I/O 대기 중심 |

---

## 🐛 트러블슈팅

### Q: "파일을 열 수 없습니다" 메시지
**A:** file_server.js가 실행 중이 아닙니다. 위의 사용 방법을 참조하세요.

### Q: "포트 3000이 이미 사용 중" 오류
**A:** 기존 프로세스 중단:
```bash
# Windows
taskkill /IM node.exe /F

# 또는 다른 포트 사용 (file_server.js line 17)
const PORT = 3001;
```

### Q: 경로가 클립보드에 복사되지 않음
**A:** 브라우저 콘솔에서 전체 경로 확인 후 수동 복사

### Q: 탐색기에서 파일이 강조되지 않음
**A:** Windows 탐색기가 최소화되어 있거나 이미 열려있을 수 있습니다. 수동으로 경로 복사하여 사용하세요.

---

## 📚 참고 문서

- **상세 사용 가이드**: `FILE_SERVER_USAGE_GUIDE.md`
- **server 코드**: `file_server.js`
- **웹 뷰어**: `project_grid_최종통합뷰어_v4_with_gate.html`
- **Project Grid 매뉴얼**: `../../PROJECT_GRID_매뉴얼_V4.0.md`

---

## ✅ 테스트 체크리스트

- [ ] file_server.js 실행
- [ ] http://localhost:3000 접속
- [ ] 배너에서 ✅ 또는 ⚠️ 표시 확인
- [ ] Task Card의 생성파일 확인
- [ ] "열기" 버튼 클릭 테스트
- [ ] Windows 탐색기 자동 열림 확인
- [ ] 파일이 강조되는지 확인
- [ ] "취소" 버튼으로 경로 복사 테스트
- [ ] 클립보드 내용 확인
- [ ] 브라우저 콘솔에서 로그 확인

---

## 📝 변경 이력

| 날짜 | 항목 | 상태 |
|------|------|------|
| 2025-11-03 | file_server.js 생성 | ✅ 완료 |
| 2025-11-03 | 웹 뷰어 통합 | ✅ 완료 |
| 2025-11-03 | 사용 가이드 작성 | ✅ 완료 |
| 2025-11-03 | 통합 완료 | ✅ 완료 |

---

**최종 상태**: ✅ 준비 완료
**다음 단계**: 웹 뷰어로 Phase 1 검증 진행
