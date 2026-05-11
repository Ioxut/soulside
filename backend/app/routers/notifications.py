from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import NotificationOut
from app.deps import get_current_user


class BatchReadRequest(BaseModel):
    ids: list[int]

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationOut])
def get_notifications(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.patch("/{notification_id}/read", response_model=NotificationOut)
def mark_read(notification_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id,
    ).first()
    if notif:
        notif.read = True
        db.commit()
        db.refresh(notif)
    return notif


@router.patch("/read-all")
def mark_all_read(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.read == False,
    ).update({"read": True})
    db.commit()
    return {"message": "Toate notificările au fost marcate ca citite"}


@router.post("/read")
def mark_batch_read(data: BatchReadRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if data.ids:
        db.query(Notification).filter(
            Notification.id.in_(data.ids),
            Notification.user_id == current_user.id,
        ).update({"read": True}, synchronize_session=False)
        db.commit()
    return {"message": f"{len(data.ids)} notificări marcate ca citite"}
