"""
Grok API 크레딧 충전 확인 테스트
"""

import os
from dotenv import load_dotenv
from openai import OpenAI

# .env 파일 로드
load_dotenv()

# Grok API 클라이언트 생성
client = OpenAI(
    api_key=os.getenv('XAI_API_KEY'),
    base_url="https://api.x.ai/v1"
)

print("="*80)
print("Grok API 크레딧 충전 확인 테스트")
print("="*80)
print()

try:
    # 간단한 테스트 호출
    print("테스트 호출 중...")
    response = client.chat.completions.create(
        model="grok-2-1212",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Say 'Hello' in Korean."}
        ],
        temperature=0.0,
        max_tokens=50
    )

    result = response.choices[0].message.content
    print(f"✅ 성공: {result}")
    print()
    print("="*80)
    print("Grok API 크레딧이 정상적으로 충전되었습니다!")
    print("한동훈 평가를 재시작할 수 있습니다.")
    print("="*80)

except Exception as e:
    print(f"❌ 실패: {str(e)}")
    print()
    print("="*80)
    print("Grok API 크레딧 충전을 확인해주세요.")
    print("충전 사이트: https://console.x.ai/")
    print("="*80)
