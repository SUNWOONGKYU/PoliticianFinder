#!/usr/bin/env python3
"""
Populate politician_details for all politicians in Supabase
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
env_path = os.path.join(os.path.dirname(__file__), '1_Frontend', '.env.local')
load_dotenv(env_path)

# Get Supabase credentials
url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not url or not key:
    print("❌ Supabase credentials not found!")
    print(f"URL: {'✅' if url else '❌'}")
    print(f"KEY: {'✅' if key else '❌'}")
    exit(1)

print(f"🔗 Connecting to Supabase...")
print(f"URL: {url}")

supabase: Client = create_client(url, key)

def populate_politician_details():
    """Populate politician_details for all politicians"""
    print("\n📊 Fetching all politicians...")

    # Get all politicians
    response = supabase.table('politicians').select('id, name').execute()
    politicians = response.data

    print(f"✅ Found {len(politicians)} politicians")

    # Get existing politician_details
    details_response = supabase.table('politician_details').select('politician_id').execute()
    existing_details = {d['politician_id'] for d in details_response.data}

    print(f"✅ Found {len(existing_details)} existing politician_details")

    # Find missing details
    missing = [p for p in politicians if p['id'] not in existing_details]

    if not missing:
        print("✅ All politicians already have politician_details records!")
        return

    print(f"\n⚠️  Missing politician_details for {len(missing)} politicians:")
    for i, p in enumerate(missing[:5], 1):
        print(f"   {i}. {p['name']} ({p['id']})")
    if len(missing) > 5:
        print(f"   ... and {len(missing) - 5} more")

    print(f"\n📝 Creating politician_details records...")

    # Insert missing records
    insert_data = [
        {
            'politician_id': p['id'],
            'user_rating': 0.0,
            'rating_count': 0
        }
        for p in missing
    ]

    try:
        insert_response = supabase.table('politician_details').insert(insert_data).execute()
        print(f"✅ Successfully created {len(insert_data)} politician_details records!")

        # Verify
        details_response = supabase.table('politician_details').select('politician_id').execute()
        new_count = len(details_response.data)
        print(f"\n📊 Final count:")
        print(f"   Politicians: {len(politicians)}")
        print(f"   Politician_details: {new_count}")

        if len(politicians) == new_count:
            print("✅ All politicians now have politician_details records!")
        else:
            print(f"⚠️  Still missing {len(politicians) - new_count} records")

    except Exception as e:
        print(f"❌ Error inserting records: {e}")
        return

if __name__ == "__main__":
    populate_politician_details()
