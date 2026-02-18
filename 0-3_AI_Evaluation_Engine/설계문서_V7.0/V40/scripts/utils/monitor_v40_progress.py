# -*- coding: utf-8 -*-
"""
V40 평가 진행 상황 실시간 모니터링

팀메이트들의 작업 진행도를 실시간으로 추적
"""

import os
import sys
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 환경 변수 로드
load_dotenv(override=True)

# Supabase 클라이언트
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# 카테고리
CATEGORIES = [
    'expertise', 'leadership', 'vision', 'integrity', 'ethics',
    'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest'
]

# 평가 AI
EVALUATION_AIS = ['Claude', 'ChatGPT', 'Gemini', 'Grok']


def print_header(title):
    """헤더 출력"""
    print(f"\n{'='*70}")
    print(f" {title}")
    print(f"{'='*70}\n")


def get_collection_progress(politician_id, politician_name):
    """Phase 1: 데이터 수집 진행 상황"""
    print(f"📊 [{politician_name}] Phase 1: 데이터 수집 진행 현황")
    print(f"{'─'*70}")

    total_collected = 0
    total_target = len(CATEGORIES) * 100  # 카테고리당 100개 목표

    for category in CATEGORIES:
        result = supabase.table('collected_data_v40') \
            .select('*', count='exact') \
            .eq('politician_id', politician_id) \
            .eq('category', category) \
            .execute()

        count = result.count or 0
        total_collected += count

        # 진행률 계산
        progress = (count / 100) * 100 if count > 0 else 0
        bar_length = 30
        filled = int(bar_length * progress / 100)
        bar = '█' * filled + '░' * (bar_length - filled)

        # 상태 표시
        if count >= 100:
            status = '✅'
        elif count >= 80:
            status = '🟡'
        else:
            status = '🔴'

        print(f"  {status} {category:18} [{bar}] {count:3d}/100 ({progress:5.1f}%)")

    print(f"{'─'*70}")
    overall_progress = (total_collected / total_target) * 100
    print(f"  📈 전체 진행률: {total_collected}/{total_target} ({overall_progress:.1f}%)")

    # 버퍼 포함 최대치 확인
    max_with_buffer = len(CATEGORIES) * 120
    if total_collected > max_with_buffer:
        print(f"  ⚠️  버퍼 초과: {total_collected} > {max_with_buffer} (최대 120%)")

    return total_collected, overall_progress


def get_evaluation_progress(politician_id, politician_name):
    """Phase 3: AI 평가 진행 상황"""
    print(f"\n🤖 [{politician_name}] Phase 3: AI 평가 진행 현황")
    print(f"{'─'*70}")

    # 전체 수집된 데이터 개수
    collected_result = supabase.table('collected_data_v40') \
        .select('*', count='exact') \
        .eq('politician_id', politician_id) \
        .execute()

    total_collected = collected_result.count or 0

    if total_collected == 0:
        print("  ⏳ 수집된 데이터 없음 (Phase 1 진행 중)")
        return 0, 0

    # 각 데이터는 4번 평가되어야 함 (4개 AI)
    expected_evaluations = total_collected * 4

    total_evaluated = 0

    for ai in EVALUATION_AIS:
        result = supabase.table('evaluations_v40') \
            .select('*', count='exact') \
            .eq('politician_id', politician_id) \
            .eq('evaluator_ai', ai) \
            .execute()

        count = result.count or 0
        total_evaluated += count

        # 진행률 계산
        progress = (count / total_collected) * 100 if total_collected > 0 else 0
        bar_length = 30
        filled = int(bar_length * progress / 100)
        bar = '█' * filled + '░' * (bar_length - filled)

        # 상태 표시
        if count >= total_collected:
            status = '✅'
        elif count >= total_collected * 0.5:
            status = '🟡'
        else:
            status = '🔴'

        print(f"  {status} {ai:10} [{bar}] {count:4d}/{total_collected} ({progress:5.1f}%)")

    print(f"{'─'*70}")
    overall_progress = (total_evaluated / expected_evaluations) * 100 if expected_evaluations > 0 else 0
    print(f"  📈 전체 평가율: {total_evaluated}/{expected_evaluations} ({overall_progress:.1f}%)")

    # 95% 기준 확인
    if overall_progress >= 95:
        print(f"  ✅ 95% 기준 통과")
    elif overall_progress > 0:
        print(f"  ⚠️  95% 기준 미달 (현재 {overall_progress:.1f}%)")

    return total_evaluated, overall_progress


def get_score_status(politician_id, politician_name):
    """Phase 4: 점수 계산 상태"""
    print(f"\n💯 [{politician_name}] Phase 4: 점수 계산 상태")
    print(f"{'─'*70}")

    # 카테고리별 점수
    cat_result = supabase.table('ai_category_scores_v40') \
        .select('*') \
        .eq('politician_id', politician_id) \
        .execute()

    if not cat_result.data:
        print("  ⏳ 점수 미계산 (Phase 3 진행 중)")
        return False

    print(f"  ✅ 카테고리별 점수: {len(cat_result.data)}/10개")

    # 최종 점수
    final_result = supabase.table('ai_final_scores_v40') \
        .select('*') \
        .eq('politician_id', politician_id) \
        .execute()

    if final_result.data:
        score_data = final_result.data[0]
        print(f"  ✅ 최종 점수: {score_data['final_score']}점")
        print(f"  ✅ 등급: {score_data['grade']} ({score_data.get('grade_name', 'N/A')})")
        return True
    else:
        print("  ⏳ 최종 점수 미계산")
        return False


def get_report_status(politician_id, politician_name):
    """Phase 5: 보고서 생성 상태"""
    print(f"\n📄 [{politician_name}] Phase 5: 보고서 생성 상태")
    print(f"{'─'*70}")

    # 보고서 파일 경로
    today = datetime.now().strftime('%Y%m%d')
    report_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        '보고서'
    )
    report_file = os.path.join(report_dir, f'{politician_name}_{today}.md')

    if os.path.exists(report_file):
        file_size = os.path.getsize(report_file)
        print(f"  ✅ 보고서 생성 완료: {report_file}")
        print(f"  ✅ 파일 크기: {file_size:,} bytes")
        return True
    else:
        print(f"  ⏳ 보고서 미생성")
        return False


def monitor_politician(politician_id, politician_name):
    """정치인별 전체 진행 상황 모니터링"""
    print_header(f"{politician_name} (ID: {politician_id}) - V40 평가 진행 상황")

    # Phase 1: 데이터 수집
    collected_count, collection_progress = get_collection_progress(politician_id, politician_name)

    # Phase 3: AI 평가
    evaluated_count, evaluation_progress = get_evaluation_progress(politician_id, politician_name)

    # Phase 4: 점수 계산
    score_calculated = get_score_status(politician_id, politician_name)

    # Phase 5: 보고서 생성
    report_generated = get_report_status(politician_id, politician_name)

    # 전체 상태 요약
    print(f"\n📊 전체 파이프라인 상태")
    print(f"{'─'*70}")

    phases = [
        ('Phase 1: 데이터 수집', collection_progress >= 100),
        ('Phase 2: 검증/중복제거', collection_progress >= 100),  # 수집 완료 후 자동 실행
        ('Phase 3: AI 평가', evaluation_progress >= 95),
        ('Phase 4: 점수 계산', score_calculated),
        ('Phase 5: 보고서 생성', report_generated)
    ]

    for phase_name, completed in phases:
        status = '✅' if completed else '⏳'
        print(f"  {status} {phase_name}")

    # 전체 완료 여부
    all_completed = all(completed for _, completed in phases)

    print(f"{'─'*70}")
    if all_completed:
        print(f"  🎉 [{politician_name}] 모든 Phase 완료!")
    else:
        completed_count = sum(1 for _, completed in phases if completed)
        print(f"  🔄 진행 중: {completed_count}/5 Phase 완료")

    return all_completed


def monitor_all():
    """전체 팀메이트 진행 상황 모니터링"""
    politicians = [
        ('d0a5d6e1', '조은희'),
        ('8c5dcc89', '박주민')
    ]

    print_header(f"V40 평가 팀 전체 진행 현황 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    all_completed = []

    for politician_id, politician_name in politicians:
        completed = monitor_politician(politician_id, politician_name)
        all_completed.append(completed)
        print()

    # 전체 팀 상태
    print_header("팀 전체 요약")

    if all(all_completed):
        print("  🎉 모든 팀메이트 작업 완료!")
        print("  ✅ 조은희 평가 완료")
        print("  ✅ 박주민 평가 완료")
    else:
        for (politician_id, politician_name), completed in zip(politicians, all_completed):
            status = '✅ 완료' if completed else '🔄 진행 중'
            print(f"  {status}: {politician_name}")


if __name__ == '__main__':
    monitor_all()
