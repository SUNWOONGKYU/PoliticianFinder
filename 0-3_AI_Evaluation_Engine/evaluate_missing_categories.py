#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""누락된 카테고리 재평가"""

import sys
import os

# UTF-8 출력
if sys.platform == 'win32':
    import io
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    except AttributeError:
        pass

print("="*80)
print("누락된 5개 카테고리 재평가")
print("="*80)
print()

# evaluate_v30.py를 누락된 카테고리만 실행
missing_categories = [
    "accountability",
    "transparency",
    "communication",
    "responsiveness",
    "publicinterest"
]

print("누락된 카테고리:")
for cat in missing_categories:
    print(f"  - {cat}")
print()

print("평가 스크립트를 --categories 옵션으로 실행하겠습니다...")
print()

# 명령어 생성
cmd = f"python 설계문서_V7.0/V30/scripts/evaluate_v30.py --politician_id=f9e00370 --politician_name=\"김민석\" --parallel --categories {','.join(missing_categories)}"

print(f"실행 명령어:")
print(cmd)
print()
print("="*80)
