#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""책임감 Codex 평가 테스트 (ID 확인용)"""

import os
import sys
import json
import subprocess
import html
from pathlib import Path
from supabase import create_client
from dotenv import load_dotenv

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent
V40_DIR = SCRIPT_DIR.parent.parent
sys.path.insert(0, str(V40_DIR))

# UTF-8 출력
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# .env 로드
env_path = V40_DIR / '.env'
load_dotenv(dotenv_path=env_path, override=True)

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

POLITICIAN_ID = 'd0a5d6e1'
CATEGORY = 'accountability'

print("="*80)
print("책임감 Codex 평가 테스트 (ID 검증)")
print("="*80)
print()

# 1. 미평가 데이터 조회
collected_result = supabase.table('collected_data_v40').select('*').eq(
    'politician_id', POLITICIAN_ID
).eq('category', CATEGORY).execute()

evaluated_result = supabase.table('evaluations_v40').select('collected_data_id').eq(
    'politician_id', POLITICIAN_ID
).eq('category', CATEGORY).eq('evaluator_ai', 'ChatGPT').execute()

evaluated_ids = {item['collected_data_id'] for item in (evaluated_result.data or []) if item.get('collected_data_id')}
unevaluated = [item for item in (collected_result.data or []) if item['id'] not in evaluated_ids]

print(f"미평가 데이터: {len(unevaluated)}개")
print()

# 2. 첫 3개만 Codex로 평가 테스트
test_data = unevaluated[:3]
print(f"테스트 데이터: {len(test_data)}개")
print()

# 3. Codex에 전달할 데이터 준비
data_json = []
for item in test_data:
    data_json.append({
        "id": item.get('id'),
        "title": html.unescape(item.get('title', '')),
        "content": html.unescape(item.get('content', ''))[:500],
        "source": html.unescape(item.get('source_name', '')),
        "date": item.get('published_date', '')
    })

print("Codex에 전달하는 데이터:")
for i, d in enumerate(data_json, 1):
    print(f"{i}. ID: {d['id'][:8]}... | 제목: {d['title'][:50]}")
print()

# 4. 프롬프트 생성
prompt = f"""정치인 조은희의 책임감 관련 데이터를 평가하세요.

평가 기준:
- +4 (탁월): 모범 사례, 법 제정, 대통령 표창 수준
- +3 (우수): 구체적 성과, 다수 법안 통과
- +2 (양호): 일반적 긍정 활동, 법안 발의
- +1 (보통): 노력, 출석, 기본 역량
- -1 (미흡): 비판 받음, 지적당함
- -2 (부족): 논란, 의혹 제기
- -3 (심각): 수사, 조사 착수
- -4 (최악): 유죄 확정, 법적 처벌
- X (제외): 동명이인, 10년 이상 과거, 가짜 정보

다음 JSON 형식으로 응답하세요:

```json
{{
  "evaluations": [
    {{
      "id": "데이터 ID",
      "rating": "+3",
      "rationale": "평가 근거 (한국어 1문장)"
    }}
  ]
}}
```

평가할 데이터:

{json.dumps(data_json, ensure_ascii=False, indent=2)}

각 데이터에 대해 rating과 rationale을 제공하세요."""

# 5. Codex CLI 실행
print("Codex CLI 실행 중...")
result = subprocess.run(
    ['codex', 'exec', '-m', 'gpt-5.1-codex-mini'],
    input=prompt,
    capture_output=True,
    text=True,
    encoding='utf-8',
    timeout=60,
    shell=True
)

output = result.stdout if result.stdout else result.stderr
if 'assistant\\n' in output:
    output = output.split('assistant\\n', 1)[1]

# JSON 추출
if '```json' in output:
    start = output.find('```json') + 7
    end = output.find('```', start)
    json_str = output[start:end].strip()
elif '```' in output:
    start = output.find('```') + 3
    end = output.find('```', start)
    json_str = output[start:end].strip()
else:
    json_str = output.strip()
    if '{' in json_str and '}' in json_str:
        start_idx = json_str.find('{')
        end_idx = json_str.rfind('}') + 1
        json_str = json_str[start_idx:end_idx]

print()
print("="*80)
print("Codex 응답 분석")
print("="*80)
print()

try:
    data = json.loads(json_str)
    evaluations = data.get('evaluations', [])

    print(f"Codex가 반환한 평가 개수: {len(evaluations)}개")
    print()

    for i, ev in enumerate(evaluations, 1):
        returned_id = ev.get('id')
        expected_id = data_json[i-1]['id']

        match = "✅ 일치" if returned_id == expected_id else f"❌ 불일치 (예상: {expected_id[:8]}...)"

        print(f"{i}. {match}")
        print(f"   반환된 ID: {returned_id}")
        print(f"   예상 ID: {expected_id}")
        print()

except json.JSONDecodeError as e:
    print(f"❌ JSON 파싱 오류: {e}")
    print(f"출력: {json_str[:500]}...")
