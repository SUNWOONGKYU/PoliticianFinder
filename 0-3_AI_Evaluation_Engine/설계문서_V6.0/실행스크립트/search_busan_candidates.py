#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
부산시장 후보자 명단 조사 (Claude API 활용)
"""

import sys, os, io
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from anthropic import Anthropic
from dotenv import load_dotenv
import json

# 환경 변수 로드
load_dotenv()

client = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

def search_busan_candidates():
    """Claude API로 부산시장 후보자 명단 조사"""

    prompt = """
2025년 또는 2026년 부산시장 선거에 출마가 거론되거나 예상되는 주요 정치인 명단을 조사해주세요.

**조사 범위**:
- 여야 주요 정당(국민의힘, 더불어민주당, 개혁신당 등)에서 거론되는 인물
- 언론에서 부산시장 후보로 보도된 인물
- 출마 의사를 밝힌 인물
- 예비후보자 등록을 한 인물
- 부산 출신 또는 연고가 있는 정치인

**제외**:
- 이재명 (현직 대통령)
- 대통령 후보로 거론되는 인물

**출력 형식** (JSON 배열로 제공):
[
  {
    "name": "성명",
    "party": "정당",
    "status": "신분 (예비후보자/출마자/현직 등)",
    "position": "현재 직책",
    "note": "간단한 설명"
  },
  ...
]

**중요**:
- 10명 정도 제공
- 2025년 11월 기준 최신 정보
- JSON 형식만 출력 (다른 설명 없이)
"""

    try:
        message = client.messages.create(
            model="claude-3-5-haiku-20241022",
            max_tokens=2000,
            temperature=0.3,
            messages=[{"role": "user", "content": prompt}]
        )

        response_text = message.content[0].text.strip()

        # JSON 파싱
        # 마크다운 코드 블록 제거
        if response_text.startswith('```'):
            lines = response_text.split('\n')
            response_text = '\n'.join(lines[1:-1])

        data = json.loads(response_text)
        return data

    except Exception as e:
        print(f"❌ 부산시장 후보자 조사 실패: {e}")
        return None

def main():
    print("="*100)
    print("부산시장 후보자 명단 조사")
    print("="*100)
    print()

    candidates = search_busan_candidates()

    if candidates:
        print(f"✅ 총 {len(candidates)}명 조사 완료")
        print()

        for i, candidate in enumerate(candidates, 1):
            print(f"{i}. {candidate['name']} ({candidate['party']})")
            print(f"   직책: {candidate['position']}")
            print(f"   신분: {candidate['status']}")
            print(f"   설명: {candidate['note']}")
            print()

        # JSON 파일로 저장
        output_file = os.path.join(os.path.dirname(__file__), '..', 'busan_mayor_candidates_list.json')
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(candidates, f, ensure_ascii=False, indent=2)

        print("="*100)
        print(f"📁 저장 위치: {output_file}")
        print("="*100)
        print()
        print("다음 단계:")
        print("1. 명단 확인 및 사용자 승인")
        print("2. 승인된 후보자들의 기본 정보 상세 수집")
        print("="*100)

    else:
        print("❌ 후보자 조사 실패")

if __name__ == "__main__":
    main()
