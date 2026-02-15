# Dokumentassistent — RAG Chatbot

A RAG (Retrieval-Augmented Generation) chatbot that lets you upload Word documents (.docx) and chat with an AI that answers based on the document content — with source references and quoted passages.

Built for Swedish-language documents with support for structured table data (ORSAK/FÖRKLARING pairs and similar Q&A formats).

## Features

- **Drag-and-drop document upload** — drop a `.docx` file and it gets parsed, chunked, and indexed automatically
- **Smart DOCX parsing** — extracts both body text and table cells, recognizes ORSAK/FÖRKLARING and Q&A patterns
- **Configurable chunking** — adjust chunk size and overlap via the UI
- **Multilingual embeddings** — uses `paraphrase-multilingual-MiniLM-L12-v2` for excellent Swedish support
- **Dual LLM support** — choose between OpenAI (GPT-4o, GPT-4o-mini) or local Ollama models
- **Source references** — every answer shows which document chunks were used, with relevance scores
- **Expandable quotes** — click to see the exact passage the AI based its answer on
- **Dark/light mode** — automatic detection + manual toggle
- **Swedish UI** — interface and AI responses default to Swedish

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python, FastAPI |
| Document parsing | python-docx |
| Embeddings | sentence-transformers |
| Vector store | ChromaDB |
| LLM | OpenAI API / Ollama |
| Frontend | React, TypeScript, Vite |

## Quick Start

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Configure
cp .env.example .env
# Edit .env with your OpenAI key (or leave empty to use Ollama)

# Run
uvicorn app.main:app --reload --port 8080
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 — the frontend proxies API calls to the backend.

### Docker Compose (with Ollama)

```bash
docker compose up
```

This starts the backend, frontend, and a local Ollama instance.

## Configuration

All settings are adjustable from the UI sidebar:

| Setting | Description | Default |
|---------|-------------|---------|
| AI Provider | OpenAI or Ollama | OpenAI |
| Model | Which model to use | gpt-4o-mini |
| Temperature | Creativity vs precision | 0.3 |
| Top-K | Number of source chunks to retrieve | 5 |
| Chunk Size | Characters per text segment | 500 |
| Chunk Overlap | Overlap between segments | 50 |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check + stats |
| `POST` | `/api/upload` | Upload a .docx file |
| `POST` | `/api/chat` | Send a question |
| `GET` | `/api/documents` | List uploaded documents |
| `DELETE` | `/api/documents` | Clear all documents |
| `GET` | `/api/models` | List available models |
