"""
Authentication Endpoints Test
Tests signup and login functionality
"""

import sys
import time
import subprocess
import urllib.request
import urllib.error
import json
import random
import string

def generate_random_user():
    """Generate random user data for testing"""
    random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    return {
        "email": f"test_{random_suffix}@example.com",
        "username": f"testuser_{random_suffix}",
        "password": "TestPassword123!",
        "full_name": f"Test User {random_suffix}"
    }

def make_request(url, data=None, method='GET'):
    """Make HTTP request"""
    try:
        if data:
            data_bytes = json.dumps(data).encode('utf-8')
            req = urllib.request.Request(
                url,
                data=data_bytes,
                headers={'Content-Type': 'application/json'},
                method=method
            )
        else:
            req = urllib.request.Request(url, method=method)

        with urllib.request.urlopen(req, timeout=30) as response:
            return {
                'status': response.status,
                'data': json.loads(response.read().decode())
            }
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        try:
            error_data = json.loads(error_body)
        except:
            error_data = error_body
        return {
            'status': e.code,
            'error': error_data
        }
    except Exception as e:
        return {
            'status': 'ERROR',
            'error': str(e)
        }

def test_auth_endpoints():
    print("=" * 70)
    print("Authentication API Test")
    print("=" * 70)

    # Start server
    print("\n1. Starting server...")
    proc = subprocess.Popen(
        [sys.executable, "run.py"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    print("   Waiting for server (5 seconds)...")
    time.sleep(5)

    if proc.poll() is not None:
        print("[ERROR] Server failed to start!")
        return False

    print("   [OK] Server started")

    try:
        user_data = generate_random_user()
        print(f"\n2. Testing with user: {user_data['username']}")

        # Test Signup
        print("\n3. Testing Signup...")
        print(f"   POST /api/v1/auth/signup")
        signup_result = make_request(
            "http://localhost:8000/api/v1/auth/signup",
            data=user_data,
            method='POST'
        )

        if signup_result['status'] == 201:
            print(f"   [OK] Signup successful (201)")
            print(f"   User ID: {signup_result['data'].get('id')}")
            print(f"   Email: {signup_result['data'].get('email')}")
            print(f"   Username: {signup_result['data'].get('username')}")
        else:
            print(f"   [FAIL] Signup failed ({signup_result['status']})")
            print(f"   Error: {signup_result.get('error')}")
            return False

        # Test Login
        print("\n4. Testing Login...")
        print(f"   POST /api/v1/auth/login")
        login_data = {
            "email": user_data['email'],
            "password": user_data['password']
        }
        login_result = make_request(
            "http://localhost:8000/api/v1/auth/login",
            data=login_data,
            method='POST'
        )

        if login_result['status'] == 200:
            print(f"   [OK] Login successful (200)")
            access_token = login_result['data'].get('access_token')
            refresh_token = login_result['data'].get('refresh_token')
            print(f"   Access token: {access_token[:30]}...")
            print(f"   Refresh token: {refresh_token[:30]}...")
            print(f"   Token type: {login_result['data'].get('token_type')}")
        else:
            print(f"   [FAIL] Login failed ({login_result['status']})")
            print(f"   Error: {login_result.get('error')}")
            return False

        # Test Get Current User
        print("\n5. Testing Get Current User...")
        print(f"   GET /api/v1/users/me")

        req = urllib.request.Request(
            "http://localhost:8000/api/v1/users/me",
            headers={'Authorization': f"Bearer {access_token}"}
        )

        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                user_info = json.loads(response.read().decode())
                print(f"   [OK] Got current user (200)")
                print(f"   User: {user_info.get('username')}")
                print(f"   Email: {user_info.get('email')}")
                print(f"   Full name: {user_info.get('full_name')}")
        except Exception as e:
            print(f"   [FAIL] Failed to get current user")
            print(f"   Error: {str(e)}")
            return False

        # Test Duplicate Signup
        print("\n6. Testing Duplicate Signup (should fail)...")
        print(f"   POST /api/v1/auth/signup")
        dup_result = make_request(
            "http://localhost:8000/api/v1/auth/signup",
            data=user_data,
            method='POST'
        )

        if dup_result['status'] == 409:
            print(f"   [OK] Duplicate signup correctly rejected (409)")
            print(f"   Error message: {dup_result.get('error', {}).get('detail')}")
        else:
            print(f"   [FAIL] Duplicate signup should have failed with 409, got {dup_result['status']}")
            print(f"   Response: {dup_result}")
            return False

        # Test Wrong Password
        print("\n7. Testing Login with wrong password (should fail)...")
        print(f"   POST /api/v1/auth/login")
        wrong_login = make_request(
            "http://localhost:8000/api/v1/auth/login",
            data={
                "email": user_data['email'],
                "password": "WrongPassword123!"
            },
            method='POST'
        )

        if wrong_login['status'] == 401:
            print(f"   [OK] Wrong password correctly rejected (401)")
        else:
            print(f"   [FAIL] Wrong password should have been rejected")
            return False

        print("\n" + "=" * 70)
        print("[OK] All authentication tests passed!")
        print("=" * 70)
        return True

    except Exception as e:
        print(f"\n[ERROR] Test failed with exception: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

    finally:
        # Stop server
        print("\n8. Stopping server...")
        proc.terminate()
        try:
            proc.wait(timeout=5)
            print("   [OK] Server stopped")
        except subprocess.TimeoutExpired:
            proc.kill()
            print("   [OK] Server killed")

if __name__ == "__main__":
    success = test_auth_endpoints()
    sys.exit(0 if success else 1)
