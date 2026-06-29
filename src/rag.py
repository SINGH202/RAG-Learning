from src.llm import get_llm
from src.retriever import get_retriever


def ask(question, retriever, llm):
    """
    Answer a question using Retrieval-Augmented Generation (RAG).
    """

    # Retrieve relevant documents
    docs = retriever.invoke(question)

    # Build context
    context = "\n\n".join(
        doc.page_content
        for doc in docs
    )

    # Prompt
    prompt = f"""
You are a helpful AI assistant.

Answer the user's question ONLY using the context below.

If the answer cannot be found in the context,
reply with:

"I don't know based on the provided document."

Context:
---------
{context}

Question:
---------
{question}

Answer:
"""

    response = llm.invoke(prompt)

    return response.content