#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Mock 데이터(mock-data.json)를 Supabase에 업로드하는 스크립트
"""
import os
import sys
import json
from supabase import create_client
from datetime import datetime

if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

# Supabase 자격증명
SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

# Mock 데이터 파일 경로
MOCK_DATA_PATH = "../../assets/mock-data.json"

def load_mock_data():
    """Mock 데이터 파일 로드"""
    try:
        with open(MOCK_DATA_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
        print(f"Mock 데이터 로드 완료: {len(data.get('politicians', []))}명의 정치인")
        return data
    except Exception as e:
        print(f"Mock 데이터 로드 실패: {e}")
        return None

def transform_politician_data(politician):
    """Mock 데이터를 Supabase 스키마에 맞게 변환"""
    # Supabase 테이블 스키마:
    # id, name, party, region, position, profile_image_url, biography,
    # avg_rating, avatar_enabled, created_at, updated_at, composite_score,
    # position_type, status, gender, birth_year

    # birth_date에서 birth_year 추출
    birth_year = None
    if politician.get("birth_date"):
        try:
            birth_year = int(politician["birth_date"].split("-")[0])
        except:
            pass

    # bio를 biography로 매핑
    biography = politician.get("bio", "")

    # education, career, pledges는 JSON 문자열로 변환 (필요시)
    # 또는 별도 테이블로 분리할 수도 있음

    transformed = {
        "id": politician["id"],
        "name": politician["name"],
        "party": politician.get("party", ""),
        "region": politician.get("region", ""),
        "position": politician.get("position", ""),
        "profile_image_url": politician.get("profile_image_url"),
        "biography": biography,
        "composite_score": politician.get("composite_score", 0),
        "status": politician.get("status", ""),
        "birth_year": birth_year,
        "avg_rating": politician.get("member_rating", 0),
        "avatar_enabled": False,
        "created_at": politician.get("created_at", datetime.now().isoformat()),
        "updated_at": politician.get("updated_at", datetime.now().isoformat())
    }

    return transformed

def upload_politicians(supabase, politicians):
    """정치인 데이터를 Supabase에 업로드"""
    print("\n" + "=" * 80)
    print("정치인 데이터 업로드 시작")
    print("=" * 80)

    success_count = 0
    error_count = 0

    for politician in politicians:
        try:
            transformed = transform_politician_data(politician)

            # Upsert 방식: 기존 데이터가 있으면 업데이트, 없으면 삽입
            response = supabase.table("politicians").upsert(transformed).execute()

            success_count += 1
            if success_count % 10 == 0:
                print(f"진행: {success_count}/{len(politicians)}명 업로드 완료...")

        except Exception as e:
            error_count += 1
            print(f"오류 (ID: {politician.get('id')}): {str(e)[:100]}")

    print("\n" + "=" * 80)
    print(f"업로드 완료: 성공 {success_count}명, 실패 {error_count}명")
    print("=" * 80)

    return success_count, error_count

def main():
    """메인 함수"""
    print("\n" + "=" * 80)
    print("Mock 데이터를 Supabase에 업로드")
    print("=" * 80)
    print()

    # Mock 데이터 로드
    mock_data = load_mock_data()
    if not mock_data:
        print("Mock 데이터를 로드할 수 없습니다.")
        return

    politicians = mock_data.get("politicians", [])
    if not politicians:
        print("정치인 데이터가 없습니다.")
        return

    print(f"총 {len(politicians)}명의 정치인 데이터를 업로드합니다.")
    print()

    # Supabase 클라이언트 생성
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        print("Supabase 연결 성공")
        print()
    except Exception as e:
        print(f"Supabase 연결 실패: {e}")
        return

    # 데이터 업로드
    success, error = upload_politicians(supabase, politicians)

    if error == 0:
        print("\n모든 데이터가 성공적으로 업로드되었습니다!")
    else:
        print(f"\n일부 데이터 업로드 중 오류가 발생했습니다. ({error}건)")

if __name__ == "__main__":
    main()
