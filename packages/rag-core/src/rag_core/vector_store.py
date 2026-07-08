from pathlib import Path
import re

import chromadb
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

from rag_core.config import EMBEDDING_MODEL


_embeddings: HuggingFaceEmbeddings | None = None


def get_embeddings():
    """
    Create the embedding model (singleton — loaded once per process).
    """
    global _embeddings
    if _embeddings is None:
        _embeddings = HuggingFaceEmbeddings(
            model_name=EMBEDDING_MODEL
        )
    return _embeddings


def _sanitize_collection_name(session_id: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9_-]", "", session_id.replace("-", ""))
    return f"session_{cleaned}"[:63]


def create_vector_store(chunks, persist_directory: str | Path):
    """
    Create and persist a new Chroma vector database.
    """

    embeddings = get_embeddings()

    vector_store = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=str(persist_directory),
    )

    print("✅ Created new vector database.")

    return vector_store


def create_session_store(chunks, session_id: str):
    """
    Create an in-memory Chroma collection for a single API session.
    """

    embeddings = get_embeddings()
    client = chromadb.EphemeralClient()

    vector_store = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        collection_name=_sanitize_collection_name(session_id),
        client=client,
    )

    return vector_store


def load_vector_store(persist_directory: str | Path):
    """
    Load an existing Chroma vector database.
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
