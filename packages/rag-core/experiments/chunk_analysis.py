import sys
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
sys.path.insert(0, str(_REPO_ROOT / "packages/rag-core/src"))

from langchain_huggingface import HuggingFaceEmbeddings

from rag_core.config import EMBEDDING_MODEL


def main():

    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)

    vector = embeddings.embed_query(
        "Company employees can work remotely."
    )

    print(type(vector))

    print(len(vector))

    print(vector[:10])


if __name__ == "__main__":
    main()
