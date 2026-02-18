#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
V30 평가 지침에서 0등급 제거
10개 카테고리 파일 일괄 수정
"""
import os
import re

# 평가 지침 디렉토리
eval_dir = "설계문서_V7.0/V30/instructions/3_evaluate"

# 10개 카테고리 파일
categories = [
    "cat01_expertise.md",
    "cat02_leadership.md",
    "cat03_vision.md",
    "cat04_integrity.md",
    "cat05_ethics.md",
    "cat06_accountability.md",
    "cat07_transparency.md",
    "cat08_communication.md",
    "cat09_responsiveness.md",
    "cat10_publicinterest.md"
]

# 0등급 라인 패턴
zero_rating_pattern = r'\|\s*\*\*0\*\*\s*\|\s*0\s*\|.*?\|'

print('=' * 60)
print('V30 평가 지침 0등급 제거')
print('=' * 60)
print()

for cat_file in categories:
    filepath = os.path.join(eval_dir, cat_file)
    
    if not os.path.exists(filepath):
        print(f'⚠️ {cat_file} - 파일 없음')
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 0등급 라인 제거
    original_len = len(content)
    content = re.sub(zero_rating_pattern, '', content)
    
    # 연속된 빈 줄 제거 (최대 2개까지만)
    content = re.sub(r'\n{4,}', '\n\n\n', content)
    
    if len(content) == original_len:
        print(f'⚠️ {cat_file} - 0등급 없음')
        continue
    
    # 파일 저장
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f'✅ {cat_file} - 0등급 제거 완료')

print()
print('=' * 60)
print('✅ 10개 카테고리 0등급 제거 완료')
print('=' * 60)
