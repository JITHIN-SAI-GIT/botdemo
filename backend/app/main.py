import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database.mongodb import mongo_db
from app.api import chat, history, auth, users

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("app.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing FastAPI application...")
    await mongo_db.connect()
    yield
    logger.info("Shutting down FastAPI application...")
    await mongo_db.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Configure CORS
# allow_origins is wide open here on purpose: this app doesn't use cookie-based
# auth (no withCredentials anywhere in the frontend), so there's no security
# downside, and it means any OpenAI-compatible testing tool (Chatbox, judges'
# own client, etc.) can hit /chat/completions from a browser without CORS
# preflight failures - which is exactly what happened before this change.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Basic Rate Limiting Middleware
import time
from fastapi import Request
from fastapi.responses import JSONResponse

request_counts = {}
RATE_LIMIT = 50 # requests per minute per IP
WINDOW_SIZE = 60 # seconds

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host if request.client else "unknown"
    current_time = time.time()
    
    if client_ip not in request_counts:
        request_counts[client_ip] = []
        
    # Remove old requests outside the window
    request_counts[client_ip] = [t for t in request_counts[client_ip] if current_time - t < WINDOW_SIZE]
    
    if len(request_counts[client_ip]) >= RATE_LIMIT:
        return JSONResponse(status_code=429, content={"detail": "Too many requests. Please try again later."})
        
    request_counts[client_ip].append(current_time)
    response = await call_next(request)
    return response

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred.", "error": str(exc)}
    )

# Include API Routers
app.include_router(chat.router)
app.include_router(history.router)
app.include_router(auth.router)
app.include_router(users.router)

@app.get("/")
@app.get("/health")
async def health_check():
    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "mongodb" if mongo_db.is_connected else "in-memory-fallback"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)