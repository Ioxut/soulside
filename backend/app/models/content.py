from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class ContentItem(Base):
    __tablename__ = "content_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    type: Mapped[str] = mapped_column(String(20), nullable=False)
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    author: Mapped[str] = mapped_column(String(255), nullable=False)
    read_time: Mapped[str] = mapped_column(String(50), nullable=False)
    url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    likes: Mapped[int] = mapped_column(Integer, default=0)
    views: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
