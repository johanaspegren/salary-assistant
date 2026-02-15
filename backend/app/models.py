from pydantic import BaseModel


class ChunkInfo(BaseModel):
    text: str
    source: str
    chunk_index: int
    section: str | None = None
    page: int | None = None


class SourceReference(BaseModel):
    chunk_text: str
    source: str
    section: str | None = None
    score: float
    chunk_index: int


class ChatRequest(BaseModel):
    question: str
    provider: str = "openai"  # "openai" or "ollama"
    model: str | None = None
    temperature: float = 0.3
    top_k: int = 5


class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceReference]
    model_used: str


class UploadSettings(BaseModel):
    chunk_size: int = 500
    chunk_overlap: int = 50


class DocumentInfo(BaseModel):
    filename: str
    num_chunks: int
    num_tables: int
    num_paragraphs: int
    sample_sections: list[str]


class HealthResponse(BaseModel):
    status: str
    documents_loaded: int
    total_chunks: int
    embedding_model: str
