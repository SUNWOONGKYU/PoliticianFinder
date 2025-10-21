from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, DateTime, Enum, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base
import enum


class PoliticalParty(str, enum.Enum):
    """정치 정당 Enum"""
    DEMOCRATIC = "더불어민주당"
    PEOPLE_POWER = "국민의힘"
    JUSTICE = "정의당"
    REFORM = "개혁신당"
    INDEPENDENT = "무소속"
    OTHER = "기타"


class Politician(Base):
    """정치인 정보 테이블"""

    __tablename__ = "politicians"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)

    # Basic Info
    name = Column(String(100), nullable=False, index=True)
    name_en = Column(String(100), nullable=True)
    birth_year = Column(Integer, nullable=True)
    party = Column(Enum(PoliticalParty), nullable=False)

    # Position
    position = Column(String(100), nullable=True)  # 예: 국회의원, 시장, 도지사
    district = Column(String(100), nullable=True)  # 예: 서울 강남구 갑

    # Profile
    profile_image_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    education = Column(Text, nullable=True)
    career = Column(Text, nullable=True)

    # External Links
    website_url = Column(String(500), nullable=True)
    wikipedia_url = Column(String(500), nullable=True)
    assembly_url = Column(String(500), nullable=True)

    # Stats
    total_ratings = Column(Integer, default=0, nullable=False)
    avg_rating = Column(Numeric(3, 1), default=0.0, nullable=False)  # 평균 평점 (0.0~5.0)
    total_bookmarks = Column(Integer, default=0, nullable=False)

    # Category
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    category = relationship("Category", back_populates="politicians")
    ratings = relationship("Rating", back_populates="politician", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="politician", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Politician(id={self.id}, name='{self.name}', party='{self.party}')>"