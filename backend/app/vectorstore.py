"""ChromaDB vector store for document chunks."""

import logging
import uuid

import chromadb

from app.config import settings
from app.embeddings import embed_texts, embed_query
from app.models import ChunkInfo, SourceReference

logger = logging.getLogger(__name__)

_client: chromadb.ClientAPI | None = None
_collection: chromadb.Collection | None = None

COLLECTION_NAME = "documents"


def _get_collection() -> chromadb.Collection:
    global _client, _collection
    if _collection is None:
        _client = chromadb.PersistentClient(path=settings.chroma_persist_dir)
        _collection = _client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


def add_chunks(chunks: list[ChunkInfo]) -> int:
    if not chunks:
        return 0

    collection = _get_collection()
    texts = [c.text for c in chunks]
    embeddings = embed_texts(texts)

    ids = [str(uuid.uuid4()) for _ in chunks]
    metadatas = [
        {
            "source": c.source,
            "chunk_index": c.chunk_index,
            "section": c.section or "",
        }
        for c in chunks
    ]

    # Add in batches
    batch_size = 100
    for i in range(0, len(ids), batch_size):
        end = min(i + batch_size, len(ids))
        collection.add(
            ids=ids[i:end],
            documents=texts[i:end],
            embeddings=embeddings[i:end],
            metadatas=metadatas[i:end],
        )

    logger.info("Added %d chunks to vector store", len(chunks))
    return len(chunks)


def search(query: str, top_k: int = 5) -> list[SourceReference]:
    collection = _get_collection()

    if collection.count() == 0:
        return []

    query_embedding = embed_query(query)

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(top_k, collection.count()),
        include=["documents", "metadatas", "distances"],
    )

    sources: list[SourceReference] = []
    if results and results["documents"]:
        for doc, meta, distance in zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0],
        ):
            # Cosine distance → similarity
            similarity = 1.0 - distance
            sources.append(SourceReference(
                chunk_text=doc,
                source=meta.get("source", "unknown"),
                section=meta.get("section") or None,
                score=round(similarity, 4),
                chunk_index=meta.get("chunk_index", 0),
            ))

    return sources


def get_stats() -> dict:
    collection = _get_collection()
    return {
        "total_chunks": collection.count(),
    }


def clear_all() -> None:
    global _collection
    client = chromadb.PersistentClient(path=settings.chroma_persist_dir)
    try:
        client.delete_collection(COLLECTION_NAME)
    except Exception:
        pass
    _collection = None
    logger.info("Vector store cleared")
