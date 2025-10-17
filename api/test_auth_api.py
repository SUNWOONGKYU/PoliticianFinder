#!/usr/bin/env python3
"""Test script for authentication API endpoints"""

import sys
import json
import random
import string
from datetime import datetime

import httpx


BASE_URL = "http://localhost:8000/api/v1"


def generate_test_data():
    """Generate random test user data"""
    random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    return {
        "email": f"testuser_{random_suffix}@example.com",
        "password": "TestPass123!",
        "username": f"testuser_{random_suffix}",
        "full_name": "Test User"
    }


def test_signup(client, user_data):
    """Test user signup"""
    print("\n1. Testing Signup...")
    response = client.post(f"{BASE_URL}/auth/signup", json=user_data)

    if response.status_code == 201:
        user = response.json()
        print(f"   ✓ User created successfully")
        print(f"     - ID: {user['id']}")
        print(f"     - Email: {user['email']}")
        print(f"     - Username: {user['username']}")
        return user
    else:
        print(f"   ✗ Signup failed: {response.status_code}")
        print(f"     {response.json()}")
        return None


def test_signup_duplicate(client, user_data):
    """Test duplicate signup prevention"""
    print("\n2. Testing Duplicate Signup Prevention...")
    response = client.post(f"{BASE_URL}/auth/signup", json=user_data)

    if response.status_code == 409:
        print("   ✓ Duplicate signup correctly prevented")
        print(f"     - Error: {response.json()['detail']}")
        return True
    else:
        print(f"   ✗ Unexpected response: {response.status_code}")
        return False


def test_login(client, email, password):
    """Test user login"""
    print("\n3. Testing Login...")
    login_data = {
        "email": email,
        "password": password
    }
    response = client.post(f"{BASE_URL}/auth/login", json=login_data)

    if response.status_code == 200:
        tokens = response.json()
        print("   ✓ Login successful")
        print(f"     - Token type: {tokens['token_type']}")
        print(f"     - Expires in: {tokens['expires_in']} seconds")
        print(f"     - Access token: {tokens['access_token'][:50]}...")
        return tokens
    else:
        print(f"   ✗ Login failed: {response.status_code}")
        print(f"     {response.json()}")
        return None


def test_invalid_login(client):
    """Test login with invalid credentials"""
    print("\n4. Testing Invalid Login...")
    login_data = {
        "email": "nonexistent@example.com",
        "password": "WrongPassword123!"
    }
    response = client.post(f"{BASE_URL}/auth/login", json=login_data)

    if response.status_code == 401:
        print("   ✓ Invalid login correctly rejected")
        print(f"     - Error: {response.json()['detail']}")
        return True
    else:
        print(f"   ✗ Unexpected response: {response.status_code}")
        return False


def test_get_current_user(client, access_token):
    """Test getting current user info"""
    print("\n5. Testing Get Current User...")
    headers = {"Authorization": f"Bearer {access_token}"}
    response = client.get(f"{BASE_URL}/auth/me", headers=headers)

    if response.status_code == 200:
        user = response.json()
        print("   ✓ Current user retrieved successfully")
        print(f"     - ID: {user['id']}")
        print(f"     - Email: {user['email']}")
        print(f"     - Active: {user['is_active']}")
        return user
    else:
        print(f"   ✗ Failed to get current user: {response.status_code}")
        print(f"     {response.json()}")
        return None


def test_unauthorized_access(client):
    """Test accessing protected endpoint without token"""
    print("\n6. Testing Unauthorized Access...")
    response = client.get(f"{BASE_URL}/auth/me")

    if response.status_code == 401:
        print("   ✓ Unauthorized access correctly rejected")
        print(f"     - Error: {response.json()['detail']}")
        return True
    else:
        print(f"   ✗ Unexpected response: {response.status_code}")
        return False


def test_refresh_token(client, refresh_token):
    """Test token refresh"""
    print("\n7. Testing Token Refresh...")
    response = client.post(
        f"{BASE_URL}/auth/refresh",
        json={"refresh_token": refresh_token}
    )

    if response.status_code == 200:
        tokens = response.json()
        print("   ✓ Token refresh successful")
        print(f"     - New access token: {tokens['access_token'][:50]}...")
        return tokens
    else:
        print(f"   ✗ Token refresh failed: {response.status_code}")
        print(f"     {response.json()}")
        return None


def test_user_profile_update(client, access_token):
    """Test updating user profile"""
    print("\n8. Testing User Profile Update...")
    headers = {"Authorization": f"Bearer {access_token}"}
    update_data = {
        "bio": "Test bio for API testing",
        "full_name": "Updated Test User"
    }
    response = client.patch(f"{BASE_URL}/users/me", json=update_data, headers=headers)

    if response.status_code == 200:
        user = response.json()
        print("   ✓ Profile updated successfully")
        print(f"     - Full name: {user['full_name']}")
        print(f"     - Bio: {user['bio']}")
        return user
    else:
        print(f"   ✗ Profile update failed: {response.status_code}")
        print(f"     {response.json()}")
        return None


def test_password_change(client, access_token, current_password):
    """Test changing user password"""
    print("\n9. Testing Password Change...")
    headers = {"Authorization": f"Bearer {access_token}"}
    password_data = {
        "current_password": current_password,
        "new_password": "NewTestPass456!"
    }
    response = client.post(
        f"{BASE_URL}/users/me/change-password",
        json=password_data,
        headers=headers
    )

    if response.status_code == 200:
        print("   ✓ Password changed successfully")
        print(f"     - {response.json()['message']}")
        return True
    else:
        print(f"   ✗ Password change failed: {response.status_code}")
        print(f"     {response.json()}")
        return False


def main():
    """Run all authentication API tests"""
    print("=" * 60)
    print("Authentication API Test Suite")
    print("=" * 60)

    with httpx.Client() as client:
        # Generate test data
        user_data = generate_test_data()
        print(f"\nTest user email: {user_data['email']}")
        print(f"Test username: {user_data['username']}")

        # Run tests
        # 1. Test signup
        created_user = test_signup(client, user_data)
        if not created_user:
            print("\n✗ Stopping tests due to signup failure")
            return 1

        # 2. Test duplicate signup prevention
        test_signup_duplicate(client, user_data)

        # 3. Test login
        tokens = test_login(client, user_data["email"], user_data["password"])
        if not tokens:
            print("\n✗ Stopping tests due to login failure")
            return 1

        access_token = tokens["access_token"]
        refresh_token = tokens["refresh_token"]

        # 4. Test invalid login
        test_invalid_login(client)

        # 5. Test get current user
        current_user = test_get_current_user(client, access_token)

        # 6. Test unauthorized access
        test_unauthorized_access(client)

        # 7. Test token refresh
        new_tokens = test_refresh_token(client, refresh_token)
        if new_tokens:
            access_token = new_tokens["access_token"]

        # 8. Test profile update
        test_user_profile_update(client, access_token)

        # 9. Test password change
        test_password_change(client, access_token, user_data["password"])

        print("\n" + "=" * 60)
        print("All tests completed!")
        print("=" * 60)

    return 0


if __name__ == "__main__":
    sys.exit(main())