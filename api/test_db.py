#!/usr/bin/env python
"""Test database connection and models."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from sqlalchemy import text
import traceback

def test_database():
    """Test database connection and table creation."""
    print("Testing database connection...")
    print(f"Database URL: {settings.DATABASE_URL}")

    try:
        # Test basic connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("Database connection successful")

        # Check if tables exist
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                ORDER BY table_name
            """))
            tables = [row[0] for row in result]

            if tables:
                print(f"\nExisting tables ({len(tables)}):")
                for table in tables:
                    print(f"  - {table}")
            else:
                print("\nNo tables found in database")

        # Try to create all tables
        print("\nCreating tables from models...")
        Base.metadata.create_all(bind=engine)
        print("Tables created/verified successfully")

        # Check tables again
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                ORDER BY table_name
            """))
            tables = [row[0] for row in result]

            print(f"\nTables after creation ({len(tables)}):")
            for table in tables:
                print(f"  - {table}")

    except Exception as e:
        print(f"\nError: {e}")
        traceback.print_exc()
        return False

    return True

if __name__ == "__main__":
    success = test_database()
    sys.exit(0 if success else 1)