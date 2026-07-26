import logging
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.database.base import memory_db

logger = logging.getLogger("app.database")

class MongoDatabase:
    client: Optional[AsyncIOMotorClient] = None
    db = None
    is_connected: bool = False

    async def connect(self):
        try:
            self.client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=2000)
            await self.client.admin.command('ping')
            self.db = self.client[settings.DATABASE_NAME]
            self.is_connected = True
            logger.info("Successfully connected to MongoDB.")
        except Exception as e:
            logger.warning(f"MongoDB connection failed ({e}). Falling back to In-Memory session storage.")
            self.is_connected = False

    async def close(self):
        if self.client:
            self.client.close()
            logger.info("Closed MongoDB connection.")

    async def get_session(self, session_id: str):
        doc = await self.db.sessions.find_one({"id": session_id})
        if doc:
            from app.models.chat import ChatSessionModel
            return ChatSessionModel(**doc)
        return None

    async def list_sessions(self, user_id: str = "guest"):
        cursor = self.db.sessions.find({"user_id": user_id}).sort("updated_at", -1)
        sessions = await cursor.to_list(length=1000)
        from app.models.chat import ChatSessionModel
        return [ChatSessionModel(**s) for s in sessions]

    async def save_session(self, session):
        from datetime import datetime
        session.updated_at = datetime.utcnow()
        await self.db.sessions.replace_one({"id": session.id}, session.model_dump(), upsert=True)
        return session

    async def delete_session(self, session_id: str) -> bool:
        res = await self.db.sessions.delete_one({"id": session_id})
        return res.deleted_count > 0

    async def add_message(self, session_id: str, sender: str, text: str, attachments=None):
        from datetime import datetime
        from app.models.chat import ChatSessionModel, MessageRecord
        import uuid
        msg = MessageRecord(id=str(uuid.uuid4()), sender=sender, text=text, attachments=attachments or [], timestamp=datetime.utcnow())
        
        session = await self.get_session(session_id)
        if not session:
            session = ChatSessionModel(id=session_id)
            if text:
                session.title = text[:30] + ("..." if len(text) > 30 else "")
            session.messages = [msg]
            await self.save_session(session)
        else:
            await self.db.sessions.update_one(
                {"id": session_id},
                {
                    "$push": {"messages": msg.model_dump()},
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )
        return msg

    async def save_user(self, user):
        await self.db.users.replace_one({"id": user.id}, user.model_dump(), upsert=True)
        return user

    async def get_user_by_email(self, email: str):
        doc = await self.db.users.find_one({"email": email.lower()})
        if doc:
            from app.models.user import UserModel
            return UserModel(**doc)
        return None

    async def get_user_by_username(self, username: str):
        doc = await self.db.users.find_one({"username": username.lower()})
        if doc:
            from app.models.user import UserModel
            return UserModel(**doc)
        return None

    async def get_user_by_id(self, user_id: str):
        doc = await self.db.users.find_one({"id": user_id})
        if doc:
            from app.models.user import UserModel
            return UserModel(**doc)
        return None

mongo_db = MongoDatabase()

def get_db():
    return mongo_db if mongo_db.is_connected else memory_db
