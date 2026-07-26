from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, EmailStr
import uuid

class UserModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: EmailStr
    hashed_password: str
    avatar_url: Optional[str] = None
    theme_preference: str = "dark"
    created_at: datetime = Field(default_factory=datetime.utcnow)
