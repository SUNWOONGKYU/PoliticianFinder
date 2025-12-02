"""
JSON → DB 마이그레이션 스크립트
pooling_batch_summary_*.json → ai_pooling_evaluation_scores 테이블
"""
import json
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

# Supabase 클라이언트 초기화
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

# 정치인 ID 매핑
POLITICIAN_IDS = {
    '김동연': '17270f25',
    '오세훈': '62e7b453',
    '한동훈': 'eeefba98'  # 실제 ID로 교체 필요
}

def migrate_politician_data(politician_name: str):
    """
    1명 정치인의 JSON 데이터를 DB로 마이그레이션
    """
    print(f"\n{'='*80}")
    print(f"마이그레이션 시작: {politician_name}")
    print(f"{'='*80}")

    # 1. JSON 파일 로드
    json_file = f'pooling_batch_summary_{politician_name}.json'

    if not os.path.exists(json_file):
        print(f"❌ 파일 없음: {json_file}")
        return False

    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    politician_id = POLITICIAN_IDS.get(politician_name)
    if not politician_id:
        print(f"❌ 정치인 ID 없음: {politician_name}")
        return False

    print(f"✅ JSON 로드 완료: {len(data['results'])}개 카테고리")

    # 2. DB에 저장
    success_count = 0
    error_count = 0

    for result in data['results']:
        category = result['category_eng']

        # 데이터 준비
        row_data = {
            'politician_id': politician_id,
            'category': category,
            'chatgpt_score': result['scores']['ChatGPT']['category_score'],
            'grok_score': result['scores']['Grok']['category_score'],
            'claude_score': result['scores']['Claude']['category_score'],
            'final_score': result['final_score'],
            'prompt_version': 'v24.5'
        }

        try:
            # Upsert (있으면 업데이트, 없으면 삽입)
            response = supabase.from_('ai_pooling_evaluation_scores') \
                .upsert(row_data, on_conflict='politician_id,category,prompt_version') \
                .execute()

            print(f"  ✅ {category}: ChatGPT={row_data['chatgpt_score']:.2f}, "
                  f"Grok={row_data['grok_score']:.2f}, "
                  f"Claude={row_data['claude_score']:.2f}, "
                  f"Final={row_data['final_score']:.2f}")
            success_count += 1

        except Exception as e:
            print(f"  ❌ {category}: {str(e)}")
            error_count += 1

    # 3. 결과 요약
    print(f"\n{'='*80}")
    print(f"{politician_name} 마이그레이션 완료")
    print(f"{'='*80}")
    print(f"성공: {success_count}개")
    print(f"실패: {error_count}개")

    return error_count == 0

def verify_migration():
    """
    마이그레이션 결과 검증
    """
    print(f"\n{'='*80}")
    print("마이그레이션 검증")
    print(f"{'='*80}\n")

    for politician_name, politician_id in POLITICIAN_IDS.items():
        try:
            # DB에서 조회
            response = supabase.from_('ai_pooling_evaluation_scores') \
                .select('*') \
                .eq('politician_id', politician_id) \
                .execute()

            count = len(response.data)
            print(f"✅ {politician_name} ({politician_id}): {count}개 카테고리")

            if count > 0:
                # 평균 점수 계산
                avg_final = sum(row['final_score'] for row in response.data) / count
                print(f"   평균 최종 점수: {avg_final:.2f}")

        except Exception as e:
            print(f"❌ {politician_name}: {str(e)}")

def main():
    """
    메인 실행
    """
    print("=" * 80)
    print("Pooling System JSON → DB 마이그레이션")
    print("=" * 80)
    print(f"대상: {list(POLITICIAN_IDS.keys())}")
    print(f"테이블: ai_pooling_evaluation_scores")
    print("=" * 80)

    # 각 정치인별 마이그레이션
    results = {}
    for politician_name in POLITICIAN_IDS.keys():
        results[politician_name] = migrate_politician_data(politician_name)

    # 검증
    verify_migration()

    # 최종 결과
    print(f"\n{'='*80}")
    print("전체 마이그레이션 완료")
    print(f"{'='*80}")
    success = sum(1 for v in results.values() if v)
    total = len(results)
    print(f"성공: {success}/{total}명")

    if success == total:
        print("✅ 모든 정치인 마이그레이션 성공!")
    else:
        print("⚠️ 일부 정치인 마이그레이션 실패")

if __name__ == "__main__":
    main()
