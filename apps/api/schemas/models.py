from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str


class DocumentInfoResponse(BaseModel):
    document_id: str
    filename: str
    chunk_count: int


class SessionCreateResponse(BaseModel):
    session_id: str
    chunk_count: int
    filename: str
    ready: bool = True
    documents: list[DocumentInfoResponse] = Field(default_factory=list)


class DocumentAddResponse(BaseModel):
    session_id: str
    document: DocumentInfoResponse
    documents: list[DocumentInfoResponse]
    chunk_count: int


class DocumentsListResponse(BaseModel):
    session_id: str
    documents: list[DocumentInfoResponse]
    chunk_count: int


class HistoryMessage(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    content: str = Field(min_length=1)


class AskRequest(BaseModel):
    question: str = Field(min_length=2)
    document_id: str | None = None
    history: list[HistoryMessage] = Field(default_factory=list, max_length=4)


class CitationResponse(BaseModel):
    chunk_index: int
    text: str
    page: int | None
    source: str | None
    score: float | None
    document_id: str | None = None


class AskResponse(BaseModel):
    answer: str
    citations: list[CitationResponse]
    session_id: str
