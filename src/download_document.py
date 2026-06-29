import wget

from src.config import (
    DATA_DIR,
    POLICY_FILE,
    DOCUMENT_URL,
)


def download_document():
    """
    Downloads the sample company policy document
    if it doesn't already exist.
    """

    # Create the data folder if it doesn't exist
    DATA_DIR.mkdir(exist_ok=True)

    # Don't download again if the file is already present
    if POLICY_FILE.exists():
        print("✅ Document already exists.")
        return

    print("⬇️ Downloading company policy document...")

    wget.download(
        DOCUMENT_URL,
        out=str(POLICY_FILE)
    )

    print("\n✅ Download complete.")