# -*- coding: utf-8 -*-
"""
평가 지침서 10개 파일에 0등급 추가 (8단계 → 9단계)
"""

import os
import re

eval_base = "설계문서_V7.0/instructions_v30/3_evaluate/"

files = [
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

print("=" * 80)
print("평가 지침서 10개 파일에 0등급 추가")
print("=" * 80)

for filename in files:
    filepath = os.path.join(eval_base, filename)

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 등급 체계 테이블 찾기
    # | **+1** | +2 | ... |
    # | **-1** | -2 | ... |
    # 사이에 0등급 삽입

    pattern = r'(\| \*\*\+1\*\* \| \+2 \| .*?\|\n)(\| \*\*-1\*\* \| -2 \| .*?\|)'

    def add_zero_rating(match):
        plus_one = match.group(1)
        minus_one = match.group(2)

        # 0등급 라인 생성
        zero_rating = "| **0** | 0 | 중립 - 긍정/부정 판단 불가, 정보 부족 또는 중립적 |\n"

        return plus_one + zero_rating + minus_one

    # 치환
    new_content = re.sub(pattern, add_zero_rating, content)

    # 파일 쓰기
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

    # 변경 확인
    if content != new_content:
        print(f"  OK {filename} - 0등급 추가 완료")
    else:
        print(f"  SKIP {filename} - 변경 없음 (이미 0등급 있거나 패턴 불일치)")

print("=" * 80)
print("작업 완료")
print("=" * 80)
