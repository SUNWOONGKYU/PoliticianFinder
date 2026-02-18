#!/usr/bin/env python3
"""Re-collect CRITICAL categories with Gemini only"""

import subprocess
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
V40_DIR = SCRIPT_DIR.parent.parent
WORKFLOW_DIR = V40_DIR / 'scripts' / 'workflow'

POLITICIAN_NAME = '박주민'
CRITICAL_CATEGORIES = ['responsiveness', 'integrity', 'ethics']

print("\n=== Gemini Re-collection for CRITICAL categories ===\n")
print(f"Politician: {POLITICIAN_NAME}")
print(f"Categories: {', '.join(CRITICAL_CATEGORIES)}")
print("\nTarget gaps:")
print("  - responsiveness: Gemini -18")
print("  - integrity: Gemini -7")
print("  - ethics: Gemini -3")
print()

for category in CRITICAL_CATEGORIES:
    print(f"\n{'='*70}")
    print(f"Collecting {category} with Gemini")
    print('='*70)

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

print("\n" + "=" * 70)
print("=== Gemini Re-collection complete ===")
print("=" * 70)
print("\nRun the following to verify:")
print("  python scripts/utils/analyze_collection_gaps.py")
print()
