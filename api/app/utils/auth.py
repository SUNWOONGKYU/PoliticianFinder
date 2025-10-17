"""Authentication utilities and helpers"""

from typing import Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.user import User
from app.core.security import verify_password, get_password_hash


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """
    Authenticate a user by email and password

    Args:
        db: Database session
        email: User email
        password: Plain text password

    Returns:
        User object if authentication successful, None otherwise
    """
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def create_user(
    db: Session,
    email: str,
    password: str,
    username: str,
    full_name: Optional[str] = None
) -> User:
    """
    Create a new user

    Args:
        db: Database session
        email: User email
        password: Plain text password
        username: Username
        full_name: Optional full name

    Returns:
        Created user object
    """
    hashed_password = get_password_hash(password)
    user = User(
        email=email,
        hashed_password=hashed_password,
        username=username,
        full_name=full_name,
        is_active=True,
        is_verified=False,
        is_superuser=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_last_login(db: Session, user: User) -> None:
    """
    Update user's last login timestamp

    Args:
        db: Database session
        user: User object
    """
    user.last_login_at = datetime.utcnow()
    db.commit()


def is_username_taken(db: Session, username: str) -> bool:
    """
    Check if a username is already taken

    Args:
        db: Database session
        username: Username to check

    Returns:
        True if username exists, False otherwise
    """
    return db.query(User).filter(User.username == username.lower()).first() is not None


def is_email_taken(db: Session, email: str) -> bool:
    """
    Check if an email is already registered

    Args:
        db: Database session
        email: Email to check

    Returns:
        True if email exists, False otherwise
    """
    return db.query(User).filter(User.email == email).first() is not None