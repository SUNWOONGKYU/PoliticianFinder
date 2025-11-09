#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Supabase auth.users에 Mock 사용자 생성
"""
import requests

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"
MOCK_USER_UUID = "00000000-0000-0000-0000-000000000001"

def create_auth_user():
    """Supabase Admin API를 사용하여 auth.users에 Mock 사용자 생성"""
    print("=" * 80)
    print("Supabase auth.users에 Mock 사용자 생성")
    print("=" * 80)

    # Supabase Admin API endpoint
    url = f"{SUPABASE_URL}/auth/v1/admin/users"

    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json"
    }

    # Mock 사용자 데이터
    user_data = {
        "email": "mock@politicianfinder.com",
        "password": "mock-password-12345",
        "email_confirm": True,
        "user_metadata": {
            "name": "Mock User",
            "role": "user"
        }
    }

    try:
        response = requests.post(url, json=user_data, headers=headers)

        if response.status_code == 200 or response.status_code == 201:
            result = response.json()
            print(f"[OK] Mock 사용자 생성 성공!")
            print(f"    - User ID: {result.get('id')}")
            print(f"    - Email: {result.get('email')}")
            return result.get('id')
        else:
            print(f"[INFO] 응답 상태: {response.status_code}")
            print(f"[INFO] 응답 내용: {response.text}")

            # 이미 존재하는 경우
            if "already been registered" in response.text or response.status_code == 422:
                print("[OK] Mock 사용자가 이미 존재합니다")
                return MOCK_USER_UUID

            return None
    except Exception as e:
        print(f"[FAIL] 오류 발생: {e}")
        return None

def main():
    user_id = create_auth_user()

    if user_id:
        print("\n" + "=" * 80)
        print("다음 단계: upload_all_mock_data.py를 실행하여 Mock 데이터 업로드")
        print("=" * 80)
    else:
        print("\n[FAIL] Mock 사용자 생성 실패")

if __name__ == "__main__":
    main()
