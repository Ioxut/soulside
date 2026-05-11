from datetime import date, datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel


class RequestStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class DoctorCreate(BaseModel):
    name: str
    specialty: str
    location: str
    bio: str
    photo_url: Optional[str] = None
    years_experience: int


class DoctorUpdate(BaseModel):
    name: Optional[str] = None
    specialty: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    photo_url: Optional[str] = None
    years_experience: Optional[int] = None


class DoctorOut(BaseModel):
    id: int
    name: str
    specialty: str
    location: str
    bio: str
    photo_url: Optional[str]
    years_experience: int
    created_at: datetime

    model_config = {"from_attributes": True}


class SpecialistRequestCreate(BaseModel):
    name: str
    email: str
    message: str
    preferred_date: date
    doctor_id: Optional[int] = None


class SpecialistRequestStatusUpdate(BaseModel):
    status: RequestStatus


class SpecialistRequestOut(BaseModel):
    id: int
    user_id: int
    name: str
    email: str
    message: str
    preferred_date: date
    doctor_id: Optional[int]
    doctor_name: Optional[str] = None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
