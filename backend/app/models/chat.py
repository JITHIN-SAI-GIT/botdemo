from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
import uuid

class MessageRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender: str
    text: str
    attachments: Optional[List[dict]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    liked: Optional[bool] = None  # True: liked, False: disliked

class ChatSessionModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = "guest"
    title: str = "New Conversation"
    messages: List[MessageRecord] = []
    is_pinned: bool = False
    is_favorite: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)