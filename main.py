from src.download_document import download_document
from src.loader import load_documents
from src.splitter import split_documents

from src.vector_store import (
    create_vector_store,
    load_vector_store,
    vector_store_exists,
)

from src.retriever import get_retriever
from src.llm import get_llm
from src.rag import ask


def main():

    download_document()

    if vector_store_exists():
        vector_store = load_vector_store()
    else:
        documents = load_documents()
        chunks = split_documents(documents)
        vector_store = create_vector_store(chunks)

    # Create once
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