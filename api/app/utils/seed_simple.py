#!/usr/bin/env python
"""Simple test data seeding script for development."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User
from app.models.category import Category
from app.models.politician import Politician


def seed_simple():
    """Create minimal seed data for testing."""
    db = SessionLocal()

    try:
        print("Starting simple database seeding...")

        # Clear existing data
        db.query(User).delete()
        db.query(Category).delete()
        db.query(Politician).delete()
        db.commit()
        print("[OK] Database cleared")

        # Create categories
        categories_data = [
            {
                "name": "국회의원",
                "slug": "national-assembly",
                "description": "대한민국 국회의원",
                "sort_order": 1,
            },
            {
                "name": "광역단체장",
                "slug": "metropolitan-mayor",
                "description": "시도지사 및 광역시장",
                "sort_order": 2,
            },
        ]

        categories = {}
        for cat_data in categories_data:
            cat = Category(**cat_data)
            db.add(cat)
            categories[cat_data["slug"]] = cat

        db.commit()
        print(f"[OK] Created {len(categories_data)} categories")

        # Create test users
        users_data = [
            {
                "email": "admin@politicianfinder.com",
                "username": "admin",
                "full_name": "관리자",
                "bio": "PoliticianFinder 시스템 관리자",
                "is_superuser": True,
                "is_verified": True,
                "is_active": True,
                "hashed_password": get_password_hash("TestPass123!"),
            },
            {
                "email": "user1@example.com",
                "username": "user1",
                "full_name": "홍길동",
                "bio": "정치에 관심있는 시민입니다.",
                "is_verified": True,
                "is_active": True,
                "hashed_password": get_password_hash("TestPass123!"),
            },
            {
                "email": "user2@example.com",
                "username": "user2",
                "full_name": "김철수",
                "bio": "더 나은 민주주의를 꿈꿉니다.",
                "is_verified": True,
                "is_active": True,
                "hashed_password": get_password_hash("TestPass123!"),
            },
        ]

        users = {}
        for user_data in users_data:
            user = User(**user_data)
            db.add(user)
            users[user_data["username"]] = user

        db.commit()
        print(f"[OK] Created {len(users_data)} test users")

        # Create sample politicians
        politicians_data = [
            {
                "name": "이재명",
                "name_en": "Lee Jae-Myung",
                "birth_year": 1964,
                "party": "DEMOCRATIC",
                "position": "국회의원",
                "district": "경기 계양구 갑",
                "bio": "더불어민주당 국회의원",
                "education": "중앙대학교 법학과",
                "career": "제20대 경기도지사, 제35대 성남시장",
                "category_id": categories["national-assembly"].id,
                "total_ratings": 0,
                "avg_rating": 0.0,
                "total_bookmarks": 0,
            },
            {
                "name": "한동훈",
                "name_en": "Han Dong-Hoon",
                "birth_year": 1973,
                "party": "PEOPLE_POWER",
                "position": "국회의원",
                "district": "서울 종로구",
                "bio": "국민의힘 국회의원",
                "education": "서울대학교 법학과",
                "career": "전 법무부 장관, 검사",
                "category_id": categories["national-assembly"].id,
                "total_ratings": 0,
                "avg_rating": 0.0,
                "total_bookmarks": 0,
            },
            {
                "name": "오세훈",
                "name_en": "Oh Se-Hoon",
                "birth_year": 1961,
                "party": "PEOPLE_POWER",
                "position": "서울특별시장",
                "district": "서울특별시",
                "bio": "국민의힘 서울시장",
                "education": "고려대학교 법학과",
                "career": "제33·35대 서울특별시장",
                "category_id": categories["metropolitan-mayor"].id,
                "total_ratings": 0,
                "avg_rating": 0.0,
                "total_bookmarks": 0,
            },
            {
                "name": "이재용",
                "name_en": "Lee Jae-Yong",
                "birth_year": 1963,
                "party": "DEMOCRATIC",
                "position": "경기도지사",
                "district": "경기도",
                "bio": "더불어민주당 경기도지사",
                "education": "아주대학교 행정학과",
                "career": "제9대 경기도지사",
                "category_id": categories["metropolitan-mayor"].id,
                "total_ratings": 0,
                "avg_rating": 0.0,
                "total_bookmarks": 0,
            },
            {
                "name": "심상정",
                "name_en": "Shim Sang-Jung",
                "birth_year": 1959,
                "party": "JUSTICE",
                "position": "국회의원",
                "district": "경기 고양시 갑",
                "bio": "정의당 국회의원",
                "education": "서울대학교 사회복지학과",
                "career": "제20·21대 국회의원",
                "category_id": categories["national-assembly"].id,
                "total_ratings": 0,
                "avg_rating": 0.0,
                "total_bookmarks": 0,
            },
        ]

        for pol_data in politicians_data:
            politician = Politician(**pol_data)
            db.add(politician)

        db.commit()
        print(f"[OK] Created {len(politicians_data)} sample politicians")

        # Print summary
        print("\n=== Database Summary ===")
        print(f"Users: {db.query(User).count()}")
        print(f"Categories: {db.query(Category).count()}")
        print(f"Politicians: {db.query(Politician).count()}")

        print("\n=== Test Credentials ===")
        print("Email: admin@politicianfinder.com | Password: TestPass123!")
        print("Email: user1@example.com | Password: TestPass123!")
        print("Email: user2@example.com | Password: TestPass123!")

        print("\n✅ Seed data created successfully!")

    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_simple()
