"""Embedding service using OpenAI or Ollama embedding APIs."""

import logging

import httpx
from openai import OpenAI

from app.config import settings

logger = logging.getLogger(__name__)

# Cache the current provider so we can detect switches
_current_provider: str | None = None


def _get_provider() -> str:
    return settings.embedding_provider


def embed_texts(texts: list[str], provider: str | None = None) -> list[list[float]]:
    provider = provider or _get_provider()
    if provider == "openai":
        return _openai_embed(texts)
    elif provider == "ollama":
        return _ollama_embed(texts)
    else:
        raise ValueError(f"Unknown embedding provider: {provider}")


def embed_query(query: str, provider: str | None = None) -> list[float]:
    return embed_texts([query], provider=provider)[0]


def _openai_embed(texts: list[str]) -> list[list[float]]:
    if not settings.openai_api_key:
        raise ValueError(
            "OpenAI API-nyckel saknas. Ange OPENAI_API_KEY i .env eller välj Ollama."
        )

    client = OpenAI(api_key=settings.openai_api_key)
    model = settings.openai_embedding_model
    logger.info("Embedding %d texts with OpenAI %s", len(texts), model)

    # OpenAI allows batches up to 2048 inputs
    all_embeddings: list[list[float]] = []
    batch_size = 512
    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        response = client.embeddings.create(model=model, input=batch)
        # Sort by index to maintain order
        sorted_data = sorted(response.data, key=lambda x: x.index)
        all_embeddings.extend([d.embedding for d in sorted_data])

    return all_embeddings


def _ollama_embed(texts: list[str]) -> list[list[float]]:
    model = settings.ollama_embedding_model
    url = f"{settings.ollama_base_url}/api/embed"
    logger.info("Embedding %d texts with Ollama %s", len(texts), model)

    # Ollama /api/embed supports batch input
    with httpx.Client(timeout=120.0) as client:
        response = client.post(url, json={"model": model, "input": texts})
        response.raise_for_status()
        data = response.json()

    return data["embeddings"]
