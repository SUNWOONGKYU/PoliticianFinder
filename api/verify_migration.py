#!/usr/bin/env python
"""Verify migration files and display what would be created."""
import sys
from pathlib import Path

def verify_migrations():
    """Verify migration files exist and display summary."""
    print("=" * 60)
    print("Migration Files Verification Report")
    print("=" * 60)

    migrations_dir = Path("alembic/versions")

    if not migrations_dir.exists():
        print(f"[ERROR] Migrations directory not found: {migrations_dir}")
        return False

    migration_files = list(migrations_dir.glob("*.py"))

    if not migration_files:
        print(f"[ERROR] No migration files found in {migrations_dir}")
        return False

    print(f"\nFound {len(migration_files)} migration files:")
    print("-" * 60)

    for migration_file in sorted(migration_files):
        if migration_file.name == "__pycache__":
            continue

        print(f"\n[FILE] {migration_file.name}")

        # Parse migration file for details
        with open(migration_file, "r", encoding="utf-8") as f:
            lines = f.readlines()

        # Extract revision info
        for line in lines[:20]:  # Check first 20 lines
            if line.startswith('"""'):
                description = line.strip('"""').strip()
                if description:
                    print(f"  Description: {description}")
            elif "revision: str =" in line or "revision =" in line:
                revision = line.split("=")[1].strip().strip("'\"")
                print(f"  Revision: {revision}")
            elif "down_revision" in line and "=" in line:
                down_revision = line.split("=")[1].strip().strip("'\"")
                if down_revision != "None":
                    print(f"  Depends on: {down_revision}")
                else:
                    print(f"  Depends on: (initial migration)")

    print("\n" + "=" * 60)
    print("Tables to be created by migrations:")
    print("=" * 60)

    # List all tables that would be created
    tables = [
        ("001", "politician_evaluations", "AI evaluation data storage"),
        ("002", "categories", "Politician categories (국회의원, etc.)"),
        ("002", "users", "User accounts and profiles"),
        ("002", "politicians", "Politician profiles and information"),
        ("002", "ratings", "User ratings for politicians (12 dimensions)"),
        ("002", "comments", "User comments on politicians"),
        ("002", "notifications", "User notification system"),
        ("002", "posts", "Blog/news posts"),
        ("002", "reports", "Content reporting system"),
        ("002", "user_follows", "User follow relationships"),
        ("002", "politician_bookmarks", "User bookmarks for politicians"),
        ("002", "ai_evaluations", "AI-generated politician evaluations"),
    ]

    current_migration = None
    for migration, table, description in tables:
        if migration != current_migration:
            current_migration = migration
            print(f"\n[Migration {migration}]")
        print(f"  - {table:<25} : {description}")

    print("\n" + "=" * 60)
    print("Database Enums to be created:")
    print("=" * 60)

    enums = [
        ("politicalparty", "Political party affiliations"),
        ("notificationtype", "Types of notifications"),
        ("reporttype", "Types of content that can be reported"),
        ("reportreason", "Reasons for reporting content"),
        ("reportstatus", "Status of reports (pending, resolved, etc.)"),
    ]

    for enum_name, description in enums:
        print(f"  - {enum_name:<20} : {description}")

    print("\n" + "=" * 60)
    print("Key Indexes to be created:")
    print("=" * 60)

    indexes = [
        ("users", "email (unique)"),
        ("users", "username (unique)"),
        ("politicians", "name, party, category_id"),
        ("ratings", "user_politician (unique composite)"),
        ("categories", "slug (unique)"),
        ("posts", "slug (unique)"),
    ]

    for table, index_desc in indexes:
        print(f"  - {table:<20} : {index_desc}")

    print("\n" + "=" * 60)
    print("Foreign Key Relationships:")
    print("=" * 60)

    relationships = [
        ("politicians.category_id", "categories.id"),
        ("ratings.user_id", "users.id"),
        ("ratings.politician_id", "politicians.id"),
        ("comments.user_id", "users.id"),
        ("comments.politician_id", "politicians.id"),
        ("comments.parent_id", "comments.id (self-referential)"),
        ("notifications.user_id", "users.id"),
        ("posts.user_id", "users.id"),
        ("reports.reporter_id", "users.id"),
        ("user_follows.follower_id", "users.id"),
        ("user_follows.following_id", "users.id"),
        ("politician_bookmarks.user_id", "users.id"),
        ("politician_bookmarks.politician_id", "politicians.id"),
        ("ai_evaluations.politician_id", "politicians.id"),
    ]

    for foreign_key, references in relationships:
        print(f"  - {foreign_key:<35} -> {references}")

    print("\n" + "=" * 60)
    print("Test Data Summary (from seed_data.py):")
    print("=" * 60)

    seed_summary = [
        ("Categories", 3, "국회의원, 광역단체장, 기초단체장"),
        ("Users", 5, "1 admin + 4 test users"),
        ("Politicians", 10, "Various parties and positions"),
        ("Ratings", 4, "Sample 12-dimension ratings"),
        ("Comments", 4, "Including 1 reply"),
        ("Bookmarks", 4, "User-politician bookmarks"),
        ("User Follows", 5, "Follow relationships"),
        ("Notifications", 3, "Various notification types"),
    ]

    for entity, count, description in seed_summary:
        print(f"  - {entity:<15} : {count:>3} records ({description})")

    print("\n" + "=" * 60)
    print("Next Steps:")
    print("=" * 60)
    print("""
1. Ensure PostgreSQL is running:
   - Windows: Check Services for PostgreSQL
   - Mac/Linux: ps aux | grep postgres

2. Create database if not exists:
   createdb politician_finder

3. Run migrations:
   python -c "from alembic.config import Config; from alembic import command; cfg = Config('alembic.ini'); command.upgrade(cfg, 'head')"

4. Seed test data (optional):
   python -m app.utils.seed_data

5. Verify success:
   python test_db.py
""")

    return True

if __name__ == "__main__":
    success = verify_migrations()
    sys.exit(0 if success else 1)