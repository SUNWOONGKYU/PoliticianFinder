#!/usr/bin/env python
"""Test data seeding script for development."""
import sys
import uuid
from pathlib import Path
from datetime import datetime, date
from decimal import Decimal

# Add the app directory to the path
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User
from app.models.category import Category
from app.models.politician import Politician, PoliticalParty
from app.models.rating import Rating
from app.models.comment import Comment
from app.models.notification import Notification, NotificationType
from app.models.politician_bookmark import PoliticianBookmark
from app.models.user_follow import UserFollow


def clear_database(db: Session):
    """Clear existing data from database (for development only)."""
    # Delete in order to respect foreign key constraints
    db.query(UserFollow).delete()
    db.query(PoliticianBookmark).delete()
    db.query(Notification).delete()
    db.query(Comment).delete()
    db.query(Rating).delete()
    db.query(Politician).delete()
    db.query(Category).delete()
    db.query(User).delete()
    db.commit()
    print("[OK] Database cleared")


def create_categories(db: Session) -> dict:
    """Create category records."""
    categories_data = [
        {
            "id": uuid.uuid4(),
            "name": "국회의원",
            "slug": "national-assembly",
            "description": "대한민국 국회의원",
            "icon": "building",
            "order_index": 1,
        },
        {
            "id": uuid.uuid4(),
            "name": "광역단체장",
            "slug": "metropolitan-mayor",
            "description": "시도지사 및 광역시장",
            "icon": "office",
            "order_index": 2,
        },
        {
            "id": uuid.uuid4(),
            "name": "기초단체장",
            "slug": "local-mayor",
            "description": "시장, 군수, 구청장",
            "icon": "house",
            "order_index": 3,
        },
    ]

    categories = {}
    for cat_data in categories_data:
        category = Category(**cat_data)
        db.add(category)
        categories[cat_data["slug"]] = category

    db.commit()
    print(f"[OK] Created {len(categories)} categories")
    return categories


def create_test_users(db: Session) -> dict:
    """Create test user accounts."""
    users_data = [
        {
            "id": uuid.uuid4(),
            "email": "admin@politicianfinder.com",
            "username": "admin",
            "full_name": "관리자",
            "bio": "PoliticianFinder 시스템 관리자",
            "is_superuser": True,
            "is_verified": True,
        },
        {
            "id": uuid.uuid4(),
            "email": "user1@example.com",
            "username": "user1",
            "full_name": "홍길동",
            "bio": "정치에 관심있는 시민입니다.",
            "is_verified": True,
        },
        {
            "id": uuid.uuid4(),
            "email": "user2@example.com",
            "username": "user2",
            "full_name": "김철수",
            "bio": "더 나은 민주주의를 꿈꿉니다.",
            "is_verified": True,
        },
        {
            "id": uuid.uuid4(),
            "email": "user3@example.com",
            "username": "user3",
            "full_name": "이영희",
            "bio": "정책 분석가입니다.",
            "is_verified": False,
        },
        {
            "id": uuid.uuid4(),
            "email": "user4@example.com",
            "username": "user4",
            "full_name": "박민수",
            "bio": "시민 기자로 활동중입니다.",
            "is_verified": True,
        },
    ]

    users = {}
    for user_data in users_data:
        user = User(
            **user_data,
            hashed_password=get_password_hash("TestPass123"),
            is_active=True,
        )
        db.add(user)
        users[user_data["username"]] = user

    db.commit()
    print(f"[OK] Created {len(users)} test users")
    return users


def create_sample_politicians(db: Session, categories: dict) -> dict:
    """Create sample politician records."""
    politicians_data = [
        {
            "id": uuid.uuid4(),
            "name": "이재명",
            "party": PoliticalParty.DEMOCRATIC,
            "position": "국회의원",
            "district": "경기 계양구 갑",
            "birth_date": date(1964, 12, 22),
            "education": "중앙대학교 법학과",
            "career": "제20대 경기도지사, 제35대 성남시장",
            "category_id": categories["national-assembly"].id,
            "contact_info": {
                "office": "02-784-xxxx",
                "email": "ljm@assembly.go.kr"
            },
            "sns_accounts": {
                "twitter": "@ljm_official",
                "facebook": "ljm.official"
            },
        },
        {
            "id": uuid.uuid4(),
            "name": "한동훈",
            "party": PoliticalParty.PEOPLE_POWER,
            "position": "국회의원",
            "district": "서울 종로구",
            "birth_date": date(1973, 4, 15),
            "education": "서울대학교 법학과",
            "career": "전 법무부 장관, 검사",
            "category_id": categories["national-assembly"].id,
        },
        {
            "id": uuid.uuid4(),
            "name": "이준석",
            "party": PoliticalParty.REFORM,
            "position": "국회의원",
            "district": "경기 분당구 을",
            "birth_date": date(1985, 2, 12),
            "education": "하버드대학교 컴퓨터공학과",
            "career": "전 국민의힘 대표",
            "category_id": categories["national-assembly"].id,
        },
        {
            "id": uuid.uuid4(),
            "name": "오세훈",
            "party": PoliticalParty.PEOPLE_POWER,
            "position": "서울특별시장",
            "district": "서울특별시",
            "birth_date": date(1961, 1, 4),
            "education": "고려대학교 법학과",
            "career": "제33·35대 서울특별시장",
            "category_id": categories["metropolitan-mayor"].id,
        },
        {
            "id": uuid.uuid4(),
            "name": "이재용",
            "party": PoliticalParty.DEMOCRATIC,
            "position": "경기도지사",
            "district": "경기도",
            "birth_date": date(1963, 9, 28),
            "education": "아주대학교 행정학과",
            "career": "제9대 경기도지사",
            "category_id": categories["metropolitan-mayor"].id,
        },
        {
            "id": uuid.uuid4(),
            "name": "박형준",
            "party": PoliticalParty.PEOPLE_POWER,
            "position": "부산광역시장",
            "district": "부산광역시",
            "birth_date": date(1960, 12, 28),
            "education": "고려대학교 정치외교학과",
            "career": "제8대 부산광역시장",
            "category_id": categories["metropolitan-mayor"].id,
        },
        {
            "id": uuid.uuid4(),
            "name": "조국",
            "party": PoliticalParty.PROGRESSIVE,
            "position": "국회의원",
            "district": "비례대표",
            "birth_date": date(1965, 4, 6),
            "education": "서울대학교 법학과",
            "career": "전 법무부 장관, 서울대 교수",
            "category_id": categories["national-assembly"].id,
        },
        {
            "id": uuid.uuid4(),
            "name": "심상정",
            "party": PoliticalParty.JUSTICE,
            "position": "국회의원",
            "district": "경기 고양시 갑",
            "birth_date": date(1959, 2, 20),
            "education": "서울대학교 사회복지학과",
            "career": "제20·21대 국회의원",
            "category_id": categories["national-assembly"].id,
        },
        {
            "id": uuid.uuid4(),
            "name": "안철수",
            "party": PoliticalParty.INDEPENDENT,
            "position": "국회의원",
            "district": "서울 중구-성동구 을",
            "birth_date": date(1962, 2, 26),
            "education": "서울대학교 의학과",
            "career": "안랩 창업자, 대통령 후보",
            "category_id": categories["national-assembly"].id,
        },
        {
            "id": uuid.uuid4(),
            "name": "유승민",
            "party": PoliticalParty.INDEPENDENT,
            "position": "전 국회의원",
            "district": "대구 동구 을",
            "birth_date": date(1958, 1, 7),
            "education": "서울대학교 경제학과",
            "career": "제19·20대 국회의원",
            "category_id": categories["national-assembly"].id,
        },
    ]

    politicians = {}
    for pol_data in politicians_data:
        politician = Politician(**pol_data)
        db.add(politician)
        politicians[pol_data["name"]] = politician

    db.commit()
    print(f"[OK] Created {len(politicians)} sample politicians")
    return politicians


def create_sample_ratings(db: Session, users: dict, politicians: dict):
    """Create sample rating records."""
    ratings_data = [
        {
            "user_id": users["user1"].id,
            "politician_id": politicians["이재명"].id,
            "integrity": Decimal("4.5"),
            "communication": Decimal("4.0"),
            "expertise": Decimal("4.2"),
            "leadership": Decimal("4.3"),
            "consistency": Decimal("4.1"),
            "empathy": Decimal("4.4"),
            "problem_solving": Decimal("4.6"),
            "accountability": Decimal("4.2"),
            "vision": Decimal("4.3"),
            "transparency": Decimal("4.0"),
            "local_engagement": Decimal("4.5"),
            "national_perspective": Decimal("4.4"),
            "comment": "전반적으로 좋은 정치인이라고 생각합니다. 특히 문제 해결 능력이 뛰어납니다.",
        },
        {
            "user_id": users["user2"].id,
            "politician_id": politicians["한동훈"].id,
            "integrity": Decimal("3.8"),
            "communication": Decimal("4.2"),
            "expertise": Decimal("4.5"),
            "leadership": Decimal("4.0"),
            "consistency": Decimal("3.5"),
            "empathy": Decimal("3.2"),
            "problem_solving": Decimal("4.1"),
            "accountability": Decimal("3.7"),
            "vision": Decimal("3.9"),
            "transparency": Decimal("3.6"),
            "local_engagement": Decimal("3.0"),
            "national_perspective": Decimal("4.2"),
            "comment": "전문성은 뛰어나지만 공감 능력이 부족해 보입니다.",
        },
        {
            "user_id": users["user3"].id,
            "politician_id": politicians["이준석"].id,
            "integrity": Decimal("3.5"),
            "communication": Decimal("4.5"),
            "expertise": Decimal("3.8"),
            "leadership": Decimal("3.7"),
            "consistency": Decimal("3.2"),
            "empathy": Decimal("3.0"),
            "problem_solving": Decimal("4.0"),
            "accountability": Decimal("3.3"),
            "vision": Decimal("4.2"),
            "transparency": Decimal("3.8"),
            "local_engagement": Decimal("2.8"),
            "national_perspective": Decimal("4.0"),
            "comment": "젊은 정치인으로서 새로운 시각을 제시하지만 일관성이 부족합니다.",
        },
        {
            "user_id": users["user1"].id,
            "politician_id": politicians["오세훈"].id,
            "integrity": Decimal("3.8"),
            "communication": Decimal("3.9"),
            "expertise": Decimal("4.0"),
            "leadership": Decimal("4.1"),
            "consistency": Decimal("3.7"),
            "empathy": Decimal("3.5"),
            "problem_solving": Decimal("3.9"),
            "accountability": Decimal("3.8"),
            "vision": Decimal("4.0"),
            "transparency": Decimal("3.6"),
            "local_engagement": Decimal("4.2"),
            "national_perspective": Decimal("3.8"),
        },
    ]

    for rating_data in ratings_data:
        # Calculate average score
        score_fields = [
            "integrity", "communication", "expertise", "leadership",
            "consistency", "empathy", "problem_solving", "accountability",
            "vision", "transparency", "local_engagement", "national_perspective"
        ]
        total_score = sum(rating_data[field] for field in score_fields)
        rating_data["average_score"] = total_score / len(score_fields)

        rating = Rating(**rating_data)
        db.add(rating)

        # Update politician's rating stats
        politician = politicians[next(
            name for name, p in politicians.items()
            if p.id == rating_data["politician_id"]
        )]
        politician.total_rating_count += 1
        politician.total_rating_score = (
            (politician.total_rating_score * (politician.total_rating_count - 1) +
             rating_data["average_score"]) / politician.total_rating_count
        )

    db.commit()
    print(f"[OK] Created {len(ratings_data)} sample ratings")


def create_sample_comments(db: Session, users: dict, politicians: dict):
    """Create sample comment records."""
    comments_data = [
        {
            "id": uuid.uuid4(),
            "user_id": users["user1"].id,
            "politician_id": politicians["이재명"].id,
            "content": "경기도지사 시절의 성과가 인상적이었습니다.",
        },
        {
            "id": uuid.uuid4(),
            "user_id": users["user2"].id,
            "politician_id": politicians["한동훈"].id,
            "content": "법무부 장관 시절 개혁 의지가 부족했다고 봅니다.",
        },
        {
            "id": uuid.uuid4(),
            "user_id": users["user3"].id,
            "politician_id": politicians["이준석"].id,
            "content": "젊은 세대의 목소리를 대변하려는 노력이 보입니다.",
        },
    ]

    comment_objects = []
    for comment_data in comments_data:
        comment = Comment(**comment_data)
        db.add(comment)
        comment_objects.append(comment)

    db.commit()

    # Add reply comments
    reply_data = {
        "id": uuid.uuid4(),
        "user_id": users["user4"].id,
        "politician_id": politicians["이재명"].id,
        "parent_id": comment_objects[0].id,
        "content": "동의합니다. 특히 기본소득 정책이 혁신적이었죠.",
    }
    reply = Comment(**reply_data)
    db.add(reply)

    # Update reply count for parent comment
    comment_objects[0].reply_count = 1

    db.commit()
    print(f"[OK] Created {len(comments_data) + 1} sample comments")


def create_sample_bookmarks(db: Session, users: dict, politicians: dict):
    """Create sample bookmark records."""
    bookmarks_data = [
        {
            "user_id": users["user1"].id,
            "politician_id": politicians["이재명"].id,
        },
        {
            "user_id": users["user1"].id,
            "politician_id": politicians["한동훈"].id,
        },
        {
            "user_id": users["user2"].id,
            "politician_id": politicians["이준석"].id,
        },
        {
            "user_id": users["user2"].id,
            "politician_id": politicians["오세훈"].id,
        },
    ]

    for bookmark_data in bookmarks_data:
        bookmark = PoliticianBookmark(**bookmark_data)
        db.add(bookmark)

        # Update politician's bookmark count
        politician = next(
            p for name, p in politicians.items()
            if p.id == bookmark_data["politician_id"]
        )
        politician.bookmark_count += 1

    db.commit()
    print(f"[OK] Created {len(bookmarks_data)} sample bookmarks")


def create_sample_follows(db: Session, users: dict):
    """Create sample user follow relationships."""
    follows_data = [
        {"follower_id": users["user1"].id, "following_id": users["user2"].id},
        {"follower_id": users["user1"].id, "following_id": users["user3"].id},
        {"follower_id": users["user2"].id, "following_id": users["user1"].id},
        {"follower_id": users["user3"].id, "following_id": users["user1"].id},
        {"follower_id": users["user4"].id, "following_id": users["user1"].id},
    ]

    for follow_data in follows_data:
        follow = UserFollow(**follow_data)
        db.add(follow)

        # Update user follow counts
        follower = next(
            u for name, u in users.items()
            if u.id == follow_data["follower_id"]
        )
        following = next(
            u for name, u in users.items()
            if u.id == follow_data["following_id"]
        )
        follower.following_count += 1
        following.followers_count += 1

    db.commit()
    print(f"[OK] Created {len(follows_data)} sample follow relationships")


def create_sample_notifications(db: Session, users: dict):
    """Create sample notification records."""
    notifications_data = [
        {
            "user_id": users["user1"].id,
            "type": NotificationType.COMMENT,
            "title": "새로운 댓글",
            "message": "회원님의 댓글에 새로운 답글이 달렸습니다.",
            "data": {"comment_id": str(uuid.uuid4())},
            "is_read": False,
        },
        {
            "user_id": users["user1"].id,
            "type": NotificationType.FOLLOW,
            "title": "새로운 팔로워",
            "message": "user2님이 회원님을 팔로우했습니다.",
            "data": {"follower_id": str(users["user2"].id)},
            "is_read": True,
        },
        {
            "user_id": users["user2"].id,
            "type": NotificationType.SYSTEM,
            "title": "시스템 공지",
            "message": "새로운 기능이 추가되었습니다. 확인해보세요!",
            "data": {},
            "is_read": False,
        },
    ]

    for notif_data in notifications_data:
        notification = Notification(**notif_data)
        db.add(notification)

    db.commit()
    print(f"[OK] Created {len(notifications_data)} sample notifications")


def seed_all(clear_existing: bool = True):
    """Execute all seeding functions."""
    db = SessionLocal()

    try:
        print("Starting database seeding...")

        if clear_existing:
            clear_database(db)

        # Create data in order (respecting foreign key dependencies)
        categories = create_categories(db)
        users = create_test_users(db)
        politicians = create_sample_politicians(db, categories)
        create_sample_ratings(db, users, politicians)
        create_sample_comments(db, users, politicians)
        create_sample_bookmarks(db, users, politicians)
        create_sample_follows(db, users)
        create_sample_notifications(db, users)

        print("\nAll seed data created successfully!")

        # Print summary
        print("\nDatabase Summary:")
        print(f"  - Categories: {db.query(Category).count()}")
        print(f"  - Users: {db.query(User).count()}")
        print(f"  - Politicians: {db.query(Politician).count()}")
        print(f"  - Ratings: {db.query(Rating).count()}")
        print(f"  - Comments: {db.query(Comment).count()}")
        print(f"  - Bookmarks: {db.query(PoliticianBookmark).count()}")
        print(f"  - User Follows: {db.query(UserFollow).count()}")
        print(f"  - Notifications: {db.query(Notification).count()}")

        print("\nTest User Credentials:")
        print("  Email: admin@politicianfinder.com | Password: TestPass123")
        print("  Email: user1@example.com | Password: TestPass123")
        print("  Email: user2@example.com | Password: TestPass123")

    except Exception as e:
        print(f"[ERROR] Error during seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Seed the database with test data")
    parser.add_argument(
        "--no-clear",
        action="store_true",
        help="Do not clear existing data before seeding"
    )
    args = parser.parse_args()

    seed_all(clear_existing=not args.no_clear)