#!/usr/bin/env python3
"""Re-collect CRITICAL gap categories"""

import subprocess
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
V40_DIR = SCRIPT_DIR.parent.parent
WORKFLOW_DIR = V40_DIR / 'scripts' / 'workflow'

POLITICIAN_ID = '8c5dcc89'
POLITICIAN_NAME = '박주민'

CRITICAL_CATEGORIES = ['responsiveness', 'integrity', 'ethics']

print("\n=== Re-collecting CRITICAL categories ===\n")
print(f"Politician: {POLITICIAN_NAME} ({POLITICIAN_ID})")
print(f"Categories: {', '.join(CRITICAL_CATEGORIES)}")
print("\nGaps:")
print("  - responsiveness: 64 items short")
print("  - integrity: 39 items short")
print("  - ethics: 37 items short")
print()

# Re-collect with Naver
print("=" * 70)
print("Starting Naver re-collection...")
print("=" * 70)

for category in CRITICAL_CATEGORIES:
    print(f"\n========== Collecting {category} ==========\n")

    cmd = [
        'python',
        str(WORKFLOW_DIR / 'collect_naver_v40_final.py'),
        '--politician-id', POLITICIAN_ID,
        '--politician-name', POLITICIAN_NAME,
        '--category', category
    ]

    try:
        result = subprocess.run(cmd, cwd=V40_DIR, capture_output=False, text=True)
        if result.returncode == 0:
            print(f"\n[SUCCESS] {category} collected")
        else:
            print(f"\n[WARNING] {category} collection had issues (code {result.returncode})")
    except Exception as e:
        print(f"\n[ERROR] Failed to collect {category}: {e}")

    print()

# Re-collect with Gemini
print("\n" + "=" * 70)
print("Starting Gemini re-collection...")
print("=" * 70)

for category in CRITICAL_CATEGORIES:
    print(f"\n========== Collecting {category} with Gemini ==========\n")

    cmd = [
        'python',
        str(WORKFLOW_DIR / 'collect_gemini_v40_final.py'),
        '--politician', POLITICIAN_NAME,
        '--category', category
    ]

    try:
        result = subprocess.run(cmd, cwd=V40_DIR, capture_output=False, text=True)
        if result.returncode == 0:
            print(f"\n[SUCCESS] {category} collected")
        else:
            print(f"\n[WARNING] {category} collection had issues (code {result.returncode})")
    except Exception as e:
        print(f"\n[ERROR] Failed to collect {category}: {e}")

    print()

print("\n" + "=" * 70)
print("=== Re-collection complete ===")
print("=" * 70)
print("\nRun the following to verify:")
print("  python scripts/utils/analyze_collection_gaps.py")
print()
