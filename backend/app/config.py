from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Upload
    upload_dir: str = "uploads"
    max_file_size_mb: int = 50

    # Chunking defaults
    default_chunk_size: int = 500
    default_chunk_overlap: int = 50

    # Embedding provider: "openai" or "ollama" (follows LLM provider by default)
    embedding_provider: str = "openai"
    openai_embedding_model: str = "text-embedding-3-small"
    ollama_embedding_model: str = "nomic-embed-text"

    # Vector store
    chroma_persist_dir: str = "data/chroma"

    # LLM
    openai_api_key: str = ""

    openai_model: str = "gpt-4o-mini"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "gemma3"

    # RAG
    default_top_k: int = 5
    default_temperature: float = 0.3

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
