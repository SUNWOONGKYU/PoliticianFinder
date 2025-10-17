"""Authentication API endpoints"""

from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.api.deps import get_database, get_current_user
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token
)
from app.core.config import settings
from app.models.user import User
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    Token,
    TokenRefresh,
    UserResponse,
    Message
)

router = APIRouter()


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    user_data: UserRegister,
    db: Session = Depends(get_database)
):
    """
    Create a new user account

    - **email**: Email address (must be unique)
    - **password**: Password (min 8 chars, must include upper/lower case, number, special char)
    - **username**: Username (3-50 chars, alphanumeric with underscores/hyphens)
    - **full_name**: Full name (optional)

    Returns created user information
    """
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )

    # Check if username already exists
    existing_username = db.query(User).filter(User.username == user_data.username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already taken"
        )

    # Hash password
    hashed_password = get_password_hash(user_data.password)

    # Create new user
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        username=user_data.username,
        full_name=user_data.full_name,
        is_active=True,
        is_verified=False  # Email verification can be added later
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email or username already exists"
        )

    return new_user


@router.post("/login", response_model=Token)
async def login(
    login_data: UserLogin,
    db: Session = Depends(get_database)
):
    """
    Login with email and password

    - **email**: Email address
    - **password**: Password

    Returns access and refresh tokens on success
    """
    # Find user by email
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify password
    if not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact support."
        )

    # Update last login time
    user.last_login_at = datetime.utcnow()
    db.commit()

    # Create tokens
    access_token = create_access_token(
        data={"user_id": user.id, "email": user.email}
    )
    refresh_token = create_refresh_token(
        data={"user_id": user.id, "email": user.email}
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }


@router.post("/login/oauth2", response_model=Token)
async def login_oauth2(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_database)
):
    """
    OAuth2 compatible login endpoint (for Swagger UI testing)

    - **username**: Email address (OAuth2 uses 'username' field)
    - **password**: Password

    Returns access and refresh tokens on success
    """
    # OAuth2PasswordRequestForm uses 'username' field for email
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated"
        )

    # Update last login time
    user.last_login_at = datetime.utcnow()
    db.commit()

    # Create tokens
    access_token = create_access_token(
        data={"user_id": user.id, "email": user.email}
    )
    refresh_token = create_refresh_token(
        data={"user_id": user.id, "email": user.email}
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }


@router.post("/refresh", response_model=Token)
async def refresh_token(
    token_data: TokenRefresh,
    db: Session = Depends(get_database)
):
    """
    Refresh access token using refresh token

    - **refresh_token**: Valid refresh token

    Returns new access and refresh tokens
    """
    # Decode and validate refresh token
    payload = decode_token(token_data.refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    user_id = payload.get("user_id")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )

    # Get user from database
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )

    # Create new tokens
    access_token = create_access_token(
        data={"user_id": user.id, "email": user.email}
    )
    new_refresh_token = create_refresh_token(
        data={"user_id": user.id, "email": user.email}
    )

    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current authenticated user information

    **Authentication required**: Bearer Token

    Returns:
    - User profile information
    - Account status
    - Registration and last login dates
    """
    return current_user


@router.post("/logout", response_model=Message)
async def logout(
    current_user: User = Depends(get_current_user)
):
    """
    Logout current user

    **Authentication required**: Bearer Token

    Note: This endpoint is mainly for logging purposes.
    The actual logout should be handled on the client side by removing the stored tokens.
    """
    # In a more complex implementation, you might want to:
    # - Add the token to a blacklist
    # - Clear server-side sessions if using them
    # - Log the logout event

    return {"message": "Successfully logged out"}