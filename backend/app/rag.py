"""RAG pipeline — retrieval + LLM generation with source references."""

import logging

import httpx
from openai import OpenAI

from app.config import settings
from app.models import ChatRequest, ChatResponse, SourceReference
from app.vectorstore import search

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """Du är en hjälpsam AI-assistent som svarar på frågor baserat på innehållet i uppladdade dokument.

VIKTIGA REGLER:
1. Svara ALLTID på svenska om inte användaren uttryckligen ber om ett annat språk.
2. Basera dina svar ENBART på den kontext som ges nedan. Hitta inte på information.
3. Om kontexten inte innehåller tillräcklig information, säg det tydligt.
4. Citera relevanta stycken från källan med citattecken och ange referens.
5. Om du hittar ORSAK/FÖRKLARING-par, presentera dem tydligt.
6. Var koncis men noggrann.

FORMAT FÖR SVAR:
- Ge ett tydligt svar på frågan
- Citera relevanta delar: "citat från dokumentet" (Källa: filnamn, avsnitt)
- Om flera källor stödjer svaret, nämn alla"""


def build_context(sources: list[SourceReference]) -> str:
    parts = []
    for i, src in enumerate(sources, 1):
        section_info = f" | Avsnitt: {src.section}" if src.section else ""
        parts.append(
            f"[Källa {i}] (Fil: {src.source}{section_info} | Relevans: {src.score:.0%})\n"
            f"{src.chunk_text}\n"
        )
    return "\n---\n".join(parts)


async def generate_response(request: ChatRequest) -> ChatResponse:
    # Retrieve relevant chunks
    sources = search(request.question, top_k=request.top_k)

    if not sources:
        return ChatResponse(
            answer="Inga dokument har laddats upp ännu. Ladda upp ett Word-dokument för att börja.",
            sources=[],
            model_used="none",
        )

    context = build_context(sources)

    user_message = (
        f"KONTEXT FRÅN DOKUMENT:\n{context}\n\n"
        f"ANVÄNDARENS FRÅGA:\n{request.question}"
    )

    if request.provider == "openai":
        answer, model_used = await _call_openai(user_message, request)
    elif request.provider == "ollama":
        answer, model_used = await _call_ollama(user_message, request)
    else:
        raise ValueError(f"Okänd leverantör: {request.provider}")

    return ChatResponse(answer=answer, sources=sources, model_used=model_used)


async def _call_openai(user_message: str, request: ChatRequest) -> tuple[str, str]:
    if not settings.openai_api_key:
        raise ValueError(
            "OpenAI API-nyckel saknas. Ange OPENAI_API_KEY i .env-filen eller välj Ollama."
        )

    model = request.model or settings.openai_model
    client = OpenAI(api_key=settings.openai_api_key)

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        temperature=request.temperature,
        max_tokens=2000,
    )

    return response.choices[0].message.content, model


async def _call_ollama(user_message: str, request: ChatRequest) -> tuple[str, str]:
    model = request.model or settings.ollama_model
    url = f"{settings.ollama_base_url}/api/chat"

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        "stream": False,
        "options": {
            "temperature": request.temperature,
        },
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(url, json=payload)
        response.raise_for_status()
        data = response.json()

    return data["message"]["content"], model
