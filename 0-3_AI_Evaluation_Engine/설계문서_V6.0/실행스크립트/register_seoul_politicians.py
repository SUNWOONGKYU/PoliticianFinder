#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
서울시장 후보 12명 DB 등록
"""

import sys, os, io
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import json
import uuid
from supabase import create_client
from dotenv import load_dotenv

# 환경 변수 로드
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '.env')
load_dotenv(dotenv_path=env_path, override=True)

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

def load_candidates():
    """JSON 파일에서 후보자 정보 로드"""
    file_path = os.path.join(os.path.dirname(__file__), '..', 'seoul_mayor_candidates_basic_info.json')
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def register_politician(candidate):
    """정치인 DB 등록"""
    politician_id = str(uuid.uuid4())[:8]  # 8자리 ID 생성

    data = {
        'id': politician_id,
        'name': candidate['name'],
        'gender': candidate['gender'],
        'birth_date': candidate['birth_date'],
        'party': candidate['party'],
        'status': candidate['status'],
        'position': candidate['position'],
        'region': candidate['region_metro'],
        'district': candidate.get('region_local'),
        'profile_image_url': candidate.get('profile_image_url')
    }

    try:
        result = supabase.table('politicians').insert(data).execute()
        return politician_id, True
    except Exception as e:
        print(f"  ❌ 오류: {e}")
        return None, False

def main():
    print("="*100)
    print("서울시장 후보 12명 DB 등록")
    print("="*100)
    print()

    # 후보자 정보 로드
    candidates = load_candidates()
    print(f"📋 총 {len(candidates)}명 등록 예정")
    print()

    registered = []
    failed = []

    for i, candidate in enumerate(candidates, 1):
        name = candidate['name']
        party = candidate['party']

        print(f"{i:2d}. {name} ({party}) 등록 중...", end=' ')

        politician_id, success = register_politician(candidate)

        if success:
            registered.append((name, politician_id))
            print(f"✅ ID: {politician_id}")
        else:
            failed.append(name)
            print(f"❌ 실패")

    print()
    print("="*100)
    print(f"📊 등록 결과")
    print("="*100)
    print(f"  성공: {len(registered)}명")
    print(f"  실패: {len(failed)}명")
    print()

    if registered:
        print("✅ 등록된 정치인:")
        for name, pid in registered:
            print(f"  • {name:6s}: {pid}")
        print()

        # politician_id 매핑 파일 저장
        mapping_file = os.path.join(os.path.dirname(__file__), '..', 'seoul_politician_ids.txt')
        with open(mapping_file, 'w', encoding='utf-8') as f:
            for name, pid in registered:
                f.write(f"{name}\t{pid}\n")
        print(f"📁 ID 매핑 파일 저장: {mapping_file}")

    if failed:
        print("❌ 등록 실패:")
        for name in failed:
            print(f"  • {name}")

    print("="*100)

if __name__ == "__main__":
    main()
