from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserProfile(BaseModel):
    id: str
    username: str
    email: EmailStr
    avatar_url: Optional[str] = None
    created_at: datetime
    theme_preference: Optional[str] = "dark"

class UserUpdate(BaseModel):
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    theme_preference: Optional[str] = None
