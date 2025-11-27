#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
새로운 경기도지사 후보 10명 기본 정보 수집
(여론조사 기반)
"""

import sys, os, io
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from anthropic import Anthropic
from dotenv import load_dotenv
import json

load_dotenv()
client = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

# 여론조사 기반 경기도지사 후보 10명
POLITICIANS = [
    # 더불어민주당 5명
    {"name": "김동연", "party": "더불어민주당"},
    {"name": "추미애", "party": "더불어민주당"},
    {"name": "한준호", "party": "더불어민주당"},
    {"name": "김병주", "party": "더불어민주당"},
    {"name": "염태영", "party": "더불어민주당"},
    # 국민의힘 5명
    {"name": "유승민", "party": "국민의힘"},
    {"name": "원유철", "party": "국민의힘"},
    {"name": "김선교", "party": "국민의힘"},
    {"name": "송석준", "party": "국민의힘"},
    {"name": "김성원", "party": "국민의힘"}
]

def collect_basic_info(politician_name, expected_party):
    """Claude API로 정치인 기본 정보 수집"""

    prompt = f"""
다음 정치인의 기본 정보를 JSON 형식으로 제공해주세요:

정치인: {politician_name}
예상 정당: {expected_party}

수집할 정보:
1. name: 성명 (한글)
2. gender: 성별 ("남" 또는 "여")
3. birth_date: 생년월일 (YYYY-MM-DD 형식)
4. party: 현재 소속 정당 ({expected_party} 확인 필수)
5. status: 신분 ("현직", "출마자" 중 하나만 사용)
6. position: 직책 (예: "경기도지사", "국회의원", "전 의원")
7. region_metro: "경기도"
8. region_local: 국회의원이면 지역구, 도지사면 null
9. profile_image_url: 공식 프로필 사진 URL (위키백과, 국회 우선)

**중요**:
- 2025년 11월 기준 최신 정보
- status는 "현직" 또는 "출마자"만 사용
- 경기도지사 출마 의사를 밝혔거나 거론되는 인물이면 "출마자"
- 현직 경기도지사나 국회의원이면 "현직"

출력 형식 (JSON만 출력, 다른 설명 없이):
{{
  "name": "{politician_name}",
  "gender": "성별",
  "birth_date": "생년월일",
  "party": "{expected_party}",
  "status": "현직 또는 출마자",
  "position": "직책",
  "region_metro": "경기도",
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

        # 마크다운 코드 블록 제거
        if response_text.startswith('```'):
            lines = response_text.split('\n')
            response_text = '\n'.join(lines[1:-1])

        data = json.loads(response_text)
        return data

    except Exception as e:
        print(f"  ❌ {politician_name} 정보 수집 실패: {e}")
        return None

def main():
    print("="*100)
    print("새로운 경기도지사 후보 10명 기본 정보 수집 (여론조사 기반)")
    print("="*100)
    print()

    results = []

    for i, politician in enumerate(POLITICIANS, 1):
        name = politician['name']
        party = politician['party']

        print(f"{i:2d}. {name} ({party}) 정보 수집 중...")
        info = collect_basic_info(name, party)

        if info:
            results.append(info)
            print(f"    ✅ {info['position']} ({info['status']})")
            print()
        else:
            print(f"    ⚠️  정보 수집 실패")
            print()

    # JSON 파일로 저장
    output_file = os.path.join(os.path.dirname(__file__), '..', 'gyeonggi_governor_candidates_new_10.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print("="*100)
    print(f"✅ 수집 완료: {len(results)}/10명")
    print(f"📁 저장 위치: {output_file}")
    print("="*100)

if __name__ == "__main__":
    main()
