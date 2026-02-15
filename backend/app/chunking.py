"""Text chunking with configurable size and overlap."""

from app.document import ParsedDocument
from app.models import ChunkInfo


def chunk_document(
    parsed: ParsedDocument,
    chunk_size: int = 500,
    chunk_overlap: int = 50,
) -> list[ChunkInfo]:
    chunks: list[ChunkInfo] = []

    # Strategy 1: Chunk body paragraphs with overlap
    current_section = None
    for section in parsed.sections:
        if section["type"] == "heading":
            current_section = section["text"]
            continue

        if section["type"] == "paragraph":
            text = section["text"]
            if len(text) <= chunk_size:
                chunks.append(ChunkInfo(
                    text=_with_heading(text, current_section),
                    source=parsed.filename,
                    chunk_index=len(chunks),
                    section=current_section,
                ))
            else:
                # Split long paragraphs
                sub_chunks = _split_text(text, chunk_size, chunk_overlap)
                for sc in sub_chunks:
                    chunks.append(ChunkInfo(
                        text=_with_heading(sc, current_section),
                        source=parsed.filename,
                        chunk_index=len(chunks),
                        section=current_section,
                    ))

        elif section["type"] == "table_entry":
            # Keep table entries as individual chunks — they're self-contained Q&A pairs
            header = section.get("header", "")
            text = section["text"]
            prefixed = f"[{header}] {text}" if header else text
            chunks.append(ChunkInfo(
                text=_with_heading(prefixed, current_section),
                source=parsed.filename,
                chunk_index=len(chunks),
                section=current_section,
            ))

    # Strategy 2: Also create merged paragraph windows for broader context
    merged = _merge_adjacent_chunks(chunks, chunk_size, chunk_overlap)
    chunks.extend(merged)

    return chunks


def _with_heading(text: str, heading: str | None) -> str:
    if heading:
        return f"[Avsnitt: {heading}]\n{text}"
    return text


def _split_text(text: str, chunk_size: int, overlap: int) -> list[str]:
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        start = end - overlap
        if start >= len(words):
            break
    return chunks


def _merge_adjacent_chunks(
    chunks: list[ChunkInfo],
    max_size: int,
    overlap: int,
) -> list[ChunkInfo]:
    """Create overlapping windows of adjacent chunks for broader context retrieval."""
    merged: list[ChunkInfo] = []
    paragraph_chunks = [c for c in chunks if not c.text.startswith("[")]

    for i in range(0, len(paragraph_chunks) - 1):
        combined = paragraph_chunks[i].text + "\n" + paragraph_chunks[i + 1].text
        if len(combined) <= max_size * 2:
            merged.append(ChunkInfo(
                text=combined,
                source=paragraph_chunks[i].source,
                chunk_index=len(chunks) + len(merged),
                section=paragraph_chunks[i].section,
            ))
    return merged
