import json
import asyncio
import logging
from typing import AsyncGenerator, Optional, List, Dict, Any
from app.services.gemini import gemini_service
from app.database.mongodb import get_db

logger = logging.getLogger("app.services.stream")

async def sse_chat_generator(
    prompt: str,
    session_id: str,
    history: Optional[List[Dict[str, str]]] = None,
    model_name: Optional[str] = None,
    attachments: Optional[List[Any]] = None,
    temperature: float = 0.7,
    max_tokens: int = 2048
) -> AsyncGenerator[str, None]:
    """
    Server-Sent Events (SSE) generator streaming token chunks progressively
    and saving the complete response to session history on completion.
    """
    accumulated_text = ""
    try:
        # 1. Send start event payload
        yield f"data: {json.dumps({'type': 'start', 'session_id': session_id})}\n\n"
        
        # 2. Stream tokens from Gemini API
        async for chunk in gemini_service.generate_stream_response(prompt, history=history, model_name=model_name, attachments=attachments, temperature=temperature, max_tokens=max_tokens):
            if chunk:
                accumulated_text += chunk
                payload = json.dumps({'type': 'chunk', 'content': chunk, 'session_id': session_id})
                yield f"data: {payload}\n\n"
                await asyncio.sleep(0.005) # smooth token dispatch

        # 3. Save completed bot response message to history
        if accumulated_text.strip():
            bot_msg = await get_db().add_message(session_id, "bot", accumulated_text)
            message_id = bot_msg.id
        else:
            message_id = None

        # 4. Send completion event payload
        yield f"data: {json.dumps({'type': 'end', 'session_id': session_id, 'message_id': message_id, 'full_text': accumulated_text})}\n\n"

    except asyncio.CancelledError:
        logger.info(f"Stream cancelled for session {session_id}")
        if accumulated_text.strip():
            await get_db().add_message(session_id, "bot", accumulated_text + " [Stopped]")
        yield f"data: {json.dumps({'type': 'stopped', 'session_id': session_id})}\n\n"

    except Exception as e:
        logger.error(f"SSE stream error: {str(e)}")
        error_payload = json.dumps({'type': 'error', 'content': str(e)})
        yield f"data: {error_payload}\n\n"
