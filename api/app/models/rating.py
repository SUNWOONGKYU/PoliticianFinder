from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class Rating(Base):
    """사용자 정치인 평가 (12차원) 테이블"""

    __tablename__ = "ratings"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True)

    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    politician_id = Column(Integer, ForeignKey("politicians.id", ondelete="CASCADE"), nullable=False)

    # 12-Dimensional Ratings (1.0 ~ 5.0)
    integrity = Column(Float, nullable=False)  # 정직성/청렴성
    communication = Column(Float, nullable=False)  # 소통능력
    expertise = Column(Float, nullable=False)  # 전문성
    leadership = Column(Float, nullable=False)  # 리더십
    consistency = Column(Float, nullable=False)  # 일관성
    empathy = Column(Float, nullable=False)  # 공감능력
    problem_solving = Column(Float, nullable=False)  # 문제해결능력
    accountability = Column(Float, nullable=False)  # 책임감
    vision = Column(Float, nullable=False)  # 비전
    transparency = Column(Float, nullable=False)  # 투명성
    local_engagement = Column(Float, nullable=False)  # 지역사회 참여
    national_perspective = Column(Float, nullable=False)  # 국가 전체 관점

    # Average
    average_score = Column(Float, nullable=False)  # 12개 평점의 평균

    # Optional Comment
    comment = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", backref="ratings")
    politician = relationship("Politician", back_populates="ratings")

    # Constraints: 한 사용자가 한 정치인에게 하나의 평가만
    __table_args__ = (
        UniqueConstraint('user_id', 'politician_id', name='unique_user_politician_rating'),
    )

    @staticmethod
    def calculate_average(rating_data: dict) -> float:
        """12차원 평점의 평균 계산"""
        dimensions = [
            rating_data.get("integrity", 0),
            rating_data.get("communication", 0),
            rating_data.get("expertise", 0),
            rating_data.get("leadership", 0),
            rating_data.get("consistency", 0),
            rating_data.get("empathy", 0),
            rating_data.get("problem_solving", 0),
            rating_data.get("accountability", 0),
            rating_data.get("vision", 0),
            rating_data.get("transparency", 0),
            rating_data.get("local_engagement", 0),
            rating_data.get("national_perspective", 0),
        ]
        return round(sum(dimensions) / len(dimensions), 2)

    def __repr__(self):
        return f"<Rating(id={self.id}, user_id={self.user_id}, politician_id={self.politician_id}, avg={self.average_score})>"