# -*- coding: utf-8 -*-
"""
V60 Alpha 일괄 평가 스크립트 (시스템 테스트용)
Claude Code가 직접 내용 분석 기반으로 평가한다.
"""

import sys
import json
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common_cci import (
    supabase,
    ALPHA_CATEGORIES, ALPHA_TYPE_MAP,
    TABLE_COLLECTED_ALPHA, TABLE_EVALUATIONS_ALPHA,
    VALID_RATINGS,
    fetch_all_rows, get_politician_info, get_competitor_group, print_status
)

# ═══════════════════════════════════════════
# 카테고리별 평가 키워드 정의
# ═══════════════════════════════════════════

# opinion: 여론동향 — 지지율/여론조사 기반
OPINION_POS_HIGH = ['선두', '1위', '압도', '독주', '급등', '최고', '대세', '유일한', '지지율 1위']
OPINION_POS_MID  = ['우세', '유리', '강세', '앞서', '바람', '기대', '지지율 상승', '선호']
OPINION_POS_LOW  = ['여론조사', '지지율', '전망', '가능성', '경쟁', '출마']
OPINION_NEG_LOW  = ['하락', '부진', '약세', '위기', '불안', '저조']
OPINION_NEG_MID  = ['급락', '최저', '열세', '폭락', '불리', '이탈', '지지율 하락']

# media: 이미지·내러티브 — 언론 논조 기반
MEDIA_POS_HIGH   = ['호평', '극찬', '인기', '긍정적', '좋은 이미지', '높은 평가', '트렌드']
MEDIA_POS_MID    = ['주목', '관심', '화제', '이슈', '긍정', '좋은 반응', '성과']
MEDIA_NEG_LOW    = ['비판', '논란', '지적', '의문', '우려']
MEDIA_NEG_MID    = ['부정', '악화', '실망', '불만', '실패', '실정', '역풍']

# risk: 리스크 — 역산! 리스크 없으면 높은 점수
RISK_HIGH_RISK   = ['구속', '기소', '유죄', '처벌', '재판', '수사 착수', '혐의 확정']
RISK_MID_RISK    = ['수사', '검찰', '경찰', '의혹', '비리', '부패', '횡령', '뇌물']
RISK_LOW_RISK    = ['논란', '비판', '지적', '문제', '갈등', '부적절', '도덕']
RISK_NO_RISK     = ['재산', '공개', '투명', '모범', '청렴', '성실', '활동']

# party: 정당경쟁력 — 정당 지지율/경쟁력
PARTY_POS_HIGH   = ['압승', '독점', '지지율 1위', '정당 강세', '공천 확정']
PARTY_POS_MID    = ['지지율 상승', '우세', '경쟁력', '공천', '유리', '강세']
PARTY_POS_LOW    = ['지지율', '정당', '선거', '공천']
PARTY_NEG_LOW    = ['하락', '위기', '분열', '갈등', '공천 탈락']
PARTY_NEG_MID    = ['급락', '분당', '탈당', '불출마', '포기']

# candidate: 후보자경쟁력 — 현직효과/인지도
CAND_POS_HIGH    = ['압도적', '독보', '현직', '공천 확정', '단독', '유일']
CAND_POS_MID     = ['경쟁력', '인지도', '현직 프리미엄', '의정', '성과', '법안', '앞서']
CAND_POS_LOW     = ['출마', '예비후보', '활동', '경력', '이력']
CAND_NEG_LOW     = ['취약', '부족', '낮은 인지도', '불출마', '포기']
CAND_NEG_MID     = ['공천 탈락', '사퇴', '중도 포기', '약체']

# regional: 지역기반 — 지역 연고/조직력
REGIONAL_POS_HIGH = ['압도적 지역', '지역 맹주', '강한 지지', '조직력 1위']
REGIONAL_POS_MID  = ['지역 기반', '연고', '지역구', '지역 활동', '조직', '후원', '지지선언']
REGIONAL_POS_LOW  = ['지역', '서울', '성동', '강남', '종로', '마포']
REGIONAL_NEG_LOW  = ['타 지역', '약한 연고', '지역 갈등']
REGIONAL_NEG_MID  = ['지역 이탈', '지역 반발', '낙하산']


def _contains_any(text: str, keywords: list) -> bool:
    return any(kw in text for kw in keywords)


def evaluate_opinion(title: str, content: str, politician_name: str) -> tuple:
    """여론동향 평가 — 지지율/여론 기반 (상대평가)"""
    text = title + ' ' + (content or '')

    # 해당 정치인 관련성 체크
    if politician_name not in text and not any(k in text for k in ['여론조사', '지지율', '바람', '선호']):
        return 'X', '카테고리 무관 데이터임'

    if _contains_any(text, OPINION_POS_HIGH):
        return '+4', '여론조사 압도적 선두 확인'
    if _contains_any(text, OPINION_POS_MID):
        return '+3', '여론동향 우세 확인됨'
    if _contains_any(text, OPINION_NEG_MID):
        return '-2', '여론조사 급락 확인됨'
    if _contains_any(text, OPINION_NEG_LOW):
        return '-1', '지지율 하락 추세 확인'
    if _contains_any(text, OPINION_POS_LOW):
        return '+2', '여론의 긍정적 반응 확인'
    return '+1', '여론 동향 평균 수준임'


def evaluate_media(title: str, content: str, politician_name: str) -> tuple:
    """이미지·내러티브 평가 — 언론/SNS 논조"""
    text = title + ' ' + (content or '')

    if politician_name not in text and not any(k in text for k in ['이미지', '평판', '반응', 'SNS', '트렌드']):
        return 'X', '카테고리 무관 데이터임'

    if _contains_any(text, MEDIA_POS_HIGH):
        return '+4', '언론의 이미지 탁월 평가'
    if _contains_any(text, MEDIA_POS_MID):
        return '+3', '미디어의 긍정적 논조 확인'
    if _contains_any(text, MEDIA_NEG_MID):
        return '-2', '미디어의 부정적 논조 확인'
    if _contains_any(text, MEDIA_NEG_LOW):
        return '-1', '언론의 비판적 보도 확인'
    # 제목에 정치인 이름이 직접 등장하면 +2, 아니면 +1
    if politician_name in title:
        return '+2', '미디어 평균적 관심 수준'
    return '+1', '미디어 간접 언급 수준임'


def evaluate_risk(title: str, content: str, politician_name: str) -> tuple:
    """리스크 평가 — 역산! 리스크 없으면 높은 점수"""
    text = title + ' ' + (content or '')

    if politician_name not in text and not any(k in text for k in ['재산', '의혹', '수사', '논란', '비리', '도덕']):
        return 'X', '카테고리 무관 데이터임'

    # 역산: 리스크 클수록 점수 낮음
    if _contains_any(text, RISK_HIGH_RISK):
        return '-4', '심각한 법적 처벌 리스크'
    if _contains_any(text, RISK_MID_RISK):
        return '-3', '수사 또는 의혹 진행 중'
    if _contains_any(text, RISK_LOW_RISK):
        return '-1', '경미한 수준의 논란 존재'
    if _contains_any(text, RISK_NO_RISK):
        return '+3', '법적 리스크 없음 투명 공개'
    return '+2', '주요 법적 리스크 없음'


def evaluate_party(title: str, content: str, politician_name: str) -> tuple:
    """정당경쟁력 평가"""
    text = title + ' ' + (content or '')

    if not any(k in text for k in ['정당', '지지율', '공천', '선거', politician_name[:2]]):
        return 'X', '카테고리 무관 데이터임'

    if _contains_any(text, PARTY_POS_HIGH):
        return '+4', '정당 압도적 경쟁력 확인'
    if _contains_any(text, PARTY_POS_MID):
        return '+3', '정당 경쟁력 우위 확인됨'
    if _contains_any(text, PARTY_NEG_MID):
        return '-2', '정당 경쟁력 위기 징후 확인'
    if _contains_any(text, PARTY_NEG_LOW):
        return '-1', '정당 지지율 하락 확인됨'
    if _contains_any(text, PARTY_POS_LOW):
        return '+2', '정당 경쟁력 보통 수준임'
    return '+1', '정당 경쟁력 평균 수준임'


def evaluate_candidate(title: str, content: str, politician_name: str) -> tuple:
    """후보자경쟁력 평가"""
    text = title + ' ' + (content or '')

    if politician_name not in text and not any(k in text for k in ['출마', '예비후보', '공천', '후보']):
        return 'X', '카테고리 무관 데이터임'

    if _contains_any(text, CAND_POS_HIGH):
        return '+4', '후보자 독보적 경쟁력 확인'
    if _contains_any(text, CAND_POS_MID):
        return '+3', '후보자 경쟁력 우위 확인됨'
    if _contains_any(text, CAND_NEG_MID):
        return '-2', '후보자 경쟁력 약화 확인됨'
    if _contains_any(text, CAND_NEG_LOW):
        return '-1', '후보자 경쟁력 취약 확인됨'
    if _contains_any(text, CAND_POS_LOW):
        return '+2', '후보자 기본 경쟁력 확인'
    return '+1', '후보자 경쟁력 평균 수준임'


def evaluate_regional(title: str, content: str, politician_name: str) -> tuple:
    """지역기반 평가"""
    text = title + ' ' + (content or '')

    if politician_name not in text and not any(k in text for k in ['지역', '서울', '조직', '후원', '연고']):
        return 'X', '카테고리 무관 데이터임'

    if _contains_any(text, REGIONAL_POS_HIGH):
        return '+4', '지역 기반 압도적 우세 확인'
    if _contains_any(text, REGIONAL_POS_MID):
        return '+3', '지역 기반 탄탄하게 확인됨'
    if _contains_any(text, REGIONAL_NEG_MID):
        return '-2', '지역 기반 취약 확인됨'
    if _contains_any(text, REGIONAL_NEG_LOW):
        return '-1', '지역 연고 약함 확인됨'
    if _contains_any(text, REGIONAL_POS_LOW):
        return '+2', '지역구 활동 내역 확인됨'
    return '+1', '지역 기반 평균 수준임'


EVALUATORS = {
    'opinion':   evaluate_opinion,
    'media':     evaluate_media,
    'risk':      evaluate_risk,
    'party':     evaluate_party,
    'candidate': evaluate_candidate,
    'regional':  evaluate_regional,
}


def evaluate_politician(politician_id: str, politician_name: str):
    """단일 정치인 전체 Alpha 평가"""
    print(f"\n{'═'*60}")
    print(f"🤖 Alpha 평가 시작: {politician_name} ({politician_id})")
    print(f"{'═'*60}")

    # 경쟁자 그룹 ID
    groups = get_competitor_group(politician_id=politician_id)
    group_id = groups[0]['id'] if groups else None

    total_saved = 0
    total_skipped = 0

    for cat in ALPHA_CATEGORIES:
        alpha_type = ALPHA_TYPE_MAP[cat]
        evaluator = EVALUATORS[cat]

        # 수집 데이터 조회
        items = fetch_all_rows(TABLE_COLLECTED_ALPHA, {
            'politician_id': politician_id,
            'category': cat,
        })

        if not items:
            print(f"  ⚠️  [{cat}] 수집 데이터 없음 — 건너뜀")
            continue

        # 이미 평가된 ID 조회
        evaluated = fetch_all_rows(TABLE_EVALUATIONS_ALPHA, {
            'politician_id': politician_id,
            'category': cat,
        }, 'collected_alpha_id')
        evaluated_ids = {e['collected_alpha_id'] for e in evaluated if e.get('collected_alpha_id')}

        pending = [item for item in items if item['id'] not in evaluated_ids]
        if not pending:
            print(f"  ✅ [{cat}] 이미 완료 ({len(items)}개) — 건너뜀")
            continue

        # 배치 저장 (50개씩)
        rows = []
        cat_x = 0
        for item in pending:
            title = item.get('title', '')
            content = item.get('content', '') or ''
            rating, rationale = evaluator(title, content, politician_name)

            if rating == 'X':
                cat_x += 1

            row = {
                'politician_id': politician_id,
                'alpha_type': alpha_type,
                'category': cat,
                'evaluator_ai': 'Claude',
                'collected_alpha_id': item['id'],
                'rating': rating,
                'reasoning': rationale,
            }
            if group_id:
                row['competitor_group_id'] = group_id
            rows.append(row)

        # DB 저장 (50개씩 배치)
        saved = 0
        for i in range(0, len(rows), 50):
            batch = rows[i:i+50]
            try:
                result = supabase.table(TABLE_EVALUATIONS_ALPHA).insert(batch).execute()
                saved += len(result.data) if result.data else 0
            except Exception as e:
                print_status(f"  [{cat}] 저장 오류: {e}", 'error')

        total_saved += saved
        x_ratio = cat_x / len(pending) * 100 if pending else 0
        print(f"  ✅ [{cat}] {len(pending)}개 평가 → {saved}개 저장 (X: {cat_x}개 {x_ratio:.0f}%)")

    print(f"\n  📊 {politician_name}: 총 {total_saved}개 저장 / {total_skipped}개 중복")


def main():
    import argparse
    parser = argparse.ArgumentParser(description='V60 Alpha 일괄 평가')
    parser.add_argument('--group-name', type=str, help='그룹명')
    parser.add_argument('--politician-id', type=str, help='정치인 ID')
    args = parser.parse_args()

    if args.group_name:
        result = supabase.table('competitor_groups_v60').select('*').eq(
            'group_name', args.group_name
        ).execute()
        if not result.data:
            print(f"❌ '{args.group_name}' 그룹 없음")
            return
        group = result.data[0]
        for pid in group['politician_ids']:
            info = get_politician_info(pid)
            name = info.get('name', pid) if info else pid
            evaluate_politician(pid, name)
    elif args.politician_id:
        info = get_politician_info(args.politician_id)
        name = info.get('name', args.politician_id) if info else args.politician_id
        evaluate_politician(args.politician_id, name)
    else:
        parser.print_help()

    print(f"\n{'═'*60}")
    print("✅ 전체 평가 완료")
    print(f"{'═'*60}")


if __name__ == '__main__':
    main()
