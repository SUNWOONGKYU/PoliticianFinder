# -*- coding: utf-8 -*-
"""
V40 Phase별 품질 검증 자동화

각 Phase 완료 시 품질 기준 자동 검증 및 alert
"""

import os
import sys
from datetime import datetime, timedelta
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


def validate_phase1_collection(politician_id, politician_name):
    """
    Phase 1: 데이터 수집 품질 검증

    기준:
    - 카테고리당 100~120개 (버퍼 20%)
    - 중복 URL 없어야 함
    - URL 유효성
    """
    print(f"\n{'='*70}")
    print(f"Phase 1 품질 검증: {politician_name}")
    print(f"{'='*70}\n")

    issues = []
    passed = True

    # 1. 카테고리별 수집 개수 검증
    print("📊 카테고리별 수집 개수 검증")
    print(f"{'─'*70}")

    for category in CATEGORIES:
        result = supabase.table('collected_data_v40') \
            .select('*', count='exact') \
            .eq('politician_id', politician_id) \
            .eq('category', category) \
            .execute()

        count = result.count or 0

        if count < 100:
            status = '❌ 미달'
            issues.append(f"{category}: {count}개 (최소 100개 필요)")
            passed = False
        elif count > 120:
            status = '⚠️  초과'
            issues.append(f"{category}: {count}개 (최대 120개 권장)")
            passed = False
        else:
            status = '✅ 통과'

        print(f"  {status} {category:18}: {count:3d}개 (100~120 권장)")

    # 2. 중복 URL 검증
    print(f"\n🔍 중복 URL 검증")
    print(f"{'─'*70}")

    dup_result = supabase.rpc('check_v40_duplicate_urls', {
        'p_politician_id': politician_id
    }).execute()

    if dup_result.data and len(dup_result.data) > 0:
        print(f"  ❌ 중복 URL 발견: {len(dup_result.data)}건")
        for dup in dup_result.data[:5]:  # 최대 5건만 표시
            print(f"     - {dup['source_url']} ({dup['count']}회)")
        issues.append(f"중복 URL {len(dup_result.data)}건")
        passed = False
    else:
        print(f"  ✅ 중복 URL 없음")

    # 3. URL 유효성 검증 (NULL이나 빈 값)
    print(f"\n🔗 URL 유효성 검증")
    print(f"{'─'*70}")

    invalid_result = supabase.table('collected_data_v40') \
        .select('*', count='exact') \
        .eq('politician_id', politician_id) \
        .or_('source_url.is.null,source_url.eq.') \
        .execute()

    invalid_count = invalid_result.count or 0

    if invalid_count > 0:
        print(f"  ❌ 유효하지 않은 URL: {invalid_count}건")
        issues.append(f"유효하지 않은 URL {invalid_count}건")
        passed = False
    else:
        print(f"  ✅ 모든 URL 유효")

    # 결과 요약
    print(f"\n{'='*70}")
    if passed:
        print(f"✅ Phase 1 품질 검증 통과: {politician_name}")
    else:
        print(f"❌ Phase 1 품질 검증 실패: {politician_name}")
        print(f"\n발견된 이슈:")
        for issue in issues:
            print(f"  - {issue}")

    return passed, issues


def validate_phase2_validation(politician_id, politician_name):
    """
    Phase 2: 검증/중복제거 품질 검증

    기준:
    - 중복 제거 완료
    - 기간 제한 검증 (OFFICIAL 4년, PUBLIC 2년)
    - is_verified = TRUE
    """
    print(f"\n{'='*70}")
    print(f"Phase 2 품질 검증: {politician_name}")
    print(f"{'='*70}\n")

    issues = []
    passed = True

    # 1. 검증 완료 여부
    print("✓ 검증 완료 상태")
    print(f"{'─'*70}")

    verified_result = supabase.table('collected_data_v40') \
        .select('*', count='exact') \
        .eq('politician_id', politician_id) \
        .eq('is_verified', True) \
        .execute()

    total_result = supabase.table('collected_data_v40') \
        .select('*', count='exact') \
        .eq('politician_id', politician_id) \
        .execute()

    verified_count = verified_result.count or 0
    total_count = total_result.count or 0

    if total_count > 0:
        verify_rate = (verified_count / total_count) * 100
        if verify_rate < 100:
            print(f"  ⚠️  검증율: {verify_rate:.1f}% ({verified_count}/{total_count})")
            issues.append(f"미검증 데이터 {total_count - verified_count}건")
        else:
            print(f"  ✅ 검증율: 100% ({verified_count}/{total_count})")
    else:
        print(f"  ⚠️  수집된 데이터 없음")
        passed = False

    # 2. 기간 제한 검증
    print(f"\n📅 기간 제한 검증")
    print(f"{'─'*70}")

    today = datetime.now()
    official_limit = today - timedelta(days=1460)  # 4년
    public_limit = today - timedelta(days=730)     # 2년

    # OFFICIAL 데이터 기간 검증
    official_old = supabase.table('collected_data_v40') \
        .select('*', count='exact') \
        .eq('politician_id', politician_id) \
        .eq('data_type', 'official') \
        .lt('published_date', official_limit.strftime('%Y-%m-%d')) \
        .execute()

    if official_old.count and official_old.count > 0:
        print(f"  ❌ OFFICIAL 기간 초과: {official_old.count}건 (4년 이상 된 데이터)")
        issues.append(f"OFFICIAL 기간 초과 {official_old.count}건")
        passed = False
    else:
        print(f"  ✅ OFFICIAL 기간 준수 (4년 이내)")

    # PUBLIC 데이터 기간 검증
    public_old = supabase.table('collected_data_v40') \
        .select('*', count='exact') \
        .eq('politician_id', politician_id) \
        .eq('data_type', 'public') \
        .lt('published_date', public_limit.strftime('%Y-%m-%d')) \
        .execute()

    if public_old.count and public_old.count > 0:
        print(f"  ❌ PUBLIC 기간 초과: {public_old.count}건 (2년 이상 된 데이터)")
        issues.append(f"PUBLIC 기간 초과 {public_old.count}건")
        passed = False
    else:
        print(f"  ✅ PUBLIC 기간 준수 (2년 이내)")

    # 결과 요약
    print(f"\n{'='*70}")
    if passed:
        print(f"✅ Phase 2 품질 검증 통과: {politician_name}")
    else:
        print(f"❌ Phase 2 품질 검증 실패: {politician_name}")
        print(f"\n발견된 이슈:")
        for issue in issues:
            print(f"  - {issue}")

    return passed, issues


def validate_phase3_evaluation(politician_id, politician_name):
    """
    Phase 3: AI 평가 품질 검증

    기준:
    - 평가 완료율 97% 이상
    - X(제외) 비율 3% 이하
    - 각 데이터당 4번 평가 (4개 AI)
    """
    print(f"\n{'='*70}")
    print(f"Phase 3 품질 검증: {politician_name}")
    print(f"{'='*70}\n")

    issues = []
    passed = True

    # 수집된 데이터 개수
    collected_result = supabase.table('collected_data_v40') \
        .select('*', count='exact') \
        .eq('politician_id', politician_id) \
        .execute()

    total_collected = collected_result.count or 0

    if total_collected == 0:
        print("  ⚠️  수집된 데이터 없음")
        return False, ['수집된 데이터 없음']

    # 기대 평가 개수 (각 데이터당 4번)
    expected_evaluations = total_collected * 4

    # 1. 평가 완료율 검증
    print("📊 평가 완료율 검증")
    print(f"{'─'*70}")

    eval_result = supabase.table('evaluations_v40') \
        .select('*', count='exact') \
        .eq('politician_id', politician_id) \
        .execute()

    total_evaluations = eval_result.count or 0
    completion_rate = (total_evaluations / expected_evaluations) * 100 if expected_evaluations > 0 else 0

    if completion_rate < 97:
        print(f"  ❌ 평가 완료율: {completion_rate:.1f}% (최소 97% 필요)")
        issues.append(f"평가 완료율 {completion_rate:.1f}% (미달)")
        passed = False
    else:
        print(f"  ✅ 평가 완료율: {completion_rate:.1f}% ({total_evaluations}/{expected_evaluations})")

    # 2. X(제외) 비율 검증
    print(f"\n🚫 X(제외) 비율 검증")
    print(f"{'─'*70}")

    x_result = supabase.table('evaluations_v40') \
        .select('*', count='exact') \
        .eq('politician_id', politician_id) \
        .eq('rating', 'X') \
        .execute()

    x_count = x_result.count or 0
    x_rate = (x_count / expected_evaluations) * 100 if expected_evaluations > 0 else 0

    if x_rate > 3:
        print(f"  ⚠️  X(제외) 비율: {x_rate:.1f}% ({x_count}/{expected_evaluations}) - 높음")
        issues.append(f"X(제외) 비율 {x_rate:.1f}% (3% 초과)")
    else:
        print(f"  ✅ X(제외) 비율: {x_rate:.1f}% ({x_count}/{expected_evaluations})")

    # 3. AI별 평가 개수 검증
    print(f"\n🤖 AI별 평가 개수 검증")
    print(f"{'─'*70}")

    for ai in EVALUATION_AIS:
        ai_result = supabase.table('evaluations_v40') \
            .select('*', count='exact') \
            .eq('politician_id', politician_id) \
            .eq('evaluator_ai', ai) \
            .execute()

        ai_count = ai_result.count or 0
        ai_rate = (ai_count / total_collected) * 100 if total_collected > 0 else 0

        if ai_count < total_collected * 0.97:
            status = '⚠️'
            issues.append(f"{ai} 평가 부족: {ai_count}/{total_collected}")
        else:
            status = '✅'

        print(f"  {status} {ai:10}: {ai_count}/{total_collected} ({ai_rate:.1f}%)")

    # 결과 요약
    print(f"\n{'='*70}")
    if passed:
        print(f"✅ Phase 3 품질 검증 통과: {politician_name}")
    else:
        print(f"❌ Phase 3 품질 검증 실패: {politician_name}")
        print(f"\n발견된 이슈:")
        for issue in issues:
            print(f"  - {issue}")

    return passed, issues


def validate_phase4_scoring(politician_id, politician_name):
    """
    Phase 4: 점수 계산 품질 검증

    기준:
    - 카테고리별 점수: 20~100점
    - 최종 점수: 200~1000점
    - 이상치 탐지
    """
    print(f"\n{'='*70}")
    print(f"Phase 4 품질 검증: {politician_name}")
    print(f"{'='*70}\n")

    issues = []
    passed = True

    # 1. 카테고리별 점수 검증
    print("📊 카테고리별 점수 검증")
    print(f"{'─'*70}")

    cat_result = supabase.table('ai_category_scores_v40') \
        .select('*') \
        .eq('politician_id', politician_id) \
        .execute()

    if not cat_result.data:
        print(f"  ❌ 카테고리별 점수 없음")
        return False, ['카테고리별 점수 미계산']

    if len(cat_result.data) != 10:
        print(f"  ⚠️  카테고리 개수: {len(cat_result.data)}/10")
        issues.append(f"카테고리 점수 부족: {len(cat_result.data)}/10")
        passed = False
    else:
        print(f"  ✅ 카테고리 개수: 10/10")

    # 점수 범위 검증
    for cat_score in cat_result.data:
        category = cat_score['category']
        score = cat_score['score']

        if score < 20 or score > 100:
            print(f"  ❌ {category}: {score}점 (범위 위반: 20~100)")
            issues.append(f"{category} 점수 범위 위반: {score}점")
            passed = False
        else:
            print(f"  ✅ {category}: {score}점")

    # 2. 최종 점수 검증
    print(f"\n💯 최종 점수 검증")
    print(f"{'─'*70}")

    final_result = supabase.table('ai_final_scores_v40') \
        .select('*') \
        .eq('politician_id', politician_id) \
        .execute()

    if not final_result.data:
        print(f"  ❌ 최종 점수 없음")
        issues.append('최종 점수 미계산')
        passed = False
    else:
        final_data = final_result.data[0]
        final_score = final_data['final_score']
        grade = final_data['grade']

        if final_score < 200 or final_score > 1000:
            print(f"  ❌ 최종 점수: {final_score}점 (범위 위반: 200~1000)")
            issues.append(f"최종 점수 범위 위반: {final_score}점")
            passed = False
        else:
            print(f"  ✅ 최종 점수: {final_score}점")
            print(f"  ✅ 등급: {grade} ({final_data.get('grade_name', 'N/A')})")

    # 결과 요약
    print(f"\n{'='*70}")
    if passed:
        print(f"✅ Phase 4 품질 검증 통과: {politician_name}")
    else:
        print(f"❌ Phase 4 품질 검증 실패: {politician_name}")
        print(f"\n발견된 이슈:")
        for issue in issues:
            print(f"  - {issue}")

    return passed, issues


def validate_phase5_report(politician_id, politician_name):
    """
    Phase 5: 보고서 생성 품질 검증

    기준:
    - 보고서 파일 존재
    - 필수 섹션 포함
    - 파일 크기 검증
    """
    print(f"\n{'='*70}")
    print(f"Phase 5 품질 검증: {politician_name}")
    print(f"{'='*70}\n")

    issues = []
    passed = True

    # 보고서 파일 경로
    today = datetime.now().strftime('%Y%m%d')
    report_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        '보고서'
    )
    report_file = os.path.join(report_dir, f'{politician_name}_{today}.md')

    print(f"📄 보고서 파일 검증")
    print(f"{'─'*70}")

    if not os.path.exists(report_file):
        print(f"  ❌ 보고서 파일 없음: {report_file}")
        issues.append('보고서 파일 미생성')
        return False, issues

    # 파일 크기 검증
    file_size = os.path.getsize(report_file)
    if file_size < 1000:  # 1KB 미만
        print(f"  ⚠️  파일 크기: {file_size} bytes (너무 작음)")
        issues.append(f"파일 크기 부족: {file_size} bytes")
        passed = False
    else:
        print(f"  ✅ 파일 존재: {report_file}")
        print(f"  ✅ 파일 크기: {file_size:,} bytes")

    # 필수 섹션 검증
    print(f"\n📋 필수 섹션 검증")
    print(f"{'─'*70}")

    required_sections = [
        '# AI 기반 정치인 상세평가 보고서',
        '## 기본 정보',
        '## 종합 평가',
        '## 카테고리별 상세 평가',
        '## 평가 방법론'
    ]

    with open(report_file, 'r', encoding='utf-8') as f:
        content = f.read()

    for section in required_sections:
        if section in content:
            print(f"  ✅ {section}")
        else:
            print(f"  ❌ {section} - 누락")
            issues.append(f"필수 섹션 누락: {section}")
            passed = False

    # 결과 요약
    print(f"\n{'='*70}")
    if passed:
        print(f"✅ Phase 5 품질 검증 통과: {politician_name}")
    else:
        print(f"❌ Phase 5 품질 검증 실패: {politician_name}")
        print(f"\n발견된 이슈:")
        for issue in issues:
            print(f"  - {issue}")

    return passed, issues


def validate_all_phases(politician_id, politician_name):
    """전체 Phase 품질 검증"""
    print(f"\n{'='*70}")
    print(f"전체 Phase 품질 검증: {politician_name}")
    print(f"{'='*70}")

    results = []

    # Phase 1
    p1_passed, p1_issues = validate_phase1_collection(politician_id, politician_name)
    results.append(('Phase 1: 데이터 수집', p1_passed, p1_issues))

    # Phase 2
    p2_passed, p2_issues = validate_phase2_validation(politician_id, politician_name)
    results.append(('Phase 2: 검증/중복제거', p2_passed, p2_issues))

    # Phase 3
    p3_passed, p3_issues = validate_phase3_evaluation(politician_id, politician_name)
    results.append(('Phase 3: AI 평가', p3_passed, p3_issues))

    # Phase 4
    p4_passed, p4_issues = validate_phase4_scoring(politician_id, politician_name)
    results.append(('Phase 4: 점수 계산', p4_passed, p4_issues))

    # Phase 5
    p5_passed, p5_issues = validate_phase5_report(politician_id, politician_name)
    results.append(('Phase 5: 보고서 생성', p5_passed, p5_issues))

    # 전체 요약
    print(f"\n{'='*70}")
    print(f"전체 검증 결과: {politician_name}")
    print(f"{'='*70}\n")

    all_passed = True
    for phase_name, passed, issues in results:
        status = '✅ 통과' if passed else '❌ 실패'
        print(f"  {status}: {phase_name}")
        if not passed:
            all_passed = False
            for issue in issues:
                print(f"      - {issue}")

    print(f"\n{'='*70}")
    if all_passed:
        print(f"🎉 [{politician_name}] 모든 Phase 품질 검증 통과!")
    else:
        print(f"⚠️  [{politician_name}] 일부 Phase에서 이슈 발견")
        print(f"    재작업 또는 확인이 필요합니다.")

    return all_passed


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='V40 Phase별 품질 검증')
    parser.add_argument('--politician_id', required=True, help='정치인 ID')
    parser.add_argument('--politician_name', required=True, help='정치인 이름')
    parser.add_argument('--phase', type=int, choices=[1, 2, 3, 4, 5], help='특정 Phase만 검증 (생략 시 전체)')

    args = parser.parse_args()

    if args.phase:
        # 특정 Phase만 검증
        if args.phase == 1:
            validate_phase1_collection(args.politician_id, args.politician_name)
        elif args.phase == 2:
            validate_phase2_validation(args.politician_id, args.politician_name)
        elif args.phase == 3:
            validate_phase3_evaluation(args.politician_id, args.politician_name)
        elif args.phase == 4:
            validate_phase4_scoring(args.politician_id, args.politician_name)
        elif args.phase == 5:
            validate_phase5_report(args.politician_id, args.politician_name)
    else:
        # 전체 Phase 검증
        validate_all_phases(args.politician_id, args.politician_name)
