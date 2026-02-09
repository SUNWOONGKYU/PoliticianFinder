# encoding: utf-8
"""
Markdown to PDF 변환 도구 (Chrome 헤드리스 모드)

사용법:
    python markdown_to_pdf.py 파일명.md

예시:
    python markdown_to_pdf.py 조은희_20260206_개선판_완성본.md

결과:
    파일명.pdf 생성 (동일한 폴더)

변경사항:
    - wkhtmltopdf -> Chrome headless (CSS 완벽 지원)
    - 외부 CSS -> report-style.css (색상 포함)
"""

import sys
import os
import subprocess
import platform
from pathlib import Path

def markdown_to_pdf(md_file):
    """Markdown 파일을 PDF로 변환"""

    if not os.path.exists(md_file):
        print(f"ERROR: 파일을 찾을 수 없습니다: {md_file}")
        return False

    # 파일명 설정
    base_name = os.path.splitext(md_file)[0]
    html_file = f"{base_name}.html"
    pdf_file = f"{base_name}.pdf"

    print(f"Markdown: {md_file}")
    print(f"HTML: {html_file}")
    print(f"PDF: {pdf_file}")

    # CSS 파일 경로 확인
    css_file = Path(__file__).parent / "report-style.css"
    if not css_file.exists():
        print(f"  WARNING: CSS 파일이 없습니다: {css_file}")
        print(f"  기본 스타일로 진행합니다.")
        css_arg = []
    else:
        css_arg = [f"--css={css_file}"]

    # 보고서 제목 설정 (HTML <title> 태그용, 본문에는 표시 안 됨)
    if "조은희" in md_file:
        page_title = "조은희 의원 평가보고"
    else:
        page_title = "정치인 평가보고"

    # Step 1: Markdown -> HTML (pandoc 사용)
    # pagetitle: HTML <title> 태그에만 사용 (본문에 표시 안 됨)
    print("\n[1/2] Markdown -> HTML 변환 중...")
    pandoc_cmd = [
        "pandoc",
        md_file,
        "-o", html_file,
        "--standalone",
        f"--metadata", f"pagetitle={page_title}"
    ] + css_arg

    try:
        subprocess.run(pandoc_cmd, check=True, capture_output=True)
        print("  HTML 생성 완료!")
    except subprocess.CalledProcessError as e:
        print(f"  ERROR: {e}")
        return False

    # Step 2: HTML -> PDF (Chrome headless 사용)
    print("\n[2/2] HTML -> PDF 변환 중 (Chrome)...")

    # Chrome 실행 파일 경로 찾기
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
            print("  ERROR: Chrome을 찾을 수 없습니다.")
            return False
    else:
        chrome_path = "google-chrome"

    # 절대 경로로 변환
    html_file_abs = os.path.abspath(html_file).replace('\\', '/')
    pdf_file_abs = os.path.abspath(pdf_file).replace('\\', '/')

    chrome_cmd = [
        chrome_path,
        '--headless',
        '--disable-gpu',
        '--no-sandbox',
        '--print-to-pdf=' + pdf_file_abs,
        '--print-to-pdf-no-header',
        '--run-all-compositor-stages-before-draw',
        '--virtual-time-budget=10000',
        f'file:///{html_file_abs}'
    ]

    try:
        result = subprocess.run(chrome_cmd, capture_output=True, text=True, encoding='utf-8', errors='ignore')
        if result.returncode != 0 and result.stderr:
            print(f"  WARNING: {result.stderr}")
        print("  PDF 생성 완료!")
    except Exception as e:
        print(f"  ERROR: {e}")
        return False

    # 파일 크기 확인
    if os.path.exists(pdf_file):
        size_kb = os.path.getsize(pdf_file) / 1024
        print(f"\n[SUCCESS] 성공!")
        print(f"   PDF: {pdf_file}")
        print(f"   크기: {size_kb:.1f} KB")
        return True
    else:
        print("\n[FAIL] 실패: PDF 파일이 생성되지 않았습니다.")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("사용법: python markdown_to_pdf.py 파일명.md")
        print("예시: python markdown_to_pdf.py 조은희_20260206_완성본.md")
        sys.exit(1)

    md_file = sys.argv[1]
    success = markdown_to_pdf(md_file)

    sys.exit(0 if success else 1)
