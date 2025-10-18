"""
프로젝트 그리드 업데이트 스크립트
CSV 파일의 진행률, 상태, 테스트 결과를 업데이트합니다.
"""

import csv
import os
import sys
from datetime import datetime
from typing import Dict, List
import shutil

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# 완료된 작업 정의
COMPLETED_TASKS = {
    # Backend
    'P1B1': {'progress': '100%', 'status': '완료', 'test': '통과', 'note': 'FastAPI 서버 실행 및 DB 연결 테스트 완료'},
    'P1B6': {'progress': '100%', 'status': '완료', 'test': '통과', 'note': '인증 엔드포인트 테스트 완료'},
    'P1B7': {'progress': '100%', 'status': '완료', 'test': '통과', 'note': 'Health check 엔드포인트 테스트 완료'},

    # Database
    'P1D1': {'progress': '100%', 'status': '완료', 'test': '통과', 'note': 'users 테이블 생성 완료'},
    'P1D2': {'progress': '100%', 'status': '완료', 'test': '통과', 'note': 'politicians 테이블 생성 완료'},
    'P1D3': {'progress': '100%', 'status': '완료', 'test': '통과', 'note': 'ratings 테이블 생성 완료'},
    'P1D4': {'progress': '100%', 'status': '완료', 'test': '통과', 'note': 'categories 테이블 생성 완료'},
    'P1D5': {'progress': '100%', 'status': '완료', 'test': '통과', 'note': 'comments 테이블 생성 완료'},
    'P1D6': {'progress': '100%', 'status': '완료', 'test': '통과', 'note': 'notifications 테이블 생성 완료'},
    'P1D7': {'progress': '100%', 'status': '완료', 'test': '통과', 'note': 'posts 테이블 생성 완료'},
    'P1D8': {'progress': '100%', 'status': '완료', 'test': '통과', 'note': 'reports 테이블 생성 완료'},
    'P1D9': {'progress': '100%', 'status': '완료', 'test': '통과', 'note': 'user_follows 테이블 생성 완료'},
    'P1D10': {'progress': '100%', 'status': '완료', 'test': '통과', 'note': 'politician_bookmarks 테이블 생성 완료'},
    'P1D11': {'progress': '100%', 'status': '완료', 'test': '통과', 'note': 'ai_evaluations 테이블 생성 완료'},
    'P1D12': {'progress': '100%', 'status': '완료', 'test': '통과', 'note': 'politician_evaluations 테이블 생성 완료'},

    # Frontend
    'P1F1': {'progress': '100%', 'status': '완료', 'test': '통과', 'note': 'Next.js 14 프로젝트 초기화 완료 - 로컬 테스트 통과'},
    'P1F2': {'progress': '100%', 'status': '완료', 'test': '통과', 'note': 'TypeScript & Tailwind 설정 완료 - 로컬 테스트 통과'},
    'P1F3': {'progress': '100%', 'status': '완료', 'test': '통과', 'note': 'shadcn/ui 설치 및 설정 완료 - UI 컴포넌트 정상 렌더링'},
    'P1F4': {'progress': '100%', 'status': '완료', 'test': '검토완료', 'note': '폴더 구조 생성 완료'},
    'P1F5': {'progress': '100%', 'status': '완료', 'test': '통과', 'note': 'Zustand 인증 상태 관리 구현 완료'},
    'P1F6': {'progress': '100%', 'status': '완료', 'test': '통과', 'note': '회원가입 페이지 구현 완료 - UI 렌더링 확인'},
    'P1F7': {'progress': '100%', 'status': '완료', 'test': '통과', 'note': '로그인 페이지 구현 완료 - UI 렌더링 확인'},
}


def backup_file(filepath: str) -> str:
    """파일 백업 생성"""
    if not os.path.exists(filepath):
        return None

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_dir = os.path.join(os.path.dirname(filepath), 'backups')
    os.makedirs(backup_dir, exist_ok=True)

    filename = os.path.basename(filepath)
    backup_path = os.path.join(backup_dir, f"{filename.replace('.csv', '')}_backup_{timestamp}.csv")

    shutil.copy2(filepath, backup_path)
    print(f"✓ 백업 생성: {backup_path}")
    return backup_path


def read_csv(filepath: str) -> List[List[str]]:
    """CSV 파일 읽기"""
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        return list(reader)


def write_csv(filepath: str, data: List[List[str]]):
    """CSV 파일 쓰기"""
    with open(filepath, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(data)


def find_task_row_and_col(data: List[List[str]], task_id: str) -> tuple:
    """작업 ID의 행과 열 번호 찾기"""
    for row_idx, row in enumerate(data):
        for col_idx, cell in enumerate(row):
            if cell == task_id:
                return (row_idx, col_idx)
    return (-1, -1)


def update_grid(csv_path: str):
    """그리드 업데이트"""
    print("\n" + "="*70)
    print("프로젝트 그리드 업데이트")
    print("="*70)

    # 백업 생성
    backup_path = backup_file(csv_path)

    # CSV 읽기
    print(f"\n✓ CSV 파일 읽기: {csv_path}")
    data = read_csv(csv_path)

    # 헤더 찾기 (작업ID 행)
    task_id_row_idx = None
    progress_row_idx = None
    status_row_idx = None
    test_row_idx = None

    for i, row in enumerate(data):
        if len(row) > 1 and row[1] == '작업ID':
            task_id_row_idx = i
        elif len(row) > 1 and row[1] == '진도':
            progress_row_idx = i
        elif len(row) > 1 and row[1] == '상태':
            status_row_idx = i
        elif len(row) > 1 and row[1] == '테스트/검토':
            test_row_idx = i

    if not all([task_id_row_idx, progress_row_idx, status_row_idx, test_row_idx]):
        print("❌ 필요한 행을 찾을 수 없습니다.")
        return

    print(f"✓ 작업ID 행: {task_id_row_idx + 1}")
    print(f"✓ 진도 행: {progress_row_idx + 1}")
    print(f"✓ 상태 행: {status_row_idx + 1}")
    print(f"✓ 테스트/검토 행: {test_row_idx + 1}")

    # 업데이트 카운터
    updated_count = 0

    # 각 완료된 작업 업데이트
    print(f"\n완료된 작업 업데이트 중...")
    for task_id, task_info in COMPLETED_TASKS.items():
        # 작업 ID의 행과 열 찾기
        task_row, task_col = find_task_row_and_col(data, task_id)

        if task_row == -1:
            print(f"⚠ {task_id}를 찾을 수 없습니다.")
            continue

        # 진도, 상태, 테스트 행은 작업ID 행으로부터 상대적 위치
        # 진도는 작업ID + 4, 상태는 +5, 테스트/검토는 +6
        progress_offset = 4
        status_offset = 5
        test_offset = 6

        # 데이터 업데이트
        data[task_row + progress_offset][task_col] = task_info['progress']
        data[task_row + status_offset][task_col] = task_info['status']
        data[task_row + test_offset][task_col] = task_info['test']

        updated_count += 1
        print(f"  ✓ {task_id}: {task_info['progress']} | {task_info['status']} | {task_info['test']} - {task_info['note']}")

    # 업데이트된 CSV 저장
    write_csv(csv_path, data)
    print(f"\n✓ {updated_count}개 작업 업데이트 완료")
    print(f"✓ CSV 파일 저장: {csv_path}")

    # 요약 출력
    print("\n" + "="*70)
    print("업데이트 요약")
    print("="*70)
    print(f"Backend 작업: 3개 완료")
    print(f"Database 작업: 12개 완료 (모든 테이블)")
    print(f"Frontend 작업: 7개 완료")
    print(f"총 {len(COMPLETED_TASKS)}개 작업 완료")
    print("="*70)

    return True


if __name__ == '__main__':
    csv_file = 'project_grid_v1.2_full_XY.csv'
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(script_dir, csv_file)

    if not os.path.exists(csv_path):
        print(f"❌ CSV 파일을 찾을 수 없습니다: {csv_path}")
        exit(1)

    success = update_grid(csv_path)

    if success:
        print("\n✅ 그리드 업데이트 성공!")
    else:
        print("\n❌ 그리드 업데이트 실패")
