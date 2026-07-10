from langchain_core.documents import Document
from langchain_google_genai import ChatGoogleGenerativeAI

from rag_core.types import Citation, RagAnswer


def _format_history(history: list[dict] | None) -> str:
    if not history:
        return ""

    lines: list[str] = []
    for message in history[-4:]:
        role = message.get("role", "user")
        content = (message.get("content") or "").strip()
        if not content:
            continue
        label = "User" if role == "user" else "Assistant"
        lines.append(f"{label}: {content}")

    if not lines:
        return ""

    return "Previous conversation:\n" + "\n".join(lines) + "\n\n"


def _build_prompt(
    question: str,
    docs: list[Document],
    history: list[dict] | None = None,
) -> str:
    context = "\n\n".join(doc.page_content for doc in docs)
    history_block = _format_history(history)

    return f"""
You are a helpful AI assistant.

Answer the user's question ONLY using the context below.
Use the previous conversation only to resolve references like "it", "that", or "the second point".
Do not invent facts that are not in the context.

If the answer cannot be found in the context,
reply with:

"I don't know based on the provided document."

{history_block}Context:
---------
{context}

Question:
---------
{question}

Answer:
"""


def _docs_to_citations(
    docs: list[Document],
    scores: list[float] | None = None,
) -> list[Citation]:
    citations: list[Citation] = []

    for index, doc in enumerate(docs):
        score = scores[index] if scores is not None else None
        citations.append(
            Citation(
                chunk_index=index,
                text=doc.page_content,
                page=doc.metadata.get("page"),
                source=doc.metadata.get("source"),
                score=score,
                document_id=doc.metadata.get("document_id"),
            )
        )

    return citations


def ask(question: str, retriever, llm: ChatGoogleGenerativeAI) -> RagAnswer:
    """
    Answer a question using MMR retrieval (CLI-friendly).
    """

    docs = retriever.invoke(question)
    prompt = _build_prompt(question, docs)
    response = llm.invoke(prompt)

    return RagAnswer(
        answer=response.content,
        citations=_docs_to_citations(docs),
    )


def ask_with_scores(
    question: str,
    vector_store,
    llm: ChatGoogleGenerativeAI,
    *,
    k: int = 3,
    document_id: str | None = None,
    history: list[dict] | None = None,
) -> RagAnswer:
    """
    Answer using similarity search with relevance scores (API-friendly).
    Optionally filter by document_id and include recent chat history.
    """

    search_kwargs: dict = {"k": k}
    if document_id:
        search_kwargs["filter"] = {"document_id": document_id}

    results = vector_store.similarity_search_with_relevance_scores(
        question,
        **search_kwargs,
    )
    docs = [doc for doc, _score in results]
    scores = [score for _doc, score in results]
    prompt = _build_prompt(question, docs, history=history)
    response = llm.invoke(prompt)

    return RagAnswer(
        answer=response.content,
        citations=_docs_to_citations(docs, scores),
    )
