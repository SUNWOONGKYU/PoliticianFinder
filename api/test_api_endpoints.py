"""Test API endpoints and authentication flow"""

import httpx
import json
from datetime import datetime

# API base URL
BASE_URL = "http://localhost:8000"

# Test user data
test_user = {
    "email": "test@example.com",
    "password": "TestPassword123!",
    "username": "testuser",
    "full_name": "Test User"
}

def test_health_check():
    """Test health check endpoint"""
    print("Testing health check...")
    response = httpx.get(f"{BASE_URL}/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    print(f"[OK] Health check: {data}")


def test_api_docs():
    """Test API documentation endpoints"""
    print("\nTesting API documentation...")

    # Test Swagger UI
    response = httpx.get(f"{BASE_URL}/docs")
    assert response.status_code == 200
    print("[OK] Swagger UI available at /docs")

    # Test ReDoc
    response = httpx.get(f"{BASE_URL}/redoc")
    assert response.status_code == 200
    print("[OK] ReDoc available at /redoc")


def test_registration():
    """Test user registration"""
    print("\nTesting user registration...")

    response = httpx.post(
        f"{BASE_URL}/api/v1/auth/signup",
        json=test_user
    )

    if response.status_code == 409:
        print("[INFO] User already exists, skipping registration")
        return None

    assert response.status_code == 201
    data = response.json()
    print(f"[OK] User registered: {data['email']}")
    return data


def test_login():
    """Test user login"""
    print("\nTesting user login...")

    response = httpx.post(
        f"{BASE_URL}/api/v1/auth/login",
        json={
            "email": test_user["email"],
            "password": test_user["password"]
        }
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"

    print("[OK] Login successful")
    print(f"[OK] Access token received: {data['access_token'][:20]}...")
    return data


def test_authenticated_endpoint(token):
    """Test authenticated endpoint"""
    print("\nTesting authenticated endpoint...")

    headers = {"Authorization": f"Bearer {token}"}
    response = httpx.get(
        f"{BASE_URL}/api/v1/users/me",
        headers=headers
    )

    assert response.status_code == 200
    data = response.json()
    print(f"[OK] Current user: {data['email']}")
    return data


def test_token_refresh(refresh_token):
    """Test token refresh"""
    print("\nTesting token refresh...")

    response = httpx.post(
        f"{BASE_URL}/api/v1/auth/refresh",
        json={"refresh_token": refresh_token}
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    print("[OK] Token refreshed successfully")
    return data


def main():
    """Run all tests"""
    print("=" * 50)
    print("API Endpoint Tests")
    print("=" * 50)

    try:
        # Basic endpoints
        test_health_check()
        test_api_docs()

        # Authentication flow
        test_registration()
        tokens = test_login()

        if tokens:
            test_authenticated_endpoint(tokens["access_token"])
            test_token_refresh(tokens["refresh_token"])

        print("\n" + "=" * 50)
        print("All tests passed successfully!")
        print("=" * 50)

    except httpx.ConnectError:
        print("\n[ERROR] Cannot connect to API server")
        print("Make sure the server is running: python run.py")
        return 1
    except AssertionError as e:
        print(f"\n[ERROR] Test failed: {e}")
        return 1
    except Exception as e:
        print(f"\n[ERROR] Unexpected error: {e}")
        return 1

    return 0


if __name__ == "__main__":
    exit(main())