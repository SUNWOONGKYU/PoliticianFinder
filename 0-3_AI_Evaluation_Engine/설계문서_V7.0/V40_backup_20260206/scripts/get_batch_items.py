#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import subprocess
import sys

batch_num = int(sys.argv[1])
batch_size = 30

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

# Print simplified version for evaluation
for i, item in enumerate(batch_items, 1):
    print(f"\n=== Item {i}/{len(batch_items)} ===")
    print(f"ID: {item['id']}")
    print(f"Title: {item['title'][:100]}")
    print(f"Content: {item['content'][:200]}")
    print(f"Source: {item['source_name']}")
    print(f"Type: {item['data_type']}")
    print(f"Date: {item.get('published_date', 'N/A')}")
    print(f"Sentiment: {item['sentiment']}")
