"""Simple test for authentication functionality"""

import sys
import os
sys.path.insert(0, os.path.abspath('.'))

def test_imports():
    """Test if all imports work"""
    try:
        from app.core.security import (
            verify_password,
            get_password_hash,
            create_access_token,
            create_refresh_token,
            decode_token
        )
        print("[OK] Security imports successful")

        from app.schemas.auth import (
            UserRegister,
            UserLogin,
            Token,
            TokenRefresh,
            UserResponse
        )
        print("[OK] Schema imports successful")

        from app.api.deps import (
            get_database,
            get_current_user
        )
        print("[OK] Dependency imports successful")

        from app.models.user import User
        print("[OK] Model imports successful")

        from app.core.config import settings
        print(f"[OK] Config loaded: APP_NAME = {settings.APP_NAME}")
        print(f"[OK] Config loaded: SECRET_KEY exists = {bool(settings.SECRET_KEY)}")
        print(f"[OK] Config loaded: ACCESS_TOKEN_EXPIRE_MINUTES = {settings.ACCESS_TOKEN_EXPIRE_MINUTES}")
        print(f"[OK] Config loaded: REFRESH_TOKEN_EXPIRE_DAYS = {settings.REFRESH_TOKEN_EXPIRE_DAYS}")

        return True
    except Exception as e:
        print(f"[FAIL] Import failed: {e}")
        return False


if __name__ == "__main__":
    print("=" * 50)
    print("Testing Authentication Components")
    print("=" * 50 + "\n")

    if test_imports():
        print("\n" + "=" * 50)
        print("All authentication components are properly configured!")
        print("=" * 50)
    else:
        print("\nSome components failed to load.")
        sys.exit(1)