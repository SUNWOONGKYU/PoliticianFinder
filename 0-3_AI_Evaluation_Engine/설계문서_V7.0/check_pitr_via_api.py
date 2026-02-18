#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Supabase Management API로 PITR 상태 확인

Personal Access Token 필요:
https://supabase.com/dashboard/account/tokens
"""

import os
import sys
import io
import requests
from dotenv import load_dotenv

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
load_dotenv()

project_ref = 'ooddlafwdpzgxfefgsrx'

print('='*80)
print('Supabase PITR 상태 확인 (Management API)')
print('='*80)

# Personal Access Token 확인
access_token = os.getenv('SUPABASE_ACCESS_TOKEN')

if not access_token:
    print('\n❌ SUPABASE_ACCESS_TOKEN 환경 변수가 없습니다.')
    print('\n📋 Personal Access Token 생성 방법:')
    print('1. https://supabase.com/dashboard/account/tokens')
    print('2. "Generate New Token" 클릭')
    print('3. 이름 입력: "PITR Recovery"')
    print('4. 토큰 복사')
    print('5. .env 파일에 추가:')
    print('   SUPABASE_ACCESS_TOKEN=sbp_...')
    print('\n또는 Supabase Dashboard에서 직접 확인하세요:')
    print(f'https://supabase.com/dashboard/project/{project_ref}/settings/database')
    sys.exit(1)

# Management API 호출
headers = {
    'Authorization': f'Bearer {access_token}',
    'Content-Type': 'application/json'
}

# 1. 프로젝트 정보
print('\n[1] 프로젝트 정보')
print('-'*80)
url = f'https://api.supabase.com/v1/projects/{project_ref}'
response = requests.get(url, headers=headers)

if response.status_code == 200:
    project = response.json()
    print(f"이름: {project.get('name')}")
    print(f"리전: {project.get('region')}")
    print(f"플랜: {project.get('organization', {}).get('billing_tier', 'unknown')}")
else:
    print(f'❌ 에러: {response.status_code} - {response.text}')
    sys.exit(1)

# 2. 백업 목록
print('\n[2] 백업 목록')
print('-'*80)
url = f'https://api.supabase.com/v1/projects/{project_ref}/database/backups'
response = requests.get(url, headers=headers)

if response.status_code == 200:
    backups = response.json()
    if backups:
        print(f"백업 개수: {len(backups)}개")
        for backup in backups[:5]:  # 최근 5개
            print(f"  - {backup.get('created_at')}: {backup.get('status')}")
    else:
        print("백업 없음")
else:
    print(f'⚠️ 백업 조회 실패: {response.status_code}')
    print(f'   (Pro 플랜만 가능할 수 있음)')

# 3. PITR 설정 확인
print('\n[3] PITR 설정')
print('-'*80)
url = f'https://api.supabase.com/v1/projects/{project_ref}/config/database/postgres'
response = requests.get(url, headers=headers)

if response.status_code == 200:
    config = response.json()
    pitr_enabled = config.get('pitr_enabled', False)
    print(f"PITR 활성화: {'✅ YES' if pitr_enabled else '❌ NO'}")
    if pitr_enabled:
        print(f"보관 기간: {config.get('pitr_retention_days', 7)}일")
else:
    print(f'⚠️ PITR 설정 조회 실패: {response.status_code}')

print('\n' + '='*80)
print('결론:')
if 'pitr_enabled' in locals() and pitr_enabled:
    print('✅ PITR 활성화됨 - 복구 가능!')
    print(f'\nDashboard에서 복구:')
    print(f'https://supabase.com/dashboard/project/{project_ref}/settings/database')
    print(f'\n복구 시점: 2026-01-26 21:40:00 (삭제 1분 전)')
else:
    print('⚠️ PITR 상태 확인 필요')
    print(f'\nDashboard에서 확인:')
    print(f'https://supabase.com/dashboard/project/{project_ref}/settings/database')
