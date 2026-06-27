import asyncio
from sqlalchemy.orm import Session
from app.models.document import DocumentChunk
from app.services.embeddings import embed_text
from app.services.ai import expand_query_llm


_EXPANSION_TRIGGER = 0.60


async def retrieve_context(query: str, db: Session, top_k: int = 5, threshold: float = 0.12):
    loop = asyncio.get_event_loop()

    async def _search(q: str):
        embedding = await loop.run_in_executor(None, embed_text, q)
        distance_col = DocumentChunk.embedding.cosine_distance(embedding)
        return (
            db.query(DocumentChunk, distance_col.label("distance"))
            .filter(distance_col < (1 - threshold))
            .order_by(distance_col)
            .limit(top_k)
            .all()
        )

    results = await _search(query)
    base_top_similarity = (1 - results[0][1]) if results else 0.0
    if base_top_similarity < _EXPANSION_TRIGGER:
        expanded_query = await expand_query_llm(query)
        if expanded_query != query:
            results = await _search(expanded_query)

    if not results:
        return "", []

    context_parts = []
    sources = []
    seen: set = set()

    for chunk, distance in results:
        similarity = round(1 - distance, 4)
        filename = chunk.document.filename if chunk.document else "Document necunoscut"
        context_parts.append(f"[{filename}, Pagina {chunk.page_number}]\n{chunk.content}")
        key = (filename, chunk.page_number)
        if key not in seen:
            seen.add(key)
            sources.append({
                "filename": filename,
                "page": chunk.page_number,
                "similarity": similarity,
                "embedding": list(chunk.embedding) if chunk.embedding is not None else None,
            })

    return "\n\n---\n\n".join(context_parts), sources


# O sursă este citată doar dacă răspunsul generat este chiar ancorat în ea.
# Un răspuns conversațional generic nu seamănă cu niciun fragment clinic, deci nu citează nimic.
_GROUNDING_THRESHOLD = 0.52


def filter_grounded_sources(answer: str, sources: list) -> list:
    if not answer.strip() or not sources:
        return sources
    try:
        answer_embedding = embed_text(answer)
    except Exception:
        return sources
    grounded = []
    for s in sources:
        emb = s.get("embedding")
        if not emb:
            grounded.append(s)
            continue
        score = sum(a * b for a, b in zip(answer_embedding, emb))
        if score >= _GROUNDING_THRESHOLD:
            grounded.append(s)
    return grounded

_SENSITIVE_PATTERNS = ("suicide", "suicid", "self-harm", "selfharm", "self harm")


def is_sensitive_source(filename: str) -> bool:
    low = (filename or "").lower()
    return any(p in low for p in _SENSITIVE_PATTERNS)
