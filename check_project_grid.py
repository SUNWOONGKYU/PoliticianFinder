# -*- coding: utf-8 -*-
import sys
import os
import json
from supabase import create_client
from dotenv import load_dotenv

# UTF-8 출력 설정
sys.stdout.reconfigure(encoding='utf-8')

# .env.local 파일 로드
env_path = os.path.join('1_Frontend', '.env.local')
load_dotenv(env_path)

# Supabase 연결
url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
supabase = create_client(url, key)

# 전체 작업 조회
result = supabase.table('project_grid_tasks_revised').select('*').order('task_id').execute()

print(f"\n{'='*80}")
print(f"📊 프로젝트 그리드 현황")
print(f"{'='*80}\n")
print(f"총 작업 수: {len(result.data)}개\n")

# Phase별 통계
phase_stats = {}
status_stats = {}

for task in result.data:
    phase = task['phase']
    status = task['status']

    if phase not in phase_stats:
        phase_stats[phase] = {'total': 0, '완료': 0, '진행중': 0, '대기': 0}
    phase_stats[phase]['total'] += 1
    phase_stats[phase][status] = phase_stats[phase].get(status, 0) + 1

    status_stats[status] = status_stats.get(status, 0) + 1

print(f"{'='*80}")
print(f"Phase별 통계")
print(f"{'='*80}\n")

for phase in sorted(phase_stats.keys()):
    stats = phase_stats[phase]
    print(f"Phase {phase}: {stats['total']}개 작업")
    print(f"  - 완료: {stats.get('완료', 0)}개")
    print(f"  - 진행중: {stats.get('진행중', 0)}개")
    print(f"  - 대기: {stats.get('대기', 0)}개")
    print()

print(f"{'='*80}")
print(f"전체 작업 목록")
print(f"{'='*80}\n")

for task in result.data:
    task_id = task['task_id']
    task_name = task['task_name']
    phase = task['phase']
    status = task['status']
    progress = task['progress']
    build_result = task.get('build_result', 'N/A')

    print(f"{task_id}: {task_name}")
    print(f"  Phase: {phase} | 상태: {status} | 진행률: {progress}% | 빌드: {build_result}")
    print()

# JSON 파일로 저장
output_file = 'project_grid_summary.json'
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(result.data, f, ensure_ascii=False, indent=2)

print(f"\n{'='*80}")
print(f"✅ 상세 데이터가 '{output_file}' 파일에 저장되었습니다.")
print(f"{'='*80}\n")
