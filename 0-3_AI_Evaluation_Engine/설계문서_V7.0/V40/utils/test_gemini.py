# -*- coding: utf-8 -*-
"""
Gemini API 테스트

⚠️ 주의: V40에서 Gemini는 CLI 방식을 사용합니다 (API 아님).
이 스크립트는 V30 시절 API 테스트용으로 작성된 것이며,
V40 실제 워크플로우에서는 사용되지 않습니다.
참조: instructions/2_collect/GEMINI_CLI_수집_가이드.md
"""

import os
import sys
from dotenv import load_dotenv

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

# 환경 변수 로드
load_dotenv(override=True)

print("Gemini API 테스트 시작...\n")

# API 키 확인
api_key = os.getenv('GEMINI_API_KEY')
if not api_key:
    print("❌ GEMINI_API_KEY 환경변수가 설정되지 않았습니다!")
    sys.exit(1)

print(f"✅ API 키 확인: {api_key[:20]}...")

# Gemini 클라이언트 초기화 (새로운 SDK 방식)
try:
    from google import genai
    client = genai.Client(api_key=api_key)
    print("✅ Gemini 클라이언트 초기화 성공")
except Exception as e:
    print(f"❌ Gemini 클라이언트 초기화 실패: {e}")
    sys.exit(1)

# 간단한 테스트
try:
    print("\n테스트 프롬프트 전송 중...")
    prompt = """다음 JSON 형식으로 응답하세요:
```json
{
  "test": "success",
  "message": "Hello from Gemini!"
}
```"""

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt
    )
    print(f"\n✅ 응답 받음:")
    print(response.text)

except Exception as e:
    print(f"\n❌ API 호출 실패: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n✅ Gemini API 테스트 성공!")
