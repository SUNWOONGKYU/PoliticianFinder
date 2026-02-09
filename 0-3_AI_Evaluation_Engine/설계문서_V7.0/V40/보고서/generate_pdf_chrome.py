#!/usr/bin/env python3
"""Chrome 헤드리스 모드로 HTML을 PDF로 변환"""
import subprocess
import os
import platform
from pathlib import Path

def html_to_pdf_chrome(input_file, output_file):
    """Chrome 헤드리스 모드를 사용하여 HTML을 PDF로 변환"""

    # Chrome 실행 파일 경로
    if platform.system() == 'Windows':
        chrome_paths = [
            r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
            os.path.expanduser(r"~\AppData\Local\Google\Chrome\Application\chrome.exe"),
        ]
        chrome_path = None
        for path in chrome_paths:
            if os.path.exists(path):
                chrome_path = path
                break
        if not chrome_path:
            raise FileNotFoundError("Chrome을 찾을 수 없습니다. Chrome이 설치되어 있는지 확인하세요.")
    else:
        chrome_path = "google-chrome"

    # HTML 파일 경로를 절대 경로로 변환
    input_file_abs = os.path.abspath(input_file).replace('\\', '/')
    output_file_abs = os.path.abspath(output_file).replace('\\', '/')

    print(f"Chrome 경로: {chrome_path}")
    print(f"입력 HTML: {input_file_abs}")
    print(f"출력 PDF: {output_file_abs}")

    # Chrome 명령어 구성
    cmd = [
        chrome_path,
        '--headless',
        '--disable-gpu',
        '--no-sandbox',
        '--print-to-pdf=' + output_file_abs,
        '--print-to-pdf-no-header',
        '--run-all-compositor-stages-before-draw',
        '--virtual-time-budget=10000',
        f'file:///{input_file_abs}'
    ]

    try:
        print("\nPDF 생성 중...")
        result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='ignore')
        if result.returncode != 0 and result.stderr:
            print(f"경고: {result.stderr}")

        if os.path.exists(output_file_abs):
            file_size = os.path.getsize(output_file_abs) / 1024
            print(f"\n[OK] PDF 변환 완료!")
            print(f"   파일: {output_file}")
            print(f"   크기: {file_size:.1f} KB")
            return True
        else:
            print(f"\n[FAIL] PDF 생성 실패!")
            return False
    except Exception as e:
        print(f"PDF 변환 중 오류 발생: {e}")
        return False

def main():
    """메인 실행 함수"""
    base_dir = Path(__file__).parent

    input_html = base_dir / "조은희_20260206_개선판_styled.html"
    output_pdf = base_dir / "조은희_20260206_개선판_Chrome.pdf"

    if not input_html.exists():
        print(f"[ERROR] HTML 파일이 없습니다: {input_html}")
        return 1

    # PDF 변환
    if html_to_pdf_chrome(str(input_html), str(output_pdf)):
        print(f"\n[SUCCESS] 성공!")
        print(f"   {output_pdf.name} 파일을 확인하세요.")
        return 0
    else:
        print("\n[FAIL] PDF 변환 실패")
        return 1

if __name__ == "__main__":
    exit(main())
