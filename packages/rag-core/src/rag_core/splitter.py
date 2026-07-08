from langchain_text_splitters import RecursiveCharacterTextSplitter

from rag_core.config import CHUNK_OVERLAP, CHUNK_SIZE


def split_documents(documents):
    """
    Split documents into smaller chunks.
    """

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
    )

    chunks = splitter.split_documents(documents)

    return chunks
