import sys
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
sys.path.insert(0, str(_REPO_ROOT / "packages/rag-core/src"))

from sentence_transformers import util

from rag_core.embeddings import get_embedding_model


def main():

    model = get_embedding_model()

    sentence1 = "Company employees can work remotely."

    sentence2 = "Remote work is allowed for employees."

    sentence3 = "I love eating pizza."

    embedding1 = model.encode(sentence1)

    embedding2 = model.encode(sentence2)

    embedding3 = model.encode(sentence3)

    similarity12 = util.cos_sim(
        embedding1,
        embedding2
    )

    similarity13 = util.cos_sim(
        embedding1,
        embedding3
    )

    print(f"Sentence 1: {sentence1}")
    print(f"Sentence 2: {sentence2}")
    print(f"Similarity: {similarity12.item():.4f}")

    print()

    print(f"Sentence 1: {sentence1}")
    print(f"Sentence 3: {sentence3}")
    print(f"Similarity: {similarity13.item():.4f}")


if __name__ == "__main__":
    main()
