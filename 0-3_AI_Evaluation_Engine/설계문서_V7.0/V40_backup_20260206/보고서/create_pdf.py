# encoding: utf-8
from weasyprint import HTML, CSS
import os

# HTML 파일 경로
html_file = "조은희_V40_평가보고서_20260206.html"
pdf_file = "조은희_V40_평가보고서_20260206.pdf"

# 한글 폰트 CSS
css = CSS(string='''
@page {
    size: A4;
    margin: 2cm;
}
body {
    font-family: "Malgun Gothic", "맑은 고딕", sans-serif;
    font-size: 11pt;
    line-height: 1.6;
}
h1 {
    font-size: 24pt;
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    page-break-before: auto;
}
h2 {
    font-size: 18pt;
    margin-top: 1.2em;
    margin-bottom: 0.4em;
    page-break-after: avoid;
}
h3 {
    font-size: 14pt;
    margin-top: 1em;
    margin-bottom: 0.3em;
}
table {
    border-collapse: collapse;
    width: 100%;
    margin: 1em 0;
}
th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
}
th {
    background-color: #f2f2f2;
}
code {
    background-color: #f4f4f4;
    padding: 2px 4px;
    border-radius: 3px;
}
blockquote {
    border-left: 4px solid #ddd;
    padding-left: 1em;
    margin-left: 0;
    color: #666;
}
''')

print("PDF 생성 중...")
try:
    HTML(filename=html_file).write_pdf(pdf_file, stylesheets=[css])
    print(f"✅ PDF 생성 완료: {pdf_file}")
    print(f"파일 크기: {os.path.getsize(pdf_file) / 1024:.1f} KB")
except Exception as e:
    print(f"❌ 오류 발생: {e}")
