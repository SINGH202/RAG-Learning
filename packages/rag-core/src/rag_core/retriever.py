def get_retriever(vector_store):
    """
    Create a retriever from the vector store.
    """

    retriever = vector_store.as_retriever(
    search_type="mmr",
    search_kwargs={
        "k": 3,
        "fetch_k": 10,
    },
    )

    return retriever