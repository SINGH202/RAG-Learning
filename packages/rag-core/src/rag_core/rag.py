from langchain_core.documents import Document
from langchain_google_genai import ChatGoogleGenerativeAI

from rag_core.types import Citation, RagAnswer


def _build_prompt(question: str, docs: list[Document]) -> str:
    context = "\n\n".join(doc.page_content for doc in docs)

    return f"""
You are a helpful AI assistant.

Answer the user's question ONLY using the context below.

If the answer cannot be found in the context,
reply with:

"I don't know based on the provided document."

Context:
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
) -> RagAnswer:
    """
    Answer using similarity search with relevance scores (API-friendly).
    """

    results = vector_store.similarity_search_with_relevance_scores(question, k=k)
    docs = [doc for doc, _score in results]
    scores = [score for _doc, score in results]
    prompt = _build_prompt(question, docs)
    response = llm.invoke(prompt)

    return RagAnswer(
        answer=response.content,
        citations=_docs_to_citations(docs, scores),
    )
