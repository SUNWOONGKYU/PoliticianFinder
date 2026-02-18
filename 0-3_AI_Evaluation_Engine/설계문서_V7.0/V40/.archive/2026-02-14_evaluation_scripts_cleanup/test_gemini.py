# -*- coding: utf-8 -*-
import warnings
warnings.filterwarnings('ignore')

import os
import sys
import json
from dotenv import load_dotenv
from supabase import create_client
import google.generativeai as genai

# UTF-8 출력
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# 설정
load_dotenv(override=True)
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-2.5-flash')

POLITICIAN_ID = '8c5dcc89'
CATEGORY = 'expertise'
BATCH_SIZE = 25

print(f"[{CATEGORY}] 평가 시작...")

# 1. 미평가 데이터 조회
collected = supabase.table('collected_data_v40').select('*').eq('politician_id', POLITICIAN_ID).eq('category', CATEGORY).execute()
evaluated = supabase.table('evaluations_v40').select('collected_data_id').eq('politician_id', POLITICIAN_ID).eq('category', CATEGORY).eq('evaluator_ai', 'Gemini').execute()

evaluated_ids = {ev['collected_data_id'] for ev in evaluated.data} if evaluated.data else set()
items = [item for item in collected.data if item['id'] not in evaluated_ids]

print(f"미평가: {len(items)}개")

if len(items) == 0:
    print("완료")
    sys.exit(0)

# 2. 첫 번째 배치만 평가
batch = items[:BATCH_SIZE]
print(f"배치 1 ({len(batch)}개) 평가 중...")

items_text = ""
for i, item in enumerate(batch, 1):
    items_text += f"\n[{i}] ID: {item['id']}\n제목: {item['title']}\n내용: {item['content'][:300]}...\n"

prompt = f"""등급(점수): +4(+8)탁월 | +3(+6)우수 | +2(+4)양호 | +1(+2)보통
-1(-2)미흡 | -2(-4)부족 | -3(-6)심각 | -4(-8)최악 | X(0)평가제외

판단: 긍정(성과/업적)→+4~+1 | 부정(논란/비판)→-1~-4
X판정: 10년+과거/동명이인/무관/날조

JSON: {{"evaluations":[{{"id":"UUID","rating":"+4~-4 또는 X","rationale":"근거"}}]}}

정치인: 박주민
카테고리: 전문성
{items_text}

각 항목을 전문성 관점에서 평가하세요."""

response = model.generate_content(prompt)
text = response.text

# JSON 추출
if '```json' in text:
    start = text.find('```json') + 7
    end = text.find('```', start)
    json_str = text[start:end].strip()
elif '```' in text:
    start = text.find('```') + 3
    end = text.find('```', start)
    json_str = text[start:end].strip()
else:
    json_str = text.strip()

result = json.loads(json_str)
evaluations = result['evaluations']

print(f"평가 완료: {len(evaluations)}개")

# 3. 저장
for ev in evaluations:
    try:
        supabase.table('evaluations_v40').insert({
            'collected_data_id': ev['id'],
            'politician_id': POLITICIAN_ID,
            'category': CATEGORY,
            'evaluator_ai': 'Gemini',
            'rating': ev['rating'],
            'rationale': ev['rationale']
        }).execute()
        print(f"  저장: {ev['id']} - {ev['rating']}")
    except Exception as e:
        if 'duplicate' not in str(e).lower():
            print(f"  ERROR: {ev['id']} - {e}")

print("완료!")
