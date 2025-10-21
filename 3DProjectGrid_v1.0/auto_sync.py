"""
CSV 파일 변경 감지 및 Excel 자동 동기화 스크립트
CSV 파일이 변경되면 자동으로 Excel 파일을 업데이트합니다.
"""

import os
import sys
import time
from datetime import datetime
from pathlib import Path

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# csv_to_excel 모듈 import
from csv_to_excel import create_excel_from_csv


def get_file_mtime(filepath: str) -> float:
    """파일의 마지막 수정 시간 반환"""
    if os.path.exists(filepath):
        return os.path.getmtime(filepath)
    return 0


def watch_and_sync(csv_file: str, excel_file: str, check_interval: int = 5):
    """
    CSV 파일을 감시하고 변경시 Excel 파일을 업데이트

    Args:
        csv_file: CSV 파일 경로
        excel_file: Excel 파일 경로
        check_interval: 체크 간격 (초)
    """
    print("="*70)
    print("CSV → Excel 자동 동기화 시작")
    print("="*70)
    print(f"감시 파일: {csv_file}")
    print(f"출력 파일: {excel_file}")
    print(f"체크 간격: {check_interval}초")
    print("\nCtrl+C를 눌러 종료하세요...")
    print("="*70 + "\n")

    last_mtime = 0
    first_run = True

    try:
        while True:
            current_mtime = get_file_mtime(csv_file)

            # 파일이 변경되었거나 첫 실행인 경우
            if current_mtime != last_mtime:
                if not first_run:
                    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    print(f"\n[{timestamp}] CSV 파일 변경 감지!")

                # Excel 파일 생성/업데이트
                try:
                    create_excel_from_csv(csv_file, excel_file)
                    if first_run:
                        print("\n✅ 초기 동기화 완료\n")
                        first_run = False
                    else:
                        print("\n✅ 동기화 완료\n")
                    last_mtime = current_mtime
                except Exception as e:
                    print(f"\n❌ 동기화 실패: {str(e)}\n")

            # 대기
            time.sleep(check_interval)

    except KeyboardInterrupt:
        print("\n\n" + "="*70)
        print("자동 동기화 종료")
        print("="*70)


def main():
    """메인 함수"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_file = os.path.join(script_dir, 'project_grid_v2.0_supabase.csv')
    excel_file = os.path.join(script_dir, 'project_grid_v2.0_supabase.xlsx')

    if not os.path.exists(csv_file):
        print(f"❌ CSV 파일을 찾을 수 없습니다: {csv_file}")
        return False

    # 자동 동기화 시작
    watch_and_sync(csv_file, excel_file, check_interval=2)


if __name__ == '__main__':
    main()
