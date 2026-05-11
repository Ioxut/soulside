from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator

MOOD_MIN = 1
MOOD_MAX = 10


class MoodLogCreate(BaseModel):
    score: int
    emoji: str
    notes: Optional[str] = Field(default=None, max_length=1000)
    logged_date: date

    @field_validator("score")
    @classmethod
    def score_range(cls, v: int) -> int:
        if not MOOD_MIN <= v <= MOOD_MAX:
            raise ValueError(f"Scorul trebuie să fie între {MOOD_MIN} și {MOOD_MAX}")
        return v


class MoodLogOut(BaseModel):
    id: int
    score: int
    emoji: str
    notes: Optional[str]
    logged_date: date
    created_at: datetime

    model_config = {"from_attributes": True}


class MoodInsightOut(BaseModel):
    insight: str
