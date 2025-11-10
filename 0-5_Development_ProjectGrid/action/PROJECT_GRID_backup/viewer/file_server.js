#!/usr/bin/env node

/**
 * 로컬 파일 서버
 * 생성 파일을 웹 브라우저에서 직접 열 수 있도록 지원
 *
 * 사용법: node file_server.js
 * 브라우저: http://localhost:3000
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// PROJECT_ROOT는 file_server.js가 있는 viewer 디렉토리의 상위 4단계
// __dirname: C:\...\0-5_Development_ProjectGrid\action\PROJECT_GRID\viewer
// PROJECT_ROOT: C:\...\Developement_Real_PoliticianFinder (프로젝트 루트)
const PROJECT_ROOT = path.resolve(path.join(__dirname, '../../../..'));
const PORT = 3001;  // 3000 포트가 점유되었으므로 3001 사용

console.log('📂 프로젝트 루트:', PROJECT_ROOT);
console.log('🚀 파일 서버 시작: http://localhost:' + PORT);

const server = http.createServer((req, res) => {
    // CORS 헤더
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // API: 파일 열기
    if (req.method === 'POST' && req.url === '/api/open-file') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const filePath = data.path;

                console.log('📄 파일 열기 요청:', filePath);

                // Windows explorer에서 파일 위치 표시
                if (process.platform === 'win32') {
                    spawn('explorer', ['/select,', filePath]);
                }
                // macOS에서는 Finder 사용
                else if (process.platform === 'darwin') {
                    spawn('open', ['-R', filePath]);
                }
                // Linux
                else {
                    spawn('xdg-open', [path.dirname(filePath)]);
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (err) {
                console.error('에러:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            }
        });
        return;
    }

    // API: 파일 콘텐츠 제공
    if (req.method === 'GET' && req.url.startsWith('/files/')) {
        const filePath = decodeURIComponent(req.url.replace('/files/', ''));
        const fullPath = path.join(PROJECT_ROOT, filePath);

        // 보안: 프로젝트 루트 벗어나지 않도록 확인
        if (!fullPath.startsWith(PROJECT_ROOT)) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '접근 거부' }));
            return;
        }

        fs.readFile(fullPath, 'utf-8', (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: '파일을 찾을 수 없습니다' }));
                return;
            }

            res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end(data);
        });
        return;
    }

    // 정적 파일 제공
    if (req.url === '/' || req.url === '/index.html') {
        const filePath = path.join(__dirname, 'project_grid_최종통합뷰어_v4_with_gate.html');
        fs.readFile(filePath, 'utf-8', (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('파일을 찾을 수 없습니다');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(data);
        });
        return;
    }

    // 다른 정적 파일 (viewer 디렉토리 또는 프로젝트 루트)
    // 1. viewer 디렉토리 먼저 확인
    let filePath = path.join(__dirname, req.url);

    // 2. viewer 디렉토리에 없으면 프로젝트 루트에서 찾기
    if (!fs.existsSync(filePath)) {
        filePath = path.join(PROJECT_ROOT, req.url);
    }

    if (fs.existsSync(filePath)) {
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('에러 발생');
                return;
            }

            let contentType = 'text/plain';
            if (filePath.endsWith('.js')) contentType = 'application/javascript';
            else if (filePath.endsWith('.json')) contentType = 'application/json';
            else if (filePath.endsWith('.css')) contentType = 'text/css';
            else if (filePath.endsWith('.ts')) contentType = 'text/plain';
            else if (filePath.endsWith('.tsx')) contentType = 'text/plain';
            else if (filePath.endsWith('.sql')) contentType = 'text/plain';

            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
    } else {
        res.writeHead(404);
        res.end('404 Not Found');
    }
});

server.listen(PORT, () => {
    console.log('✅ 서버 실행 중: http://localhost:' + PORT);
    console.log('❌ 종료: Ctrl+C');
});
