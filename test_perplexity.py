#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Perplexity API 테스트
"""

import os
import sys
from dotenv import load_dotenv
from openai import OpenAI

# UTF-8 출력
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

load_dotenv(override=True)

PERPLEXITY_API_KEY = os.getenv('PERPLEXITY_API_KEY')

print("=" * 80)
print("Perplexity API 테스트")
print("=" * 80)

if not PERPLEXITY_API_KEY:
    print("❌ PERPLEXITY_API_KEY 환경 변수가 없습니다.")
    sys.exit(1)

print(f"✅ API 키: {PERPLEXITY_API_KEY[:10]}...{PERPLEXITY_API_KEY[-5:]}")

# 클라이언트 생성
try:
    client = OpenAI(
        api_key=PERPLEXITY_API_KEY,
        base_url="https://api.perplexity.ai"
    )
    print("✅ 클라이언트 생성 성공")
except Exception as e:
    print(f"❌ 클라이언트 생성 실패: {e}")
    sys.exit(1)

# API 호출 테스트
print("\n테스트 쿼리: 조은희 국회의원 관련 뉴스")
print("-" * 80)

try:
    response = client.chat.completions.create(
        model="llama-3.1-sonar-small-128k-online",
        messages=[{
            "role": "user",
            "content": "조은희 국회의원의 최근 의정활동 1개만 찾아서 JSON 형식으로 답변해줘. {\"title\": \"제목\", \"content\": \"내용\", \"source_url\": \"URL\"}"
        }],
        max_tokens=500
    )

    print("✅ API 호출 성공")
    print(f"\n응답:\n{response.choices[0].message.content}")

except Exception as e:
    print(f"❌ API 호출 실패: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 80)
