"""
Verify data insertion to Supabase
"""

import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv(r'C:\Development_PoliticianFinder\Developement_Real_PoliticianFinder\0-3_AI_Evaluation_Engine\.env')

# Initialize Supabase client
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_KEY')
)

print("="*60)
print("Supabase Data Verification")
print("="*60)

# Get sample data from each item
for item_num in range(1, 8):
    print(f"\nItem {item_num}:")
    response = supabase.table('collected_data')\
        .select('data_title, rating, rating_rationale')\
        .eq('politician_id', 272)\
        .eq('category_num', 2)\
        .eq('item_num', item_num)\
        .limit(3)\
        .execute()

    for idx, record in enumerate(response.data, 1):
        print(f"  {idx}. [{record['rating']:+2d}] {record['data_title'][:40]}")
        print(f"      Rationale: {record['rating_rationale'][:60]}...")

print("\n" + "="*60)
print("Verification complete!")
print("="*60)
