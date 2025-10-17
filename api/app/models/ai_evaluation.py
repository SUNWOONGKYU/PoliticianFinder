from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class AIEvaluation(Base):
    __tablename__ = "ai_evaluations"

    id = Column(Integer, primary_key=True, index=True)

    # Foreign Key
    politician_id = Column(Integer, ForeignKey("politicians.id", ondelete="CASCADE"), nullable=False)

    # AI Evaluation Data
    evaluation_scores = Column(JSON, nullable=False)  # 12차원 평가 점수
    summary = Column(Text, nullable=False)  # AI 평가 요약
    strengths = Column(JSON, nullable=True)  # 강점 리스트
    weaknesses = Column(JSON, nullable=True)  # 약점 리스트
    sources = Column(JSON, nullable=True)  # 참고 자료 URL 리스트

    # Metadata
    ai_model = Column(String(100), default="claude-3-opus", nullable=False)
    ai_version = Column(String(50), nullable=True)
    confidence_score = Column(Integer, nullable=True)  # AI 신뢰도 (1-100)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    politician = relationship("Politician", backref="ai_evaluations")

    def __repr__(self):
        return f"<AIEvaluation(id={self.id}, politician_id={self.politician_id}, model={self.ai_model})>"