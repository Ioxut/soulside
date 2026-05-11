import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db, SessionLocal
from app.models.user import User
from app.models.chat import ChatSession, ChatMessage, MessageSource
from app.models.document import SourceDocument
from app.schemas.chat import ChatRequest
from app.schemas.document import SourceDocumentOut
from app.services.rag import retrieve_context
from app.services.ai import stream_chat_response
from app.deps import get_current_user

router = APIRouter(prefix="/rag", tags=["rag"])


@router.get("/sources", response_model=list[SourceDocumentOut])
def get_public_sources(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    docs = db.query(SourceDocument).order_by(SourceDocument.uploaded_at.desc()).all()
    from app.models.document import DocumentChunk
    result = []
    for doc in docs:
        chunk_count = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).count()
        result.append(SourceDocumentOut(id=doc.id, filename=doc.filename, uploaded_at=doc.uploaded_at, chunk_count=chunk_count))
    return result


@router.post("/chat/stream")
async def chat_stream(
    data: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = db.query(ChatSession).filter(
        ChatSession.id == data.session_id,
        ChatSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Sesiune negăsită")

    user_msg = ChatMessage(session_id=session.id, role="user", content=data.message)
    db.add(user_msg)
    db.commit()

    if len(session.messages) == 1 and session.title == "Conversație nouă":
        session.title = data.message[:60] + ("..." if len(data.message) > 60 else "")
        db.commit()

    context, sources = await retrieve_context(data.message, db)
    history = [{"role": m.role, "content": m.content} for m in session.messages[:-1]]
    session_id = session.id

    db.close()

    full_response = []

    async def event_generator():
        try:
            async for token in stream_chat_response(data.message, history, context):
                full_response.append(token)
                yield f"data: {json.dumps({'token': token})}\n\n"
        except Exception:
            yield f"data: {json.dumps({'error': True})}\n\n"
            return

        save_db = SessionLocal()
        try:
            assistant_content = "".join(full_response)
            assistant_msg = ChatMessage(session_id=session_id, role="assistant", content=assistant_content)
            save_db.add(assistant_msg)
            save_db.flush()

            DISPLAY_THRESHOLD = 0.60
            MAX_SOURCES = 3
            display_sources = [s for s in sources if s.get("similarity", 0) >= DISPLAY_THRESHOLD][:MAX_SOURCES]

            for src in display_sources:
                save_db.add(MessageSource(
                    message_id=assistant_msg.id,
                    filename=src.get("filename", ""),
                    page=src.get("page"),
                ))

            save_db.commit()
            yield f"data: {json.dumps({'done': True, 'sources': display_sources, 'message_id': assistant_msg.id})}\n\n"
        except Exception:
            save_db.rollback()
            yield f"data: {json.dumps({'done': True, 'sources': [], 'message_id': -1})}\n\n"
        finally:
            save_db.close()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
