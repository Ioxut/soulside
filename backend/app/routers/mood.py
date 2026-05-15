from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.mood import MoodLog
from app.schemas.mood import MoodLogCreate, MoodLogOut, MoodInsightOut
from app.deps import get_current_user

router = APIRouter(prefix="/mood", tags=["mood"])

_insight_cache: dict[int, tuple[date, str]] = {}


@router.get("", response_model=list[MoodLogOut])
def get_mood_logs(
    skip: int = 0,
    limit: int = 90,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(MoodLog)
        .filter(MoodLog.user_id == current_user.id)
        .order_by(MoodLog.logged_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.post("", response_model=MoodLogOut)
def create_mood_log(data: MoodLogCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(MoodLog).filter(
        MoodLog.user_id == current_user.id,
        MoodLog.logged_date == data.logged_date
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Ai înregistrat deja starea pentru această zi")

    log = MoodLog(user_id=current_user.id, **data.model_dump())
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/today", response_model=MoodLogOut | None)
def get_today_log(
    client_date: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        today = date.fromisoformat(client_date) if client_date else date.today()
    except ValueError:
        today = date.today()
    return db.query(MoodLog).filter(
        MoodLog.user_id == current_user.id,
        MoodLog.logged_date == today
    ).first()


@router.get("/insight", response_model=MoodInsightOut)
async def get_mood_insight(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.services.ai import generate_mood_insight
    today = date.today()

    cached = _insight_cache.get(current_user.id)
    if cached and cached[0] == today:
        return MoodInsightOut(insight=cached[1])

    logs = (
        db.query(MoodLog)
        .filter(MoodLog.user_id == current_user.id)
        .order_by(MoodLog.logged_date.desc())
        .limit(7)
        .all()
    )
    if not logs:
        return MoodInsightOut(insight="Înregistrează-ți prima stare pentru a primi insight-uri personalizate.")

    insight = await generate_mood_insight(current_user.name, logs)
    _insight_cache[current_user.id] = (today, insight)
    return MoodInsightOut(insight=insight)


@router.delete("/{log_id}", status_code=204)
def delete_mood_log(log_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    log = db.query(MoodLog).filter(MoodLog.id == log_id, MoodLog.user_id == current_user.id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Înregistrare negăsită")
    db.delete(log)
    db.commit()


@router.put("/{log_id}", response_model=MoodLogOut)
def update_mood_log(log_id: int, data: MoodLogCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    log = db.query(MoodLog).filter(MoodLog.id == log_id, MoodLog.user_id == current_user.id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Înregistrare negăsită")
    if log.logged_date != data.logged_date:
        raise HTTPException(status_code=403, detail="Poți edita doar înregistrarea din ziua curentă")
    for key, value in data.model_dump().items():
        setattr(log, key, value)
    db.commit()
    db.refresh(log)
    return log
