from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ContentItemCreate(BaseModel):
    type: str
    title: str
    description: str
    category: str
    author: str
    read_time: str
    url: Optional[str] = None
    content: Optional[str] = None


class ContentItemUpdate(BaseModel):
    type: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    author: Optional[str] = None
    read_time: Optional[str] = None
    url: Optional[str] = None
    content: Optional[str] = None


class ContentItemOut(BaseModel):
    id: int
    type: str
    title: str
    description: str
    category: str
    author: str
    read_time: str
    url: Optional[str]
    content: Optional[str]
    likes: int
    views: int
    is_favorited: bool = False
    is_liked: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}
