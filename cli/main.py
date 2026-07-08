import sys
from pathlib import Path

# ponytail: sys.path bootstrap until rag-core is installed editable (pip install -e packages/rag-core)
_REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_REPO_ROOT / "packages/rag-core/src"))
sys.path.insert(0, str(_REPO_ROOT))

from cli.config import CHROMA_DIR, POLICY_FILE
from cli.download_document import download_document
from rag_core.llm import get_llm
from rag_core.loader import load_documents
from rag_core.rag import ask
from rag_core.retriever import get_retriever
from rag_core.splitter import split_documents
from rag_core.vector_store import (
    create_vector_store,
    load_vector_store,
    vector_store_exists,
)


def main():

    download_document()

    if vector_store_exists(CHROMA_DIR):
        vector_store = load_vector_store(CHROMA_DIR)
    else:
        documents = load_documents(POLICY_FILE)
        chunks = split_documents(documents)
        vector_store = create_vector_store(chunks, CHROMA_DIR)

    retriever = get_retriever(vector_store)
    llm = get_llm()

    while True:

        question = input("\nAsk a question (type 'exit' to quit): ")

        if question.lower() == "exit":
            break

        answer = ask(
            question,
            retriever,
            llm,
        )

        print("\nAnswer:\n")
        print(answer)


if __name__ == "__main__":
    main()
