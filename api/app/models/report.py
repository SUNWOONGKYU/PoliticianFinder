from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base
import enum


class ReportType(str, enum.Enum):
    COMMENT = "comment"
    RATING = "rating"
    USER = "user"


class ReportReason(str, enum.Enum):
    SPAM = "spam"
    OFFENSIVE = "offensive"
    MISINFORMATION = "misinformation"
    OTHER = "other"


class ReportStatus(str, enum.Enum):
    PENDING = "pending"
    REVIEWED = "reviewed"
    RESOLVED = "resolved"
    REJECTED = "rejected"


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)

    # Reporter
    reporter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Target
    report_type = Column(Enum(ReportType), nullable=False)
    target_id = Column(Integer, nullable=False)  # comment_id, rating_id, user_id

    # Reason
    reason = Column(Enum(ReportReason), nullable=False)
    description = Column(Text, nullable=True)

    # Status
    status = Column(Enum(ReportStatus), default=ReportStatus.PENDING)
    admin_note = Column(Text, nullable=True)
    resolved_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    reporter = relationship("User", foreign_keys=[reporter_id], backref="reports_made")
    resolver = relationship("User", foreign_keys=[resolved_by], backref="reports_resolved")

    def __repr__(self):
        return f"<Report(id={self.id}, type={self.report_type}, status={self.status})>"