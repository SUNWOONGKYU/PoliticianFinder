import os
from supabase import create_client
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), '1_Frontend', '.env.local')
load_dotenv(env_path)

url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

supabase = create_client(url, key)

print("=== ai_evaluations TABLE CHECK ===\n")

# Get one row to see columns
response = supabase.table('ai_evaluations').select('*').limit(1).execute()

if response.data and len(response.data) > 0:
    print("Columns found:")
    for key in response.data[0].keys():
        print(f"  - {key}")
else:
    print("No data in table. Checking table structure...")
    # Try to select specific columns
    try:
        test = supabase.table('ai_evaluations').select('evaluation_date').limit(1).execute()
        print("✅ evaluation_date column EXISTS")
    except Exception as e:
        print(f"❌ evaluation_date column ERROR: {e}")

    try:
        test = supabase.table('ai_evaluations').select('created_at').limit(1).execute()
        print("✅ created_at column EXISTS")
    except Exception as e:
        print(f"❌ created_at column ERROR: {e}")
