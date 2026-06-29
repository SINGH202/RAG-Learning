from pathlib import Path

# Root folder of the project
BASE_DIR = Path(__file__).resolve().parent.parent

# Data folder
DATA_DIR = BASE_DIR / "data"

# Chroma database folder
CHROMA_DIR = BASE_DIR / "chroma_db"

# Company policy file
POLICY_FILE = DATA_DIR / "companyPolicies.txt"

# Sample document URL
DOCUMENT_URL = (
    "https://cf-courses-data.s3.us.cloud-object-storage.appdomain.cloud/"
    "6JDbUb_L3egv_eOkouY71A.txt"
)

# Embedding model
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

# Gemini model
LLM_MODEL = "gemini-2.5-flash"

# Text splitter settings
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200