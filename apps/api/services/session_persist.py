from __future__ import annotations

from datetime import datetime, timedelta

from fastapi import HTTPException, status

from config import settings
from services import object_storage
from services.pdf_service import rebuild_session_from_pdfs
from services.session_manager import DocumentInfo, Session, SessionManager


def persist_session(session: Session, pdf_by_document_id: dict[str, bytes]) -> None:
    """
    Write PDFs + meta.json to object storage when configured.
    Fail closed if storage is enabled and a write fails.
    """
    if not object_storage.is_enabled():
        return

    try:
        for document_id, content in pdf_by_document_id.items():
            document = session.get_document(document_id)
            filename = document.filename if document else f"{document_id}.pdf"
            object_storage.put_pdf(
                session.session_id,
                document_id,
                content,
                filename,
            )
        object_storage.put_meta(
            session.session_id,
            object_storage.session_meta_dict(session),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to persist session to object storage: {exc}",
        ) from exc


def touch_persisted_meta(session: Session) -> None:
    if not object_storage.is_enabled():
        return
    try:
        object_storage.put_meta(
            session.session_id,
            object_storage.session_meta_dict(session),
        )
    except Exception:
        # Best-effort; in-memory TTL still applies while process is warm.
        pass


def get_or_restore(
    session_manager: SessionManager,
    session_id: str,
    api_key: str | None,
) -> Session | None:
    session = session_manager.get(session_id)
    if session is not None:
        return session

    if not object_storage.is_enabled():
        return None

    try:
        meta = object_storage.get_meta(session_id)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to load session metadata: {exc}",
        ) from exc

    if meta is None:
        return None

    try:
        last_active = object_storage.parse_iso(meta.get("last_active") or "")
    except Exception:
        object_storage.delete_session_prefix(session_id)
        return None

    ttl = timedelta(minutes=settings.session_ttl_minutes)
    if datetime.utcnow() - last_active > ttl:
        object_storage.delete_session_prefix(session_id)
        return None

    documents_meta = object_storage.documents_from_meta(meta)
    if not documents_meta:
        object_storage.delete_session_prefix(session_id)
        return None

    pdf_pairs: list[tuple[DocumentInfo, bytes]] = []
    try:
        for document in documents_meta:
            raw = object_storage.get_pdf(session_id, document.document_id)
            if raw is None:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Session PDF missing from object storage. Re-upload the document.",
                )
            pdf_pairs.append((document, raw))
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to download session PDFs: {exc}",
        ) from exc

    try:
        vector_store, documents = rebuild_session_from_pdfs(
            session_id,
            pdf_pairs,
            api_key=api_key,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to restore session index: {exc}",
        ) from exc

    created_at = last_active
    try:
        created_at = object_storage.parse_iso(meta.get("created_at") or "")
    except Exception:
        pass

    session = session_manager.create(
        vector_store=vector_store,
        documents=documents,
        session_id=session_id,
    )
    session.created_at = created_at
    session_manager.touch(session_id)
    touch_persisted_meta(session)
    return session


def delete_persisted_session(session_id: str) -> None:
    if not object_storage.is_enabled():
        return
    try:
        object_storage.delete_session_prefix(session_id)
    except Exception:
        pass
