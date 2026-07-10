from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from services.session_manager import Session


def answer_question(
    session: Session,
    question: str,
    api_key: str | None,
    *,
    document_id: str | None = None,
    history: list[dict] | None = None,
):
    from rag_core.llm import get_llm
    from rag_core.rag import ask_with_scores

    llm = get_llm(api_key=api_key)
    return ask_with_scores(
        question,
        session.vector_store,
        llm,
        document_id=document_id,
        history=history,
    )
