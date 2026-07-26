from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class Attachment(BaseModel):
    name: str
    type: str  # image, text, document, audio
    url: Optional[str] = None
    content: Optional[str] = None

class ChatMessage(BaseModel):
    id: Optional[str] = None
    sender: str
    text: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    attachments: Optional[List[Attachment]] = None
    liked: Optional[bool] = None

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    attachments: Optional[List[Attachment]] = None
    model_name: Optional[str] = None
    temperature: float = 0.7
    max_tokens: int = 2048

class ChatResponse(BaseModel):
    response: str
    session_id: str
    message_id: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class SessionCreate(BaseModel):
    title: Optional[str] = "New Conversation"

class SessionUpdate(BaseModel):
    title: Optional[str] = None
    is_pinned: Optional[bool] = None
    is_favorite: Optional[bool] = None

class SessionResponse(BaseModel):
    id: str
    title: str
    is_pinned: bool = False
    is_favorite: bool = False
    created_at: datetime
    updated_at: datetime
    message_count: int = 0
    preview: Optional[str] = ""

class SessionDetailResponse(SessionResponse):
    messages: List[ChatMessage] = []
