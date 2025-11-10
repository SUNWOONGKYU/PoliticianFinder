#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PROJECT GRID Viewer with Local JSON Data
로컬 JSON 파일을 사용하는 뷰어 실행 스크립트
"""

import http.server
import socketserver
import webbrowser
import os
import json
from pathlib import Path

# 설정
PORT = 8081
VIEWER_FILE = "project_grid_최종통합뷰어_v4.html"
JSON_FILE = "../grid/generated_grid_full_v4_10agents_with_skills.json"

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    """커스텀 HTTP 핸들러 - JSON 파일 서빙"""

    def end_headers(self):
        # CORS 헤더 추가
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

def main():
    """Viewer 실행"""

    # 현재 스크립트 디렉토리로 이동
    script_dir = Path(__file__).parent
    os.chdir(script_dir)

    # Viewer 파일 존재 확인
    if not Path(VIEWER_FILE).exists():
        print(f"Error: Viewer file not found: {VIEWER_FILE}")
        print(f"Current directory: {os.getcwd()}")
        return

    # JSON 파일 존재 확인
    json_path = Path(JSON_FILE)
    if not json_path.exists():
        print(f"Error: JSON file not found: {JSON_FILE}")
        return

    # JSON 파일 읽기
    with open(json_path, 'r', encoding='utf-8') as f:
        json_data = json.load(f)

    print("=" * 60)
    print("PROJECT GRID Viewer (Local JSON) Starting")
    print("=" * 60)
    print(f"Viewer file: {VIEWER_FILE}")
    print(f"JSON file: {JSON_FILE}")
    print(f"Tasks loaded: {len(json_data)}")
    print(f"Port: {PORT}")
    print(f"URL: http://localhost:{PORT}/{VIEWER_FILE}")
    print("=" * 60)
    print("Press Ctrl+C to stop the server")
    print("=" * 60)

    # HTTP 서버 시작
    Handler = CustomHandler

    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            # 브라우저 자동 열기
            url = f"http://localhost:{PORT}/{VIEWER_FILE}"
            print(f"\nOpening browser: {url}")
            webbrowser.open(url)

            # 서버 실행
            print(f"\nHTTP server running on port {PORT}...\n")
            httpd.serve_forever()

    except KeyboardInterrupt:
        print("\n\nServer stopped")
    except OSError as e:
        if e.errno == 48 or e.errno == 10048:  # Address already in use
            print(f"\nError: Port {PORT} is already in use.")
            print("Please close other programs or use a different port.")
        else:
            print(f"\nError: {e}")


if __name__ == "__main__":
    main()
