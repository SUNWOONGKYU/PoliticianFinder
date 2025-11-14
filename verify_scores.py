import os, sys
from supabase import create_client
if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'
SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8"
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
response = supabase.table('politicians').select('name, evaluation_score, ai_score').limit(5).execute()
for p in response.data:
    print(f"{p['name']}: eval={p.get('evaluation_score')}, ai={p.get('ai_score')}")
