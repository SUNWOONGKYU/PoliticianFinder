# -*- coding: utf-8 -*-
"""
V40 Gemini CLI 수집 헬퍼 스크립트

Gemini CLI 터미널에서 호출하여 DB 조회/저장을 수행합니다.
데이터 수집(웹 검색)은 Gemini CLI가 직접 수행 (무료).

사용법:
    # 1. 수집 필요량 조회 (어떤 카테고리에 몇 개 필요한지)
    python gemini_collect_helper.py fetch --politician_id=d0a5d6e1 --politician_name=조은희 --category=communication

    # 2. 수집 결과 저장
    python gemini_collect_helper.py save --politician_id=d0a5d6e1 --politician_name=조은희 --category=communication --input=gemini_result.json

    # 3. 전체 현황 확인
    python gemini_collect_helper.py status --politician_id=d0a5d6e1
"""

import os
import sys
import json
import argparse
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# .env 로드 (상위 디렉토리들에서 찾기)
for env_path in [
    os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env'),
    os.path.join(os.path.dirname(__file__), '.env'),
    '.env'
]:
    if os.path.exists(env_path):
        load_dotenv(env_path)
        break

TABLE_COLLECTED = 'collected_data_v40'

CATEGORIES = [
    'expertise', 'leadership', 'vision', 'integrity', 'ethics',
    'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest'
]

# ⚠️ 카테고리 한글명: instructions/2_collect/cat01~10_*.md 참조
CATEGORY_KR = {
    'expertise': '전문성', 'leadership': '리더십', 'vision': '비전',
    'integrity': '청렴성', 'ethics': '윤리성', 'accountability': '책임감',
    'transparency': '투명성', 'communication': '소통능력', 'responsiveness': '대응성',
    'publicinterest': '공익성'
}

# ⚠️ Gemini 수집 목표: instructions/2_collect/cat01_expertise.md Section 12 참조
# sentiment: positive/negative/free (instructions 기준)
# 기본 목표 (negative/positive/free) + 버퍼 20% 포함 목표 (buf_neg/buf_pos/buf_free)
GEMINI_TARGETS = {
    "official": {"negative": 3, "positive": 3, "free": 24, "min_total": 30, "max_total": 36,
                 "buf_neg": 4, "buf_pos": 4, "buf_free": 28},   # 버퍼: 36개 (4/4/28)
    "public":   {"negative": 4, "positive": 4, "free": 12, "min_total": 20, "max_total": 24,
                 "buf_neg": 5, "buf_pos": 5, "buf_free": 14}    # 버퍼: 24개 (5/5/14)
}

supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))


def cmd_fetch(args):
    """수집 필요량 조회 - Gemini CLI에게 전달할 정보 출력"""
    pid = args.politician_id
    pname = args.politician_name
    category = args.category

    if category == 'all':
        cats = CATEGORIES
    else:
        cats = [category]

    result = {"politician_id": pid, "politician_name": pname, "categories": []}

    for cat in cats:
        # 현재 Gemini 수집량 조회
        off_data = supabase.table(TABLE_COLLECTED).select('id,sentiment', count='exact')\
            .eq('politician_id', pid).eq('category', cat)\
            .eq('collector_ai', 'Gemini').eq('data_type', 'official').execute()
        pub_data = supabase.table(TABLE_COLLECTED).select('id,sentiment', count='exact')\
            .eq('politician_id', pid).eq('category', cat)\
            .eq('collector_ai', 'Gemini').eq('data_type', 'public').execute()

        off_count = off_data.count or 0
        pub_count = pub_data.count or 0

        # sentiment별 카운트
        off_sentiments = {}
        for item in (off_data.data or []):
            s = item.get('sentiment', 'free')
            off_sentiments[s] = off_sentiments.get(s, 0) + 1

        pub_sentiments = {}
        for item in (pub_data.data or []):
            s = item.get('sentiment', 'free')
            pub_sentiments[s] = pub_sentiments.get(s, 0) + 1

        # 필요량 계산
        targets = GEMINI_TARGETS
        needs = {"official": {}, "public": {}}

        for sentiment in ['negative', 'positive', 'free']:
            off_max = targets["official"][sentiment]
            off_cur = off_sentiments.get(sentiment, 0)
            off_need = max(0, off_max - off_cur)
            needs["official"][sentiment] = {"current": off_cur, "max": off_max, "need": off_need}

            pub_max = targets["public"][sentiment]
            pub_cur = pub_sentiments.get(sentiment, 0)
            pub_need = max(0, pub_max - pub_cur)
            needs["public"][sentiment] = {"current": pub_cur, "max": pub_max, "need": pub_need}

        total_need = sum(v["need"] for v in needs["official"].values()) + \
                     sum(v["need"] for v in needs["public"].values())

        cat_info = {
            "category": cat,
            "category_kr": CATEGORY_KR.get(cat, cat),
            "current": {"official": off_count, "public": pub_count, "total": off_count + pub_count},
            "target": {"official_min": 30, "official_max": 36, "public_min": 20, "public_max": 24, "total_min": 50, "total_max": 60},
            "needs": needs,
            "total_need": total_need
        }
        result["categories"].append(cat_info)

    # 기존 URL 로드 (중복 방지용)
    if len(cats) == 1:
        existing = supabase.table(TABLE_COLLECTED).select('source_url')\
            .eq('politician_id', pid).eq('category', cats[0])\
            .eq('collector_ai', 'Gemini').execute()
        result["existing_urls"] = [item['source_url'] for item in (existing.data or []) if item.get('source_url')]

    print(json.dumps(result, ensure_ascii=False, indent=2))


def cmd_save(args):
    """수집 결과를 DB에 저장"""
    pid = args.politician_id
    pname = args.politician_name
    category = args.category
    input_file = args.input

    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    items = data if isinstance(data, list) else data.get('items', data.get('data', []))

    if not items:
        print("ERROR: 저장할 데이터가 없습니다.")
        return

    saved = 0
    skipped = 0
    errors = 0

    for item in items:
        try:
            # ⚠️ JSON 필드명: instructions/2_collect/prompts/gemini_*.md 참조
            # data_title, data_content, data_source, data_date (V40 통일)
            # 하위 호환: 이전 필드명(title, content, source, date)도 fallback 지원
            title = str(item.get('data_title', item.get('title', '')))[:200]
            url = item.get('source_url', '') or item.get('url', '')
            if not title and not url:
                skipped += 1
                continue

            # data_type 결정
            data_type = item.get('data_type', 'public')
            if url and '.go.kr' in url:
                data_type = 'official'

            # ⚠️ sentiment: instructions/2_collect/cat01~10 Section 12 참조
            # 유효값: negative / positive / free
            sentiment = item.get('sentiment', 'free')
            if sentiment not in ('negative', 'positive', 'free'):
                sentiment = 'free'

            content_raw = str(item.get('data_content', item.get('content', '')))
            db_item = {
                'politician_id': pid,
                'politician_name': pname,
                'category': category,
                'data_type': data_type,
                'sentiment': sentiment,
                'collector_ai': 'Gemini',
                'title': title,
                'content': content_raw[:2000],
                'summary': str(item.get('summary', content_raw))[:500],
                'source_url': url,
                'source_name': str(item.get('data_source', item.get('source', item.get('source_name', '')))),
                'published_date': item.get('data_date', item.get('date', item.get('published_date', None))),
                'is_verified': False
            }

            supabase.table(TABLE_COLLECTED).insert(db_item).execute()
            saved += 1

        except Exception as e:
            err_str = str(e)
            if 'duplicate' in err_str.lower() or '23505' in err_str:
                skipped += 1
            else:
                print(f"ERROR: {e}")
                errors += 1

    print(f"OK: {saved}개 저장, {skipped}개 스킵(중복), {errors}개 에러")


def cmd_status(args):
    """전체 수집 현황"""
    pid = args.politician_id

    print(f"=== Gemini 수집 현황 ({pid}) ===")
    print(f"목표: OFFICIAL MIN 30/MAX 36 + PUBLIC MIN 20/MAX 24 = MIN 50/MAX 60")
    print()
    print(f"{'#':>2} {'카테고리':18s} | OFF(/36) | PUB(/24) | 합계(/60) | 판정")
    print("-" * 70)

    pass_count = 0
    for i, cat in enumerate(CATEGORIES):
        off = supabase.table(TABLE_COLLECTED).select('id', count='exact')\
            .eq('politician_id', pid).eq('category', cat)\
            .eq('collector_ai', 'Gemini').eq('data_type', 'official').execute()
        pub = supabase.table(TABLE_COLLECTED).select('id', count='exact')\
            .eq('politician_id', pid).eq('category', cat)\
            .eq('collector_ai', 'Gemini').eq('data_type', 'public').execute()

        o = off.count or 0
        p = pub.count or 0
        t = o + p

        o_st = 'OK' if o >= 30 else f'-{30-o}'
        p_st = 'OK' if p >= 20 else f'-{20-p}'

        if t >= 50:
            verdict = 'PASS'
            pass_count += 1
        else:
            verdict = f'FAIL(-{50-t})'

        print(f"{i+1:2d} {cat:18s} | {o:3d} ({o_st:>4s}) | {p:3d} ({p_st:>4s}) | {t:3d} ({('OK' if t>=50 else f'-{50-t}'):>4s}) | {verdict}")

    print("-" * 70)
    print(f"결과: {pass_count}/10 카테고리 최소 목표 달성")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='V40 Gemini CLI 수집 헬퍼')
    subparsers = parser.add_subparsers(dest='command')

    # fetch
    p_fetch = subparsers.add_parser('fetch', help='수집 필요량 조회')
    p_fetch.add_argument('--politician_id', required=True)
    p_fetch.add_argument('--politician_name', required=True)
    p_fetch.add_argument('--category', required=True, help='카테고리명 또는 all')

    # save
    p_save = subparsers.add_parser('save', help='수집 결과 저장')
    p_save.add_argument('--politician_id', required=True)
    p_save.add_argument('--politician_name', required=True)
    p_save.add_argument('--category', required=True)
    p_save.add_argument('--input', required=True, help='JSON 파일 경로')

    # status
    p_status = subparsers.add_parser('status', help='전체 현황')
    p_status.add_argument('--politician_id', required=True)

    args = parser.parse_args()

    if args.command == 'fetch':
        cmd_fetch(args)
    elif args.command == 'save':
        cmd_save(args)
    elif args.command == 'status':
        cmd_status(args)
    else:
        parser.print_help()
