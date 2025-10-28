"""Test script to verify all models can be imported successfully"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

def test_imports():
    """Test importing all models"""
    print("Testing model imports...")
    print("-" * 50)

    try:
        # Import all models
        from app.models import (
            PoliticianEvaluation,
            User,
            Category,
            Politician,
            PoliticalParty,
            Rating,
            Comment,
            Notification,
            NotificationType,
            Post,
            Report,
            ReportType,
            ReportReason,
            ReportStatus,
            UserFollow,
            PoliticianBookmark,
            AIEvaluation,
        )

        # Test each model
        models = [
            ("PoliticianEvaluation", PoliticianEvaluation),
            ("User", User),
            ("Category", Category),
            ("Politician", Politician),
            ("Rating", Rating),
            ("Comment", Comment),
            ("Notification", Notification),
            ("Post", Post),
            ("Report", Report),
            ("UserFollow", UserFollow),
            ("PoliticianBookmark", PoliticianBookmark),
            ("AIEvaluation", AIEvaluation),
        ]

        for name, model in models:
            print(f"OK {name:20} - Table: {model.__tablename__:20} - Columns: {len(model.__table__.columns)}")

        # Test enums
        print(f"\nOK PoliticalParty enum values: {[p.value for p in PoliticalParty]}")
        print(f"OK NotificationType enum values: {[n.value for n in NotificationType]}")
        print(f"OK ReportType enum values: {[r.value for r in ReportType]}")
        print(f"OK ReportReason enum values: {[r.value for r in ReportReason]}")
        print(f"OK ReportStatus enum values: {[r.value for r in ReportStatus]}")

        print("-" * 50)
        print("SUCCESS: All models imported successfully!")

        # Display relationships
        print("\nRelationships:")
        print("-" * 50)
        print("- User -> ratings, comments, posts, notifications")
        print("- Category -> politicians, parent/children (self-referential)")
        print("- Politician -> category, ratings, comments, posts")
        print("- Rating -> user, politician")
        print("- Comment -> user, politician, parent/replies (self-referential)")
        print("- Notification -> user")
        print("- Post -> user, politician")

        return True

    except Exception as e:
        print(f"ERROR importing models: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = test_imports()
    sys.exit(0 if success else 1)