"""
V40 데이터 조회 스크립트
- collected_data_v40 테이블에서 조은희, 박주민 데이터 확인
- V40 평가 테이블 존재 여부 확인
"""
import os
import sys
from dotenv import load_dotenv
from supabase import create_client

# .env 로드
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '.env')
load_dotenv(env_path)

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_SERVICE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: Supabase credentials not found!")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=" * 80)
print("V40 데이터 조회")
print("=" * 80)

# ============================================================
# 1. collected_data_v40 - 전체 정치인별 데이터 수
# ============================================================
print("\n[1] collected_data_v40 - 정치인별 데이터 수")
print("-" * 60)

all_data = []
try:
    # Get all data from collected_data_v40, paginated
    offset = 0
    page_size = 1000
    while True:
        result = supabase.table('collected_data_v40') \
            .select('politician_id, politician_name, category, collector_ai, data_type, sentiment') \
            .range(offset, offset + page_size - 1) \
            .execute()
        if result.data:
            all_data.extend(result.data)
            if len(result.data) < page_size:
                break
            offset += page_size
        else:
            break
    
    print(f"총 데이터 수: {len(all_data)}개")
    
    if not all_data:
        print("  -> collected_data_v40 테이블에 데이터가 없습니다.")
    else:
        # 정치인별 카운트
        politician_counts = {}
        for row in all_data:
            name = row.get('politician_name', 'Unknown')
            pid = row.get('politician_id', 'Unknown')
            key = f"{name} ({pid})"
            politician_counts[key] = politician_counts.get(key, 0) + 1
        
        print(f"\n정치인 수: {len(politician_counts)}명")
        for name, count in sorted(politician_counts.items(), key=lambda x: -x[1]):
            print(f"  {name}: {count}개")

except Exception as e:
    print(f"  ERROR: {e}")

# ============================================================
# 2. 조은희 & 박주민 상세 분석
# ============================================================
target_politicians = ['조은희', '박주민']

for target_name in target_politicians:
    print(f"\n{'=' * 80}")
    print(f"[2] {target_name} 상세 분석")
    print("=" * 80)
    
    target_data = [row for row in all_data if row.get('politician_name') == target_name]
    
    if not target_data:
        print(f"  -> {target_name} 데이터 없음")
        continue
    
    print(f"\n총 데이터 수: {len(target_data)}개")
    
    # (a) 카테고리별 카운트
    print(f"\n  [카테고리별 카운트]")
    category_counts = {}
    for row in target_data:
        cat = row.get('category', 'Unknown')
        category_counts[cat] = category_counts.get(cat, 0) + 1
    for cat, count in sorted(category_counts.items()):
        print(f"    {cat}: {count}개")
    
    # (b) collector_ai별 카운트
    print(f"\n  [collector_ai별 카운트]")
    ai_counts = {}
    for row in target_data:
        ai = row.get('collector_ai', 'Unknown')
        ai_counts[ai] = ai_counts.get(ai, 0) + 1
    for ai, count in sorted(ai_counts.items()):
        print(f"    {ai}: {count}개")
    
    # (c) data_type별 카운트
    print(f"\n  [data_type별 카운트]")
    type_counts = {}
    for row in target_data:
        dt = row.get('data_type', 'Unknown')
        type_counts[dt] = type_counts.get(dt, 0) + 1
    for dt, count in sorted(type_counts.items()):
        print(f"    {dt}: {count}개")
    
    # (d) sentiment별 카운트
    print(f"\n  [sentiment별 카운트]")
    sentiment_counts = {}
    for row in target_data:
        s = row.get('sentiment', 'Unknown')
        sentiment_counts[s] = sentiment_counts.get(s, 0) + 1
    for s, count in sorted(sentiment_counts.items()):
        print(f"    {s}: {count}개")
    
    # (e) 카테고리 x collector_ai 크로스탭
    print(f"\n  [카테고리 x collector_ai 크로스탭]")
    cross = {}
    all_ais = set()
    for row in target_data:
        cat = row.get('category', 'Unknown')
        ai = row.get('collector_ai', 'Unknown')
        all_ais.add(ai)
        key = (cat, ai)
        cross[key] = cross.get(key, 0) + 1
    
    sorted_ais = sorted(all_ais)
    header = f"    {'카테고리':<25}" + "".join(f"{ai:>10}" for ai in sorted_ais) + f"{'합계':>10}"
    print(header)
    print("    " + "-" * (25 + 10 * (len(sorted_ais) + 1)))
    
    for cat in sorted(category_counts.keys()):
        row_str = f"    {cat:<25}"
        row_total = 0
        for ai in sorted_ais:
            cnt = cross.get((cat, ai), 0)
            row_str += f"{cnt:>10}"
            row_total += cnt
        row_str += f"{row_total:>10}"
        print(row_str)

# ============================================================
# 3. V40 평가 테이블 확인
# ============================================================
print(f"\n{'=' * 80}")
print("[3] V40 평가 테이블 존재 여부 확인")
print("=" * 80)

eval_tables = [
    'ai_evaluations_v40',
    'ai_category_scores_v40', 
    'ai_final_scores_v40',
]

for table_name in eval_tables:
    try:
        result = supabase.table(table_name).select('*', count='exact').limit(5).execute()
        count = result.count if result.count is not None else len(result.data)
        print(f"\n  {table_name}:")
        print(f"    존재: YES")
        print(f"    데이터 수: {count}개")
        if result.data:
            print(f"    샘플 컬럼: {list(result.data[0].keys())}")
            for i, row in enumerate(result.data[:3]):
                print(f"    샘플 {i+1}: {row}")
    except Exception as e:
        error_msg = str(e)
        if '42P01' in error_msg or 'does not exist' in error_msg or 'relation' in error_msg:
            print(f"\n  {table_name}:")
            print(f"    존재: NO (테이블 없음)")
        else:
            print(f"\n  {table_name}:")
            print(f"    ERROR: {e}")

print(f"\n{'=' * 80}")
print("조회 완료")
print("=" * 80)
