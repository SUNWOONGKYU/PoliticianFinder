from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class RatingP2D2(Base):
    """P2D2 요구사항에 따른 시민 평가 테이블"""

    __tablename__ = "ratings"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Foreign Keys
    # user_id는 UUID (Supabase Auth와의 호환성을 위해 String으로 저장)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    # politician_id는 BIGINT
    politician_id = Column(Integer, ForeignKey("politicians.id", ondelete="CASCADE"), nullable=False, index=True)

    # Rating content
    score = Column(Integer, nullable=False)  # 1-5 평점
    comment = Column(Text, nullable=True)  # 선택적 코멘트 (최대 1000자)
    category = Column(String(50), nullable=True, default='overall')  # 평가 카테고리

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", backref="p2d2_ratings")
    politician = relationship("Politician", backref="p2d2_ratings")

    # Constraints
    __table_args__ = (
        # 1인 1평가 제약조건
        UniqueConstraint('user_id', 'politician_id', name='unique_user_politician'),
        # 평점 범위 제약조건 (1-5)
        CheckConstraint('score >= 1 AND score <= 5', name='check_score_range'),
        # 코멘트 길이 제한 (1000자)
        CheckConstraint('LENGTH(comment) <= 1000', name='check_comment_length'),
        # 추가 인덱스
        {'extend_existing': True}  # Allow redefinition of the table
    )

    def __repr__(self):
        return f"<RatingP2D2(id={self.id}, user_id={self.user_id}, politician_id={self.politician_id}, score={self.score})>"

    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'politician_id': self.politician_id,
            'score': self.score,
            'comment': self.comment,
            'category': self.category,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    @classmethod
    def validate_score(cls, score):
        """Validate score is between 1 and 5"""
        if not isinstance(score, int) or score < 1 or score > 5:
            raise ValueError("Score must be an integer between 1 and 5")
        return score

    @classmethod
    def validate_comment(cls, comment):
        """Validate comment length"""
        if comment and len(comment) > 1000:
            raise ValueError("Comment must be 1000 characters or less")
        return comment