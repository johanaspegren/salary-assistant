"""FastAPI application — RAG chatbot with document upload."""

import logging
import os
import shutil
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.chunking import chunk_document
from app.config import settings
from app.document import parse_docx
from app.models import (
    ChatRequest,
    ChatResponse,
    DocumentInfo,
    HealthResponse,
)
from app.rag import generate_response
from app.vectorstore import add_chunks, clear_all, get_stats

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="RAG Chatbot API",
    description="Upload Word documents and chat with AI using RAG",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Track uploaded documents
uploaded_documents: list[DocumentInfo] = []

# Ensure upload directory exists
os.makedirs(settings.upload_dir, exist_ok=True)


@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    stats = get_stats()
    emb_model = (
        settings.openai_embedding_model
        if settings.embedding_provider == "openai"
        else settings.ollama_embedding_model
    )
    return HealthResponse(
        status="ok",
        documents_loaded=len(uploaded_documents),
        total_chunks=stats["total_chunks"],
        embedding_model=f"{settings.embedding_provider}/{emb_model}",
    )


@app.post("/api/upload", response_model=DocumentInfo)
async def upload_document(
    file: UploadFile = File(...),
    chunk_size: int = 500,
    chunk_overlap: int = 50,
):
    if not file.filename or not file.filename.endswith((".docx", ".DOCX")):
        raise HTTPException(
            status_code=400,
            detail="Endast .docx-filer stöds. Ladda upp ett Word-dokument.",
        )

    # Check file size
    contents = await file.read()
    size_mb = len(contents) / (1024 * 1024)
    if size_mb > settings.max_file_size_mb:
        raise HTTPException(
            status_code=400,
            detail=f"Filen är för stor ({size_mb:.1f} MB). Max: {settings.max_file_size_mb} MB.",
        )

    # Save file
    file_path = os.path.join(settings.upload_dir, file.filename)
    with open(file_path, "wb") as f:
        f.write(contents)

    try:
        # Parse document
        parsed = parse_docx(file_path, file.filename)

        # Chunk document
        chunks = chunk_document(parsed, chunk_size=chunk_size, chunk_overlap=chunk_overlap)

        # Add to vector store
        add_chunks(chunks)

        # Collect section names
        sections = list({
            s["text"] for s in parsed.sections if s["type"] == "heading"
        })

        doc_info = DocumentInfo(
            filename=file.filename,
            num_chunks=len(chunks),
            num_tables=len(parsed.tables),
            num_paragraphs=len(parsed.paragraphs),
            sample_sections=sections[:10],
        )
        uploaded_documents.append(doc_info)

        logger.info(
            "Document uploaded: %s (%d chunks, %d tables, %d paragraphs)",
            file.filename,
            len(chunks),
            len(parsed.tables),
            len(parsed.paragraphs),
        )

        return doc_info

    except Exception as e:
        logger.exception("Failed to process document: %s", file.filename)
        raise HTTPException(status_code=500, detail=f"Kunde inte bearbeta dokumentet: {e}")


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        response = await generate_response(request)
        return response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Chat error")
        raise HTTPException(status_code=500, detail=f"Fel vid AI-generering: {e}")


@app.get("/api/documents", response_model=list[DocumentInfo])
async def list_documents():
    return uploaded_documents


@app.delete("/api/documents")
async def clear_documents():
    uploaded_documents.clear()
    clear_all()

    # Clean upload directory
    upload_path = Path(settings.upload_dir)
    if upload_path.exists():
        shutil.rmtree(upload_path)
        upload_path.mkdir(exist_ok=True)

    return {"message": "Alla dokument har tagits bort."}


@app.get("/api/models")
async def list_available_models():
    """List available models for both providers."""
    models = {
        "openai": [
            {"id": "gpt-4o-mini", "name": "GPT-4o Mini (Snabb & billig)"},
            {"id": "gpt-4o", "name": "GPT-4o (Kraftfull)"},
            {"id": "gpt-4-turbo", "name": "GPT-4 Turbo"},
        ],
        "ollama": [],
    }

    # Try to fetch Ollama models
    try:
        import httpx
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{settings.ollama_base_url}/api/tags")
            if resp.status_code == 200:
                data = resp.json()
                models["ollama"] = [
                    {"id": m["name"], "name": m["name"]}
                    for m in data.get("models", [])
                ]
    except Exception:
        models["ollama"] = [
            {"id": "llama3", "name": "Llama 3 (standard)"},
            {"id": "mistral", "name": "Mistral"},
            {"id": "gemma2", "name": "Gemma 2"},
        ]

    return models
