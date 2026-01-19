"""
V30 누락된 평가 보완 스크립트 (수정 버전)
- 평가 데이터 조회 시 1000개 제한 해결 (pagination 추가)
"""
import argparse
from datetime import datetime
from collections import defaultdict
from collect_v30 import supabase, CATEGORIES
from evaluate_v30 import CATEGORY_MAP
from evaluate_v30 import (
    init_ai_client,
    evaluate_batch,
    save_evaluations,
    EVALUATION_AIS
)

def fetch_all_evaluations(politician_id):
    """모든 평가 데이터 가져오기 (pagination 처리)"""
    all_evaluations = []
    offset = 0
    batch_size = 1000
    
    while True:
        batch = supabase.table('evaluations_v30') \
            .select('collected_data_id, category, evaluator_ai') \
            .eq('politician_id', politician_id) \
            .range(offset, offset + batch_size - 1) \
            .execute()
        
        if not batch.data:
            break
        
        all_evaluations.extend(batch.data)
        offset += batch_size
        
        if len(batch.data) < batch_size:
            break
    
    return all_evaluations


def find_missing_evaluations(politician_id):
    """누락된 평가 찾기 (수정 버전)"""
    # 1. 모든 수집 데이터 가져오기
    collected = supabase.table('collected_data_v30')\
        .select('id, category')\
        .eq('politician_id', politician_id)\
        .execute()

    collected_by_cat = defaultdict(list)
    for item in collected.data:
        collected_by_cat[item['category']].append(item['id'])

    print(f"수집 데이터: {len(collected.data)}개")

    # 2. 평가된 데이터 추적 (ALL evaluations, not just first 1000)
    evaluations = fetch_all_evaluations(politician_id)
    
    evaluated_by_cat_ai = defaultdict(lambda: defaultdict(set))
    for ev in evaluations:
        if ev['collected_data_id']:
            evaluated_by_cat_ai[ev['category']][ev['evaluator_ai']].add(ev['collected_data_id'])

    print(f"평가 데이터: {len(evaluations)}건\n")

    # 3. 누락된 평가 찾기
    missing = defaultdict(list)

    for cat in collected_by_cat.keys():
        for ai in EVALUATION_AIS:
            for cid in collected_by_cat[cat]:
                if cid not in evaluated_by_cat_ai[cat][ai]:
                    missing[(cat, ai)].append(cid)

    return missing, collected_by_cat


def evaluate_missing(politician_id, politician_name, missing, collected_by_cat):
    """누락된 평가 실행"""
    # 카테고리별 현황 표시
    print("카테고리별 평가 현황:")
    print(f"{'카테고리':<15} | {'Claude':<6} | {'ChatGPT':<7} | {'Gemini':<6} | {'Grok':<6}")
    print("-" * 60)
    
    for cat in sorted(collected_by_cat.keys()):
        counts = []
        for ai in ['Claude', 'ChatGPT', 'Gemini', 'Grok']:
            total = len(collected_by_cat[cat])
            evaluated = total - len(missing.get((cat, ai), []))
            counts.append(f"{evaluated:<6}")
        
        print(f"{cat:<15} | {' | '.join(counts)}")
    
    print(f"\n2. 누락된 평가 평가 중...\n")
    
    total_missing = sum(len(ids) for ids in missing.values())
    print(f"총 평가 대상: {total_missing}건\n")
    
    total_evaluated = 0
    
    # 카테고리별, AI별로 평가
    for (category, evaluator_ai), collected_ids in missing.items():
        if not collected_ids:
            continue
        
        category_korean = CATEGORY_MAP.get(category, category)
        print(f"[{evaluator_ai}] {category_korean} - 평가 {len(collected_ids)}건 중...")
        
        # 해당 카테고리의 모든 수집 데이터 가져오기
        all_cat_data = supabase.table('collected_data_v30') \
            .select('*') \
            .eq('politician_id', politician_id) \
            .eq('category', category) \
            .execute()
        
        # 평가할 아이템만 필터링
        items_to_evaluate = [
            item for item in all_cat_data.data
            if item['id'] in collected_ids
        ]
        
        try:
            # 평가 실행
            ai_client = init_ai_client(evaluator_ai)
            evaluations = evaluate_batch(
                evaluator_ai=evaluator_ai,
                items=items_to_evaluate,
                category_name=category,
                politician_id=politician_id,
                politician_name=politician_name
            )
            
            # 저장
            if evaluations:
                save_evaluations(
                    politician_id=politician_id,
                    politician_name=politician_name,
                    category_name=category,
                    evaluator_ai=evaluator_ai,
                    evaluations=evaluations
                )
                total_evaluated += len(evaluations)
                print(f"  OK {len(evaluations)}건 추가 완료\n")
            else:
                print(f"  WARNING 평가 결과 없음\n")
        
        except Exception as e:
            print(f"  ERROR {str(e)}\n")
            continue
    
    return total_evaluated


def main():
    parser = argparse.ArgumentParser(description='V30 누락된 평가 보완')
    parser.add_argument('--politician_id', required=True, help='정치인 ID')
    parser.add_argument('--politician_name', required=True, help='정치인 이름')

    args = parser.parse_args()

    print(f"\n{'='*60}")
    print(f"V30 누락된 평가 보완")
    print(f"정치인: {args.politician_name} ({args.politician_id})")
    print(f"{'='*60}\n")

    start_time = datetime.now()

    # 1. 누락된 평가 찾기
    print("1. 누락된 평가 찾는 중...\n")
    missing, collected_by_cat = find_missing_evaluations(args.politician_id)
    
    total_missing = sum(len(ids) for ids in missing.values())
    if total_missing == 0:
        print("누락된 평가가 없습니다!\n")
        return
    
    # 2. 누락된 평가 실행
    total_evaluated = evaluate_missing(
        args.politician_id,
        args.politician_name,
        missing,
        collected_by_cat
    )
    
    # 3. 완료 보고
    elapsed = datetime.now() - start_time
    print(f"\n{'='*60}")
    print(f"완료!")
    print(f"추가된 평가: {total_evaluated}건")
    print(f"소요 시간: {elapsed}")
    print(f"{'='*60}\n")


if __name__ == '__main__':
    main()
