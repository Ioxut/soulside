from datetime import date, datetime
from typing import Optional
from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class SpecialistRequest(Base):
    __tablename__ = "specialist_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    preferred_date: Mapped[date] = mapped_column(Date, nullable=False)
    doctor_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("doctors.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    status: Mapped[str] = mapped_column(String(20), default="pending")

    user: Mapped["User"] = relationship(back_populates="specialist_requests")
    doctor: Mapped[Optional["Doctor"]] = relationship(back_populates="requests")
