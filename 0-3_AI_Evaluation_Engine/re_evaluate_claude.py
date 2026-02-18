# -*- coding: utf-8 -*-
"""
김민석 청렴성 Claude 재평가
68개 데이터만으로 재평가 수행
"""
import os
import sys
import io
from dotenv import load_dotenv
from supabase import create_client, Client

# UTF-8 출력 설정
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

load_dotenv()

# Supabase 연결
url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_KEY')
if not url or not key:
    raise ValueError('Supabase 환경 변수가 설정되지 않았습니다')

supabase: Client = create_client(url, key)

print('=== 김민석 청렴성 Claude 재평가 ===\n')

# 1. 현재 데이터 추출
print('1️⃣ 청렴성 데이터 추출 중...\n')

result = supabase.table('collected_data_v30').select('*').eq(
    'politician_id', 'f9e00370'
).eq('category', 'integrity').order('created_at', desc=True).execute()

data_list = result.data
print(f'✅ 총 {len(data_list)}개 데이터 추출 완료\n')

# 2. Claude 평가용 JSON 생성
print('2️⃣ Claude 평가용 JSON 생성 중...\n')

import json

# 10개씩 배치로 나누기
batch_size = 10
batches = []
for i in range(0, len(data_list), batch_size):
    batch = data_list[i:i+batch_size]
    batches.append(batch)

print(f'✅ {len(batches)}개 배치 생성 완료 (각 배치당 최대 10개)\n')

# 배치 파일 생성
for i, batch in enumerate(batches, 1):
    filename = f'claude_reeval_batch_{i:02d}.json'

    # 평가용 구조로 변환
    eval_items = []
    for item in batch:
        eval_items.append({
            'id': item['id'],
            'politician_id': item['politician_id'],
            'category': item['category'],
            'data_type': item.get('data_type', ''),
            'event_date': item.get('event_date', ''),
            'title': item.get('title', ''),
            'content': item.get('content', ''),
            'url': item.get('url', ''),
            'source': item.get('source', ''),
            'reasoning': item.get('reasoning', ''),
            'created_at': item.get('created_at', '')
        })

    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(eval_items, f, ensure_ascii=False, indent=2)

    print(f'   ✅ {filename} 생성 (항목 {len(eval_items)}개)')

print(f'\n✅ 총 {len(batches)}개 배치 파일 생성 완료\n')

# 3. 안내 메시지
print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
print('3️⃣ Claude Code에서 평가를 수행해주세요\n')
print('평가 방법:')
print('1. 각 배치 파일을 Claude Code에서 열기')
print('2. "설계문서_V7.0/V30/instructions/3_evaluate/cat04_integrity.md" 지침 참고')
print('3. 각 항목에 대해 rating (-4~+4) + reasoning 작성')
print('4. 결과를 claude_reeval_batch_XX_result.json으로 저장')
print('\n평가 형식:')
print('''[
  {
    "id": "데이터 ID",
    "rating": "-3",
    "reasoning": "구체적인 평가 이유"
  },
  ...
]''')
print('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
print(f'\n💡 총 {len(batches)}개 배치를 평가해야 합니다')
print('   평가 완료 후 "python save_claude_reeval.py"를 실행하세요\n')
