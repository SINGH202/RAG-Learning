from __future__ import annotations

import json

from fastapi import APIRouter, Depends, File, Header, HTTPException, Request, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from auth.clerk import AuthUser, require_auth
from config import settings
from db.models import MemberRole
from db.session import get_db
from schemas.models import (
    AskRequest,
    CitationResponse,
    DocumentInfoResponse,
    InviteAcceptResponse,
    InviteCreateRequest,
    InviteCreateResponse,
    ProjectAskResponse,
    ProjectCreateRequest,
    ProjectDetailResponse,
    ProjectDocumentAddResponse,
    ProjectSummaryResponse,
)
from services import project_service
from services.rag_service import answer_question, answer_question_stream

router = APIRouter(prefix="/api/v1")


def get_session_manager(request: Request):
    return request.app.state.session_manager


def resolve_api_key(user_api_key: str | None) -> str | None:
    if user_api_key and user_api_key.strip():
        return user_api_key.strip()
    if settings.google_api_key:
        return settings.google_api_key
    return None


def _require_api_key(user_api_key: str | None) -> str:
    api_key = resolve_api_key(user_api_key)
    if api_key is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server API key is not configured. Set GOOGLE_API_KEY.",
        )
    return api_key


def _doc_response(document_id: str, filename: str, chunk_count: int) -> DocumentInfoResponse:
    return DocumentInfoResponse(
        document_id=document_id,
        filename=filename,
        chunk_count=chunk_count,
    )


def _sse(data: dict) -> str:
    return f"data: {json.dumps(data, default=str)}\n\n"


async def _read_pdf(file: UploadFile) -> tuple[str, bytes]:
    filename = file.filename or "document.pdf"
    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty."
        )
    if len(content) > settings.max_pdf_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"PDF exceeds {settings.max_pdf_size_mb} MB limit.",
        )
    return filename, content


@router.post("/projects", response_model=ProjectSummaryResponse, status_code=201)
def create_project(
    body: ProjectCreateRequest,
    auth: AuthUser = Depends(require_auth),
    db: Session = Depends(get_db),
):
    if not settings.database_enabled:
        raise HTTPException(status_code=503, detail="DATABASE_URL is not configured.")
    project = project_service.create_project(db, auth, body.name)
    return ProjectSummaryResponse(
        project_id=project.id,
        name=project.name,
        role=MemberRole.owner.value,
        document_count=0,
        updated_at=project.updated_at.isoformat() if project.updated_at else None,
    )


@router.get("/projects", response_model=list[ProjectSummaryResponse])
def list_projects(
    auth: AuthUser = Depends(require_auth),
    db: Session = Depends(get_db),
):
    if not settings.database_enabled:
        raise HTTPException(status_code=503, detail="DATABASE_URL is not configured.")
    rows = project_service.list_projects_for_user(db, auth.user_id)
    return [
        ProjectSummaryResponse(
            project_id=project.id,
            name=project.name,
            role=role,
            document_count=len(project.documents) if project.documents is not None else 0,
            updated_at=project.updated_at.isoformat() if project.updated_at else None,
        )
        for project, role in rows
    ]


@router.get("/projects/{project_id}", response_model=ProjectDetailResponse)
def get_project(
    project_id: str,
    auth: AuthUser = Depends(require_auth),
    db: Session = Depends(get_db),
):
    member = project_service.require_membership(db, project_id, auth.user_id)
    project = project_service.get_project(db, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found.")
    documents = [
        _doc_response(d.id, d.filename, d.chunk_count) for d in project.documents
    ]
    return ProjectDetailResponse(
        project_id=project.id,
        name=project.name,
        role=member.role,
        documents=documents,
        chunk_count=sum(d.chunk_count for d in project.documents),
    )


@router.delete("/projects/{project_id}", status_code=204)
def delete_project(
    project_id: str,
    request: Request,
    auth: AuthUser = Depends(require_auth),
    db: Session = Depends(get_db),
):
    project_service.require_membership(
        db, project_id, auth.user_id, min_role=MemberRole.owner.value
    )
    project_service.delete_project(db, get_session_manager(request), project_id)


@router.post(
    "/projects/{project_id}/documents",
    response_model=ProjectDocumentAddResponse,
    status_code=201,
)
async def upload_project_document(
    project_id: str,
    request: Request,
    file: UploadFile = File(...),
    auth: AuthUser = Depends(require_auth),
    db: Session = Depends(get_db),
    x_user_api_key: str | None = Header(default=None),
):
    project_service.require_membership(
        db, project_id, auth.user_id, min_role=MemberRole.editor.value
    )
    project = project_service.get_project(db, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found.")

    filename, content = await _read_pdf(file)
    api_key = _require_api_key(x_user_api_key)
    doc = project_service.add_document_to_project(
        db,
        get_session_manager(request),
        project,
        content,
        filename,
        api_key,
    )
    project = project_service.get_project(db, project_id)
    documents = [
        _doc_response(d.id, d.filename, d.chunk_count) for d in (project.documents if project else [])
    ]
    return ProjectDocumentAddResponse(
        project_id=project_id,
        document=_doc_response(doc.id, doc.filename, doc.chunk_count),
        documents=documents,
        chunk_count=sum(d.chunk_count for d in documents),
    )


@router.delete("/projects/{project_id}/documents/{document_id}", status_code=204)
def delete_project_document(
    project_id: str,
    document_id: str,
    request: Request,
    auth: AuthUser = Depends(require_auth),
    db: Session = Depends(get_db),
):
    project_service.require_membership(
        db, project_id, auth.user_id, min_role=MemberRole.editor.value
    )
    project = project_service.get_project(db, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found.")
    project_service.remove_document(
        db, get_session_manager(request), project, document_id
    )


@router.post("/projects/{project_id}/ask", response_model=ProjectAskResponse)
def ask_project(
    project_id: str,
    body: AskRequest,
    request: Request,
    auth: AuthUser = Depends(require_auth),
    db: Session = Depends(get_db),
    x_user_api_key: str | None = Header(default=None),
):
    project_service.require_membership(db, project_id, auth.user_id)
    project = project_service.get_project(db, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found.")
    if body.document_id and not any(d.id == body.document_id for d in project.documents):
        raise HTTPException(status_code=400, detail="document_id is not part of this project.")

    api_key = _require_api_key(x_user_api_key)
    session = project_service.get_or_restore_project_session(
        db, get_session_manager(request), project, api_key
    )
    history = [
        {"role": m.role, "content": m.content} for m in body.history[-4:]
    ]
    try:
        result = answer_question(
            session,
            body.question,
            api_key=api_key,
            document_id=body.document_id,
            history=history,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Failed to generate answer: {exc}"
        ) from exc

    get_session_manager(request).touch(project_id)
    return ProjectAskResponse(
        answer=result.answer,
        citations=[
            CitationResponse(
                chunk_index=c.chunk_index,
                text=c.text,
                page=c.page,
                source=c.source,
                score=c.score,
                document_id=c.document_id,
            )
            for c in result.citations
        ],
        project_id=project_id,
    )


@router.post("/projects/{project_id}/ask/stream")
async def ask_project_stream(
    project_id: str,
    body: AskRequest,
    request: Request,
    auth: AuthUser = Depends(require_auth),
    db: Session = Depends(get_db),
    x_user_api_key: str | None = Header(default=None),
):
    project_service.require_membership(db, project_id, auth.user_id)
    project = project_service.get_project(db, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found.")
    if body.document_id and not any(d.id == body.document_id for d in project.documents):
        raise HTTPException(status_code=400, detail="document_id is not part of this project.")

    api_key = _require_api_key(x_user_api_key)
    session_manager = get_session_manager(request)
    session = project_service.get_or_restore_project_session(
        db, session_manager, project, api_key
    )
    history = [
        {"role": m.role, "content": m.content} for m in body.history[-4:]
    ]
    session_manager.touch(project_id)

    async def event_stream():
        try:
            async for event in answer_question_stream(
                session,
                body.question,
                api_key=api_key,
                document_id=body.document_id,
                history=history,
            ):
                if await request.is_disconnected():
                    break
                if event.get("type") == "done":
                    event = {**event, "project_id": project_id}
                    session_manager.touch(project_id)
                yield _sse(event)
        except Exception as exc:
            yield _sse({"type": "error", "message": f"Failed to generate answer: {exc}"})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post(
    "/projects/{project_id}/invites",
    response_model=InviteCreateResponse,
    status_code=201,
)
def create_invite(
    project_id: str,
    body: InviteCreateRequest,
    auth: AuthUser = Depends(require_auth),
    db: Session = Depends(get_db),
):
    project_service.require_membership(
        db, project_id, auth.user_id, min_role=MemberRole.owner.value
    )
    project = project_service.get_project(db, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found.")
    invite = project_service.create_invite(db, project, auth.user_id, body.role)
    return InviteCreateResponse(
        token=invite.token,
        role=invite.role,
        expires_at=invite.expires_at.isoformat(),
        path=f"/invite/{invite.token}",
    )


@router.post("/invites/{token}/accept", response_model=InviteAcceptResponse)
def accept_invite(
    token: str,
    auth: AuthUser = Depends(require_auth),
    db: Session = Depends(get_db),
):
    project = project_service.accept_invite(db, auth, token)
    member = project_service.require_membership(db, project.id, auth.user_id)
    return InviteAcceptResponse(
        project_id=project.id,
        name=project.name,
        role=member.role,
    )
