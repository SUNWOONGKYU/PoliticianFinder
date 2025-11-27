#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
신분(status) 값 수정: 예비후보자/후보자 → 출마자
현재 시점(2025-11-25)에는 아직 선거 등록 기간이 아니므로
"현직"과 "출마자"만 사용 가능
"""

import sys, os, io
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import json

def fix_status(data):
    """status 값 수정"""
    for person in data:
        status = person.get('status', '')

        # 현직이 아닌 모든 경우 → 출마자
        if status in ['예비후보자', '후보자', '국회의원', '출마 검토 중', '출마 가능성', '거론되는 인물']:
            person['status'] = '출마자'
        elif status == '현직':
            # 현직은 그대로 유지
            pass
        else:
            # 기타 예상치 못한 값도 출마자로 통일
            print(f"  ⚠️  예상치 못한 status 값: '{status}' → '출마자'로 변경 ({person['name']})")
            person['status'] = '출마자'

    return data

def process_file(filename):
    """JSON 파일 처리"""
    file_path = os.path.join(os.path.dirname(__file__), '..', filename)

    print(f"\n📁 {filename} 처리 중...")

    try:
        # 읽기
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        original_count = len(data)

        # status 변경 전 통계
        status_before = {}
        for person in data:
            status = person.get('status', '')
            status_before[status] = status_before.get(status, 0) + 1

        # status 수정
        data = fix_status(data)

        # status 변경 후 통계
        status_after = {}
        for person in data:
            status = person.get('status', '')
            status_after[status] = status_after.get(status, 0) + 1

        # 저장
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"  변경 전: {status_before}")
        print(f"  변경 후: {status_after}")
        print(f"  ✅ {original_count}명 처리 완료")

        return True

    except Exception as e:
        print(f"  ❌ 파일 처리 실패: {e}")
        return False

def main():
    print("="*100)
    print("신분(status) 값 수정: 현직/출마자로 통일")
    print("="*100)

    files = [
        'seoul_mayor_candidates_basic_info.json',
        'gyeonggi_governor_candidates_basic_info.json',
        'busan_mayor_candidates_basic_info.json'
    ]

    success_count = 0
    for filename in files:
        if process_file(filename):
            success_count += 1

    print("\n" + "="*100)
    print(f"✅ 처리 완료: {success_count}/{len(files)} 파일")
    print("="*100)
    print("\n📊 수정 규칙:")
    print("  - 현직: 그대로 유지 (현재 시장/국회의원)")
    print("  - 출마자: 출마 의사를 밝혔거나 거론되는 모든 사람")
    print("  - 예비후보자/후보자: 아직 등록 기간이 아니므로 → 출마자로 변경")
    print("="*100)

if __name__ == "__main__":
    main()
