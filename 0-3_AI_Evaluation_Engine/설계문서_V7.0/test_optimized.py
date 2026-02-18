#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
최적화 버전 테스트 실행 (1개 카테고리만)

목표: 1개 카테고리로 최적화 검증
- Gemini: 75개 (카테고리당)
- 현재 부족분: expertise (1개 부족) → 테스트용

예상 시간 (최적화):
- Gemini Tier 1: 75개 × 0.4초 = 30초
- Gemini Free: 75개 × 12초 = 15분
"""

import subprocess
import sys
import io

# UTF-8 출력 설정
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

print('='*80)
print('⚡ 최적화 버전 테스트 (1개 카테고리)')
print('='*80)

politician_id = 'd0a5d6e1'
politician_name = '조은희'

print(f'\n정치인: {politician_name} ({politician_id})')
print(f'테스트 카테고리: expertise (전문성)')
print(f'목표: 75개 (Gemini)')

print('\n⚡ 최적화 사항:')
print('  1. Gemini Tier 자동 감지')
print('     - Tier 1: 0.4초 간격 → 30초 완료')
print('     - Free: 12초 간격 → 15분 완료')

print('\n예상 시간:')
print('  - Tier 1: 약 30초')
print('  - Free Tier: 약 15분')

response = input('\n테스트 실행하시겠습니까? (yes/no): ')

if response.lower() != 'yes':
    print('중단됨')
    sys.exit(0)

# 실행 (카테고리 1번만)
cmd = [
    'python',
    'V30/scripts/collect_v30_optimized.py',
    f'--politician_id={politician_id}',
    f'--politician_name={politician_name}',
    '--category=1',  # expertise만
    '--parallel'
]

print('\n실행 명령어:')
print(' '.join(cmd))
print('\n' + '='*80)

subprocess.run(cmd, cwd='설계문서_V7.0')
