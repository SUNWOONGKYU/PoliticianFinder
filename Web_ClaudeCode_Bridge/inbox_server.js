// inbox_server.js - Dashboard에서 작성한 내용을 자동으로 inbox/에 저장하는 로컬 서버

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const https = require('https');

const app = express();
const PORT = 3030;

// CORS 설정 (모든 출처 허용)
app.use(cors());

// JSON 요청 본문 파싱
app.use(express.json({ limit: '10mb' }));

// inbox 디렉토리 경로
const INBOX_DIR = path.join(__dirname, 'inbox');

// inbox 디렉토리가 없으면 생성
if (!fs.existsSync(INBOX_DIR)) {
    fs.mkdirSync(INBOX_DIR, { recursive: true });
}

// Perplexity API 설정
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || 'YOUR_PERPLEXITY_API_KEY_HERE';

// Health check 엔드포인트
app.get('/ping', (req, res) => {
    res.json({ status: 'ok', message: 'Inbox server is running' });
});

// 파일 저장 엔드포인트
app.post('/save', (req, res) => {
    try {
        const { content, filename, targetPath } = req.body;

        if (!content) {
            return res.status(400).json({
                success: false,
                error: '내용이 비어있습니다.'
            });
        }

        // 파일명 생성 (제공되지 않으면 타임스탬프 사용)
        let finalFilename = filename;
        if (!finalFilename) {
            const timestamp = new Date().toISOString()
                .slice(0, 19)
                .replace(/:/g, '-')
                .replace('T', '_');
            finalFilename = `task_${timestamp}.md`;
        }

        // .md 확장자가 없으면 추가
        if (!finalFilename.endsWith('.md')) {
            finalFilename += '.md';
        }

        // 대상 디렉토리 결정 (targetPath가 있으면 사용, 없으면 기본 INBOX_DIR)
        let targetDir = INBOX_DIR;
        if (targetPath) {
            targetDir = targetPath;
            // 대상 디렉토리가 없으면 생성
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
                console.log(`📁 디렉토리 생성: ${targetDir}`);
            }
        }

        // 파일 경로
        const filePath = path.join(targetDir, finalFilename);

        // 파일 저장
        fs.writeFileSync(filePath, content, 'utf8');

        console.log(`✅ 파일 저장 완료: ${finalFilename}`);
        console.log(`📂 저장 경로: ${filePath}`);

        res.json({
            success: true,
            filename: finalFilename,
            path: filePath,
            message: `파일이 ${targetDir}에 저장되었습니다.`
        });

    } catch (error) {
        console.error('❌ 파일 저장 실패:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 저장된 파일 목록 조회
app.get('/files', (req, res) => {
    try {
        const files = fs.readdirSync(INBOX_DIR)
            .filter(file => file.endsWith('.md') || file.endsWith('.json'))
            .map(file => {
                const filePath = path.join(INBOX_DIR, file);
                const stats = fs.statSync(filePath);
                return {
                    filename: file,
                    size: stats.size,
                    created: stats.birthtime,
                    modified: stats.mtime
                };
            })
            .sort((a, b) => b.modified - a.modified);

        res.json({
            success: true,
            count: files.length,
            files
        });

    } catch (error) {
        console.error('❌ 파일 목록 조회 실패:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// AI 번역 + 문법 교정 엔드포인트
app.post('/translate', async (req, res) => {
    try {
        const { text, mode } = req.body;

        if (!text) {
            return res.status(400).json({
                success: false,
                error: '번역할 텍스트가 없습니다.'
            });
        }

        console.log(`🌐 번역 요청: ${text.substring(0, 50)}...`);

        // 무료 번역 API 사용 (MyMemory)
        const translated = await callFreeTranslationAPI(text);

        res.json({
            success: true,
            translated: translated.trim()
        });

    } catch (error) {
        console.error('❌ 번역 실패:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 무료 번역 API 호출 (MyMemory Translation API)
async function callFreeTranslationAPI(text) {
    return new Promise((resolve, reject) => {
        // MyMemory API는 URL 파라미터로 전달
        const encodedText = encodeURIComponent(text);
        const path = `/get?q=${encodedText}&langpair=ko|en`;

        const options = {
            hostname: 'api.mymemory.translated.net',
            port: 443,
            path: path,
            method: 'GET',
            headers: {
                'User-Agent': 'SSALWorks/1.0'
            }
        };

        const apiReq = https.request(options, (apiRes) => {
            let data = '';

            apiRes.on('data', (chunk) => {
                data += chunk;
            });

            apiRes.on('end', () => {
                try {
                    const response = JSON.parse(data);

                    if (response.responseData && response.responseData.translatedText) {
                        const translated = response.responseData.translatedText;
                        resolve(translated);
                    } else {
                        reject(new Error('Invalid API response'));
                    }
                } catch (error) {
                    reject(error);
                }
            });
        });

        apiReq.on('error', (error) => {
            reject(error);
        });

        apiReq.end();
    });
}

// 서버 시작
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════╗
║                                              ║
║   📬 Inbox Server 실행 중                     ║
║                                              ║
║   포트: ${PORT}                               ║
║   저장 경로: ${INBOX_DIR}
║                                              ║
║   API 엔드포인트:                             ║
║   - POST http://localhost:${PORT}/save       ║
║   - POST http://localhost:${PORT}/translate  ║
║   - GET  http://localhost:${PORT}/files      ║
║   - GET  http://localhost:${PORT}/ping       ║
║                                              ║
╚══════════════════════════════════════════════╝
    `);
});

// 에러 핸들링
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled Rejection:', error);
});
