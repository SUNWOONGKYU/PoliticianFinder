#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import subprocess
import sys

def get_items_batch(batch_num, batch_size=30):
    """Fetch items and return specific batch"""
    cmd = [
        sys.executable,
        'claude_eval_helper.py',
        'fetch',
        '--politician_id=d0a5d6e1',
        '--politician_name=조은희',
        '--category=transparency'
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
    data = json.loads(result.stdout)

    items = data['items']
    start_idx = (batch_num - 1) * batch_size
    end_idx = start_idx + batch_size
    batch_items = items[start_idx:end_idx]

    return batch_items

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python process_transparency_eval.py <batch_num>")
        sys.exit(1)

    batch_num = int(sys.argv[1])
    items = get_items_batch(batch_num)

    print(json.dumps(items, ensure_ascii=False, indent=2))
    print(f"\n\nBatch {batch_num}: {len(items)} items", file=sys.stderr)
