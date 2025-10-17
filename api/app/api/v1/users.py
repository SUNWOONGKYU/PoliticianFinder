"""User management API endpoints"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_database, get_current_user, get_current_active_user
from app.core.security import verify_password, get_password_hash
from app.models.user import User
from app.schemas.auth import (
    UserResponse,
    UserUpdate,
    PasswordChange,
    Message
)

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current authenticated user profile

    **Authentication required**: Bearer Token

    Returns complete user profile information including:
    - Basic information (id, email, username)
    - Profile details (full name, bio, avatar)
    - Account status (active, verified)
    - Timestamps (created, updated, last login)
    """
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_current_user_profile(
    user_update: UserUpdate,
    db: Session = Depends(get_database),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update current user profile

    **Authentication required**: Bearer Token

    Updatable fields:
    - **username**: Username (optional, must be unique)
    - **full_name**: Full name (optional)
    - **bio**: Biography/description (optional, max 500 chars)
    - **avatar_url**: Avatar image URL (optional)

    Returns updated user profile
    """
    # Check username uniqueness if being updated
    if user_update.username and user_update.username != current_user.username:
        existing_username = db.query(User).filter(
            User.username == user_update.username
        ).first()
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already taken"
            )

    # Update fields if provided
    update_data = user_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)

    try:
        db.commit()
        db.refresh(current_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update profile"
        )

    return current_user


@router.post("/me/change-password", response_model=Message)
async def change_password(
    password_data: PasswordChange,
    db: Session = Depends(get_database),
    current_user: User = Depends(get_current_active_user)
):
    """
    Change current user password

    **Authentication required**: Bearer Token

    - **current_password**: Current password for verification
    - **new_password**: New password (min 8 chars, must include upper/lower case, number, special char)

    Returns success message
    """
    # Verify current password
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    # Check if new password is same as current
    if verify_password(password_data.new_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password cannot be the same as current password"
        )

    # Update password
    current_user.hashed_password = get_password_hash(password_data.new_password)

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update password"
        )

    return {"message": "Password successfully updated"}


@router.get("/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_database),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get user information by ID

    **Authentication required**: Bearer Token

    - **user_id**: User ID to retrieve

    Returns user profile information (public fields only)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Only return active users to non-superusers
    if not user.is_active and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user


@router.get("/username/{username}", response_model=UserResponse)
async def get_user_by_username(
    username: str,
    db: Session = Depends(get_database),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get user information by username

    **Authentication required**: Bearer Token

    - **username**: Username to search for

    Returns user profile information (public fields only)
    """
    user = db.query(User).filter(User.username == username.lower()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Only return active users to non-superusers
    if not user.is_active and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user


@router.delete("/me", response_model=Message)
async def delete_current_user_account(
    password: str,
    db: Session = Depends(get_database),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete current user account (soft delete)

    **Authentication required**: Bearer Token

    - **password**: Current password for confirmation

    This will deactivate the account rather than permanently deleting it.
    """
    # Verify password
    if not verify_password(password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is incorrect"
        )

    # Soft delete - just deactivate the account
    current_user.is_active = False

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete account"
        )

    return {"message": "Account successfully deactivated"}