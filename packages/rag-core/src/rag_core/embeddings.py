from sentence_transformers import SentenceTransformer

from rag_core.config import EMBEDDING_MODEL


def get_embedding_model():
    """
    Load the SentenceTransformer embedding model.
    """

    model = SentenceTransformer(EMBEDDING_MODEL)

    return model
