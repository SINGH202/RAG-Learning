from __future__ import annotations

from datetime import datetime, timedelta, timezone
from secrets import token_urlsafe
from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from auth.clerk import AuthUser
from config import settings
from db.models import Document, MemberRole, Project, ProjectInvite, ProjectMember, User
from services import object_storage
from services.pdf_service import _prepare_chunks, rebuild_session_from_pdfs
from services.session_manager import DocumentInfo, SessionManager


ROLE_RANK = {
    MemberRole.viewer.value: 1,
    MemberRole.editor.value: 2,
    MemberRole.owner.value: 3,
}


def upsert_user(db: Session, auth: AuthUser) -> User:
    user = db.get(User, auth.user_id)
    if user is None:
        user = User(id=auth.user_id, email=auth.email, name=auth.name)
        db.add(user)
    else:
        if auth.email:
            user.email = auth.email
        if auth.name:
            user.name = auth.name
    db.commit()
    db.refresh(user)
    return user


def require_membership(
    db: Session,
    project_id: str,
    user_id: str,
    *,
    min_role: str = MemberRole.viewer.value,
) -> ProjectMember:
    member = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
        )
        .first()
    )
    if member is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found.",
        )
    if ROLE_RANK.get(member.role, 0) < ROLE_RANK.get(min_role, 99):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions for this project.",
        )
    return member


def create_project(db: Session, auth: AuthUser, name: str) -> Project:
    upsert_user(db, auth)
    project = Project(
        id=str(uuid4()),
        name=name.strip() or "Untitled project",
        owner_user_id=auth.user_id,
    )
    db.add(project)
    db.flush()
    db.add(
        ProjectMember(
            id=str(uuid4()),
            project_id=project.id,
            user_id=auth.user_id,
            role=MemberRole.owner.value,
        )
    )
    db.commit()
    db.refresh(project)
    return project


def list_projects_for_user(db: Session, user_id: str) -> list[tuple[Project, str]]:
    rows = (
        db.query(Project, ProjectMember.role)
        .join(ProjectMember, ProjectMember.project_id == Project.id)
        .filter(ProjectMember.user_id == user_id)
        .order_by(Project.updated_at.desc())
        .all()
    )
    return [(project, role) for project, role in rows]


def get_project(db: Session, project_id: str) -> Project | None:
    return (
        db.query(Project)
        .options(joinedload(Project.documents), joinedload(Project.members))
        .filter(Project.id == project_id)
        .first()
    )


def delete_project(db: Session, session_manager: SessionManager, project_id: str) -> None:
    project = db.get(Project, project_id)
    if project is None:
        return
    db.delete(project)
    db.commit()
    session_manager.delete(project_id)
    try:
        object_storage.delete_project_prefix(project_id)
    except Exception:
        pass


def add_document_to_project(
    db: Session,
    session_manager: SessionManager,
    project: Project,
    content: bytes,
    filename: str,
    api_key: str | None,
) -> Document:
    from rag_core.vector_store import (
        add_documents_to_session_store,
        create_session_store,
    )

    if not object_storage.is_enabled():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Object storage is required for project documents.",
        )

    document_id = str(uuid4())
    chunks = _prepare_chunks(content, filename, document_id)
    existing = session_manager.get(project.id)

    try:
        if existing is None:
            # Rebuild prior docs then add this one, or create fresh
            prior = list(project.documents)
            if prior:
                pdf_pairs: list[tuple[DocumentInfo, bytes]] = []
                for doc in prior:
                    raw = object_storage.get_project_pdf(project.id, doc.id)
                    if raw is None:
                        raise HTTPException(
                            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail=f"Missing PDF in storage for {doc.filename}.",
                        )
                    pdf_pairs.append(
                        (
                            DocumentInfo(
                                document_id=doc.id,
                                filename=doc.filename,
                                chunk_count=doc.chunk_count,
                            ),
                            raw,
                        )
                    )
                pdf_pairs.append(
                    (
                        DocumentInfo(
                            document_id=document_id,
                            filename=filename,
                            chunk_count=len(chunks),
                        ),
                        content,
                    )
                )
                vector_store, documents = rebuild_session_from_pdfs(
                    project.id, pdf_pairs, api_key=api_key
                )
                session_manager.create(
                    vector_store=vector_store,
                    documents=documents,
                    session_id=project.id,
                )
                chunk_count = len(chunks)
            else:
                vector_store = create_session_store(
                    chunks, project.id, api_key=api_key
                )
                chunk_count = len(chunks)
                session_manager.create(
                    vector_store=vector_store,
                    documents=[
                        DocumentInfo(
                            document_id=document_id,
                            filename=filename,
                            chunk_count=chunk_count,
                        )
                    ],
                    session_id=project.id,
                )
        else:
            chunk_count = add_documents_to_session_store(existing.vector_store, chunks)
            existing.documents.append(
                DocumentInfo(
                    document_id=document_id,
                    filename=filename,
                    chunk_count=chunk_count,
                )
            )
            session_manager.touch(project.id)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to index PDF: {exc}",
        ) from exc

    try:
        b2_key = object_storage.put_project_pdf(
            project.id, document_id, content, filename
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to store PDF: {exc}",
        ) from exc

    doc = Document(
        id=document_id,
        project_id=project.id,
        filename=filename,
        b2_key=b2_key,
        chunk_count=chunk_count,
    )
    db.add(doc)
    project.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(doc)
    return doc


def remove_document(
    db: Session,
    session_manager: SessionManager,
    project: Project,
    document_id: str,
) -> None:
    doc = (
        db.query(Document)
        .filter(Document.project_id == project.id, Document.id == document_id)
        .first()
    )
    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Document not found."
        )
    db.delete(doc)
    db.commit()
    object_storage.delete_project_pdf(project.id, document_id)
    # Drop in-memory index so next ask rebuilds without this doc
    if project.id in session_manager._sessions:
        session = session_manager._sessions.pop(project.id, None)
        if session is not None:
            try:
                session.vector_store.delete_collection()
            except Exception:
                pass


def get_or_restore_project_session(
    db: Session,
    session_manager: SessionManager,
    project: Project,
    api_key: str | None,
):
    session = session_manager.get(project.id)
    if session is not None:
        return session

    docs = list(project.documents)
    if not docs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project has no documents yet. Upload a PDF first.",
        )

    pdf_pairs: list[tuple[DocumentInfo, bytes]] = []
    for doc in docs:
        raw = object_storage.get_project_pdf(project.id, doc.id)
        if raw is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Missing PDF in storage for {doc.filename}. Re-upload it.",
            )
        pdf_pairs.append(
            (
                DocumentInfo(
                    document_id=doc.id,
                    filename=doc.filename,
                    chunk_count=doc.chunk_count,
                ),
                raw,
            )
        )

    vector_store, documents = rebuild_session_from_pdfs(
        project.id, pdf_pairs, api_key=api_key
    )
    return session_manager.create(
        vector_store=vector_store,
        documents=documents,
        session_id=project.id,
    )


def create_invite(
    db: Session,
    project: Project,
    created_by: str,
    role: str = MemberRole.viewer.value,
) -> ProjectInvite:
    if role not in {MemberRole.viewer.value, MemberRole.editor.value}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invite role must be viewer or editor.",
        )
    invite = ProjectInvite(
        id=str(uuid4()),
        project_id=project.id,
        token=token_urlsafe(24),
        role=role,
        created_by=created_by,
        expires_at=datetime.now(timezone.utc)
        + timedelta(days=settings.invite_expiry_days),
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)
    return invite


def accept_invite(db: Session, auth: AuthUser, token: str) -> Project:
    upsert_user(db, auth)
    invite = db.query(ProjectInvite).filter(ProjectInvite.token == token).first()
    if invite is None or invite.revoked_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invite not found or revoked.",
        )
    expires = invite.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Invite has expired.",
        )

    existing = (
        db.query(ProjectMember)
        .filter(
            ProjectMember.project_id == invite.project_id,
            ProjectMember.user_id == auth.user_id,
        )
        .first()
    )
    if existing is None:
        db.add(
            ProjectMember(
                id=str(uuid4()),
                project_id=invite.project_id,
                user_id=auth.user_id,
                role=invite.role,
            )
        )
        db.commit()
    project = db.get(Project, invite.project_id)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found."
        )
    return project
