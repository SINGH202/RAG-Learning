from __future__ import annotations

import asyncio
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any


@dataclass
class DocumentInfo:
    document_id: str
    filename: str
    chunk_count: int


@dataclass
class Session:
    session_id: str
    vector_store: Any
    documents: list[DocumentInfo] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    last_active: datetime = field(default_factory=datetime.utcnow)

    @property
    def filename(self) -> str:
        if not self.documents:
            return ""
        if len(self.documents) == 1:
            return self.documents[0].filename
        return f"{len(self.documents)} documents"

    @property
    def chunk_count(self) -> int:
        return sum(doc.chunk_count for doc in self.documents)

    def get_document(self, document_id: str) -> DocumentInfo | None:
        for document in self.documents:
            if document.document_id == document_id:
                return document
        return None


class SessionManager:
    def __init__(self, ttl_minutes: int, cleanup_interval_seconds: int) -> None:
        self.ttl = timedelta(minutes=ttl_minutes)
        self.cleanup_interval_seconds = cleanup_interval_seconds
        self._sessions: dict[str, Session] = {}
        self._cleanup_task: asyncio.Task | None = None

    def create(
        self,
        vector_store: Any,
        documents: list[DocumentInfo],
        session_id: str | None = None,
    ) -> Session:
        sid = session_id or str(uuid.uuid4())
        now = datetime.utcnow()
        session = Session(
            session_id=sid,
            vector_store=vector_store,
            documents=list(documents),
            created_at=now,
            last_active=now,
        )
        self._sessions[sid] = session
        return session

    def get(self, session_id: str) -> Session | None:
        session = self._sessions.get(session_id)
        if session is None:
            return None

        if datetime.utcnow() - session.last_active > self.ttl:
            self.delete(session_id)
            return None

        return session

    def touch(self, session_id: str) -> None:
        session = self._sessions.get(session_id)
        if session is not None:
            session.last_active = datetime.utcnow()

    def delete(self, session_id: str) -> bool:
        session = self._sessions.pop(session_id, None)
        if session is None:
            return False

        try:
            session.vector_store.delete_collection()
        except Exception:
            pass

        return True

    def cleanup_expired(self) -> None:
        now = datetime.utcnow()
        expired_ids = [
            session_id
            for session_id, session in self._sessions.items()
            if now - session.last_active > self.ttl
        ]
        for session_id in expired_ids:
            self.delete(session_id)

    async def _cleanup_loop(self) -> None:
        while True:
            await asyncio.sleep(self.cleanup_interval_seconds)
            self.cleanup_expired()

    def start_cleanup_task(self) -> None:
        if self._cleanup_task is None:
            self._cleanup_task = asyncio.create_task(self._cleanup_loop())

    def stop_cleanup_task(self) -> None:
        if self._cleanup_task is not None:
            self._cleanup_task.cancel()
            self._cleanup_task = None
