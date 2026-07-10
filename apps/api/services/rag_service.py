from __future__ import annotations

from collections.abc import AsyncIterator
from typing import TYPE_CHECKING, Any

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


async def answer_question_stream(
    session: Session,
    question: str,
    api_key: str | None,
    *,
    document_id: str | None = None,
    history: list[dict] | None = None,
) -> AsyncIterator[dict[str, Any]]:
    from rag_core.llm import get_llm
    from rag_core.rag import ask_with_scores_stream

    llm = get_llm(api_key=api_key)
    async for event in ask_with_scores_stream(
        question,
        session.vector_store,
        llm,
        document_id=document_id,
        history=history,
    ):
        yield event
