from sqlalchemy import Column, Integer, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class PoliticianBookmark(Base):
    __tablename__ = "politician_bookmarks"

    id = Column(Integer, primary_key=True, index=True)

    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    politician_id = Column(Integer, ForeignKey("politicians.id", ondelete="CASCADE"), nullable=False)

    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", backref="bookmarks")
    politician = relationship("Politician", backref="bookmarked_by")

    # Constraints: 중복 북마크 방지
    __table_args__ = (
        UniqueConstraint('user_id', 'politician_id', name='unique_politician_bookmark'),
    )

    def __repr__(self):
        return f"<PoliticianBookmark(user={self.user_id}, politician={self.politician_id})>"