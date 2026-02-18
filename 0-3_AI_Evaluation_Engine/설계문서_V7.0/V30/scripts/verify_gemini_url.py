#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gemini가 제공한 URL이 실제인지 확인
"""

import sys
import os
import google.generativeai as genai
from dotenv import load_dotenv

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# .env 파일 로드
load_dotenv(override=True)

# API 키
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("[오류] GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.")
    sys.exit(1)

def call_gemini(prompt):
    """Gemini API 호출"""
    genai.configure(api_key=GEMINI_API_KEY)

    try:
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"[오류] Gemini API 에러: {e}")
        return None

def main():
    prompt = """방금 네가 제공한 "조은희 의원 관련 최신 뉴스"에서:

```json
{
  "source_url": "https://www.example.com/news/12345",
  "date": "2024-10-27"
}
```

**질문:**

1. **이 URL (https://www.example.com/news/12345)은 실제로 존재하는 뉴스 기사 URL입니까?**
   - 예/아니오로 명확히 답변해주세요.

2. **"example.com"은 예시용 도메인이지 실제 뉴스 사이트가 아닙니다. 맞습니까?**
   - 예/아니오로 명확히 답변해주세요.

3. **방금 전 답변에서 "실제 검색을 수행한다"고 했는데, 왜 실제 URL이 아닌 example.com을 제공했습니까?**

4. **솔직히 말해주세요: 방금 제공한 뉴스는 실제로 검색한 것입니까, 아니면 예시로 생성한 것입니까?**

5. **다시 테스트: 지금 당장 "조은희 의원" 관련 뉴스를 실제로 검색해서, 실제 존재하는 URL (예: https://www.chosun.com/..., https://www.joongang.co.kr/... 등)을 제공해주세요.**
   - 만약 실제 검색 기능이 있다면, 실제 한국 언론사 URL을 제공할 수 있어야 합니다.
   - 만약 검색 기능이 없다면, "검색 불가능"이라고 솔직하게 말해주세요.

---

**중요:**
- 예시(example)가 아닌 실제(real) URL을 요청합니다.
- 가짜 데이터는 연구 신뢰성을 파괴합니다.
- 정직하게 답변해주세요.

**지금 바로 실제 검색을 수행하고 실제 URL을 제공해주세요.**
"""

    print("=" * 70)
    print("Gemini에게 URL 검증 요청 중...")
    print("=" * 70)
    print()

    response = call_gemini(prompt)

    if response:
        print("=" * 70)
        print("Gemini 2.0 응답:")
        print("=" * 70)
        print()
        print(response)
        print()
        print("=" * 70)
    else:
        print("[오류] 응답을 받지 못했습니다.")

if __name__ == "__main__":
    main()
