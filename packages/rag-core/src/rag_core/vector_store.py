import os
import re
from pathlib import Path

import chromadb
from langchain_chroma import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings

from rag_core.config import EMBEDDING_MODEL, GOOGLE_EMBEDDING_MODEL

_hf_embeddings = None
_google_embeddings: dict[str, GoogleGenerativeAIEmbeddings] = {}


def get_embeddings():
    """
    Local HuggingFace embeddings for the CLI (lazy import).
    """
    global _hf_embeddings
    if _hf_embeddings is None:
        from langchain_huggingface import HuggingFaceEmbeddings

        _hf_embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
    return _hf_embeddings


def get_google_embeddings(api_key: str | None = None) -> GoogleGenerativeAIEmbeddings:
    """
    Gemini embeddings for the hosted API — no local model download.
    """
    key = api_key or os.getenv("GOOGLE_API_KEY")
    if not key:
        raise ValueError("GOOGLE_API_KEY is required for embeddings.")

    cached = _google_embeddings.get(key)
    if cached is not None:
        return cached

    embeddings = GoogleGenerativeAIEmbeddings(
        model=GOOGLE_EMBEDDING_MODEL,
        google_api_key=key,
    )
    _google_embeddings[key] = embeddings
    return embeddings


def _sanitize_collection_name(session_id: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9_-]", "", session_id.replace("-", ""))
    return f"session_{cleaned}"[:63]


def create_vector_store(chunks, persist_directory: str | Path):
    """
    Create and persist a new Chroma vector database (CLI).
    """
    embeddings = get_embeddings()

    vector_store = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=str(persist_directory),
    )

    print("✅ Created new vector database.")

    return vector_store


def create_session_store(chunks, session_id: str, api_key: str | None = None):
    """
    Create an in-memory Chroma collection for a single API session.
    Uses Gemini embeddings so Render does not download Torch models.
    """
    embeddings = get_google_embeddings(api_key)
    client = chromadb.EphemeralClient()

    vector_store = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        collection_name=_sanitize_collection_name(session_id),
        client=client,
    )

    return vector_store


def add_documents_to_session_store(vector_store, chunks) -> int:
    """
    Append chunks to an existing in-memory session collection.
    """
    if not chunks:
        return 0
    vector_store.add_documents(chunks)
    return len(chunks)


def load_vector_store(persist_directory: str | Path):
    """
    Load an existing Chroma vector database (CLI).
    """
    embeddings = get_embeddings()

    vector_store = Chroma(
        persist_directory=str(persist_directory),
        embedding_function=embeddings,
    )

    print("✅ Loaded existing vector database.")

    return vector_store


def vector_store_exists(persist_directory: str | Path):
    """
    Check whether the vector database already exists.
    """
    return (Path(persist_directory) / "chroma.sqlite3").exists()
