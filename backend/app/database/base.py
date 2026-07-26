from typing import Dict, List, Optional, Any
from datetime import datetime
import uuid
import logging
from app.models.chat import ChatSessionModel, MessageRecord
from app.models.user import UserModel

logger = logging.getLogger("app.database")

class MemoryDatabase:
    """In-memory fallback database when MongoDB is not running."""
    def __init__(self):
        self.sessions: Dict[str, ChatSessionModel] = {}
        self.users: Dict[str, UserModel] = {}
        self.users_by_email: Dict[str, UserModel] = {}
        self.users_by_username: Dict[str, UserModel] = {}

    async def get_session(self, session_id: str) -> Optional[ChatSessionModel]:
        return self.sessions.get(session_id)

    async def list_sessions(self, user_id: str = "guest") -> List[ChatSessionModel]:
        user_sessions = [s for s in self.sessions.values() if s.user_id == user_id]
        return sorted(user_sessions, key=lambda s: s.updated_at, reverse=True)

    async def save_session(self, session: ChatSessionModel) -> ChatSessionModel:
        session.updated_at = datetime.utcnow()
        self.sessions[session.id] = session
        return session

    async def delete_session(self, session_id: str) -> bool:
        if session_id in self.sessions:
            del self.sessions[session_id]
            return True
        return False

    async def add_message(self, session_id: str, sender: str, text: str, attachments: Optional[List[dict]] = None) -> MessageRecord:
        session = await self.get_session(session_id)
        if not session:
            session = ChatSessionModel(id=session_id)
            if text:
                # generate summary title from first 30 chars
                session.title = text[:30] + ("..." if len(text) > 30 else "")
            self.sessions[session_id] = session

        msg = MessageRecord(sender=sender, text=text, attachments=attachments or [])
        session.messages.append(msg)
        session.updated_at = datetime.utcnow()
        return msg

    async def save_user(self, user: UserModel) -> UserModel:
        self.users[user.id] = user
        self.users_by_email[user.email.lower()] = user
        self.users_by_username[user.username.lower()] = user
        return user

    async def get_user_by_email(self, email: str) -> Optional[UserModel]:
        return self.users_by_email.get(email.lower())

    async def get_user_by_username(self, username: str) -> Optional[UserModel]:
        return self.users_by_username.get(username.lower())

    async def get_user_by_id(self, user_id: str) -> Optional[UserModel]:
        return self.users.get(user_id)

memory_db = MemoryDatabase()
