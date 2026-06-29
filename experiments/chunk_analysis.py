
from src.embeddings import get_embeddings


def main():

    embeddings = get_embeddings()

    vector = embeddings.embed_query(
        "Company employees can work remotely."
    )

    print(type(vector))

    print(len(vector))

    print(vector[:10])


if __name__ == "__main__":
    main()