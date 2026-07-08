import uuid

from fastapi import APIRouter, File, Header, HTTPException, Request, UploadFile, status

from config import settings
from middleware.rate_limit import RateLimiter
from schemas.models import (
    AskRequest,
    AskResponse,
    CitationResponse,
    SessionCreateResponse,
)
from services.pdf_service import index_pdf
from services.rag_service import answer_question

router = APIRouter(prefix="/api/v1")

rate_limiter = RateLimiter(
    max_requests=settings.rate_limit_per_hour,
    window_seconds=3600,
)


def get_session_manager(request: Request):
    return request.app.state.session_manager


def resolve_api_key(user_api_key: str | None) -> str | None:
    if user_api_key and user_api_key.strip():
        return user_api_key.strip()
    if settings.google_api_key:
        return settings.google_api_key
    return None


@router.post("/sessions", response_model=SessionCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    request: Request,
    file: UploadFile = File(...),
    x_user_api_key: str | None = Header(default=None),
):
    session_manager = get_session_manager(request)
    filename = file.filename or "document.pdf"
    content = await file.read()

    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    if len(content) > settings.max_pdf_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"PDF exceeds {settings.max_pdf_size_mb} MB limit.",
        )

    api_key = resolve_api_key(x_user_api_key)
    if api_key is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server API key is not configured. Set GOOGLE_API_KEY on Render.",
        )

    session_id = str(uuid.uuid4())
    vector_store, chunk_count = index_pdf(
        content,
        filename,
        session_id,
        api_key=api_key,
    )
    session = session_manager.create(
        vector_store=vector_store,
        filename=filename,
        session_id=session_id,
    )

    return SessionCreateResponse(
        session_id=session.session_id,
        chunk_count=chunk_count,
        filename=session.filename,
        ready=True,
    )


@router.post("/sessions/{session_id}/ask", response_model=AskResponse)
async def ask_session(
    session_id: str,
    body: AskRequest,
    request: Request,
    x_user_api_key: str | None = Header(default=None),
):
    session_manager = get_session_manager(request)
    session = session_manager.get(session_id)
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or expired.",
        )

    user_key = x_user_api_key.strip() if x_user_api_key and x_user_api_key.strip() else None
    if user_key is None:
        client_ip = request.client.host if request.client else "unknown"
        if not rate_limiter.is_allowed(client_ip):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "error": "rate_limit_exceeded",
                    "message": "Server demo limit reached. Paste your Google API key to continue.",
                    "use_own_key": True,
                },
            )

    api_key = resolve_api_key(x_user_api_key)
    if api_key is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server API key is not configured.",
        )

    try:
        result = answer_question(session, body.question, api_key=api_key)
    except Exception as exc:
        error_text = str(exc).lower()
        if "429" in error_text or "quota" in error_text or "rate" in error_text:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "error": "rate_limit_exceeded",
                    "message": "Gemini rate limit hit. Provide your Google API key via X-User-Api-Key.",
                    "use_own_key": True,
                },
            ) from exc
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate answer: {exc}",
        ) from exc

    session_manager.touch(session_id)

    return AskResponse(
        answer=result.answer,
        citations=[
            CitationResponse(
                chunk_index=citation.chunk_index,
                text=citation.text,
                page=citation.page,
                source=citation.source,
                score=citation.score,
            )
            for citation in result.citations
        ],
        session_id=session_id,
    )


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(session_id: str, request: Request):
    session_manager = get_session_manager(request)
    deleted = session_manager.delete(session_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found.",
        )
