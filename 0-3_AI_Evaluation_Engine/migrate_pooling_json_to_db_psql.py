"""
JSON → DB 마이그레이션 스크립트 (PostgreSQL 직접 연결)
pooling_batch_summary_*.json → ai_pooling_evaluation_scores 테이블
"""
import json
import os
import psycopg2
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

# PostgreSQL 연결 정보
db_host = os.getenv("SUPABASE_HOST")
db_port = int(os.getenv("SUPABASE_PORT", "5432"))
db_name = os.getenv("SUPABASE_DB", "postgres")
db_user = os.getenv("SUPABASE_USER", "postgres")
db_password = os.getenv("SUPABASE_PASSWORD")

# 정치인 ID 매핑
POLITICIAN_IDS = {
    '김동연': '17270f25',
    '오세훈': '62e7b453',
    '한동훈': 'eeefba98'  # 실제 ID로 교체 필요
}

def get_db_connection():
    """PostgreSQL 연결"""
    try:
        conn = psycopg2.connect(
            host=db_host,
            port=db_port,
            dbname=db_name,
            user=db_user,
            password=db_password,
            sslmode='require'
        )
        return conn
    except Exception as e:
        print(f"❌ DB 연결 실패: {str(e)}")
        return None

def migrate_politician_data(conn, politician_name: str):
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
    cursor = conn.cursor()
    success_count = 0
    error_count = 0

    for result in data['results']:
        category = result['category_eng']

        # 데이터 준비
        sql = """
        INSERT INTO ai_pooling_evaluation_scores
            (politician_id, category, chatgpt_score, grok_score, claude_score, final_score, prompt_version)
        VALUES
            (%s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (politician_id, category, prompt_version)
        DO UPDATE SET
            chatgpt_score = EXCLUDED.chatgpt_score,
            grok_score = EXCLUDED.grok_score,
            claude_score = EXCLUDED.claude_score,
            final_score = EXCLUDED.final_score,
            updated_at = NOW();
        """

        values = (
            politician_id,
            category,
            result['scores']['ChatGPT']['category_score'],
            result['scores']['Grok']['category_score'],
            result['scores']['Claude']['category_score'],
            result['final_score'],
            'v24.5'
        )

        try:
            cursor.execute(sql, values)
            conn.commit()

            print(f"  ✅ {category}: ChatGPT={result['scores']['ChatGPT']['category_score']:.2f}, "
                  f"Grok={result['scores']['Grok']['category_score']:.2f}, "
                  f"Claude={result['scores']['Claude']['category_score']:.2f}, "
                  f"Final={result['final_score']:.2f}")
            success_count += 1

        except Exception as e:
            conn.rollback()
            print(f"  ❌ {category}: {str(e)}")
            error_count += 1

    cursor.close()

    # 3. 결과 요약
    print(f"\n{'='*80}")
    print(f"{politician_name} 마이그레이션 완료")
    print(f"{'='*80}")
    print(f"성공: {success_count}개")
    print(f"실패: {error_count}개")

    return error_count == 0

def verify_migration(conn):
    """
    마이그레이션 결과 검증
    """
    print(f"\n{'='*80}")
    print("마이그레이션 검증")
    print(f"{'='*80}\n")

    cursor = conn.cursor()

    for politician_name, politician_id in POLITICIAN_IDS.items():
        try:
            # DB에서 조회
            cursor.execute("""
                SELECT * FROM ai_pooling_evaluation_scores
                WHERE politician_id = %s
            """, (politician_id,))

            rows = cursor.fetchall()
            count = len(rows)

            print(f"✅ {politician_name} ({politician_id}): {count}개 카테고리")

            if count > 0:
                # 평균 점수 계산
                cursor.execute("""
                    SELECT AVG(final_score) FROM ai_pooling_evaluation_scores
                    WHERE politician_id = %s
                """, (politician_id,))

                avg_final = cursor.fetchone()[0]
                print(f"   평균 최종 점수: {avg_final:.2f}")

        except Exception as e:
            print(f"❌ {politician_name}: {str(e)}")

    cursor.close()

def main():
    """
    메인 실행
    """
    print("=" * 80)
    print("Pooling System JSON → DB 마이그레이션 (PostgreSQL 직접 연결)")
    print("=" * 80)
    print(f"대상: {list(POLITICIAN_IDS.keys())}")
    print(f"테이블: ai_pooling_evaluation_scores")
    print("=" * 80)

    # DB 연결
    conn = get_db_connection()
    if not conn:
        print("\n❌ DB 연결 실패")
        return

    try:
        # 각 정치인별 마이그레이션
        results = {}
        for politician_name in POLITICIAN_IDS.keys():
            results[politician_name] = migrate_politician_data(conn, politician_name)

        # 검증
        verify_migration(conn)

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

    finally:
        conn.close()

if __name__ == "__main__":
    main()
