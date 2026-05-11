from datetime import datetime
from pydantic import BaseModel


class SourceDocumentOut(BaseModel):
    id: int
    filename: str
    uploaded_at: datetime
    chunk_count: int = 0

    model_config = {"from_attributes": True}
