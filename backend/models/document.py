from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class DocumentIn(BaseModel):
    filename: str
    filepath: str


class DocumentOut(DocumentIn):
    id: str
    upload_time: datetime
    processed: bool
