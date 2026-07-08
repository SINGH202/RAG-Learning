from io import BytesIO
from pathlib import Path

from langchain_community.document_loaders import TextLoader
from langchain_core.documents import Document
from pypdf import PdfReader


def load_documents(file_path: str | Path):
    """
    Load a text document using LangChain.
    """

    loader = TextLoader(str(file_path))

    documents = loader.load()

    return documents


def load_pdf(file_bytes: bytes, filename: str) -> list[Document]:
    """
    Extract text from a PDF and return one Document per page.
    """

    reader = PdfReader(BytesIO(file_bytes))
    documents: list[Document] = []

    for page_index, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        if not text.strip():
            continue

        documents.append(
            Document(
                page_content=text,
                metadata={
                    "page": page_index + 1,
                    "source": filename,
                },
            )
        )

    return documents
