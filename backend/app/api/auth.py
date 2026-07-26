from fastapi import APIRouter, HTTPException, status
from app.schemas.auth import UserRegister, UserLogin, Token
from app.services.auth import auth_service
from app.core.security import create_access_token

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.post("/register", response_model=Token)
async def register(payload: UserRegister):
    try:
        user = await auth_service.register_user(payload)
        access_token = create_access_token(user.id)
        return Token(
            access_token=access_token,
            user_id=user.id,
            username=user.username,
            email=user.email
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login", response_model=Token)
async def login(payload: UserLogin):
    user = await auth_service.authenticate_user(payload)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password"
        )
    access_token = create_access_token(user.id)
    return Token(
        access_token=access_token,
        user_id=user.id,
        username=user.username,
        email=user.email
    )
