"""
JSON 데이터에서 INSERT SQL 생성 (수정 버전)
- profile_image → profile_image_url
- politicians.id는 TEXT 타입 (8자리)
"""
import json
import uuid

# 정치인 ID 매핑
POLITICIAN_IDS = {
    '김동연': '17270f25',
    '오세훈': '62e7b453',
    '한동훈': '5516976b'  # 새로 생성된 ID
}

def generate_insert_sql_fixed():
    """
    JSON 파일들에서 INSERT SQL 생성 (FIXED 버전)
    """
    output_file = 'insert_pooling_data_with_han_FIXED.sql'

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("-- V24.5 Pooling System 데이터 삽입 (한동훈 포함)\n")
        f.write("-- 생성일: 2025-12-02\n")
        f.write("-- 수정: profile_image → profile_image_url\n")
        f.write("-- 주의: politicians.id가 TEXT 타입이어야 함 (UUID가 아님!)\n\n")

        # 1. 한동훈을 politicians 테이블에 추가
        han_id = POLITICIAN_IDS['한동훈']
        f.write(f"-- 1. 한동훈을 politicians 테이블에 추가\n")
        f.write(f"-- 주의: id는 8자리 TEXT (UUID 앞 8자리)\n")
        f.write(f"INSERT INTO politicians (id, name, party, position, profile_image_url)\n")
        f.write(f"VALUES ('{han_id}', '한동훈', '국민의힘', '당 대표', '')\n")
        f.write(f"ON CONFLICT (id) DO NOTHING;\n\n")

        f.write(f"-- 2. 평가 데이터 삽입\n\n")

        for politician_name, politician_id in POLITICIAN_IDS.items():
            json_file = f'pooling_batch_summary_{politician_name}.json'

            try:
                with open(json_file, 'r', encoding='utf-8') as jf:
                    data = json.load(jf)

                f.write(f"-- {politician_name} ({politician_id})\n")

                for result in data['results']:
                    category = result['category_eng']
                    chatgpt_score = result['scores']['ChatGPT']['category_score']
                    grok_score = result['scores']['Grok']['category_score']
                    claude_score = result['scores']['Claude']['category_score']
                    final_score = result['final_score']

                    sql = f"""INSERT INTO ai_pooling_evaluation_scores
    (politician_id, category, chatgpt_score, grok_score, claude_score, final_score, prompt_version)
VALUES
    ('{politician_id}', '{category}', {chatgpt_score}, {grok_score}, {claude_score}, {final_score}, 'v24.5')
ON CONFLICT (politician_id, category, prompt_version)
DO UPDATE SET
    chatgpt_score = EXCLUDED.chatgpt_score,
    grok_score = EXCLUDED.grok_score,
    claude_score = EXCLUDED.claude_score,
    final_score = EXCLUDED.final_score,
    updated_at = NOW();

"""
                    f.write(sql)

                print(f"✅ {politician_name} ({politician_id}): {len(data['results'])}개 카테고리")

            except FileNotFoundError:
                print(f"❌ 파일 없음: {json_file}")
            except Exception as e:
                print(f"❌ {politician_name} 처리 실패: {str(e)}")

        # 검증 쿼리 추가
        f.write("\n-- 3. 검증 쿼리\n")
        f.write("SELECT \n")
        f.write("    p.name,\n")
        f.write("    a.politician_id, \n")
        f.write("    COUNT(*) as category_count, \n")
        f.write("    ROUND(AVG(a.final_score)::numeric, 2) as avg_score\n")
        f.write("FROM ai_pooling_evaluation_scores a\n")
        f.write("JOIN politicians p ON p.id = a.politician_id\n")
        f.write("WHERE a.prompt_version = 'v24.5'\n")
        f.write("GROUP BY p.name, a.politician_id\n")
        f.write("ORDER BY avg_score DESC;\n")

    print(f"\n✅ SQL 파일 생성 완료: {output_file}")
    print(f"\n주요 수정 사항:")
    print(f"  - profile_image → profile_image_url")
    print(f"  - politicians.id는 TEXT 타입 (8자리)")
    print(f"  - 한동훈 ID: {POLITICIAN_IDS['한동훈']}")
    print(f"\n사용 방법:")
    print(f"1. Supabase 대시보드 > SQL Editor 열기")
    print(f"2. {output_file} 파일 내용 전체 복사")
    print(f"3. SQL Editor에 붙여넣기")
    print(f"4. Run 클릭")

if __name__ == "__main__":
    generate_insert_sql_fixed()
