import uuid

from fastapi import HTTPException, status


def _prepare_chunks(file_bytes: bytes, filename: str, document_id: str):
    from rag_core.loader import load_pdf
    from rag_core.splitter import split_documents

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

    for chunk in chunks:
        chunk.metadata["document_id"] = document_id
        chunk.metadata["source"] = filename

    return chunks


def index_pdf(
    file_bytes: bytes,
    filename: str,
    session_id: str,
    api_key: str | None = None,
):
    from rag_core.vector_store import create_session_store

    document_id = str(uuid.uuid4())
    chunks = _prepare_chunks(file_bytes, filename, document_id)

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

    return vector_store, document_id, len(chunks)


def add_pdf_to_session(
    vector_store,
    file_bytes: bytes,
    filename: str,
    api_key: str | None = None,
):
    from rag_core.vector_store import add_documents_to_session_store, get_google_embeddings

    # Ensure embeddings client is warm / key is valid before add.
    get_google_embeddings(api_key)

    document_id = str(uuid.uuid4())
    chunks = _prepare_chunks(file_bytes, filename, document_id)

    try:
        chunk_count = add_documents_to_session_store(vector_store, chunks)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to index PDF: {exc}",
        ) from exc

    return document_id, chunk_count


def rebuild_session_from_pdfs(
    session_id: str,
    pdf_pairs: list[tuple],
    api_key: str | None = None,
):
    """
    Rebuild an in-memory Chroma collection from stored PDF bytes.
    pdf_pairs: list of (DocumentInfo-like with document_id/filename, bytes)
    """
    from rag_core.vector_store import (
        add_documents_to_session_store,
        create_session_store,
    )
    from services.session_manager import DocumentInfo

    if not pdf_pairs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No documents to restore.",
        )

    documents: list[DocumentInfo] = []
    vector_store = None

    for index, (info, file_bytes) in enumerate(pdf_pairs):
        document_id = info.document_id
        filename = info.filename
        chunks = _prepare_chunks(file_bytes, filename, document_id)

        try:
            if index == 0:
                vector_store = create_session_store(
                    chunks,
                    session_id,
                    api_key=api_key,
                )
            else:
                add_documents_to_session_store(vector_store, chunks)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to restore PDF index: {exc}",
            ) from exc

        documents.append(
            DocumentInfo(
                document_id=document_id,
                filename=filename,
                chunk_count=len(chunks),
            )
        )

    return vector_store, documents
