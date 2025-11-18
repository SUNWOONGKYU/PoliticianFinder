// inbox_watcher.js - inbox 폴더 감시 및 자동 알림

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const INBOX_DIR = path.join(__dirname, 'inbox');
const CHECK_INTERVAL = 5000; // 5초마다 체크

console.log(`
╔══════════════════════════════════════════════╗
║                                              ║
║   👁️  Inbox Watcher 실행 중                  ║
║                                              ║
║   감시 폴더: ${INBOX_DIR}
║   체크 주기: ${CHECK_INTERVAL}ms (5초)        ║
║                                              ║
╚══════════════════════════════════════════════╝
`);

let lastFiles = new Set();

// 초기 파일 목록 로드
function getInboxFiles() {
    try {
        if (!fs.existsSync(INBOX_DIR)) {
            fs.mkdirSync(INBOX_DIR, { recursive: true });
            return [];
        }

        return fs.readdirSync(INBOX_DIR)
            .filter(file => file.endsWith('.md') || file.endsWith('.json'))
            .map(file => path.join(INBOX_DIR, file));
    } catch (error) {
        console.error('❌ 파일 목록 조회 실패:', error);
        return [];
    }
}

// 초기화
const initialFiles = getInboxFiles();
initialFiles.forEach(file => lastFiles.add(file));
console.log(`📁 초기 파일 ${lastFiles.size}개 감지됨`);

// 파일 감시
setInterval(() => {
    const currentFiles = new Set(getInboxFiles());

    // 새 파일 찾기
    const newFiles = [...currentFiles].filter(file => !lastFiles.has(file));

    if (newFiles.length > 0) {
        console.log(`\n🆕 새 파일 감지됨!`);
        newFiles.forEach(file => {
            const filename = path.basename(file);
            console.log(`   📄 ${filename}`);

            // 파일 내용 미리보기
            try {
                const content = fs.readFileSync(file, 'utf8');
                const preview = content.split('\n').slice(0, 3).join('\n');
                console.log(`   ───────────────────────────────────────`);
                console.log(preview);
                console.log(`   ───────────────────────────────────────\n`);
            } catch (error) {
                console.error(`   ❌ 파일 읽기 실패:`, error.message);
            }
        });

        console.log(`\n💡 Claude Code에게 알림:`);
        console.log(`   새로운 작업이 inbox/에 도착했습니다!`);
        console.log(`   다음 파일들을 확인하세요:`);
        newFiles.forEach(file => {
            console.log(`   - ${path.basename(file)}`);
        });
        console.log(`\n`);

        // Windows 알림 (선택사항)
        if (process.platform === 'win32') {
            const message = `inbox/에 새 파일 ${newFiles.length}개 도착!`;
            exec(`msg %username% "${message}"`, (error) => {
                if (error) {
                    // 조용히 무시 (msg 명령이 실패할 수 있음)
                }
            });
        }
    }

    lastFiles = currentFiles;
}, CHECK_INTERVAL);

// 종료 처리
process.on('SIGINT', () => {
    console.log('\n\n👋 Inbox Watcher 종료됨\n');
    process.exit(0);
});
