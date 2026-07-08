import sys
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_REPO_ROOT / "packages/rag-core/src"))

from rag_core.llm import get_llm

llm = get_llm()

response = llm.invoke(
    "Say hello in one sentence."
)

print(response.content)
