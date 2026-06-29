# from langchain_huggingface import HuggingFaceEmbeddings

# from src.config import EMBEDDING_MODEL


# def get_embeddings():
#     """
#     Load the Hugging Face embedding model.
#     """

#     embeddings = HuggingFaceEmbeddings(
#         model_name=EMBEDDING_MODEL
#     )

#     return embeddings


from sentence_transformers import SentenceTransformer

from src.config import EMBEDDING_MODEL


def get_embedding_model():
    """
    Load the SentenceTransformer embedding model.
    """

    model = SentenceTransformer(EMBEDDING_MODEL)

    return model