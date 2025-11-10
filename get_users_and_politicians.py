#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
등록된 회원과 정치인 정보 확인
"""
from supabase import create_client
import os
from dotenv import load_dotenv
import sys
import io

# UTF-8 출력 설정
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

load_dotenv('1_Frontend/.env.local')

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not url or not key:
    raise ValueError("Supabase credentials missing")

supabase = create_client(url, key)

print("=== Registered Users ===\n")
try:
    users_result = supabase.table('users').select('id, email, username, role').limit(10).execute()
    if users_result.data:
        for user in users_result.data:
            print(f"ID: {user.get('id')}")
            print(f"Email: {user.get('email')}")
            print(f"Username: {user.get('username')}")
            print(f"Role: {user.get('role')}")
            print("-" * 50)
    else:
        print("No users found")
except Exception as e:
    print(f"Users table error: {str(e)}")

print("\n=== Registered Politicians ===\n")
try:
    politicians_result = supabase.table('politicians').select('id, name, party, position').limit(10).execute()
    if politicians_result.data:
        for pol in politicians_result.data:
            print(f"ID: {pol.get('id')}")
            print(f"Name: {pol.get('name')}")
            print(f"Party: {pol.get('party')}")
            print(f"Position: {pol.get('position')}")
            print("-" * 50)
    else:
        print("No politicians found")
except Exception as e:
    print(f"Politicians table error: {str(e)}")
