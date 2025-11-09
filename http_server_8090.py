#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
개선된 HTTP 서버 - 포트 8090
UTF-8 charset이 올바르게 설정된 서버
"""

import http.server
import socketserver
import os
import sys
from pathlib import Path

class UTF8FileHandler(http.server.SimpleHTTPRequestHandler):
    """
    UTF-8 charset을 제대로 설정하는 핸들러
    """

    def send_response(self, code, message=None):
        """응답 시작"""
        super().send_response(code, message)

    def end_headers(self):
        """모든 text 파일에 UTF-8 charset 추가"""
        file_path = self.translate_path(self.path)

        if os.path.isfile(file_path):
            # 파일 확장자 확인
            _, ext = os.path.splitext(file_path)
            ext = ext.lower()

            # text 기반 파일 목록
            text_exts = {'.md', '.txt', '.html', '.css', '.js', '.json', '.py', '.ts', '.tsx', '.jsx', '.sql'}

            # text 파일이면 charset=utf-8 추가
            if ext in text_exts:
                content_type = self.headers.get('Content-Type', 'text/plain')
                # charset이 없으면 추가
                if 'charset' not in content_type:
                    self.send_header('Content-Type', content_type + '; charset=utf-8')
                else:
                    self.send_header('Content-Type', content_type)
                # CORS 헤더 추가
                self.send_header('Access-Control-Allow-Origin', '*')
                super().end_headers()
                return

        # 기본 동작
        super().end_headers()

    def log_message(self, format, *args):
        """로그 출력"""
        sys.stderr.write("[%s] %s\n" % (self.log_date_time_string(), format % args))
        sys.stderr.flush()


if __name__ == '__main__':
    PORT = 8090

    # 프로젝트 루트로 변경
    project_root = r'C:\Development_PoliticianFinder_copy\Developement_Real_PoliticianFinder'
    os.chdir(project_root)

    print(f"HTTP 서버 시작: 포트 {PORT}")
    print(f"작업 디렉토리: {os.getcwd()}")
    print(f"URL: http://localhost:{PORT}/")
    print()

    with socketserver.TCPServer(("", PORT), UTF8FileHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n서버 종료")
            sys.exit(0)
