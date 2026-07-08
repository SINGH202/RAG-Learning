import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

_REPO_ROOT = Path(__file__).resolve().parent.parent.parent
_RAG_CORE_SRC = _REPO_ROOT / "packages/rag-core/src"
if str(_RAG_CORE_SRC) not in sys.path:
    sys.path.insert(0, str(_RAG_CORE_SRC))

from config import settings
from routes.health import router as health_router
from routes.sessions import router as sessions_router
from services.session_manager import SessionManager


@asynccontextmanager
async def lifespan(app: FastAPI):
    session_manager = SessionManager(
        ttl_minutes=settings.session_ttl_minutes,
        cleanup_interval_seconds=settings.cleanup_interval_seconds,
    )
    session_manager.start_cleanup_task()
    app.state.session_manager = session_manager
    yield
    session_manager.stop_cleanup_task()


app = FastAPI(
    title="DocuMind API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(sessions_router)


@app.get("/")
async def root():
    return {"service": "DocuMind API", "health": "/api/v1/health"}
