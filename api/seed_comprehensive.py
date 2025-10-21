#!/usr/bin/env python
"""Comprehensive seed data for testing."""
import os
os.environ['PYTHONIOENCODING'] = 'utf-8'
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models import (
    User, Category, Politician, Rating, Comment,
    PoliticianBookmark, UserFollow
)

def seed_data():
    db = SessionLocal()
    try:
        # Clear data
        db.query(UserFollow).delete()
        db.query(PoliticianBookmark).delete()
        db.query(Comment).delete()
        db.query(Rating).delete()
        db.query(Politician).delete()
        db.query(User).delete()
        db.query(Category).delete()
        db.commit()
        print("[OK] Database cleared")

        # Categories
        cat_national = Category(
            name='National Assembly',
            slug='national-assembly',
            description='National Assembly Members'
        )
        cat_metro = Category(
            name='Metropolitan Governor',
            slug='metropolitan-governor',
            description='Provincial and Metropolitan Governors'
        )
        cat_local = Category(
            name='Local Mayor',
            slug='local-mayor',
            description='City and District Mayors'
        )

        for cat in [cat_national, cat_metro, cat_local]:
            db.add(cat)
        db.commit()
        print("[OK] Created 3 categories")

        # Users
        admin = User(
            email='admin@politicianfinder.com',
            username='admin',
            full_name='Administrator',
            hashed_password=get_password_hash('TestPass123!'),
            is_active=True,
            is_superuser=True,
            is_verified=True
        )
        user1 = User(
            email='user1@example.com',
            username='user1',
            full_name='Test User 1',
            hashed_password=get_password_hash('TestPass123!'),
            is_active=True,
            is_superuser=False,
            is_verified=True
        )
        user2 = User(
            email='user2@example.com',
            username='user2',
            full_name='Test User 2',
            hashed_password=get_password_hash('TestPass123!'),
            is_active=True,
            is_superuser=False,
            is_verified=True
        )

        for user in [admin, user1, user2]:
            db.add(user)
        db.commit()
        print("[OK] Created 3 test users")

        # Politicians - Using proper PoliticalParty Enum values
        politicians_data = [
            ('Lee Junseok', 'Lee Junseok', 1987, '국민의힘', 'National Assembly',
             'Seoul', 'Politician', 'Seoul National University Law', cat_national),
            ('Han Dong-hoon', 'Han Dong-hoon', 1973, '국민의힘', 'National Assembly',
             'Seoul', 'Former Minister', 'Seoul National University Law', cat_national),
            ('Oh Se-hoon', 'Oh Se-hoon', 1964, '국민의힘', 'Mayor',
             'Seoul', 'Current Seoul Mayor', 'Korea University Law', cat_metro),
            ('Lee Jae-myung', 'Lee Jae-myung', 1964, '더불어민주당', 'Governor',
             'Gyeonggi', 'Governor', 'Sungkyunkwan University Law', cat_metro),
            ('Shim Sang-jeung', 'Shim Sang-jeung', 1960, '정의당', 'National Assembly',
             'Seoul', 'Social Activist', 'Seoul National University Social Welfare', cat_national),
            ('Park Young-sun', 'Park Young-sun', 1966, '더불어민주당', 'National Assembly',
             'Seoul', 'Former Minister', 'Ewha Womans University Law', cat_national),
        ]

        politicians = []
        for name, name_en, birth_year, party, position, district, bio, education, category in politicians_data:
            pol = Politician(
                name=name,
                name_en=name_en,
                birth_year=birth_year,
                party=party,
                position=position,
                district=district,
                bio=bio,
                education=education,
                category_id=category.id,
                total_ratings=0,
                avg_rating=0.0,
                total_bookmarks=0
            )
            db.add(pol)
            politicians.append(pol)

        db.commit()
        print(f"[OK] Created {len(politicians)} politicians")

        # Ratings
        for i, pol in enumerate(politicians[:3]):
            rating = Rating(
                user_id=user1.id,
                politician_id=pol.id,
                integrity=4.5 - i * 0.3,
                communication=4.0 - i * 0.2,
                expertise=4.5 - i * 0.3,
                leadership=4.0 - i * 0.2,
                consistency=3.5 - i * 0.2,
                empathy=3.5 - i * 0.2,
                problem_solving=4.0 - i * 0.2,
                accountability=4.5 - i * 0.3,
                vision=4.0 - i * 0.2,
                transparency=3.5 - i * 0.2,
                local_engagement=4.0 - i * 0.2,
                national_perspective=4.0 - i * 0.2,
                average_score=4.04 - i * 0.22
            )
            db.add(rating)
        db.commit()
        print("[OK] Created 3 ratings")

        # Comments
        for idx, pol in enumerate(politicians[:3]):
            comment = Comment(
                user_id=user1.id,
                politician_id=pol.id,
                content=f'Comment on {pol.name}. More information needed.',
                likes_count=idx + 1
            )
            db.add(comment)
        db.commit()
        print("[OK] Created 3 comments")

        # Bookmarks
        for pol in politicians[:4]:
            bookmark = PoliticianBookmark(
                user_id=user1.id,
                politician_id=pol.id
            )
            db.add(bookmark)
        db.commit()
        print("[OK] Created 4 bookmarks")

        # User Follow
        follow = UserFollow(
            follower_id=user1.id,
            following_id=user2.id
        )
        db.add(follow)
        db.commit()
        print("[OK] Created user follow")

        # Verification
        print("\n[DATA SUMMARY]")
        print(f"  Users: {db.query(User).count()}")
        print(f"  Categories: {db.query(Category).count()}")
        print(f"  Politicians: {db.query(Politician).count()}")
        print(f"  Ratings: {db.query(Rating).count()}")
        print(f"  Comments: {db.query(Comment).count()}")
        print(f"  Bookmarks: {db.query(PoliticianBookmark).count()}")
        print(f"  User Follows: {db.query(UserFollow).count()}")

    except Exception as e:
        print(f"[ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == '__main__':
    seed_data()
