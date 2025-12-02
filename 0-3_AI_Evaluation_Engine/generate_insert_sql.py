"""
JSON 데이터에서 INSERT SQL 생성
Supabase SQL Editor에서 직접 실행할 수 있도록
"""
import json

# 정치인 ID 매핑
POLITICIAN_IDS = {
    '김동연': '17270f25',
    '오세훈': '62e7b453',
    '한동훈': 'eeefba98'
}

def generate_insert_sql():
    """
    JSON 파일들에서 INSERT SQL 생성
    """
    output_file = 'insert_pooling_data.sql'

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("-- V24.5 Pooling System 데이터 삽입\n")
        f.write("-- 생성일: 2025-12-02\n\n")

        for politician_name, politician_id in POLITICIAN_IDS.items():
            json_file = f'pooling_batch_summary_{politician_name}.json'

            try:
                with open(json_file, 'r', encoding='utf-8') as jf:
                    data = json.load(jf)

                f.write(f"\n-- {politician_name} ({politician_id})\n")

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
                    f.write("\n")

                print(f"✅ {politician_name}: {len(data['results'])}개 카테고리 SQL 생성")

            except FileNotFoundError:
                print(f"❌ 파일 없음: {json_file}")
            except Exception as e:
                print(f"❌ {politician_name} 처리 실패: {str(e)}")

        # 검증 쿼리 추가
        f.write("\n-- 검증 쿼리\n")
        f.write("SELECT politician_id, COUNT(*) as category_count, AVG(final_score) as avg_score\n")
        f.write("FROM ai_pooling_evaluation_scores\n")
        f.write("GROUP BY politician_id\n")
        f.write("ORDER BY politician_id;\n")

    print(f"\n✅ SQL 파일 생성 완료: {output_file}")
    print(f"\n사용 방법:")
    print(f"1. Supabase 대시보드 > SQL Editor 열기")
    print(f"2. {output_file} 파일 내용 전체 복사")
    print(f"3. SQL Editor에 붙여넣기")
    print(f"4. Run 클릭")

if __name__ == "__main__":
    generate_insert_sql()
