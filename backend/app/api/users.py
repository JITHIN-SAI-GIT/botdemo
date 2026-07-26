from fastapi import APIRouter, HTTPException, Depends
from app.schemas.user import UserProfile
from app.database.mongodb import get_db

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(user_id: str = "guest"):
    db = get_db()
    user = await db.get_user_by_id(user_id)
    if not user:
        # Return default guest profile
        from datetime import datetime
        return UserProfile(
            id="guest",
            username="Guest User",
            email="guest@demo.local",
            avatar_url=None,
            created_at=datetime.utcnow(),
            theme_preference="dark"
        )
    return UserProfile(
        id=user.id,
        username=user.username,
        email=user.email,
        avatar_url=user.avatar_url,
        created_at=user.created_at,
        theme_preference=user.theme_preference
    )
