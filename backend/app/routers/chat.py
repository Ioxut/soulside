from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.chat import ChatSession, ChatMessage, MessageSource
from app.schemas.chat import ChatSessionCreate, ChatSessionOut, ChatMessageOut, SessionUpdate
from app.deps import get_current_user

router = APIRouter(prefix="/chat", tags=["chat"])


def _enrich_session(session: ChatSession) -> dict:
    msgs = sorted(session.messages, key=lambda m: m.created_at)
    updated_at = msgs[-1].created_at if msgs else session.started_at
    first_msg = next((m.content for m in msgs if m.role == "user"), None)
    source_count = sum(len(m.sources) for m in msgs if m.role == "assistant")
    return {
        "id": session.id,
        "title": session.title,
        "sentiment": session.sentiment,
        "started_at": session.started_at,
        "ended_at": session.ended_at,
        "updated_at": updated_at,
        "message_count": len(msgs),
        "source_count": source_count,
        "first_message": first_msg,
    }


@router.get("/sessions", response_model=list[ChatSessionOut])
def get_sessions(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.started_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [_enrich_session(s) for s in sessions]


@router.post("/sessions", response_model=ChatSessionOut)
def create_session(data: ChatSessionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = ChatSession(user_id=current_user.id, title=data.title or "Conversație nouă")
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/sessions/{session_id}", response_model=ChatSessionOut)
def get_session(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Sesiune negăsită")
    return _enrich_session(session)


@router.get("/sessions/{session_id}/messages", response_model=list[ChatMessageOut])
def get_messages(
    session_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Sesiune negăsită")
    return (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.patch("/sessions/{session_id}", response_model=ChatSessionOut)
def update_session(session_id: int, data: SessionUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Sesiune negăsită")
    if data.title is not None:
        session.title = data.title
    db.commit()
    db.refresh(session)
    return session


@router.delete("/sessions/{session_id}", status_code=204)
def delete_session(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Sesiune negăsită")
    db.delete(session)
    db.commit()
