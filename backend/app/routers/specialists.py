from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.doctor import Doctor
from app.models.specialist import SpecialistRequest
from app.schemas.doctor import DoctorCreate, DoctorUpdate, DoctorOut, SpecialistRequestCreate, SpecialistRequestOut, SpecialistRequestStatusUpdate, RequestStatus
from app.models.notification import Notification
from app.deps import get_current_user, get_admin_user

router = APIRouter(prefix="/specialists", tags=["specialists"])


@router.get("/doctors", response_model=list[DoctorOut])
def get_doctors(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Doctor).order_by(Doctor.created_at.desc()).all()


@router.get("/doctors/{doctor_id}", response_model=DoctorOut)
def get_doctor(doctor_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Specialist negăsit")
    return doctor


@router.post("/requests", response_model=SpecialistRequestOut, status_code=201)
def create_request(
    data: SpecialistRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.doctor_id:
        doctor = db.query(Doctor).filter(Doctor.id == data.doctor_id).first()
        if not doctor:
            raise HTTPException(status_code=404, detail="Specialist negăsit")

    req = SpecialistRequest(user_id=current_user.id, **data.model_dump())
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


@router.get("/requests/my", response_model=list[SpecialistRequestOut])
def get_my_requests(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    reqs = db.query(SpecialistRequest).filter(SpecialistRequest.user_id == current_user.id).all()
    result = []
    for r in reqs:
        d = SpecialistRequestOut.model_validate(r)
        if r.doctor:
            d.doctor_name = r.doctor.name
        result.append(d)
    return result


@router.post("/doctors", response_model=DoctorOut, status_code=201)
def create_doctor(data: DoctorCreate, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    doctor = Doctor(**data.model_dump())
    db.add(doctor)
    db.commit()
    db.refresh(doctor)
    return doctor


@router.patch("/doctors/{doctor_id}", response_model=DoctorOut)
def update_doctor(doctor_id: int, data: DoctorUpdate, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Specialist negăsit")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(doctor, field, value)
    db.commit()
    db.refresh(doctor)
    return doctor


@router.delete("/doctors/{doctor_id}", status_code=204)
def delete_doctor(doctor_id: int, db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Specialist negăsit")
    db.delete(doctor)
    db.commit()


@router.get("/requests", response_model=list[SpecialistRequestOut])
def get_all_requests(db: Session = Depends(get_db), _: User = Depends(get_admin_user)):
    reqs = db.query(SpecialistRequest).order_by(SpecialistRequest.created_at.desc()).all()
    result = []
    for r in reqs:
        d = SpecialistRequestOut.model_validate(r)
        if r.doctor:
            d.doctor_name = r.doctor.name
        result.append(d)
    return result


@router.patch("/requests/{request_id}", response_model=SpecialistRequestOut)
def update_request_status(
    request_id: int,
    data: SpecialistRequestStatusUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    req = db.query(SpecialistRequest).filter(SpecialistRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Cerere negăsită")
    req.status = data.status.value
    db.commit()

    status_labels = {"approved": "aprobată", "rejected": "respinsă", "pending": "în așteptare"}
    notif = Notification(
        user_id=req.user_id,
        title="Cerere consultație actualizată",
        body=f"Cererea ta de consultație din {req.preferred_date} a fost {status_labels[data.status]}.",
    )
    db.add(notif)
    db.commit()
    db.refresh(req)
    return req
