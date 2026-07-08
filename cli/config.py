from pathlib import Path

CLI_DIR = Path(__file__).resolve().parent

DATA_DIR = CLI_DIR / "data"
CHROMA_DIR = CLI_DIR / "chroma_db"
POLICY_FILE = DATA_DIR / "companyPolicies.txt"

DOCUMENT_URL = (
    "https://cf-courses-data.s3.us.cloud-object-storage.appdomain.cloud/"
    "6JDbUb_L3egv_eOkouY71A.txt"
)
