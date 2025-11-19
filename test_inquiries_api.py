#!/usr/bin/env python3
import os, sys
import requests
if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

# Test the deployed API endpoint
API_URL = "https://politician-finder-4y73d4rc2-finder-world.vercel.app/api/admin/inquiries"

print("=" * 80)
print("Testing Admin Inquiries API")
print("=" * 80)
print()
print(f"API URL: {API_URL}")
print()

# Make request without auth (should fail with 401 or 403)
print("1. Testing without authentication...")
response = requests.get(API_URL)
print(f"Status: {response.status_code}")
print(f"Response: {response.text[:500]}")
print()

# The API requires admin authentication, so we expect 401/403
if response.status_code in [401, 403]:
    print("✅ API correctly requires authentication")
else:
    print(f"⚠️ Unexpected status code: {response.status_code}")
