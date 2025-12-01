#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
오세훈, 한동훈 2명 풀링 시스템 - 김동연 스크립트 2회 실행
"""
import subprocess
import sys
import time
from datetime import datetime

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 테스트할 정치인 2명
TEST_POLITICIANS = [
    {'id': '62e7b453', 'name': '오세훈'},
    {'id': '7abadf92', 'name': '한동훈'}
]

print("="*80)
print("오세훈, 한동훈 전체 10개 카테고리 풀링 시스템")
print("="*80)
print(f"정치인: {', '.join([p['name'] for p in TEST_POLITICIANS])}")
print(f"카테고리: 10개 전체")
print("예상 소요 시간: 약 4시간 (각 정치인 2시간)")
print("="*80)

overall_start = datetime.now()

for idx, politician in enumerate(TEST_POLITICIANS, 1):
    print(f"\n{'='*80}")
    print(f"[{idx}/2] {politician['name']} 평가 시작...")
    print(f"{'='*80}")
    
    # 환경 변수로 정치인 정보 전달하여 pooling_batch_evaluation.py 실행
    # 하지만 이 방법은 복잡하므로, 대신 임시 스크립트 생성
    
    # pooling_batch_evaluation.py의 POLITICIAN_ID와 POLITICIAN_NAME을 교체한 임시 파일 생성
    with open('pooling_batch_evaluation.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # ID와 이름 교체
    modified_content = content.replace(
        'POLITICIAN_ID = "0756ec15"\nPOLITICIAN_NAME = "김동연"',
        f'POLITICIAN_ID = "{politician["id"]}"\nPOLITICIAN_NAME = "{politician["name"]}"'
    )
    
    temp_script = f'pooling_temp_{politician["id"]}.py'
    with open(temp_script, 'w', encoding='utf-8') as f:
        f.write(modified_content)
    
    # 실행
    result = subprocess.run(
        [sys.executable, temp_script],
        capture_output=False
    )
    
    if result.returncode != 0:
        print(f"\n❌ {politician['name']} 평가 실패!")
    else:
        print(f"\n✅ {politician['name']} 평가 완료!")

overall_end = datetime.now()
total_duration = (overall_end - overall_start).total_seconds() / 60

print(f"\n{'='*80}")
print("📊 전체 완료!")
print(f"{'='*80}")
print(f"총 소요 시간: {total_duration:.1f}분 ({total_duration/60:.1f}시간)")
print(f"{'='*80}")

# 결과 파일 확인
print("\n생성된 결과 파일:")
for politician in TEST_POLITICIANS:
    filename = f"pooling_batch_summary_{politician['name']}.json"
    print(f"  - {filename}")
