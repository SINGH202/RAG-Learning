from pathlib import Path

from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

from rag_core.config import EMBEDDING_MODEL


def get_embeddings():
    """
    Create the embedding model.
    """
    return HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL
    )


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
