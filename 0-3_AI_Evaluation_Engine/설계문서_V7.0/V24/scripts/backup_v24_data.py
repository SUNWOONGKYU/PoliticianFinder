# -*- coding: utf-8 -*-
"""
V24.0 → V26.0 마이그레이션: 기존 데이터 백업

목적:
- V24.0 수집 데이터 및 점수를 백업 테이블로 복사
- V26.0 데이터 수집 전 기존 데이터 보존
- 나중에 V24.0 vs V26.0 비교 분석 가능

백업 대상 테이블:
- collected_data → collected_data_v24_backup
- ai_category_scores → ai_category_scores_v24_backup
- ai_final_scores → ai_final_scores_v24_backup
- ai_evaluations → ai_evaluations_v24_backup
"""

import os
import sys
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 환경 변수 로드
load_dotenv()

# Supabase 클라이언트
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# 백업 대상 테이블 매핑
BACKUP_TABLES = {
    'collected_data': 'collected_data_v24_backup',
    'ai_category_scores': 'ai_category_scores_v24_backup',
    'ai_final_scores': 'ai_final_scores_v24_backup',
    'ai_evaluations': 'ai_evaluations_v24_backup',
}


def check_table_exists(table_name):
    """테이블 존재 여부 확인"""
    try:
        response = supabase.table(table_name).select('*').limit(1).execute()
        return True
    except Exception as e:
        if 'does not exist' in str(e).lower() or '42P01' in str(e):
            return False
        return True  # 다른 에러는 테이블이 있다고 가정


def get_table_count(table_name):
    """테이블 레코드 수 조회"""
    try:
        response = supabase.table(table_name).select('*', count='exact').execute()
        return response.count if response.count else 0
    except Exception:
        return 0


def backup_table(source_table, target_table, batch_size=1000):
    """테이블 백업 (배치 처리)"""
    print(f"\n{'='*60}")
    print(f"📦 {source_table} → {target_table} 백업")
    print(f"{'='*60}")

    # 원본 테이블 레코드 수 확인
    source_count = get_table_count(source_table)
    print(f"원본 테이블 레코드 수: {source_count:,}개")

    if source_count == 0:
        print("  ⚠️ 원본 테이블이 비어있음, 건너뛰기")
        return 0

    # 백업 테이블 존재 여부 확인
    if check_table_exists(target_table):
        existing_count = get_table_count(target_table)
        if existing_count > 0:
            print(f"  ⚠️ 백업 테이블에 이미 {existing_count:,}개 데이터 존재")
            print(f"  → 기존 백업 유지, 신규 백업 건너뛰기")
            return existing_count

    # 배치로 데이터 복사
    copied = 0
    offset = 0

    while offset < source_count:
        try:
            # 원본에서 배치 읽기
            response = supabase.table(source_table).select('*').range(offset, offset + batch_size - 1).execute()
            data = response.data

            if not data:
                break

            # 백업 테이블에 삽입
            for row in data:
                # ID 컬럼 제거 (자동 생성되도록)
                row_copy = {k: v for k, v in row.items() if not k.endswith('_id') or k == 'politician_id'}

                try:
                    supabase.table(target_table).insert(row_copy).execute()
                    copied += 1
                except Exception as e:
                    # 중복 키 에러 등은 무시
                    pass

            offset += batch_size
            print(f"  진행: {min(offset, source_count):,}/{source_count:,}")

        except Exception as e:
            print(f"  ❌ 배치 복사 에러: {e}")
            break

    print(f"  ✅ 백업 완료: {copied:,}개 복사됨")
    return copied


def run_backup():
    """전체 백업 실행"""
    print("="*60)
    print("V24.0 데이터 백업 시작")
    print("="*60)
    print(f"시작 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    results = {}

    for source, target in BACKUP_TABLES.items():
        try:
            count = backup_table(source, target)
            results[source] = count
        except Exception as e:
            print(f"❌ {source} 백업 실패: {e}")
            results[source] = -1

    print("\n" + "="*60)
    print("📊 백업 결과 요약")
    print("="*60)

    for source, count in results.items():
        target = BACKUP_TABLES[source]
        if count >= 0:
            print(f"✅ {source} → {target}: {count:,}개")
        else:
            print(f"❌ {source} → {target}: 실패")

    print("="*60)
    print(f"완료 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)


def verify_backup():
    """백업 검증"""
    print("\n" + "="*60)
    print("🔍 백업 검증")
    print("="*60)

    for source, target in BACKUP_TABLES.items():
        source_count = get_table_count(source)
        target_count = get_table_count(target)

        if source_count == target_count:
            status = "✅ 일치"
        elif target_count > 0:
            status = "⚠️ 부분 백업"
        else:
            status = "❌ 백업 없음"

        print(f"{source}: {source_count:,}개 | {target}: {target_count:,}개 | {status}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='V24.0 데이터 백업')
    parser.add_argument('--verify', action='store_true', help='백업 검증만 수행')

    args = parser.parse_args()

    if args.verify:
        verify_backup()
    else:
        run_backup()
        verify_backup()
