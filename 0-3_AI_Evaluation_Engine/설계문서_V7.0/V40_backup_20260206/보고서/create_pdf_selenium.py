# encoding: utf-8
from selenium import webdriver
from selenium.webdriver.edge.service import Service
from selenium.webdriver.edge.options import Options
import os
import time
import json

# 파일 경로
html_file = os.path.abspath("조은희_V40_평가보고서_20260206.html")
pdf_file = os.path.abspath("조은희_V40_평가보고서_20260206.pdf")

print(f"HTML: {html_file}")
print(f"PDF: {pdf_file}")

# Edge 옵션 설정
edge_options = Options()
edge_options.add_argument('--headless')
edge_options.add_argument('--disable-gpu')
edge_options.add_argument('--no-sandbox')

# PDF 설정
appState = {
    "recentDestinations": [{
        "id": "Save as PDF",
        "origin": "local",
        "account": ""
    }],
    "selectedDestinationId": "Save as PDF",
    "version": 2
}

prefs = {
    'printing.print_preview_sticky_settings.appState': json.dumps(appState),
    'savefile.default_directory': os.path.dirname(pdf_file)
}
edge_options.add_experimental_option('prefs', prefs)
edge_options.add_argument('--kiosk-printing')

print("Edge driver starting...")
try:
    driver = webdriver.Edge(options=edge_options)

    print("Loading HTML...")
    driver.get(f"file:///{html_file}")

    time.sleep(2)

    print("Creating PDF...")
    driver.execute_script('window.print();')

    time.sleep(3)

    driver.quit()

    if os.path.exists(pdf_file):
        print("SUCCESS: PDF created!")
        print(f"File size: {os.path.getsize(pdf_file) / 1024 / 1024:.1f} MB")
    else:
        print("ERROR: PDF file not created")

except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
