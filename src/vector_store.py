from pathlib import Path

from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

from src.config import (
    CHROMA_DIR,
    EMBEDDING_MODEL,
)


def get_embeddings():
    """
    Create the embedding model.
    """
    return HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL
    )


def create_vector_store(chunks):
    """
    Create and persist a new Chroma vector database.
    """

    embeddings = get_embeddings()

    vector_store = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=str(CHROMA_DIR),
    )

    print("✅ Created new vector database.")

    return vector_store


def load_vector_store():
    """
    Load an existing Chroma vector database.
    """

    embeddings = get_embeddings()

    vector_store = Chroma(
        persist_directory=str(CHROMA_DIR),
        embedding_function=embeddings,
    )

    print("✅ Loaded existing vector database.")

    return vector_store


def vector_store_exists():
    """
    Check whether the vector database already exists.
    """

    return (CHROMA_DIR / "chroma.sqlite3").exists()