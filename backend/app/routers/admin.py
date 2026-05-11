from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.document import SourceDocument, DocumentChunk
from app.models.chat import ChatSession
from app.models.mood import MoodLog
from app.models.specialist import SpecialistRequest
from app.models.content import ContentItem
from app.schemas.document import SourceDocumentOut
from app.services.ingestion import ingest_pdf
from app.deps import get_admin_user
from sqlalchemy import func as sqlfunc
import os, uuid, tempfile

_CHUNK = 1024 * 1024
_MAX_PDF = 50 * 1024 * 1024

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/documents/upload", response_model=SourceDocumentOut)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Doar fișiere PDF sunt acceptate")
    if file.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(status_code=400, detail="Tipul fișierului nu este PDF")

    tmp_fd, tmp_path = tempfile.mkstemp(suffix=".pdf")
    try:
        size = 0
        first_chunk = True
        with os.fdopen(tmp_fd, "wb") as tmp:
            while True:
                chunk = await file.read(_CHUNK)
                if not chunk:
                    break
                if first_chunk:
                    if not chunk.startswith(b"%PDF-"):
                        raise HTTPException(status_code=400, detail="Fișierul nu este un PDF valid")
                    first_chunk = False
                size += len(chunk)
                if size > _MAX_PDF:
                    raise HTTPException(status_code=400, detail="Fișierul depășește limita de 50MB")
                tmp.write(chunk)

        try:
            doc = ingest_pdf(tmp_path, file.filename, db)
            chunk_count = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).count()
            return SourceDocumentOut(
                id=doc.id,
                filename=doc.filename,
                uploaded_at=doc.uploaded_at,
                chunk_count=chunk_count,
            )
        except ValueError as e:
            raise HTTPException(status_code=422, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Eroare la procesarea PDF-ului: {str(e)}")
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


@router.get("/documents", response_model=list[SourceDocumentOut])
def get_documents(db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    docs = db.query(SourceDocument).order_by(SourceDocument.uploaded_at.desc()).all()
    result = []
    for doc in docs:
        chunk_count = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).count()
        result.append(SourceDocumentOut(
            id=doc.id,
            filename=doc.filename,
            uploaded_at=doc.uploaded_at,
            chunk_count=chunk_count,
        ))
    return result


@router.post("/documents/{doc_id}/reindex", status_code=200)
def reindex_document(doc_id: int, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    from app.services.embeddings import embed_texts

    doc = db.query(SourceDocument).filter(SourceDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document negăsit")

    chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc_id).all()
    if not chunks:
        raise HTTPException(status_code=422, detail="Documentul nu are chunk-uri")

    texts = [c.content for c in chunks]
    embeddings = embed_texts(texts)

    for chunk, embedding in zip(chunks, embeddings):
        chunk.embedding = embedding

    db.commit()
    return {"reindexed": len(chunks), "document": doc.filename}


@router.post("/documents/reindex-all", status_code=200)
def reindex_all_documents(db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    from app.services.embeddings import embed_texts

    chunks = db.query(DocumentChunk).all()
    if not chunks:
        return {"reindexed": 0}

    texts = [c.content for c in chunks]
    embeddings = embed_texts(texts)

    for chunk, embedding in zip(chunks, embeddings):
        chunk.embedding = embedding

    db.commit()
    return {"reindexed": len(chunks)}


@router.delete("/documents/{doc_id}", status_code=204)
def delete_document(doc_id: int, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    doc = db.query(SourceDocument).filter(SourceDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document negăsit")
    db.delete(doc)
    db.commit()


UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "content")


@router.post("/content/upload-file")
async def upload_content_file(
    file: UploadFile = File(...),
    _: User = Depends(get_admin_user),
):
    os.makedirs(UPLOADS_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename or "file.pdf")[1].lower()
    if ext not in (".pdf",):
        raise HTTPException(status_code=400, detail="Doar fișiere PDF sunt acceptate")
    if file.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(status_code=400, detail="Tipul fișierului nu este PDF")
    unique_name = f"{uuid.uuid4().hex}{ext}"
    dest = os.path.join(UPLOADS_DIR, unique_name)
    size = 0
    first_chunk = True
    try:
        with open(dest, "wb") as f:
            while True:
                chunk = await file.read(_CHUNK)
                if not chunk:
                    break
                if first_chunk:
                    if not chunk.startswith(b"%PDF-"):
                        raise HTTPException(status_code=400, detail="Fișierul nu este un PDF valid")
                    first_chunk = False
                size += len(chunk)
                if size > _MAX_PDF:
                    raise HTTPException(status_code=400, detail="Fișierul depășește limita de 50MB")
                f.write(chunk)
    except HTTPException:
        if os.path.exists(dest):
            os.unlink(dest)
        raise
    return {"url": f"/uploads/content/{unique_name}", "filename": file.filename}


@router.post("/documents/drop-embedding-index", status_code=200)
def drop_embedding_index(db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    from sqlalchemy import text
    db.execute(text("DROP INDEX IF EXISTS document_chunks_embedding_idx"))
    db.commit()
    return {"detail": "IVFFlat index dropped. Exact cosine search is now active."}


@router.get("/debug/retrieve")
def debug_retrieve(q: str, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    from app.services.embeddings import embed_text
    from app.services.rag import _expand_query

    expanded = _expand_query(q)
    query_embedding = embed_text(expanded)
    distance_col = DocumentChunk.embedding.cosine_distance(query_embedding)

    results = (
        db.query(DocumentChunk, distance_col.label("distance"))
        .order_by(distance_col)
        .limit(10)
        .all()
    )

    all_results = [
        {
            "filename": chunk.document.filename if chunk.document else "?",
            "page": chunk.page_number,
            "similarity": round(1 - distance, 4),
            "preview": chunk.content[:120],
        }
        for chunk, distance in results
    ]

    nih_doc = db.query(SourceDocument).filter(
        SourceDocument.filename.ilike("%sleep%")
    ).first()
    nih_results = []
    if nih_doc:
        nih_chunks = (
            db.query(DocumentChunk, distance_col.label("distance"))
            .filter(DocumentChunk.document_id == nih_doc.id)
            .order_by(distance_col)
            .limit(5)
            .all()
        )
        nih_results = [
            {
                "page": chunk.page_number,
                "similarity": round(1 - distance, 4),
                "preview": chunk.content[:120],
            }
            for chunk, distance in nih_chunks
        ]

    return {
        "original_query": q,
        "expanded_query": expanded,
        "top10_global": all_results,
        "nih_sleep_guide_top5": nih_results,
    }


@router.get("/stats")
def get_stats(db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    total_users = db.query(User).count()
    total_sessions = db.query(ChatSession).count()
    total_documents = db.query(SourceDocument).count()
    total_content = db.query(ContentItem).count()
    pending_requests = db.query(SpecialistRequest).filter(SpecialistRequest.status == "pending").count()
    mood_avg = db.query(sqlfunc.avg(MoodLog.score)).scalar()
    return {
        "total_users": total_users,
        "total_sessions": total_sessions,
        "total_documents": total_documents,
        "total_content": total_content,
        "pending_requests": pending_requests,
        "mood_avg": round(float(mood_avg), 1) if mood_avg else None,
    }
