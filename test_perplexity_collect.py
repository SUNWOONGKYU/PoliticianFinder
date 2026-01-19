#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Perplexity 단독 수집 테스트
"""

import os
import sys
from dotenv import load_dotenv
from openai import OpenAI

# UTF-8 출력
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# .env 로드
sys.path.insert(0, 'C:\\Development_PoliticianFinder_com\\Developement_Real_PoliticianFinder\\0-3_AI_Evaluation_Engine')
load_dotenv('C:\\Development_PoliticianFinder_com\\Developement_Real_PoliticianFinder\\0-3_AI_Evaluation_Engine\\.env', override=True)

print("=" * 80)
print("Perplexity 단독 수집 테스트")
print("=" * 80)

# API 키 확인
PERPLEXITY_API_KEY = os.getenv('PERPLEXITY_API_KEY')
if not PERPLEXITY_API_KEY:
    print("❌ PERPLEXITY_API_KEY 없음")
    sys.exit(1)

print(f"✅ API 키: {PERPLEXITY_API_KEY[:10]}...")

# 클라이언트 초기화
try:
    client = OpenAI(
        api_key=PERPLEXITY_API_KEY,
        base_url="https://api.perplexity.ai"
    )
    print("✅ 클라이언트 초기화 성공")
except Exception as e:
    print(f"❌ 클라이언트 초기화 실패: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# 프롬프트 생성
prompt = """
조은희 국회의원의 리더십 관련 공개 뉴스를 6개 찾아주세요.

기간: 2024-01-18 ~ 2026-01-18 (최근 2년)

JSON 배열 형식으로 답변:
[
  {
    "data_title": "뉴스 제목",
    "data_content": "뉴스 내용 요약 (100자 이상)",
    "source_url": "실제 URL",
    "data_source": "언론사명",
    "data_date": "YYYY-MM-DD"
  }
]

부정적 주제 2개:
- 논란, 비판, 의혹, 실패

긍정적 주제 2개:
- 성과, 업적, 수상, 법안 통과

자유 주제 2개:
- 의정활동, 회의 참석
"""

print("\n" + "-" * 80)
print("테스트 프롬프트:")
print(prompt[:200] + "...")
print("-" * 80)

# API 호출
print("\nPerplexity API 호출 중...")
try:
    response = client.chat.completions.create(
        model="sonar-pro",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=8000
    )

    print("✅ API 호출 성공")
    print("\n응답:")
    print("=" * 80)
    print(response.choices[0].message.content)
    print("=" * 80)

except Exception as e:
    print(f"❌ API 호출 실패: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n✅ 테스트 완료")
