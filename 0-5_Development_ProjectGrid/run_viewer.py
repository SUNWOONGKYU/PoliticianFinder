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
        print(f"❌ Viewer 파일이 없습니다: {VIEWER_FILE}")
        print(f"📁 현재 디렉토리: {os.getcwd()}")
        return

    print("=" * 60)
    print("🚀 PROJECT GRID Viewer 시작")
    print("=" * 60)
    print(f"📄 Viewer 파일: {VIEWER_FILE}")
    print(f"🌐 포트: {PORT}")
    print(f"🔗 URL: http://localhost:{PORT}/{VIEWER_FILE}")
    print("=" * 60)
    print("⏹️  종료하려면 Ctrl+C를 누르세요")
    print("=" * 60)

    # HTTP 서버 시작
    Handler = http.server.SimpleHTTPRequestHandler

    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            # 브라우저 자동 열기
            url = f"http://localhost:{PORT}/{VIEWER_FILE}"
            print(f"\n🌐 브라우저에서 열기: {url}")
            webbrowser.open(url)

            # 서버 실행
            print(f"\n✅ HTTP 서버가 포트 {PORT}에서 실행 중...\n")
            httpd.serve_forever()

    except KeyboardInterrupt:
        print("\n\n⏹️  서버 종료됨")
    except OSError as e:
        if e.errno == 48 or e.errno == 10048:  # Address already in use
            print(f"\n❌ 포트 {PORT}가 이미 사용 중입니다.")
            print("다른 프로그램을 종료하거나 다른 포트를 사용하세요.")
        else:
            print(f"\n❌ 오류: {e}")


if __name__ == "__main__":
    main()
