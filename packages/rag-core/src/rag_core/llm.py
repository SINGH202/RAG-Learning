import os

from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

from rag_core.config import LLM_MODEL


load_dotenv()


def get_llm(api_key: str | None = None):
    """
    Create and return the Gemini LLM.
    """

    llm = ChatGoogleGenerativeAI(
        model=LLM_MODEL,
        temperature=0.3,
        google_api_key=api_key or os.getenv("GOOGLE_API_KEY"),
    )

    return llm
