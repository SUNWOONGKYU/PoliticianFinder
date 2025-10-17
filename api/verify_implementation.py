"""Verify complete backend implementation"""

import os
import sys
from pathlib import Path

def check_file_exists(filepath, description):
    """Check if a file exists"""
    path = Path(filepath)
    exists = path.exists()
    status = "[OK]" if exists else "[MISSING]"
    print(f"{status} {description}: {filepath}")
    return exists

def check_directory_exists(dirpath, description):
    """Check if a directory exists"""
    path = Path(dirpath)
    exists = path.exists() and path.is_dir()
    status = "[OK]" if exists else "[MISSING]"
    print(f"{status} {description}: {dirpath}")
    return exists

def verify_file_structure():
    """Verify all required files and directories exist"""
    print("=" * 60)
    print("Verifying File Structure")
    print("=" * 60 + "\n")

    checks = []

    # Configuration files
    print("Configuration Files:")
    checks.append(check_file_exists("requirements.txt", "Production dependencies"))
    checks.append(check_file_exists("requirements-dev.txt", "Development dependencies"))
    checks.append(check_file_exists("runtime.txt", "Python runtime version"))
    checks.append(check_file_exists(".env.example", "Environment template"))
    checks.append(check_file_exists(".gitignore", "Git ignore rules"))
    checks.append(check_file_exists("run.py", "Server runner"))
    print()

    # Application structure
    print("Application Structure:")
    checks.append(check_directory_exists("app", "App directory"))
    checks.append(check_file_exists("app/__init__.py", "App package"))
    checks.append(check_file_exists("app/main.py", "Main application"))
    print()

    # Core modules
    print("Core Modules:")
    checks.append(check_directory_exists("app/core", "Core directory"))
    checks.append(check_file_exists("app/core/config.py", "Configuration"))
    checks.append(check_file_exists("app/core/database.py", "Database connection"))
    checks.append(check_file_exists("app/core/security.py", "Security utilities"))
    print()

    # API structure
    print("API Structure:")
    checks.append(check_directory_exists("app/api", "API directory"))
    checks.append(check_file_exists("app/api/deps.py", "Dependencies"))
    checks.append(check_directory_exists("app/api/v1", "API v1 directory"))
    checks.append(check_file_exists("app/api/v1/router.py", "Main router"))
    checks.append(check_file_exists("app/api/v1/auth.py", "Auth endpoints"))
    checks.append(check_file_exists("app/api/v1/users.py", "User endpoints"))
    print()

    # Models
    print("Models:")
    checks.append(check_directory_exists("app/models", "Models directory"))
    checks.append(check_file_exists("app/models/user.py", "User model"))
    print()

    # Schemas
    print("Schemas:")
    checks.append(check_directory_exists("app/schemas", "Schemas directory"))
    checks.append(check_file_exists("app/schemas/auth.py", "Auth schemas"))
    print()

    # Utilities
    print("Utilities:")
    checks.append(check_directory_exists("app/utils", "Utils directory"))
    checks.append(check_file_exists("app/utils/auth.py", "Auth utilities"))
    print()

    # Test files
    print("Test Files:")
    checks.append(check_file_exists("test_auth_simple.py", "Auth component tests"))
    checks.append(check_file_exists("test_api_endpoints.py", "API endpoint tests"))
    print()

    # Documentation
    print("Documentation:")
    checks.append(check_file_exists("BACKEND_IMPLEMENTATION_REPORT.md", "Implementation report"))
    checks.append(check_file_exists("AUTHENTICATION_GUIDE.md", "Authentication guide"))
    checks.append(check_file_exists("IMPLEMENTATION_SUMMARY.md", "Implementation summary"))
    print()

    return all(checks)

def verify_imports():
    """Verify all critical imports work"""
    print("=" * 60)
    print("Verifying Imports")
    print("=" * 60 + "\n")

    checks = []

    try:
        print("Core imports...")
        from app.core.config import settings
        print(f"  [OK] Config - APP_NAME: {settings.APP_NAME}")
        checks.append(True)

        from app.core.database import engine, SessionLocal, get_db
        print("  [OK] Database")
        checks.append(True)

        from app.core.security import (
            get_password_hash,
            verify_password,
            create_access_token,
            create_refresh_token,
            decode_token
        )
        print("  [OK] Security")
        checks.append(True)

        print("\nAPI imports...")
        from app.api.deps import get_database, get_current_user
        print("  [OK] Dependencies")
        checks.append(True)

        from app.api.v1.router import api_router
        print("  [OK] Router")
        checks.append(True)

        print("\nModel imports...")
        from app.models.user import User
        print("  [OK] User model")
        checks.append(True)

        print("\nSchema imports...")
        from app.schemas.auth import (
            UserRegister,
            UserLogin,
            Token,
            UserResponse
        )
        print("  [OK] Auth schemas")
        checks.append(True)

        print("\nUtility imports...")
        from app.utils.auth import authenticate_user, create_user
        print("  [OK] Auth utilities")
        checks.append(True)

        print("\nFastAPI app...")
        from app.main import app
        print("  [OK] FastAPI application")
        checks.append(True)

    except ImportError as e:
        print(f"  [ERROR] Import failed: {e}")
        checks.append(False)

    print()
    return all(checks)

def verify_configuration():
    """Verify configuration is properly set up"""
    print("=" * 60)
    print("Verifying Configuration")
    print("=" * 60 + "\n")

    checks = []

    try:
        from app.core.config import settings

        # Check required settings
        required_settings = [
            ("APP_NAME", settings.APP_NAME),
            ("APP_VERSION", settings.APP_VERSION),
            ("DATABASE_URL", settings.DATABASE_URL),
            ("SECRET_KEY", settings.SECRET_KEY),
            ("ALGORITHM", settings.ALGORITHM),
            ("ACCESS_TOKEN_EXPIRE_MINUTES", settings.ACCESS_TOKEN_EXPIRE_MINUTES),
            ("REFRESH_TOKEN_EXPIRE_DAYS", settings.REFRESH_TOKEN_EXPIRE_DAYS),
        ]

        for name, value in required_settings:
            exists = bool(value)
            status = "[OK]" if exists else "[MISSING]"
            display_value = value if name not in ["SECRET_KEY", "DATABASE_URL"] else "***"
            print(f"{status} {name}: {display_value}")
            checks.append(exists)

        # Check property methods
        print("\nProperty methods:")
        print(f"[OK] CORS origins list: {settings.cors_origins_list}")
        print(f"[OK] Allowed extensions list: {settings.allowed_extensions_list}")
        checks.append(True)

    except Exception as e:
        print(f"[ERROR] Configuration check failed: {e}")
        checks.append(False)

    print()
    return all(checks)

def main():
    """Run all verification checks"""
    print("\n" + "=" * 60)
    print("BACKEND IMPLEMENTATION VERIFICATION")
    print("=" * 60 + "\n")

    results = []

    # Run checks
    results.append(("File Structure", verify_file_structure()))
    results.append(("Imports", verify_imports()))
    results.append(("Configuration", verify_configuration()))

    # Summary
    print("=" * 60)
    print("VERIFICATION SUMMARY")
    print("=" * 60 + "\n")

    all_passed = True
    for name, passed in results:
        status = "[PASS]" if passed else "[FAIL]"
        print(f"{status} {name}")
        if not passed:
            all_passed = False

    print("\n" + "=" * 60)
    if all_passed:
        print("SUCCESS: All verification checks passed!")
        print("=" * 60)
        print("\nYou can now:")
        print("1. Start the server: python run.py")
        print("2. View docs: http://localhost:8000/docs")
        print("3. Run API tests: python test_api_endpoints.py")
        print("4. Read guides: AUTHENTICATION_GUIDE.md")
        return 0
    else:
        print("FAILURE: Some verification checks failed!")
        print("=" * 60)
        print("\nPlease review the errors above and fix them.")
        return 1

if __name__ == "__main__":
    sys.exit(main())