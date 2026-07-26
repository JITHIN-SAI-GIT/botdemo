from fastapi import APIRouter, HTTPException
from typing import List
import uuid
from app.schemas.chat import SessionResponse, SessionDetailResponse, SessionCreate, SessionUpdate, ChatMessage
from app.database.mongodb import get_db
from app.models.chat import ChatSessionModel

router = APIRouter(prefix="/api/history", tags=["History"])

@router.get("", response_model=List[SessionResponse])
async def list_chat_sessions(user_id: str = "guest"):
    """List all chat sessions for user."""
    sessions = await get_db().list_sessions(user_id=user_id)
    result = []
    for s in sessions:
        preview = s.messages[-1].text[:60] if s.messages else "Empty conversation"
        result.append(SessionResponse(
            id=s.id,
            title=s.title,
            is_pinned=s.is_pinned,
            is_favorite=s.is_favorite,
            created_at=s.created_at,
            updated_at=s.updated_at,
            message_count=len(s.messages),
            preview=preview
        ))
    return result

@router.post("", response_model=SessionResponse)
async def create_chat_session(payload: SessionCreate, user_id: str = "guest"):
    """Create a new empty chat session."""
    session = ChatSessionModel(
        id=str(uuid.uuid4()),
        user_id=user_id,
        title=payload.title or "New Conversation"
    )
    await get_db().save_session(session)
    return SessionResponse(
        id=session.id,
        title=session.title,
        is_pinned=session.is_pinned,
        is_favorite=session.is_favorite,
        created_at=session.created_at,
        updated_at=session.updated_at,
        message_count=0,
        preview=""
    )

@router.get("/{session_id}", response_model=SessionDetailResponse)
async def get_chat_session(session_id: str):
    """Get conversation history for session."""
    session = await get_db().get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    
    messages = [
        ChatMessage(
            id=m.id,
            sender=m.sender,
            text=m.text,
            timestamp=m.timestamp,
            attachments=m.attachments,
            liked=m.liked
        ) for m in session.messages
    ]
    
    return SessionDetailResponse(
        id=session.id,
        title=session.title,
        is_pinned=session.is_pinned,
        is_favorite=session.is_favorite,
        created_at=session.created_at,
        updated_at=session.updated_at,
        message_count=len(messages),
        preview=messages[-1].text[:60] if messages else "",
        messages=messages
    )

@router.patch("/{session_id}", response_model=SessionResponse)
async def update_chat_session(session_id: str, payload: SessionUpdate):
    """Rename, pin, or favorite a chat session."""
    session = await get_db().get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    
    if payload.title is not None:
        session.title = payload.title
    if payload.is_pinned is not None:
        session.is_pinned = payload.is_pinned
    if payload.is_favorite is not None:
        session.is_favorite = payload.is_favorite

    await get_db().save_session(session)
    return SessionResponse(
        id=session.id,
        title=session.title,
        is_pinned=session.is_pinned,
        is_favorite=session.is_favorite,
        created_at=session.created_at,
        updated_at=session.updated_at,
        message_count=len(session.messages),
        preview=session.messages[-1].text[:60] if session.messages else ""
    )

@router.delete("/{session_id}")
async def delete_chat_session(session_id: str):
    """Delete a chat session."""
    success = await get_db().delete_session(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found.")
    return {"message": "Session deleted successfully", "id": session_id}
