#!/usr/bin/env python3
import os, sys
from supabase import create_client
if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

print("=" * 80)
print("Check Inquiries Table")
print("=" * 80)
print()

# Check if inquiries table exists and get data
result = supabase.table('inquiries').select('*').limit(10).execute()

if result.data:
    print(f"Found {len(result.data)} inquiries:")
    print()
    for inquiry in result.data:
        print(f"ID: {inquiry.get('id')}")
        print(f"Title: {inquiry.get('title')}")
        print(f"Status: {inquiry.get('status')}")
        print(f"Created: {inquiry.get('created_at')}")
        print()
else:
    print("No inquiries found in database")
    print()
    print("Creating sample inquiry for testing...")

    # Get wksun999@gmail.com user
    admin_result = supabase.table('users').select('user_id, email').eq('email', 'wksun999@gmail.com').limit(1).execute()

    if admin_result.data:
        admin_user = admin_result.data[0]
        print(f"Using user: {admin_user['email']} (ID: {admin_user['user_id']})")

        # Create sample inquiry (user_id can be null for anonymous inquiries)
        sample = supabase.table('inquiries').insert({
            'user_id': None,  # Try without user_id first
            'email': admin_user['email'],
            'title': '테스트 문의',
            'content': '이것은 테스트 문의입니다.',
            'status': 'pending',
            'priority': 'normal',
        }).execute()

        if sample.data:
            print("✅ Sample inquiry created successfully!")
            print(f"ID: {sample.data[0].get('id')}")
        else:
            print("❌ Failed to create sample inquiry")
    else:
        print("❌ No admin user found")
