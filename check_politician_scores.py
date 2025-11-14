#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import sys
from supabase import create_client

if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8"

def main():
    print("Connecting to Supabase...")
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    print("\nFetching politicians with scores...")
    response = supabase.table('politicians').select('id, name, evaluation_score, ai_score, user_rating').limit(10).execute()
    
    print(f"\nFound {len(response.data)} politicians (showing first 10):\n")
    for p in response.data:
        print(f"Name: {p['name']}")
        print(f"  evaluation_score: {p.get('evaluation_score')}")
        print(f"  ai_score: {p.get('ai_score')}")
        print(f"  user_rating: {p.get('user_rating')}")
        print()

if __name__ == '__main__':
    main()
