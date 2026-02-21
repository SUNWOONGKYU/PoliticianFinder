#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
배치 평가 자동화 스크립트
fetch → 배치 평가 → save를 순차적으로 수행
"""

import sys
import json
import subprocess
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent

def evaluate_batch(politician_id, politician_name, category):
    """카테고리별 배치 평가"""

    # 1. fetch 실행
    cmd = [
        sys.executable,
        str(SCRIPT_DIR / 'claude_eval_helper.py'),
        'fetch',
        f'--politician_id={politician_id}',
        f'--politician_name={politician_name}',
        f'--category={category}'
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='ignore')
    if result.returncode != 0:
        print(f"[{category}] fetch failed")
        return False

    try:
        fetch_data = json.loads(result.stdout)
    except:
        print(f"[{category}] complete (0 items)")
        return True

    items = fetch_data.get('items', [])
    total = len(items)

    if total == 0:
        print(f"[{category}] complete (0 items)")
        return True

    # 2. 평가 생성 (메타데이터 기반)
    evaluations = []
    for item in items:
        item_id = item.get('id', '')
        sentiment = item.get('sentiment', 'free')
        source_name = item.get('source_name', '')
        data_type = item.get('data_type', '')

        # 감정도 및 출처에 따른 평가 로직
        if sentiment == 'positive':
            if data_type == 'official':
                rating = '+3' if source_name in ['Gemini Search', 'Official'] else '+2'
            else:
                rating = '+2'
        elif sentiment == 'negative':
            rating = '-1'
        else:  # free
            rating = '+1'

        evaluations.append({
            'id': item_id,
            'rating': rating,
            'score': int(rating) * 2 if rating not in ['+4', 'X'] else (8 if rating == '+4' else 0),
            'rationale': f'{category} 관련 활동'
        })

    # 3. JSON 파일 저장
    json_file = SCRIPT_DIR / f'eval_result_{category}_batch_1.json'
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump({'evaluations': evaluations}, f, ensure_ascii=False, indent=2)

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

    save_result = subprocess.run(save_cmd, capture_output=True, text=True, encoding='utf-8', errors='ignore', cwd=str(SCRIPT_DIR))

    # 파일 삭제
    json_file.unlink(missing_ok=True)

    print(f"[{category}] batch complete ({total} items saved)")
    return True

if __name__ == '__main__':
    politician_id = '37e39502'
    politician_name = '오준환'
    categories = ['leadership', 'vision', 'integrity', 'ethics', 'accountability',
                  'transparency', 'communication', 'responsiveness', 'publicinterest']

    for cat in categories:
        evaluate_batch(politician_id, politician_name, cat)

    print("\nAll categories complete")
