import asyncio
import unicodedata
from sqlalchemy.orm import Session
from app.models.document import DocumentChunk
from app.services.embeddings import embed_text


def _strip_diacritics(text: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFD", text)
        if unicodedata.category(c) != "Mn"
    )

_SLEEP_KEYWORDS = {"dorm", "somn", "insomnie", "adorm", "trezesc", "noapte", "obosit", "oboseala"}
_ANXIETY_KEYWORDS = {"anxietate", "panica", "atac de panica", "ingrijorat", "fric", "fobie", "neliniste"}
_DEPRESSION_KEYWORDS = {"depresie", "trist", "tristete", "deprimat", "motivatie", "gol", "nu mai vreau"}
_STRESS_KEYWORDS = {"stres", "coplesit", "burnout", "epuizat", "tensiune", "presiune"}


def _expand_query(query: str) -> str:
    lower = _strip_diacritics(query.lower())
    expansions = []
    if any(kw in lower for kw in _SLEEP_KEYWORDS):
        expansions.append("igienă somn calitate somn insomnie sfaturi somn sănătos")
    if any(kw in lower for kw in _ANXIETY_KEYWORDS):
        expansions.append("tulburare anxietate terapie cognitiv comportamentală tehnici relaxare")
    if any(kw in lower for kw in _DEPRESSION_KEYWORDS):
        expansions.append("depresie simptome tratament intervenție psihologică")
    if any(kw in lower for kw in _STRESS_KEYWORDS):
        expansions.append("managementul stresului tehnici coping reducere stres")
    if not expansions:
        return query
    return query + " " + " ".join(expansions)


async def retrieve_context(query: str, db: Session, top_k: int = 5, threshold: float = 0.12):
    expanded_query = _expand_query(query)
    loop = asyncio.get_event_loop()
    query_embedding = await loop.run_in_executor(None, embed_text, expanded_query)

    distance_col = DocumentChunk.embedding.cosine_distance(query_embedding)

    results = (
        db.query(DocumentChunk, distance_col.label("distance"))
        .filter(distance_col < (1 - threshold))
        .order_by(distance_col)
        .limit(top_k)
        .all()
    )

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
            sources.append({"filename": filename, "page": chunk.page_number, "similarity": similarity})

    return "\n\n---\n\n".join(context_parts), sources
