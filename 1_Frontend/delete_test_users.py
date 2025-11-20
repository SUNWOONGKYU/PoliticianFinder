from supabase import create_client
import os

# Supabase 설정
url = "https://ooddlafwdpzgxfefgsrx.supabase.co"
# Service role key (admin 권한)
service_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

supabase = create_client(url, service_key)

# 모든 사용자 조회
response = supabase.auth.admin.list_users()

print("현재 등록된 사용자:")
for i, user in enumerate(response, 1):
    email = user.email if hasattr(user, 'email') else 'No email'
    user_id = user.id if hasattr(user, 'id') else 'No ID'
    print(f"{i}. {email} (ID: {user_id})")

print("\n마지막 2개 사용자를 삭제하시겠습니까?")
