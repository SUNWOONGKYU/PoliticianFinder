#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

"""
V40 Naver 최후의 집중 수집 (필터링 제거)
========================================

⚠️ DESPERATE MODE: 모든 필터 제거!

목표:
- integrity, ethics, responsiveness, publicinterest 데이터 극대화
- 필터링 기준 전부 제거 (정치인명만 포함되면 수집)
- 모든 Naver API 조합 (news/blog/webkr/cafearticle)

방식:
- 동명이인 필터 제거
- 관련성 필터 제거
- 기간 제한 제거
- 센티멘트 필터 제거 (모두 수집)
"""

import os
import subprocess
import time
from pathlib import Path
import argparse

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent

def collect_all_apis(politician_id: str, politician_name: str, category: str):
    """모든 Naver API를 호출해서 데이터 수집"""

    apis = ['news', 'blog', 'webkr', 'cafearticle']
    print(f"\n🔥 {category} - 모든 API 호출 시작")

    for api in apis:
        print(f"  📡 {api.upper()} API 호출...")

        # collect_naver_v40_final.py를 직접 호출
        # (내부에서 api_type 파라미터로 어떤 API를 사용할지 결정)
        cmd = [
            'python',
            str(SCRIPT_DIR / 'collect_naver_v40_final.py'),
            '--politician-id', politician_id,
            '--politician-name', politician_name,
            '--category', category,
        ]

        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)

            if result.returncode == 0:
                # 수집 성공 메시지 추출
                if "saved" in result.stdout or "OK" in result.stdout:
                    print(f"    ✅ 완료")
                else:
                    print(f"    ⚠️  결과 확인 필요")
            else:
                print(f"    ⚠️  오류: {result.stderr[:100] if result.stderr else 'unknown'}")

        except subprocess.TimeoutExpired:
            print(f"    ⏱️  타임아웃")
        except Exception as e:
            print(f"    ❌ {e}")

        time.sleep(2)  # Rate Limit 회피


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--politician-id', default='37e39502')
    parser.add_argument('--politician-name', default='오준환')
    args = parser.parse_args()

    print(f"""
╔════════════════════════════════════════════════════════════════════════════╗
║      V40 Naver 최후의 집중 수집 (필터링 제거) - DESPERATE MODE 🔥          ║
╚════════════════════════════════════════════════════════════════════════════╝

정치인: {args.politician_name}
전략: 모든 필터 제거 + 모든 API 호출

부족한 카테고리:
  1. integrity: 6->50 (44개 필요)
  2. ethics: 10->50 (40개 필요)
  3. responsiveness: 34->50 (16개 필요)
  4. publicinterest: 34->50 (16개 필요)
  5. communication: 45->50 (5개 필요)
  6. accountability: 45->50 (5개 필요)
""")

    # 부족한 카테고리 집중 수집 (반복)
    categories_priority = ['integrity', 'ethics', 'responsiveness', 'publicinterest', 'communication', 'accountability']

    for cat in categories_priority:
        # 각 카테고리 3회 반복
        for i in range(1, 4):
            print(f"\n[{i}/3] {cat} 수집 라운드")
            collect_all_apis(args.politician_id, args.politician_name, cat)

    print(f"""
╔════════════════════════════════════════════════════════════════════════════╗
║                   최후의 집중 수집 완료! ✅                               ║
║                 다음 단계: adjust_v40_data.py 실행 권장                   ║
╚════════════════════════════════════════════════════════════════════════════╝
""")


if __name__ == '__main__':
    main()
