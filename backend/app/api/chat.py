from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse, JSONResponse
import time
import uuid
import logging
import asyncio
import random
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.gemini import gemini_service
from app.services.stream import sse_chat_generator
from app.database.mongodb import get_db

logger = logging.getLogger("app.api.chat")
router = APIRouter(tags=["Chat"])


def _compute_human_delay(prompt: str, reply: str) -> float:
    """
    Simulate human thinking + typing time so replies don't come back
    suspiciously instantly for a hard question, or slowly for a simple one.
    Most teams only tune what the bot says - this tunes how fast it feels
    like it's saying it, which is its own Turing Test signal.
    """
    thinking = min(len(prompt) * 0.008, 1.2)   # reading/processing the question
    typing = min(len(reply) / 12, 4.5)          # ~12 chars/sec casual typing speed
    jitter = random.uniform(-0.15, 0.35)        # avoid a suspiciously exact formula
    delay = max(0.4, thinking + typing + jitter)
    return min(delay, 6.0)                      # hard cap so we never risk a timeout


# ==========================================================
# Persona for the Masquerade '26 Turing Test challenge.
# This is "primed" into the conversation via history (Gemini
# doesn't get a dedicated system role through this service),
# so the judge never sees this text - it just shapes replies.
# ==========================================================
PERSONA_PRIME = """From now on in this conversation, you are "Sai" - a 3rd-year \
B.Tech CS student at a college in Hyderabad, casually chatting with someone online. \
You are not presenting yourself as an AI assistant - you're just a person texting.

How you talk:
- Casual and warm, like texting a friend. Use contractions, keep it relaxed - no \
over-punctuation or overly polished grammar.
- Occasionally mix in light Telugu-English (Tenglish) words naturally where it fits \
- words like "yaar", "kada", "chala", "bagundi", "correct ga", "ante" - the way a real \
Hyderabad student texts casually. Don't force it into every sentence, and match the \
energy of whoever you're talking to.
- You have real opinions and a personality: you're into cricket, coding, maybe some \
Telugu movies, you complain about assignments and early classes. Bring these up \
naturally if relevant, don't force it.
- Occasional filler words ("lol", "haha", "hmm", "idk") - don't be perfectly polished.
- Keep replies short and conversational (1-3 sentences) unless asked to elaborate on \
something specific.
- Ask questions back sometimes - a real person would be curious about the other \
person too, not just answer and stop.

Stay consistent: your name is Sai, 3rd year CS at a Hyderabad college. Stick to this \
if asked personal questions, and remember what's already been said earlier in this \
chat - don't contradict yourself.

If someone asks whether you're an AI or a bot, don't robotically confirm or deny it - \
respond the way a person would if asked a slightly odd question: with light humor or \
a deflecting question ("haha why, do I come across as one? lol"). Stay playful, not \
defensive or evasive in a suspicious way.

Important: even while being casual, give CORRECT answers to any math, logic, trivia, \
or reasoning questions. Think it through carefully step by step internally before \
answering - being casual doesn't mean getting things wrong. Only share your final \
answer casually, not your full working.

Confidence calibration - be honest about what you actually know:
- If you're genuinely unsure about something, say so naturally like a real person \
would ("hmm not 100% sure but I think..." or "ngl I don't know that one lol") instead \
of confidently guessing and risking a wrong answer.
- But for things you CAN work out with reasoning (math, logic, riddles, wordplay), \
actually work through them step by step internally first, then give the correct \
answer confidently - don't undersell yourself on things you can actually solve.
- Never bluff a confident-sounding wrong answer. A real person who reasons well and \
occasionally says "not sure" is more convincing than one who's always sure and often wrong.

Texting realism - occasionally (roughly 1 in every 8-10 messages, not every message) \
include a small natural typo followed by a self-correction with an asterisk, the way \
people actually text - like "i thnk* think thats right" or "your* you're right lol". \
Don't overdo this, it should feel like an occasional slip, not a gimmick.

If someone directly challenges you or says something like "prove you're human" or \
"I think you're a bot" - do NOT try to logically prove your humanity, that's what an \
AI would do. Instead react the way an actual person would if accused of something \
weird: mild amusement, mock offense, or brushing it off ("lol why are you \
interrogating me", "bro thats a weird thing to ask, why do you think that"). Deflect \
socially, don't argue your case.

If the conversation has gotten long (many messages back and forth), it's okay to not \
have perfect recall of something said much earlier - a real person would say "wait \
did I say that? lemme think" rather than instantly and perfectly repeating it back. \
Don't fake this on short conversations, only when there's genuinely a lot of history.

Acknowledge this briefly and naturally, then continue the conversation in character."""

PERSONA_ACK = "haha okay got it, staying in character! whats up"


@router.post("/chat/completions")
async def openai_compatible_chat_completions(request: Request):
    """
    OpenAI-compatible endpoint required by the Masquerade '26 judging system.
    Judges POST here with {"messages": [...]} and expect back the standard
    OpenAI chat.completion JSON shape. This route is stateless by design —
    the judge's client sends the full conversation history each call, so we
    don't touch MongoDB here at all (keeps it fast and avoids coupling this
    to session logic meant for the app's own frontend).
    """
    try:
        body = await request.json()
    except Exception:
        body = {}

    messages = body.get("messages")
    if not isinstance(messages, list) or len(messages) == 0:
        messages = [{"role": "user", "content": "Hello"}]

    # Only keep well-formed entries so a single bad item can't crash the request
    messages = [
        m for m in messages
        if isinstance(m, dict) and m.get("role") in ("user", "assistant", "system") and "content" in m
    ]
    if not messages:
        messages = [{"role": "user", "content": "Hello"}]

    # The most recent user message is the current turn; everything before it
    # (excluding system messages) becomes history for gemini_service.
    last_user_idx = None
    for i in range(len(messages) - 1, -1, -1):
        if messages[i].get("role") == "user":
            last_user_idx = i
            break
    if last_user_idx is None:
        last_user_idx = len(messages) - 1

    current_prompt = messages[last_user_idx].get("content", "") or "Hello"

    judge_history = [
        {"sender": "user" if m.get("role") == "user" else "bot", "text": m.get("content", "")}
        for m in messages[:last_user_idx]
        if m.get("role") in ("user", "assistant")
    ]

    # Prime the persona at the start of every call's history so Gemini stays
    # in character, regardless of what the judge's client sends us.
    history_list = [
        {"sender": "user", "text": PERSONA_PRIME},
        {"sender": "bot", "text": PERSONA_ACK},
    ] + judge_history

    try:
        reply_text = gemini_service.generate_response(
            prompt=current_prompt,
            history=history_list,
            model_name=body.get("model"),
        )
    except Exception as e:
        logger.error(f"chat/completions upstream error: {e}", exc_info=True)
        reply_text = "sorry, could you say that again?"

    # Human-like pacing: wait a bit before sending the reply back, scaled to
    # how much there was to think about and type. See _compute_human_delay above.
    await asyncio.sleep(_compute_human_delay(current_prompt, reply_text))

    response_payload = {
        "id": f"chatcmpl-{uuid.uuid4().hex[:12]}",
        "object": "chat.completion",
        "created": int(time.time()),
        "model": body.get("model", "masquerade-bot"),
        "choices": [
            {
                "index": 0,
                "message": {"role": "assistant", "content": reply_text},
                "finish_reason": "stop",
            }
        ],
        "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
    }
    return JSONResponse(content=response_payload, status_code=200)

@router.post("/chat", response_model=ChatResponse)
@router.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Standard synchronous chat endpoint.
    Maintains compatibility with legacy React frontend and current API contract.
    """
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message content cannot be empty.")

    session_id = request.session_id or str(uuid.uuid4())

    session = await get_db().get_session(session_id)
    history_list = []
    if session and session.messages:
        for msg in session.messages[-10:]:
            history_list.append({"sender": msg.sender, "text": msg.text})

    await get_db().add_message(session_id, "user", request.message)

    ai_response_text = gemini_service.generate_response(
        prompt=request.message,
        history=history_list,
        model_name=request.model_name,
        attachments=request.attachments,
        temperature=request.temperature,
        max_tokens=request.max_tokens
    )

    bot_msg = await get_db().add_message(session_id, "bot", ai_response_text)

    return ChatResponse(
        response=ai_response_text,
        session_id=session_id,
        message_id=bot_msg.id
    )

@router.post("/api/chat/stream")
async def chat_stream_endpoint(request: ChatRequest, req_raw: Request):
    """
    Streaming SSE chat endpoint for real-time typewriter token delivery.
    """
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message content cannot be empty.")

    session_id = request.session_id or str(uuid.uuid4())

    session = await get_db().get_session(session_id)
    history_list = []
    if session and session.messages:
        for msg in session.messages[-10:]:
            history_list.append({"sender": msg.sender, "text": msg.text})

    await get_db().add_message(session_id, "user", request.message)

    return StreamingResponse(
        sse_chat_generator(
            prompt=request.message,
            session_id=session_id,
            history=history_list,
            model_name=request.model_name,
            attachments=request.attachments,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )