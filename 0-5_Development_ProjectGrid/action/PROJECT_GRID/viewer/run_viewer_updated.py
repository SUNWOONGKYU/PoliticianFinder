#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PROJECT GRID Viewer - 작업지시서 연결 지원
상위 디렉토리에서 실행하여 tasks 폴더 접근 가능
"""

import http.server
import socketserver
import webbrowser
import os
from pathlib import Path

PORT = 8080
VIEWER_FILE = "action/PROJECT_GRID/viewer/project_grid_최종통합뷰어_v4.html"

class UTF8Handler(http.server.SimpleHTTPRequestHandler):
    """UTF-8 인코딩 지원 핸들러"""

    def end_headers(self):
        # .md 파일은 UTF-8로 명시
        if self.path.endswith('.md'):
            self.send_header('Content-Type', 'text/markdown; charset=utf-8')
        super().end_headers()

# 프로젝트 루트로 이동 (tasks 폴더에 접근 가능)
project_root = Path(__file__).parent.parent.parent.parent
os.chdir(project_root)

print("=" * 70)
print("PROJECT GRID Viewer V5.0 (작업지시서 연결 지원)")
print("=" * 70)
print(f"작업 디렉토리: {os.getcwd()}")
print(f"PORT: {PORT}")
print(f"URL: http://localhost:{PORT}/{VIEWER_FILE}")
print("=" * 70)
print("브라우저에서 작업지시서 링크 클릭 가능!")
print("Press Ctrl+C to stop")
print("=" * 70)

try:
    with socketserver.TCPServer(("", PORT), UTF8Handler) as httpd:
        url = f"http://localhost:{PORT}/{VIEWER_FILE}"
        webbrowser.open(url)
        print(f"\nServer running... Opened {url}\n")
        httpd.serve_forever()
except KeyboardInterrupt:
    print("\n\nServer stopped")
except OSError as e:
    if e.errno in (48, 10048):
        print(f"\nPort {PORT} is busy. Try closing other programs.")
    else:
        print(f"\nError: {e}")
