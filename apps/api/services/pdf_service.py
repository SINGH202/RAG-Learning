from fastapi import HTTPException, status


def index_pdf(
    file_bytes: bytes,
    filename: str,
    session_id: str,
    api_key: str | None = None,
):
    from rag_core.loader import load_pdf
    from rag_core.splitter import split_documents
    from rag_core.vector_store import create_session_store

    if not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported.",
        )

    documents = load_pdf(file_bytes, filename)
    if not documents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PDF has no extractable text. Try a text-based PDF (not a scanned image).",
        )

    chunks = split_documents(documents)
    if not chunks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PDF produced no searchable chunks.",
        )

    try:
        vector_store = create_session_store(chunks, session_id, api_key=api_key)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to index PDF: {exc}",
        ) from exc

    return vector_store, len(chunks)
