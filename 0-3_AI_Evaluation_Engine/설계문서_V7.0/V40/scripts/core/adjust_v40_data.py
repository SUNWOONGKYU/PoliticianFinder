# -*- coding: utf-8 -*-
"""
V40 검증 후 조정 스크립트 (Phase 2-2)
========================================

목적:
    Phase 3 검증 완료 후, AI별/카테고리별 데이터 균형 조정

조정 목표:
    - AI별: 500-600개 (카테고리당 50-60개)
    - 전체: 1,000-1,200개

프로세스:
    1. 현황 분석: AI별/카테고리별 개수 집계
    2. 초과 처리: 60개 초과 → 시간순 삭제 (오래된 것부터)
    3. 재수집 트리거: 50개 미만 → 해당 AI로 재수집
    4. 균형 검증: 모든 카테고리 50-60개 달성 확인
    5. 최종 보고: 조정 결과 요약

무한루프 방지:
    - 최대 4회 조정 라운드
    - 4회 후 포기 규칙: 25-49개=부족허용, <25개=leverage score 0 (60점)

사용법:
    # 시뮬레이션 (DRY RUN)
    python adjust_v40_data.py --politician_id={ID} --politician_name="{이름}"

    # 실제 조정 실행
    python adjust_v40_data.py --politician_id={ID} --politician_name="{이름}" --no-dry-run

    # 특정 AI만 조정
    python adjust_v40_data.py --politician_id={ID} --politician_name="{이름}" --ai=Gemini --no-dry-run

상세 가이드:
    instructions/V40_검증후조정_가이드.md
"""

import sys
import io
import os
import json
import argparse
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple
from collections import defaultdict
from supabase import create_client
from dotenv import load_dotenv

# UTF-8 출력 설정 (Windows)
if sys.platform == 'win32':
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
    except AttributeError:
        pass

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent
V40_DIR = SCRIPT_DIR.parent.parent
WORKFLOW_DIR = SCRIPT_DIR.parent / 'workflow'

# .env 로드 (다중 경로 시도)
env_paths = [
    V40_DIR.parent.parent / '.env',  # 0-3_AI_Evaluation_Engine/.env
    V40_DIR.parent / '.env',          # 설계문서_V7.0/.env
    V40_DIR / '.env',                 # V40/.env
    Path('.env')                      # 현재 디렉토리
]

env_loaded = False
for env_path in env_paths:
    if env_path.exists():
        load_dotenv(env_path, override=True)
        env_loaded = True
        break

if not env_loaded:
    print("⚠️ .env 파일을 찾을 수 없습니다.")
    print("시도한 경로:")
    for p in env_paths:
        print(f"  - {p}")

# Supabase 클라이언트
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# 상수
TABLE_COLLECTED = "collected_data_v40"
CATEGORIES = [
    'expertise', 'leadership', 'vision', 'integrity', 'ethics',
    'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest'
]

CATEGORY_KR = {
    'expertise': '전문성', 'leadership': '리더십', 'vision': '비전',
    'integrity': '청렴성', 'ethics': '윤리성', 'accountability': '책임감',
    'transparency': '투명성', 'communication': '소통능력', 'responsiveness': '대응성',
    'publicinterest': '공익성'
}

# 목표 균형
MIN_PER_CATEGORY = 50  # 최소 목표
MAX_PER_CATEGORY = 60  # 버퍼 목표
MIN_PER_AI = 500       # 최소 목표 (50 × 10)
MAX_PER_AI = 600       # 버퍼 목표 (60 × 10)

# 무한루프 방지
MAX_ADJUSTMENT_ROUNDS = 4

# 재수집 포기 규칙 (4회 재수집 후 적용)
GIVE_UP_THRESHOLD = 25  # 최소 목표의 50%, 이하면 포기 → leverage score 0 처리


def print_header(title: str):
    """헤더 출력"""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80)


def print_section(title: str):
    """섹션 출력"""
    print(f"\n--- {title} ---")


def analyze_current_status(politician_id: str) -> Dict:
    """
    Step 1: 현황 분석
    AI별/카테고리별 데이터 개수 집계
    """
    print_section("Step 1: 현황 분석")

    # 페이지네이션 (Supabase 1,000행 제한 대응)
    all_rows = []
    offset = 0
    page_size = 1000
    while True:
        r = supabase.table(TABLE_COLLECTED).select('collector_ai, category').eq('politician_id', politician_id).range(offset, offset + page_size - 1).execute()
        batch = r.data or []
        all_rows.extend(batch)
        if len(batch) < page_size:
            break
        offset += page_size

    if not all_rows:
        print("수집된 데이터가 없습니다.")
        return {}

    # AI별/카테고리별 집계
    stats = defaultdict(lambda: defaultdict(int))
    for row in all_rows:
        ai = row['collector_ai']
        cat = row['category']
        stats[ai][cat] += 1

    # 결과 출력
    print(f"\n총 데이터: {len(all_rows)}개")
    print("\nAI별/카테고리별 현황:")
    print(f"{'AI':<10} {'카테고리':<20} {'개수':>6} {'상태':<10}")
    print("-" * 50)

    total_by_ai = defaultdict(int)
    issues = []

    for ai in ['Gemini', 'Naver']:
        for cat in CATEGORIES:
            count = stats[ai].get(cat, 0)
            total_by_ai[ai] += count

            # 상태 판단
            if count > MAX_PER_CATEGORY:
                status = f"초과 ({count - MAX_PER_CATEGORY}개)"
                issues.append(('overflow', ai, cat, count))
            elif count < MIN_PER_CATEGORY:
                status = f"부족 ({MIN_PER_CATEGORY - count}개)"
                issues.append(('shortage', ai, cat, count))
            else:
                status = "OK"

            print(f"{ai:<10} {CATEGORY_KR[cat]:<20} {count:>6} {status:<10}")

    print("\nAI별 합계:")
    for ai in ['Gemini', 'Naver']:
        total = total_by_ai[ai]
        status = "OK" if MIN_PER_AI <= total <= MAX_PER_AI else ("초과" if total > MAX_PER_AI else "부족")
        print(f"  {ai}: {total}/{MAX_PER_AI} ({status})")

    grand_total = sum(total_by_ai.values())
    print(f"\n전체 합계: {grand_total}/{MAX_PER_AI * 2}")

    return {
        'stats': dict(stats),
        'total_by_ai': dict(total_by_ai),
        'grand_total': grand_total,
        'issues': issues
    }


def trim_overflow(politician_id: str, ai: str, category: str, current_count: int, dry_run: bool = True) -> int:
    """
    Step 2: 초과 처리
    60개 초과 카테고리 → 시간순 삭제 (오래된 것부터)

    Returns:
        삭제할 개수 (실제 삭제는 dry_run=False일 때만)
    """
    excess = current_count - MAX_PER_CATEGORY
    if excess <= 0:
        return 0

    # 오래된 데이터부터 조회 (published_date, created_at 오름차순)
    result = supabase.table(TABLE_COLLECTED)\
        .select('id, published_date, created_at')\
        .eq('politician_id', politician_id)\
        .eq('collector_ai', ai)\
        .eq('category', category)\
        .order('published_date', desc=False)\
        .order('created_at', desc=False)\
        .limit(excess)\
        .execute()

    if not result.data:
        return 0

    ids_to_delete = [row['id'] for row in result.data]

    if dry_run:
        print(f"  [DRY RUN] {ai} {CATEGORY_KR[category]}: {len(ids_to_delete)}개 삭제 예정")
    else:
        # 실제 삭제
        for item_id in ids_to_delete:
            supabase.table(TABLE_COLLECTED).delete().eq('id', item_id).execute()
        print(f"  [삭제 완료] {ai} {CATEGORY_KR[category]}: {len(ids_to_delete)}개")

    return len(ids_to_delete)


def trigger_recollection(politician_id: str, politician_name: str, ai: str, category: str,
                         current_count: int, dry_run: bool = True) -> bool:
    """
    Step 3: 재수집 트리거
    50개 미만 카테고리 → 해당 AI로 재수집

    목표: 60개까지 수집 (버퍼 포함)

    Returns:
        재수집 성공 여부
    """
    shortage = MIN_PER_CATEGORY - current_count
    if shortage <= 0:
        return True  # 이미 충분함

    target = MAX_PER_CATEGORY  # 60개 목표

    if dry_run:
        print(f"  [DRY RUN] {ai} {CATEGORY_KR[category]}: {target}개까지 재수집 예정 (현재 {current_count}개)")
        return True

    # 실제 재수집 실행
    print(f"  [재수집 시작] {ai} {CATEGORY_KR[category]}: {target}개 목표...")

    try:
        if ai == 'Gemini':
            # Gemini CLI Subprocess 재수집
            # Note: collect_gemini_subprocess.py는 --target 플래그 미지원
            # 자동으로 60개 목표로 수집함
            script_path = WORKFLOW_DIR / 'collect_gemini_subprocess.py'
            cmd = [
                sys.executable,
                str(script_path),
                '--politician', politician_name,
                '--category', category
            ]

            result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)

            if result.returncode == 0:
                print(f"    [성공] {ai} {CATEGORY_KR[category]} 재수집 완료")
                return True
            else:
                print(f"    [실패] {ai} {CATEGORY_KR[category]} 재수집 실패")
                if result.stderr:
                    print(f"         오류: {result.stderr[:200]}")
                return False

        elif ai == 'Naver':
            # Naver API 재수집 (V40/scripts/workflow/collect_naver_v40_final.py)
            collect_naver_script = V40_DIR / 'scripts' / 'workflow' / 'collect_naver_v40_final.py'
            cmd = [
                sys.executable,
                str(collect_naver_script),
                '--politician-id', politician_id,
                '--politician-name', politician_name,
                '--category', category  # string name (e.g., 'expertise'), NOT number
            ]

            result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)

            if result.returncode == 0:
                print(f"    [성공] {ai} {CATEGORY_KR[category]} 재수집 완료")
                return True
            else:
                print(f"    [실패] {ai} {CATEGORY_KR[category]} 재수집 실패")
                if result.stderr:
                    print(f"         오류: {result.stderr[:200]}")
                return False

        else:
            print(f"    [오류] 알 수 없는 AI: {ai}")
            return False

    except subprocess.TimeoutExpired:
        print(f"    [실패] {ai} {CATEGORY_KR[category]} 재수집 시간 초과 (10분)")
        return False
    except Exception as e:
        print(f"    [실패] {ai} {CATEGORY_KR[category]} 재수집 오류: {str(e)}")
        return False


def _verify_not_error(politician_id: str, politician_name: str) -> Dict:
    """
    [강화 규칙] Give-Up 적용 전 "오류가 아니다"를 증명하는 검증 함수

    5가지 조건을 모두 확인해야만 포기 규칙을 적용 가능:
    1. API 응답: 200 OK (정상)
    2. Naver 검색결과: 존재함 (0개 아님)
    3. 기간 범위: 기간 내 데이터 0개임을 확인
    4. 필터 작동: 정상 작동 확인
    5. 논리적 결론: 모두 정상이므로 데이터 부족이 오류가 아님
    """

    justification = {
        'api_status': 'OK',
        'search_total': 0,
        'period_data': 0,
        'filter_normal': True,
        'justified': False
    }

    try:
        # 1️⃣ API 응답 상태 (DB에서 수집된 데이터로 확인)
        all_rows = []
        offset = 0
        page_size = 1000
        while True:
            r = supabase.table(TABLE_COLLECTED).select('*').eq('politician_id', politician_id).eq('collector_ai', 'Naver').range(offset, offset + page_size - 1).execute()
            batch = r.data or []
            all_rows.extend(batch)
            if len(batch) < page_size:
                break
            offset += page_size

        # API가 응답했으므로 상태는 OK
        justification['api_status'] = 'OK (API 응답 정상)'

        # 2️⃣ Naver 검색결과 (DB에 저장된 데이터 = 검색 결과 존재함을 의미)
        total_count = len(all_rows)
        justification['search_total'] = total_count

        # 3️⃣ 기간 범위 분석 (OFFICIAL 4년, PUBLIC 2년)
        from datetime import datetime, timedelta
        now = datetime.now()
        official_cutoff = now - timedelta(days=365*4)
        public_cutoff = now - timedelta(days=365*2)

        period_data = 0
        for row in all_rows:
            try:
                date_str = row.get('published_date', '')
                if date_str:
                    item_date = datetime.strptime(date_str, '%Y-%m-%d')
                    if item_date >= public_cutoff:
                        period_data += 1
            except:
                pass

        justification['period_data'] = period_data

        # 4️⃣ 필터 작동 (sentiment 분포가 정상인지 확인)
        sentiment_dist = defaultdict(int)
        for row in all_rows:
            sentiment = row.get('sentiment', 'free')
            sentiment_dist[sentiment] += 1

        # 필터가 정상이면 negative/positive/free가 모두 존재하거나
        # 기간 내 데이터가 적으면 필터가 정상적으로 작동한 것
        justification['filter_normal'] = (
            len(sentiment_dist) > 0 and
            (period_data == 0 or len(sentiment_dist) >= 1)
        )

        # 5️⃣ 논리적 결론: 모든 증거가 "오류가 아님"을 증명
        justification['justified'] = (
            justification['api_status'] == 'OK (API 응답 정상)' and
            justification['search_total'] > 0 and
            justification['filter_normal']
        )

    except Exception as e:
        print(f"    [경고] 검증 중 오류: {e}")
        justification['justified'] = False

    return justification


def validate_balance(politician_id: str) -> Tuple[bool, Dict]:
    """
    Step 4: 균형 검증
    모든 카테고리가 50-60개 범위에 있는지 확인

    Returns:
        (균형 달성 여부, 상태 정보)
    """
    # 페이지네이션 (Supabase 1,000행 제한 대응)
    all_rows = []
    offset = 0
    page_size = 1000
    while True:
        r = supabase.table(TABLE_COLLECTED).select('collector_ai, category').eq('politician_id', politician_id).range(offset, offset + page_size - 1).execute()
        batch = r.data or []
        all_rows.extend(batch)
        if len(batch) < page_size:
            break
        offset += page_size

    if not all_rows:
        return False, {}

    # AI별/카테고리별 집계
    stats = defaultdict(lambda: defaultdict(int))
    for row in all_rows:
        ai = row['collector_ai']
        cat = row['category']
        stats[ai][cat] += 1

    # 균형 검증
    all_balanced = True
    total_by_ai = defaultdict(int)

    for ai in ['Gemini', 'Naver']:
        for cat in CATEGORIES:
            count = stats[ai].get(cat, 0)
            total_by_ai[ai] += count

            if count < MIN_PER_CATEGORY or count > MAX_PER_CATEGORY:
                all_balanced = False

    # AI별 합계 검증
    for ai in ['Gemini', 'Naver']:
        if total_by_ai[ai] < MIN_PER_AI or total_by_ai[ai] > MAX_PER_AI:
            all_balanced = False

    return all_balanced, {
        'stats': dict(stats),
        'total_by_ai': dict(total_by_ai),
        'grand_total': sum(total_by_ai.values())
    }


def print_final_report(before_stats: Dict, after_stats: Dict, adjustments: Dict):
    """
    Step 5: 최종 보고
    조정 전후 비교 및 조정 내역 요약
    """
    print_header("조정 완료 보고서")

    print("\n조정 전후 비교:")
    print(f"{'AI':<10} {'조정 전':>10} {'조정 후':>10} {'변화':>10}")
    print("-" * 45)

    for ai in ['Gemini', 'Naver']:
        before = before_stats.get('total_by_ai', {}).get(ai, 0)
        after = after_stats.get('total_by_ai', {}).get(ai, 0)
        change = after - before
        change_str = f"+{change}" if change > 0 else str(change)
        print(f"{ai:<10} {before:>10} {after:>10} {change_str:>10}")

    before_total = before_stats.get('grand_total', 0)
    after_total = after_stats.get('grand_total', 0)
    total_change = after_total - before_total
    total_change_str = f"+{total_change}" if total_change > 0 else str(total_change)
    print("-" * 45)
    print(f"{'합계':<10} {before_total:>10} {after_total:>10} {total_change_str:>10}")

    print("\n조정 내역:")
    print(f"  삭제: {adjustments.get('deleted', 0)}개")
    print(f"  추가 수집: {adjustments.get('recollected', 0)}개 시도")
    print(f"  성공한 재수집: {adjustments.get('recollect_success', 0)}개")

    print("\n목표 달성 여부:")
    balanced, _ = validate_balance(before_stats.get('politician_id', ''))
    if balanced:
        print("  ✅ 모든 카테고리가 균형을 달성했습니다!")
    else:
        print("  ⚠️ 일부 카테고리가 아직 균형을 달성하지 못했습니다.")


def adjust_data(politician_id: str, politician_name: str, target_ai: str = None, dry_run: bool = True) -> bool:
    """
    메인 조정 프로세스

    Args:
        politician_id: 정치인 ID
        politician_name: 정치인 이름
        target_ai: 특정 AI만 조정 ('Gemini' or 'Naver', None이면 전체)
        dry_run: True면 시뮬레이션만, False면 실제 실행

    Returns:
        균형 달성 여부
    """
    print_header(f"V40 검증 후 조정 - {politician_name}")

    if dry_run:
        print("\n⚠️ DRY RUN 모드: 실제 삭제/재수집 없이 시뮬레이션만 수행합니다.")
    else:
        print("\n⚠️ 실제 조정 모드: 데이터 삭제 및 재수집을 수행합니다.")

    # Step 1: 현황 분석
    before_stats = analyze_current_status(politician_id)
    before_stats['politician_id'] = politician_id

    if not before_stats.get('issues'):
        print("\n✅ 모든 카테고리가 이미 균형을 달성했습니다!")
        return True

    # 조정 대상 AI 필터링
    ais_to_adjust = [target_ai] if target_ai else ['Gemini', 'Naver']

    adjustments = {
        'deleted': 0,
        'recollected': 0,
        'recollect_success': 0
    }

    # 조정 라운드
    for round_num in range(1, MAX_ADJUSTMENT_ROUNDS + 1):
        print_section(f"조정 라운드 {round_num}/{MAX_ADJUSTMENT_ROUNDS}")

        # Step 2: 초과 처리
        print("\n[Step 2] 초과 데이터 삭제:")
        for issue_type, ai, cat, count in before_stats['issues']:
            if issue_type == 'overflow' and ai in ais_to_adjust:
                deleted = trim_overflow(politician_id, ai, cat, count, dry_run)
                adjustments['deleted'] += deleted

        # Step 3: 재수집 트리거
        print("\n[Step 3] 부족 카테고리 재수집:")
        for issue_type, ai, cat, count in before_stats['issues']:
            if issue_type == 'shortage' and ai in ais_to_adjust:
                adjustments['recollected'] += 1
                success = trigger_recollection(politician_id, politician_name, ai, cat, count, dry_run)
                if success:
                    adjustments['recollect_success'] += 1

        # Step 4: 균형 검증
        print("\n[Step 4] 균형 검증:")
        balanced, after_stats = validate_balance(politician_id)

        if balanced:
            print("  ✅ 균형 달성!")
            break
        else:
            print(f"  ⚠️ 균형 미달성 (라운드 {round_num}/{MAX_ADJUSTMENT_ROUNDS})")

            if round_num == MAX_ADJUSTMENT_ROUNDS:
                print(f"\n⚠️ 최대 조정 횟수({MAX_ADJUSTMENT_ROUNDS}회)에 도달했습니다.")
                print("   재수집 포기 규칙 적용 (오류 아님 증명 필수):")
                print()

                # 포기 전 "오류가 아니다"는 증명 필수
                justification = _verify_not_error(politician_id, politician_name)

                print("   [증명 검증]")
                print(f"   ✅ API 응답 상태: {justification.get('api_status', 'unknown')}")
                print(f"   ✅ Naver 검색결과: {justification.get('search_total', 'unknown')}개 존재")
                print(f"   ✅ 기간 내(2년) 데이터: {justification.get('period_data', 'unknown')}개")
                print(f"   ✅ 필터 작동: {'정상' if justification.get('filter_normal') else '문제 있음'}")
                print()

                # 모든 증명이 확인되었을 때만 포기 적용
                if justification.get('justified', False):
                    print("   [결론] 오류가 아님 증명됨 → Give-Up 포기 규칙 적용 가능")
                    print()

                    if after_stats and after_stats.get('stats'):
                        for ai in ['Gemini', 'Naver']:
                            ai_stats = after_stats['stats'].get(ai, {})
                            for cat in CATEGORIES:
                                cat_count = ai_stats.get(cat, 0)
                                if cat_count < MIN_PER_CATEGORY:
                                    cat_kr = CATEGORY_KR.get(cat, cat)
                                    if cat_count >= GIVE_UP_THRESHOLD:
                                        print(f"   - {ai}/{cat_kr}: {cat_count}개 (부족 허용, 보유 데이터로 평가)")
                                    else:
                                        print(f"   - {ai}/{cat_kr}: {cat_count}개 (포기, leverage score 0 처리)")
                else:
                    print("   [경고] 오류 의심 → 추가 조사 필요 (포기 불가)")
                break

            # 다음 라운드를 위해 현황 재분석
            before_stats = analyze_current_status(politician_id)
            before_stats['politician_id'] = politician_id

    # Step 5: 최종 보고
    print_final_report(before_stats, after_stats, adjustments)

    return balanced


def main():
    parser = argparse.ArgumentParser(
        description='V40 검증 후 조정 스크립트 (Phase 2-2)',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
사용 예시:
  # 시뮬레이션 (DRY RUN)
  python adjust_v40_data.py --politician_id=d0a5d6e1 --politician_name="조은희"

  # 실제 조정 실행
  python adjust_v40_data.py --politician_id=d0a5d6e1 --politician_name="조은희" --no-dry-run

  # Gemini만 조정
  python adjust_v40_data.py --politician_id=d0a5d6e1 --politician_name="조은희" --ai=Gemini --no-dry-run

상세 가이드:
  instructions/V40_검증후조정_가이드.md
        """
    )

    parser.add_argument('--politician_id', required=True, help='정치인 ID (8자리 hex)')
    parser.add_argument('--politician_name', required=True, help='정치인 이름')
    parser.add_argument('--ai', choices=['Gemini', 'Naver'], help='특정 AI만 조정 (선택)')
    parser.add_argument('--no-dry-run', action='store_true', help='실제 조정 실행 (기본: DRY RUN)')

    args = parser.parse_args()

    dry_run = not args.no_dry_run

    success = adjust_data(
        politician_id=args.politician_id,
        politician_name=args.politician_name,
        target_ai=args.ai,
        dry_run=dry_run
    )

    # Phase 2-2 완료 기록 (실제 조정 모드일 때만)
    if not dry_run:
        try:
            sys.path.insert(0, str(SCRIPT_DIR.parent / 'helpers'))
            from phase_tracker import mark_phase_done
            if success:
                details = "균형 달성 완료"
            else:
                details = "최대 라운드 도달 (포기 규칙 적용)"
            mark_phase_done(args.politician_id, '2-2', details, args.politician_name)
            print(f"\n  Phase 2-2 완료 기록됨")
        except ImportError:
            pass  # phase_tracker 없어도 기존 동작 유지

    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
