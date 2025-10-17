#!/usr/bin/env python
"""Test migration script."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from alembic.config import Config
from alembic import command

def test_migration():
    """Test migration functionality."""
    try:
        # Create alembic configuration
        alembic_cfg = Config("alembic.ini")

        # Check current migration status
        print("Current migration status:")
        command.current(alembic_cfg)

        print("\nMigration history:")
        command.history(alembic_cfg)

        # Run migration
        print("\nRunning migration to head...")
        command.upgrade(alembic_cfg, "head")

        print("\nMigration completed successfully!")
        command.current(alembic_cfg)

    except Exception as e:
        print(f"Error during migration: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_migration()