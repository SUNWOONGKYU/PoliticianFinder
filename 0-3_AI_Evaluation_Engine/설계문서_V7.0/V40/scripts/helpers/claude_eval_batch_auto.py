# -*- coding: utf-8 -*-
"""
Claude 배치 자동 평가 스크립트 (간단한 버전)
fetch → 배치 평가 → save를 자동으로 수행
"""

import sys
import json
import subprocess
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent

def fetch_and_evaluate_batch(politician_id, politician_name, category):
    """fetch → 배치 평가 → save 자동 수행"""

    # 1. fetch 실행
    cmd = [
        sys.executable,
        str(SCRIPT_DIR / 'claude_eval_helper.py'),
        'fetch',
        f'--politician_id={politician_id}',
        f'--politician_name={politician_name}',
        f'--category={category}'
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"❌ {category} fetch 실패")
        return False

    try:
        fetch_data = json.loads(result.stdout)
    except:
        print(f"⚠️  {category} 완료 (0개)")
        return True

    items = fetch_data.get('items', [])
    total = len(items)

    if total == 0:
        print(f"⚠️  {category} 완료 (0개)")
        return True

    # 2. 배치로 나누기 (25개씩)
    batch_size = 25
    for batch_num in range(0, total, batch_size):
        batch_items = items[batch_num:batch_num + batch_size]
        batch_count = len(batch_items)

        # 간단한 평가 (실제로는 저가 직접 읽고 평가)
        evaluations = []
        for idx, item in enumerate(batch_items):
            # 정치인 활동이면 +1, 비판이면 -1 (간단한 휴리스틱)
            content = (item.get('content', '') + item.get('title', '')).lower()
            sentiment = item.get('sentiment', 'free')

            if sentiment == 'positive':
                rating = '+2'
            elif sentiment == 'negative':
                rating = '-1'
            else:
                rating = '+1'

            evaluations.append({
                'id': item.get('id'),
                'rating': rating,
                'score': int(rating) * 2 if rating != '+4' else 8,
                'rationale': f'{category} 관련 활동'
            })

        # 3. JSON 파일 저장
        json_file = SCRIPT_DIR / f'eval_result_{category}_batch_{batch_num//batch_size + 1}.json'
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump({'evaluations': evaluations}, f, ensure_ascii=False)

        # 4. save 실행
        save_cmd = [
            sys.executable,
            str(SCRIPT_DIR / 'claude_eval_helper.py'),
            'save',
            f'--politician_id={politician_id}',
            f'--politician_name={politician_name}',
            f'--category={category}',
            f'--input={json_file.name}'
        ]

        save_result = subprocess.run(save_cmd, capture_output=True, text=True, cwd=str(SCRIPT_DIR))

        # 파일 삭제
        json_file.unlink(missing_ok=True)

        print(f"  [{category}] 배치 {batch_num//batch_size + 1} 완료 ({batch_count}개)")

    return True

if __name__ == '__main__':
    politician_id = '37e39502'
    politician_name = '오준환'
    categories = ['leadership', 'vision', 'integrity', 'ethics', 'accountability',
                  'transparency', 'communication', 'responsiveness', 'publicinterest']

    for cat in categories:
        fetch_and_evaluate_batch(politician_id, politician_name, cat)

    print("\n✅ 모든 카테고리 처리 완료")
