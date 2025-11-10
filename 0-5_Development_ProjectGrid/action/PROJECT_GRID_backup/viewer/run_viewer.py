#!/usr/bin/env python3
"""
PROJECT GRID Viewer 실행 스크립트
간단한 HTTP 서버로 HTML 뷰어 실행
"""

import http.server
import socketserver
import webbrowser
import os
from pathlib import Path

# 설정
PORT = 8080
VIEWER_FILE = "project_grid_최종통합뷰어_v4.html"

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

    print("=" * 60)
    print("PROJECT GRID Viewer Starting")
    print("=" * 60)
    print(f"Viewer file: {VIEWER_FILE}")
    print(f"Port: {PORT}")
    print(f"URL: http://localhost:{PORT}/{VIEWER_FILE}")
    print("=" * 60)
    print("Press Ctrl+C to stop the server")
    print("=" * 60)

    # HTTP 서버 시작
    Handler = http.server.SimpleHTTPRequestHandler

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
