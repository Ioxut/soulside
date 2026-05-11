import os
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.content import ContentItem
from app.models.favorite import UserFavorite
from app.models.like import UserLike
from app.models.user import User
from app.schemas.content import ContentItemCreate, ContentItemUpdate, ContentItemOut
from app.deps import get_current_user, get_admin_user

router = APIRouter(prefix="/content", tags=["content"])


def _enrich(item: ContentItem, fav_ids: set, like_ids: set) -> ContentItemOut:
    out = ContentItemOut.model_validate(item)
    out.is_favorited = item.id in fav_ids
    out.is_liked = item.id in like_ids
    return out


def _fetch_user_sets(user_id: int, db: Session) -> tuple[set, set]:
    fav_ids = {r.content_id for r in db.query(UserFavorite.content_id).filter_by(user_id=user_id).all()}
    like_ids = {r.content_id for r in db.query(UserLike.content_id).filter_by(user_id=user_id).all()}
    return fav_ids, like_ids


@router.get("/counts")
def get_counts(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    rows = db.query(ContentItem.type, func.count(ContentItem.id)).group_by(ContentItem.type).all()
    counts: dict = {"total": 0, "articol": 0, "video": 0, "pdf": 0, "ghid": 0}
    for row_type, cnt in rows:
        counts["total"] += cnt
        if row_type in ("articol", "articol_extern"):
            counts["articol"] += cnt
        elif row_type in counts:
            counts[row_type] += cnt
    return counts


@router.get("", response_model=list[ContentItemOut])
def get_content(
    category: Optional[str] = None,
    type: Optional[str] = None,
    skip: int = 0,
    limit: int = 12,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(ContentItem)
    if category:
        q = q.filter(ContentItem.category == category)
    if type:
        q = q.filter(ContentItem.type == type)
    items = q.order_by(ContentItem.created_at.desc()).offset(skip).limit(limit).all()
    fav_ids, like_ids = _fetch_user_sets(current_user.id, db)
    return [_enrich(i, fav_ids, like_ids) for i in items]


@router.get("/favorites", response_model=list[ContentItemOut])
def get_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = (
        db.query(ContentItem)
        .join(UserFavorite, UserFavorite.content_id == ContentItem.id)
        .filter(UserFavorite.user_id == current_user.id)
        .all()
    )
    fav_ids, like_ids = _fetch_user_sets(current_user.id, db)
    return [_enrich(i, fav_ids, like_ids) for i in items]


@router.get("/favorites/count")
def get_favorites_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count = db.query(UserFavorite).filter_by(user_id=current_user.id).count()
    return {"count": count}


@router.get("/{item_id}", response_model=ContentItemOut)
def get_content_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(ContentItem).filter(ContentItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Conținut negăsit")
    item.views += 1
    db.commit()
    db.refresh(item)
    fav_ids, like_ids = _fetch_user_sets(current_user.id, db)
    return _enrich(item, fav_ids, like_ids)


@router.post("/{item_id}/like", response_model=ContentItemOut)
def toggle_like(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(ContentItem).filter(ContentItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Conținut negăsit")
    existing = db.query(UserLike).filter_by(user_id=current_user.id, content_id=item_id).first()
    if existing:
        db.delete(existing)
        item.likes = max(0, item.likes - 1)
    else:
        db.add(UserLike(user_id=current_user.id, content_id=item_id))
        item.likes += 1
    db.commit()
    db.refresh(item)
    fav_ids, like_ids = _fetch_user_sets(current_user.id, db)
    return _enrich(item, fav_ids, like_ids)


@router.post("/{item_id}/favorite", response_model=ContentItemOut)
def toggle_favorite(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(ContentItem).filter(ContentItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Conținut negăsit")

    existing = db.query(UserFavorite).filter_by(user_id=current_user.id, content_id=item_id).first()
    if existing:
        db.delete(existing)
    else:
        db.add(UserFavorite(user_id=current_user.id, content_id=item_id))
    db.commit()
    db.refresh(item)
    fav_ids, like_ids = _fetch_user_sets(current_user.id, db)
    return _enrich(item, fav_ids, like_ids)


@router.post("", response_model=ContentItemOut)
def create_content(
    data: ContentItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    item = ContentItem(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    fav_ids, like_ids = _fetch_user_sets(current_user.id, db)
    return _enrich(item, fav_ids, like_ids)


@router.patch("/{item_id}", response_model=ContentItemOut)
def update_content(
    item_id: int,
    data: ContentItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    item = db.query(ContentItem).filter(ContentItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Conținut negăsit")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    fav_ids, like_ids = _fetch_user_sets(current_user.id, db)
    return _enrich(item, fav_ids, like_ids)


@router.delete("/{item_id}", status_code=204)
def delete_content(
    item_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    item = db.query(ContentItem).filter(ContentItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Conținut negăsit")
    if item.url:
        filename = item.url.split("/uploads/")[-1]
        file_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "uploads", filename)
        if os.path.isfile(file_path):
            os.unlink(file_path)
    db.delete(item)
    db.commit()
