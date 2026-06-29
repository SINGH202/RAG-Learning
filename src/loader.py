from langchain_community.document_loaders import TextLoader

from src.config import POLICY_FILE


def load_documents():
    """
    Load the company policy document using LangChain.
    """

    loader = TextLoader(str(POLICY_FILE))

    documents = loader.load()

    return documents