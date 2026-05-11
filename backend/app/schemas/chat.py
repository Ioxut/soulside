from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ChatSessionCreate(BaseModel):
    title: Optional[str] = "Conversație nouă"


class ChatSessionOut(BaseModel):
    id: int
    title: str
    sentiment: str = "neutru"  # kept for DB compat, not used in UI
    started_at: datetime
    ended_at: Optional[datetime]
    updated_at: Optional[datetime] = None
    message_count: int = 0
    source_count: int = 0
    first_message: Optional[str] = None

    model_config = {"from_attributes": True}


class MessageSourceOut(BaseModel):
    filename: str
    page: Optional[int] = None

    model_config = {"from_attributes": True}


class ChatMessageOut(BaseModel):
    id: int
    session_id: int
    role: str
    content: str
    created_at: datetime
    sources: list[MessageSourceOut] = []

    model_config = {"from_attributes": True}


class ChatRequest(BaseModel):
    session_id: int
    message: str


class SessionUpdate(BaseModel):
    title: Optional[str] = None
