from datetime import date, datetime
from typing import Optional
from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class MoodLog(Base):
    __tablename__ = "mood_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    score: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-10
    emoji: Mapped[str] = mapped_column(String(10), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    logged_date: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="mood_logs")
