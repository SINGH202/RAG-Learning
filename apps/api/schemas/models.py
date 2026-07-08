from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str


class SessionCreateResponse(BaseModel):
    session_id: str
    chunk_count: int
    filename: str
    ready: bool = True


class AskRequest(BaseModel):
    question: str = Field(min_length=2)


class CitationResponse(BaseModel):
    chunk_index: int
    text: str
    page: int | None
    source: str | None
    score: float | None


class AskResponse(BaseModel):
    answer: str
    citations: list[CitationResponse]
    session_id: str
