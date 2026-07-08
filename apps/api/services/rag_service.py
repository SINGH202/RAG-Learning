from rag_core.llm import get_llm
from rag_core.rag import ask_with_scores

from services.session_manager import Session


def answer_question(session: Session, question: str, api_key: str | None):
    llm = get_llm(api_key=api_key)
    return ask_with_scores(
        question,
        session.vector_store,
        llm,
    )
