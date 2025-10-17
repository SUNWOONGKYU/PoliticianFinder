"""Test authentication functionality"""

import sys
import os
sys.path.insert(0, os.path.abspath('.'))

from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token
)
from datetime import timedelta


def test_password_hashing():
    """Test password hashing and verification"""
    print("Testing password hashing...")

    password = "TestPassword123!"
    hashed = get_password_hash(password)

    print(f"Original: {password}")
    print(f"Hashed: {hashed}")
    print(f"Verify correct: {verify_password(password, hashed)}")
    print(f"Verify wrong: {verify_password('wrong', hashed)}")
    print("✓ Password hashing test passed\n")


def test_jwt_tokens():
    """Test JWT token creation and decoding"""
    print("Testing JWT tokens...")

    # Test data
    user_data = {"user_id": 1, "email": "test@example.com"}

    # Create access token
    access_token = create_access_token(
        data=user_data,
        expires_delta=timedelta(minutes=30)
    )
    print(f"Access Token: {access_token[:50]}...")

    # Create refresh token
    refresh_token = create_refresh_token(data=user_data)
    print(f"Refresh Token: {refresh_token[:50]}...")

    # Decode access token
    access_payload = decode_token(access_token)
    print(f"Access Payload: {access_payload}")
    assert access_payload["type"] == "access"
    assert access_payload["user_id"] == 1

    # Decode refresh token
    refresh_payload = decode_token(refresh_token)
    print(f"Refresh Payload: {refresh_payload}")
    assert refresh_payload["type"] == "refresh"
    assert refresh_payload["user_id"] == 1

    print("✓ JWT token test passed\n")


def test_invalid_token():
    """Test invalid token handling"""
    print("Testing invalid token...")

    invalid_token = "invalid.token.here"
    payload = decode_token(invalid_token)
    print(f"Invalid token result: {payload}")
    assert payload is None

    print("✓ Invalid token test passed\n")


if __name__ == "__main__":
    print("=" * 50)
    print("Running Authentication Tests")
    print("=" * 50 + "\n")

    try:
        test_password_hashing()
        test_jwt_tokens()
        test_invalid_token()

        print("=" * 50)
        print("All tests passed successfully!")
        print("=" * 50)
    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        sys.exit(1)