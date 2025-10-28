"""
Simple server test script
Tests if the FastAPI server can start and respond to basic requests
"""

import sys
import time
import subprocess
import urllib.request
import urllib.error
import json

def test_server():
    print("=" * 60)
    print("Backend Server Test")
    print("=" * 60)

    # Start the server
    print("\n1. Starting FastAPI server...")
    proc = subprocess.Popen(
        [sys.executable, "run.py"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    # Wait for server to start
    print("   Waiting for server to start (5 seconds)...")
    time.sleep(5)

    # Check if process is still running
    if proc.poll() is not None:
        stdout, stderr = proc.communicate()
        print("\n[ERROR] Server failed to start!")
        print("\nSTDOUT:")
        print(stdout)
        print("\nSTDERR:")
        print(stderr)
        return False

    print("   [OK] Server process started")

    # Test endpoints
    test_results = []

    endpoints = [
        ("Root", "http://localhost:8000/"),
        ("Health", "http://localhost:8000/health"),
        ("API Health", "http://localhost:8000/api/v1/health"),
        ("API Docs", "http://localhost:8000/docs"),
    ]

    print("\n2. Testing endpoints...")

    for name, url in endpoints:
        try:
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=5) as response:
                status = response.status
                if url.endswith("/docs"):
                    # Docs returns HTML
                    content = "Swagger UI"
                else:
                    content = json.loads(response.read().decode())

                test_results.append((name, url, status, "[OK] PASS", content))
                print(f"   [OK] {name}: {status} - PASS")

        except urllib.error.HTTPError as e:
            test_results.append((name, url, e.code, "[FAIL] FAIL", str(e)))
            print(f"   [FAIL] {name}: {e.code} - FAIL")
        except Exception as e:
            test_results.append((name, url, "N/A", "[FAIL] ERROR", str(e)))
            print(f"   [FAIL] {name}: ERROR - {str(e)}")

    # Stop the server
    print("\n3. Stopping server...")
    proc.terminate()
    try:
        proc.wait(timeout=5)
        print("   [OK] Server stopped")
    except subprocess.TimeoutExpired:
        proc.kill()
        print("   [OK] Server killed (forced)")

    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)

    passed = sum(1 for r in test_results if r[3] == "[OK] PASS")
    total = len(test_results)

    print(f"\nPassed: {passed}/{total}")

    for result in test_results:
        name, url, status, result_str, content = result
        print(f"\n{name}:")
        print(f"  URL: {url}")
        print(f"  Status: {status}")
        print(f"  Result: {result_str}")
        if result_str == "[OK] PASS" and isinstance(content, dict):
            print(f"  Response: {json.dumps(content, indent=4)}")

    print("\n" + "=" * 60)

    if passed == total:
        print("[OK] All tests passed!")
        print("=" * 60)
        return True
    else:
        print(f"[FAIL] {total - passed} test(s) failed")
        print("=" * 60)
        return False


if __name__ == "__main__":
    success = test_server()
    sys.exit(0 if success else 1)
