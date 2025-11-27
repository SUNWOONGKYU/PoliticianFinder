#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
부산시장 후보 10명 기본 정보 수집
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

# 부산시장 후보 10명
POLITICIANS = [
    "박형준", "김영춘", "김태호", "진성준", "오거돈",
    "강기정", "조해진", "박재호", "김석준", "변성완"
]

def collect_basic_info(politician_name):
    """Claude API로 정치인 기본 정보 수집"""

    prompt = f"""
다음 정치인의 기본 정보를 JSON 형식으로 제공해주세요:

정치인: {politician_name}

수집할 정보:
1. name: 성명 (한글)
2. gender: 성별 ("남" 또는 "여")
3. birth_date: 생년월일 (YYYY-MM-DD 형식)
4. party: 현재 소속 정당 (약칭 사용, 예: 국민의힘, 더불어민주당, 개혁신당, 무소속)
5. status: 신분 ("현직", "후보자", "예비후보자", "출마자" 중 하나만 사용, "전직" 사용 금지)
6. position: 직책 (예: "부산시장", "국회의원", "전 부산시장")
7. region_metro: 광역 지역 ("부산광역시")
8. region_local: 기초 지역 (국회의원이면 지역구, 시장이면 null)
9. profile_image_url: 공식 프로필 사진 URL (위키백과, 국회 또는 정당 공식 사이트 URL 우선)

**중요**:
- 2025년 11월 기준 최신 정보를 제공해주세요
- status는 반드시 "현직", "후보자", "예비후보자", "출마자" 중 하나만 사용
- 부산시장 출마 의사를 밝혔거나 거론되는 인물이면 status는 "예비후보자" 또는 "출마자"로 표시
- 현직 부산시장이나 국회의원이면 "현직"으로 표시
- 프로필 사진은 공식적인 출처(위키백과, 국회, 정당 사이트)의 URL을 제공

출력 형식 (JSON만 출력, 다른 설명 없이):
{{
  "name": "이름",
  "gender": "성별",
  "birth_date": "생년월일",
  "party": "정당",
  "status": "신분",
  "position": "직책",
  "region_metro": "부산광역시",
  "region_local": "지역구 또는 null",
  "profile_image_url": "https://..."
}}
"""

    try:
        message = client.messages.create(
            model="claude-3-5-haiku-20241022",
            max_tokens=1000,
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
        print(f"❌ {politician_name} 정보 수집 실패: {e}")
        return None

def main():
    print("="*100)
    print("부산시장 후보 10명 기본 정보 수집")
    print("="*100)
    print()

    results = []

    for politician in POLITICIANS:
        print(f"📌 {politician} 정보 수집 중...")
        info = collect_basic_info(politician)

        if info:
            results.append(info)
            print(f"✅ {politician}: {info['party']} ({info['status']})")
            print(f"   생년월일: {info['birth_date']}, 성별: {info['gender']}")
            if info.get('region_local'):
                print(f"   지역: {info['region_metro']} {info['region_local']}")
            print()
        else:
            print(f"⚠️  {politician} 정보 수집 실패")
            print()

    # JSON 파일로 저장
    output_file = os.path.join(os.path.dirname(__file__), '..', 'busan_mayor_candidates_basic_info.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print("="*100)
    print(f"✅ 수집 완료: {len(results)}/{len(POLITICIANS)}명")
    print(f"📁 저장 위치: {output_file}")
    print("="*100)

if __name__ == "__main__":
    main()
