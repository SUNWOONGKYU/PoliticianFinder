# 📬 Inbox Watcher - 자동 감시 시스템

inbox 폴더에 새 파일이 도착하면 자동으로 감지하고 알림을 보냅니다.

## 🚀 실행 방법

```bash
cd Web_ClaudeCode_Bridge
node inbox_watcher.js
```

## 💡 작동 방식

1. **5초마다** inbox/ 폴더를 자동으로 체크
2. 새 파일 감지 시:
   - 콘솔에 파일명과 미리보기 출력
   - Claude Code에게 작업 알림
3. 백그라운드에서 계속 실행

## 📋 출력 예시

```
╔══════════════════════════════════════════════╗
║   👁️  Inbox Watcher 실행 중                  ║
║   감시 폴더: C:\...\inbox                    ║
║   체크 주기: 5000ms (5초)                    ║
╚══════════════════════════════════════════════╝

📁 초기 파일 0개 감지됨

🆕 새 파일 감지됨!
   📄 order_2025-11-17_15-30-00.md
   ───────────────────────────────────────
   # Order: 회원가입 API 구현

   ## 요구사항
   ───────────────────────────────────────

💡 Claude Code에게 알림:
   새로운 작업이 inbox/에 도착했습니다!
   다음 파일들을 확인하세요:
   - order_2025-11-17_15-30-00.md
```

## 🔧 함께 실행하기

**옵션 1: 두 개의 터미널**
```bash
# 터미널 1
cd Web_ClaudeCode_Bridge
node inbox_server.js

# 터미널 2
cd Web_ClaudeCode_Bridge
node inbox_watcher.js
```

**옵션 2: 하나의 통합 스크립트** (추천)
→ `start_all.bat` 사용 (아래 참고)

## ⚙️ 설정

`inbox_watcher.js` 파일에서 체크 주기 변경 가능:

```javascript
const CHECK_INTERVAL = 5000; // 5초 (기본값)
// const CHECK_INTERVAL = 3000; // 3초 (더 빠르게)
// const CHECK_INTERVAL = 10000; // 10초 (느리게)
```

## ⏹️ 종료

`Ctrl+C` 눌러서 종료
