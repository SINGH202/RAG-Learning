from fastapi import HTTPException, status

from rag_core.loader import load_pdf
from rag_core.splitter import split_documents
from rag_core.vector_store import create_session_store


def index_pdf(file_bytes: bytes, filename: str, session_id: str):
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported.",
        )

    documents = load_pdf(file_bytes, filename)
    if not documents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PDF has no extractable text.",
        )

    chunks = split_documents(documents)
    if not chunks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PDF produced no searchable chunks.",
        )

    vector_store = create_session_store(chunks, session_id)
    return vector_store, len(chunks)
