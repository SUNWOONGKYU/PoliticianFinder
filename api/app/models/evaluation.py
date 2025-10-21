from sqlalchemy import Column, String, Text, DECIMAL, TIMESTAMP, Integer, ForeignKey
from sqlalchemy import JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from ..core.database import Base


class PoliticianEvaluation(Base):
    """정치인 평가 결과 테이블"""

    __tablename__ = "politician_evaluations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # 정치인 정보
    politician_id = Column(Integer, ForeignKey("politicians.id"), nullable=True, index=True)
    politician_name = Column(String(100), nullable=False, index=True)
    politician_position = Column(String(100), nullable=False)
    politician_party = Column(String(100), nullable=False)
    politician_region = Column(String(100), nullable=True)

    # AI 정보
    ai_model = Column(String(50), nullable=False, index=True)

    # 평가 결과 (JSON로 유연하게 저장)
    data_sources = Column(JSON, nullable=False)
    raw_data_100 = Column(JSON, nullable=False)
    category_scores = Column(JSON, nullable=False)
    rationale = Column(JSON, nullable=False)
    strengths = Column(JSON, nullable=False)
    weaknesses = Column(JSON, nullable=False)
    overall_assessment = Column(Text, nullable=False)

    # 최종 점수
    final_score = Column(DECIMAL(5, 2), nullable=False, index=True)
    grade = Column(String(1), nullable=False, index=True)

    # 메타 정보
    user_id = Column(String(36), nullable=True)
    payment_id = Column(String(36), nullable=True)

    # 타임스탬프
    created_at = Column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True
    )
    updated_at = Column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    # Relationships
    politician = relationship("Politician", backref="evaluations")

    def __repr__(self):
        return f"<Evaluation {self.politician_name} by {self.ai_model}>"
