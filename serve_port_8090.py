#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HTTP Server for port 8090 - Serves files with proper UTF-8 charset headers
"""

import http.server
import socketserver
import os
import sys
from pathlib import Path

# Change to project root directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

class UTF8Handler(http.server.SimpleHTTPRequestHandler):
    """Custom handler that properly sets UTF-8 charset for text files"""

    def end_headers(self):
        """Override to add UTF-8 charset to all text files"""
        file_path = self.translate_path(self.path)

        # Check if it's a text-based file
        if os.path.isfile(file_path):
            ext = os.path.splitext(file_path)[1].lower()
            text_extensions = {'.md', '.txt', '.html', '.css', '.js', '.json', '.py', '.ts', '.tsx', '.jsx', '.sql'}

            # Add charset=utf-8 to text files
            if ext in text_extensions or 'text' in self.headers.get('Content-Type', ''):
                current_ct = self.headers.get('Content-Type', 'text/plain')
                if 'charset' not in current_ct:
                    self.send_header('Content-Type', current_ct + '; charset=utf-8')
                else:
                    self.send_header('Content-Type', current_ct)

        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')

        super().end_headers()

if __name__ == '__main__':
    PORT = 8090
    Handler = UTF8Handler

    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Server started on port {PORT}")
        print(f"Working directory: {os.getcwd()}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped")
            sys.exit(0)
