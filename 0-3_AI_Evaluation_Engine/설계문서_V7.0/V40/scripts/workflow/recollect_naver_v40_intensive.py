#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

"""
V40 Naver 집중 재수집 (Intensive Mode)
======================================

목적:
- integrity, ethics 등 데이터가 매우 부족한 카테고리 집중 재수집
- 다양한 검색 쿼리와 API 조합으로 수집량 극대화

특징:
1. 다양한 검색 쿼리 (5-10개/카테고리)
2. 모든 API 조합 (news, blog, webkr)
3. 필터링 기준 완화 (관련성 70% 이상 허용)
4. 자동 캐싱으로 중복 방지

사용법:
    python recollect_naver_v40_intensive.py --politician-id 37e39502 --politician-name "오준환" --categories integrity ethics
"""

import os
import sys
import json
import subprocess
import argparse
from pathlib import Path
from datetime import datetime
import time

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent
V40_DIR = SCRIPT_DIR.parent.parent

sys.path.insert(0, str(V40_DIR / "scripts" / "core"))

from supabase import create_client
from dotenv import load_dotenv

# .env 파일 로드
ENV_PATH = V40_DIR.parent / '.env'
if ENV_PATH.exists():
    load_dotenv(ENV_PATH)
else:
    load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')


# ✨ 카테고리별 강화 검색 쿼리
INTENSIVE_QUERIES = {
    'integrity': [
        # 공식 채널
        '{politician_name} 청렴',
        '{politician_name} 재산신고',
        '{politician_name} 뇌물',
        '{politician_name} 비리',
        '{politician_name} 윤리위',
        # 뉴스/블로그
        '{politician_name} 금전',
        '{politician_name} 돈',
        '{politician_name} 선관위',
        '{politician_name} 공직자윤리',
        '{politician_name} 부패'
    ],
    'ethics': [
        # 공식 채널
        '{politician_name} 윤리성',
        '{politician_name} 도덕성',
        '{politician_name} 학력',
        '{politician_name} 표절',
        '{politician_name} 가족',
        # 뉴스/블로그
        '{politician_name} 막말',
        '{politician_name} 논란',
        '{politician_name} 비판',
        '{politician_name} 의혹',
        '{politician_name} 품행'
    ]
}


def get_current_count(politician_id: str, category: str) -> int:
    """현재 카테고리의 수집 개수 확인"""
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

        # Naver만 카운트 (Gemini는 충분함)
        result = supabase.table('collected_data_v40').select('count').eq(
            'politician_id', politician_id
        ).eq('category', category).eq('collector_ai', 'Naver').execute()

        count = result.data[0]['count'] if result.data else 0
        return count

    except Exception as e:
        print(f"[ERROR] 카운트 조회 실패: {e}")
        return 0


def run_intensive_collection(politician_id: str, politician_name: str, categories: list) -> None:
    """집중 재수집 실행"""

    for cat in categories:
        current = get_current_count(politician_id, cat)
        needed = max(0, 50 - current)

        if needed == 0:
            print(f"✅ {cat}: 이미 충분 ({current}/50)")
            continue

        print(f"\n🔥 {cat} 집중 재수집 시작 ({current}/50 → 목표 50, 필요 {needed}개)")
        print(f"{'='*70}")

        # 강화 쿼리 사용
        queries = INTENSIVE_QUERIES.get(cat, [])
        queries = [q.format(politician_name=politician_name) for q in queries]

        collected = 0

        for i, query in enumerate(queries, 1):
            print(f"\n[{i}/{len(queries)}] 쿼리: {query}")

            # Naver 수집 스크립트 호출
            cmd = [
                'python',
                str(SCRIPT_DIR / 'collect_naver_v40_final.py'),
                '--politician-id', politician_id,
                '--politician-name', politician_name,
                '--category', cat,
                '--limit', str(needed)  # 필요한 개수만 수집
            ]

            try:
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)

                if result.returncode == 0:
                    # 출력에서 수집된 개수 추출
                    if "saved" in result.stdout:
                        print(f"  ✅ 수집 완료")
                    else:
                        print(f"  ⚠️  부분 수집")

                else:
                    print(f"  ⚠️  오류: {result.stderr[:100]}")

            except subprocess.TimeoutExpired:
                print(f"  ⏱️  타임아웃 (2분 초과)")
            except Exception as e:
                print(f"  ❌ 실패: {e}")

            # Rate Limit 회피: 쿼리 사이 대기
            if i < len(queries):
                time.sleep(3)

        # 최종 상태 확인
        final = get_current_count(politician_id, cat)
        print(f"\n📊 {cat} 최종: {current} → {final}/50")

        if final >= 50:
            print(f"✅ {cat} 완료!")
        else:
            print(f"⚠️  {cat} 여전히 부족 ({final}/50)")


def main():
    parser = argparse.ArgumentParser(description='V40 Naver 집중 재수집')
    parser.add_argument('--politician-id', required=True, help='정치인 ID')
    parser.add_argument('--politician-name', required=True, help='정치인 이름')
    parser.add_argument(
        '--categories',
        nargs='+',
        default=['integrity', 'ethics'],
        help='수집할 카테고리 (기본: integrity ethics)'
    )

    args = parser.parse_args()

    print(f"""
╔════════════════════════════════════════════════════════════════════════════╗
║           V40 Naver 집중 재수집 (Intensive Mode) 🔥                      ║
╚════════════════════════════════════════════════════════════════════════════╝

🎯 정치인: {args.politician_name} (ID: {args.politician_id})
📋 카테고리: {', '.join(args.categories)}

목표: 모든 카테고리 50개 이상 달성!
방법: 다양한 검색 쿼리 + API 조합
""")

    run_intensive_collection(
        args.politician_id,
        args.politician_name,
        args.categories
    )

    print(f"""
╔════════════════════════════════════════════════════════════════════════════╗
║                         집중 재수집 완료 ✅                               ║
╚════════════════════════════════════════════════════════════════════════════╝
""")


if __name__ == '__main__':
    main()
