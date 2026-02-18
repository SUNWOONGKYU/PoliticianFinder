# encoding: utf-8
import markdown
from xhtml2pdf import pisa
import os

# Markdown 파일 읽기
md_file = "조은희_20260206_완성본.md"
pdf_file = "조은희_V40_평가보고서_20260206.pdf"

print("Markdown 파일 읽기 중...")
with open(md_file, 'r', encoding='utf-8') as f:
    md_content = f.read()

print("HTML 변환 중...")
html_content = markdown.markdown(md_content, extensions=['tables', 'fenced_code'])

# CSS 추가
html_with_style = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @page {{
            size: A4;
            margin: 2cm;
        }}
        body {{
            font-family: "Malgun Gothic", sans-serif;
            font-size: 11pt;
            line-height: 1.6;
        }}
        h1 {{
            font-size: 24pt;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            color: #333;
        }}
        h2 {{
            font-size: 18pt;
            margin-top: 1.2em;
            margin-bottom: 0.4em;
            color: #444;
        }}
        h3 {{
            font-size: 14pt;
            margin-top: 1em;
            margin-bottom: 0.3em;
            color: #555;
        }}
        table {{
            border-collapse: collapse;
            width: 100%;
            margin: 1em 0;
        }}
        th, td {{
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }}
        th {{
            background-color: #f2f2f2;
            font-weight: bold;
        }}
        code {{
            background-color: #f4f4f4;
            padding: 2px 4px;
            border-radius: 3px;
        }}
        blockquote {{
            border-left: 4px solid #ddd;
            padding-left: 1em;
            margin-left: 0;
            color: #666;
        }}
        strong {{
            font-weight: bold;
        }}
    </style>
</head>
<body>
{html_content}
</body>
</html>
"""

print("PDF 생성 중...")
with open(pdf_file, "wb") as pdf:
    pisa_status = pisa.CreatePDF(html_with_style, dest=pdf)

if pisa_status.err:
    print(f"❌ PDF 생성 실패: {pisa_status.err}")
else:
    print(f"✅ PDF 생성 완료: {pdf_file}")
    print(f"파일 크기: {os.path.getsize(pdf_file) / 1024 / 1024:.1f} MB")
    print(f"전체 경로: {os.path.abspath(pdf_file)}")
