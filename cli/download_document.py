import wget

from cli.config import DATA_DIR, DOCUMENT_URL, POLICY_FILE


def download_document():
    """
    Downloads the sample company policy document
    if it doesn't already exist.
    """

    DATA_DIR.mkdir(exist_ok=True)

    if POLICY_FILE.exists():
        print("✅ Document already exists.")
        return

    print("⬇️ Downloading company policy document...")

    wget.download(
        DOCUMENT_URL,
        out=str(POLICY_FILE)
    )

    print("\n✅ Download complete.")
