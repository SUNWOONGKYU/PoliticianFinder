# encoding: utf-8
"""
Markdown to PDF 변환 도구

사용법:
    python markdown_to_pdf.py 파일명.md

예시:
    python markdown_to_pdf.py 조은희_20260206_완성본.md

결과:
    파일명.pdf 생성 (동일한 폴더)
"""

import sys
import os
import subprocess

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

    # Step 1: Markdown -> HTML (pandoc 사용)
    print("\n[1/2] Markdown -> HTML 변환 중...")
    pandoc_cmd = [
        "pandoc",
        md_file,
        "-o", html_file,
        "--standalone",
        "--css=https://cdn.jsdelivr.net/npm/github-markdown-css@5/github-markdown.min.css",
        f"--metadata", f"title={base_name}"
    ]

    try:
        subprocess.run(pandoc_cmd, check=True, capture_output=True)
        print("  HTML 생성 완료!")
    except subprocess.CalledProcessError as e:
        print(f"  ERROR: {e}")
        return False

    # Step 2: HTML -> PDF (wkhtmltopdf 사용)
    print("\n[2/2] HTML -> PDF 변환 중...")
    wkhtmltopdf_cmd = [
        "wkhtmltopdf",
        "--encoding", "utf-8",
        "--page-size", "A4",
        "--margin-top", "20mm",
        "--margin-bottom", "20mm",
        "--margin-left", "20mm",
        "--margin-right", "20mm",
        html_file,
        pdf_file
    ]

    try:
        result = subprocess.run(wkhtmltopdf_cmd, check=True, capture_output=True, text=True)
        print("  PDF 생성 완료!")
    except subprocess.CalledProcessError as e:
        print(f"  ERROR: {e}")
        return False

    # 파일 크기 확인
    if os.path.exists(pdf_file):
        size_kb = os.path.getsize(pdf_file) / 1024
        print(f"\n✅ 성공!")
        print(f"   PDF: {pdf_file}")
        print(f"   크기: {size_kb:.1f} KB")
        return True
    else:
        print("\n❌ 실패: PDF 파일이 생성되지 않았습니다.")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("사용법: python markdown_to_pdf.py 파일명.md")
        print("예시: python markdown_to_pdf.py 조은희_20260206_완성본.md")
        sys.exit(1)

    md_file = sys.argv[1]
    success = markdown_to_pdf(md_file)

    sys.exit(0 if success else 1)
