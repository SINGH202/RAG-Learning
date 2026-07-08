from pathlib import Path

from langchain_community.document_loaders import TextLoader


def load_documents(file_path: str | Path):
    """
    Load a text document using LangChain.
    """

    loader = TextLoader(str(file_path))

    documents = loader.load()

    return documents
