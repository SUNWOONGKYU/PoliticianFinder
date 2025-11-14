import os, sys
from supabase import create_client
if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

modifications = """2025-11-14 Modifications:

1. Community Page UI Fixes:
   - Hot/Best badges moved next to title (matches homepage)
   - Total post count display (86 posts using pagination.total)
   - Member level duplicate removal (ML prefix handling)
   
2. Homepage UI Fixes:
   - Politician name display: removed '의원' suffix (matches community)
   - Added influence level (🏰 영주) to popular posts
   - Added like/dislike/share icons to politician posts
   - Removed status hardcoding, using API data
   
3. Politician Scores:
   - Changed to 3-digit scores (DB x10: 93→930, 95→950)
   - Updated grade thresholds (900/850/800/750/700)
   
4. Admin Dashboard:
   - Users API changed: users table → profiles table
   - Field mapping: user_id→id, nickname→username
   - Status conversion: is_active/is_banned
   
Commits: b033bfc, 43b696c, 5faebdf, 7d2fb29, 09041c3, 76e82b7, cf86af7
Files: page.tsx, community/page.tsx, politicians/page.tsx, api/admin/users/route.ts
"""

print("Updating P3BA3 with today's modifications...")
supabase.table('project_grid_tasks_revised').update({
    'modification_history': modifications,
    'status': 'completed',
    'progress': 100
}).eq('task_id', 'P3BA3').execute()

print("P3BA3 updated successfully!")
print("\nModifications added:")
print(modifications)
