from dataclasses import dataclass


@dataclass
class Citation:
    chunk_index: int
    text: str
    page: int | None
    source: str | None
    score: float | None
    document_id: str | None = None


@dataclass
class RagAnswer:
    answer: str
    citations: list[Citation]
