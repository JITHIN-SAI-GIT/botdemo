from typing import Optional
from app.database.mongodb import get_db
from app.models.user import UserModel
from app.schemas.auth import UserRegister, UserLogin
from app.core.security import get_password_hash, verify_password, create_access_token

class AuthService:
    async def register_user(self, data: UserRegister) -> UserModel:
        db = get_db()
        existing_email = await db.get_user_by_email(data.email)
        if existing_email:
            raise ValueError("Email already registered.")
            
        existing_username = await db.get_user_by_username(data.username)
        if existing_username:
            raise ValueError("Username already taken.")

        hashed_pwd = get_password_hash(data.password)
        user = UserModel(
            username=data.username,
            email=data.email,
            hashed_password=hashed_pwd
        )
        return await db.save_user(user)

    async def authenticate_user(self, data: UserLogin) -> Optional[UserModel]:
        db = get_db()
        user = await db.get_user_by_email(data.username_or_email)
        if not user:
            user = await db.get_user_by_username(data.username_or_email)
            
        if not user:
            return None
            
        if not verify_password(data.password, user.hashed_password):
            return None
            
        return user

auth_service = AuthService()
