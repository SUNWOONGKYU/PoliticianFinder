#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
프로젝트 그리드 업데이트 내역을 Supabase에 반영하는 스크립트
2025-11-21: AI 모델 축소 및 테이블 레이아웃 균형 조정 작업 반영
"""
import os, sys
from supabase import create_client
import json
from datetime import datetime

if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def read_json_file(file_path):
    """JSON 파일 읽기"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"❌ 파일 읽기 실패: {file_path}")
        print(f"   오류: {str(e)}")
        return None

def insert_project_grid_task(task_data):
    """프로젝트 그리드 작업 데이터를 Supabase에 삽입"""
    try:
        task_id = task_data.get('task_id')

        # Git commit 정보
        git_commit = task_data.get('git_commit', {})
        git_hash = git_commit.get('hash', '')
        git_message = git_commit.get('message', '')

        # 파일 수정 내역을 generated_files 형식으로 변환
        files_modified = task_data.get('files_modified', [])
        file_paths = []
        for file_info in files_modified:
            path = file_info.get('path', '')
            if path:
                file_paths.append(path)

        # modification_history 형식 생성
        modification_entry = f"2025-11-21: {task_data.get('task_name')} [{git_hash}]\n"
        if files_modified:
            for file_info in files_modified:
                modification_entry += f"  - {file_info.get('description', '')}\n"

        # remarks 생성 (notes + impact_analysis)
        remarks_list = task_data.get('notes', [])
        impact = task_data.get('impact_analysis', {})
        if impact:
            remarks_list.append(f"Impact: {json.dumps(impact, ensure_ascii=False)}")

        # project_grid_tasks_revised 테이블에 upsert
        result = supabase.table('project_grid_tasks_revised').upsert({
            'task_id': task_id,
            'task_name': task_data.get('task_name'),
            'phase': task_data.get('phase'),
            'area': task_data.get('area'),
            'status': task_data.get('status'),
            'progress': task_data.get('progress'),
            'assigned_agent': task_data.get('execution_info', {}).get('assigned_agent', 'Claude Code'),
            'generated_files': ', '.join(file_paths),
            'modification_history': modification_entry,
            'build_result': task_data.get('verification', {}).get('build', {}).get('status', ''),
            'validation_result': '통과' if task_data.get('status') == '완료' else '진행중',
            'remarks': ' | '.join(remarks_list) if remarks_list else '',
            'updated_at': datetime.now().isoformat()
        }).execute()

        print(f"[OK] {task_id} 반영 성공")
        return True

    except Exception as e:
        print(f"[FAIL] {task_id} 반영 실패")
        print(f"   오류: {str(e)}")
        return False

def main():
    """메인 함수"""
    print("\n" + "="*70)
    print("프로젝트 그리드 데이터베이스 업데이트 시작")
    print("="*70 + "\n")

    # 업데이트할 JSON 파일 목록
    json_files = [
        {
            'path': '0-5_Development_ProjectGrid/action/PROJECT_GRID_REVISED/grid/update_ai_models_reduction.json',
            'task_id': 'AI_MODELS_REDUCTION',
            'description': 'AI 평가 모델 축소 (5개 → 3개)'
        },
        {
            'path': '0-5_Development_ProjectGrid/action/PROJECT_GRID_REVISED/grid/update_table_layout_balance.json',
            'task_id': 'TABLE_LAYOUT_BALANCE',
            'description': '홈 및 정치인 페이지 테이블 레이아웃 균형 조정'
        }
    ]

    success_count = 0
    fail_count = 0

    for item in json_files:
        print(f"\n처리 중: {item['description']}")
        print(f"Task ID: {item['task_id']}")
        print("-" * 70)

        # JSON 파일 읽기
        task_data = read_json_file(item['path'])

        if task_data:
            # Supabase에 삽입
            if insert_project_grid_task(task_data):
                success_count += 1
            else:
                fail_count += 1
        else:
            fail_count += 1

    # 결과 요약
    print("\n" + "="*70)
    print("업데이트 완료")
    print("="*70)
    print(f"✅ 성공: {success_count}개")
    print(f"❌ 실패: {fail_count}개")
    print(f"📊 총 작업: {success_count + fail_count}개")
    print("="*70 + "\n")

    # 상세 작업 내역 출력
    if success_count > 0:
        print("\n반영된 작업 내역:")
        print("-" * 70)
        print("1. AI_MODELS_REDUCTION (AI 평가 모델 축소)")
        print("   - AI 모델 5개 → 3개 (Claude, ChatGPT, Grok)")
        print("   - Gemini, Perplexity 제거")
        print("   - Git: d6f51ff")
        print("")
        print("2. TABLE_LAYOUT_BALANCE (테이블 레이아웃 균형 조정)")
        print("   - 홈 및 정치인 페이지 레이아웃 통일")
        print("   - 컬럼별 적절한 너비 클래스 적용")
        print("   - Git: ad177de")
        print("="*70 + "\n")

if __name__ == "__main__":
    main()
