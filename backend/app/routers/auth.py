import random
import string
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, OTPToken
from app.schemas.user import (
    UserRegister, UserLogin, OTPVerify, UserOut, UserUpdate,
    ForgotPasswordRequest, ResetPasswordRequest, VerifyResetCodeRequest, ChangePasswordRequest,
    ResendOTPRequest,
)
from app.utils.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
)
from app.services.email import send_otp_email, send_reset_email
from app.deps import get_current_user
from app.config import settings
from app.limiter import limiter

router = APIRouter(prefix="/auth", tags=["auth"])

_MAX_LOGIN_ATTEMPTS = 5
_LOCKOUT_MINUTES = 15
_OTP_EXPIRE_MINUTES = 10


def _issue_otp(db: Session, user: User) -> None:
    """Generate a fresh 6-digit OTP for the user and email it via Resend."""
    code = "".join(random.choices(string.digits, k=6))
    otp = OTPToken(
        user_id=user.id,
        code=code,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=_OTP_EXPIRE_MINUTES),
    )
    db.add(otp)
    db.commit()
    send_otp_email(user.email, user.name, code)


def _set_auth_cookies(response: Response, user: User) -> None:
    is_prod = settings.ENVIRONMENT == "production"
    payload = {"sub": str(user.id), "ver": user.token_version}
    access_token  = create_access_token(payload)
    refresh_token = create_refresh_token(payload)

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=is_prod,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=is_prod,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/",
    )


def _clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(key="access_token",  path="/")
    response.delete_cookie(key="refresh_token", path="/")


@router.post("/register", status_code=status.HTTP_201_CREATED)
@limiter.limit("10/hour")
def register(request: Request, data: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        if existing.is_verified:
            raise HTTPException(status_code=400, detail="Email-ul este deja înregistrat")
        # Account exists but was never verified: refresh credentials and re-send a code.
        existing.name = data.name
        existing.hashed_password = hash_password(data.password)
        db.commit()
        db.refresh(existing)
        user = existing
    else:
        is_first_user = db.query(User).count() == 0
        user = User(
            email=data.email,
            name=data.name,
            hashed_password=hash_password(data.password),
            is_admin=is_first_user,
            is_verified=False,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    _issue_otp(db, user)
    return {"email": user.email, "message": "Cont creat. Verifică email-ul pentru codul de confirmare."}


@router.post("/verify-otp", response_model=UserOut)
@limiter.limit("3/10minutes")
def verify_otp(request: Request, data: OTPVerify, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilizator negăsit")

    otp = (
        db.query(OTPToken)
        .filter(
            OTPToken.user_id == user.id,
            OTPToken.code == data.code,
            OTPToken.used == False,
            OTPToken.expires_at > datetime.now(timezone.utc),
        )
        .first()
    )
    if not otp:
        raise HTTPException(status_code=400, detail="Cod invalid sau expirat")

    otp.used = True
    user.is_verified = True
    db.commit()

    _set_auth_cookies(response, user)
    return user


@router.post("/login", response_model=UserOut)
@limiter.limit("30/hour")
def login(request: Request, data: UserLogin, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()

    if user and user.locked_until and user.locked_until > datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Prea multe încercări eșuate. Încearcă din nou în {_LOCKOUT_MINUTES} minute.",
        )

    if not user or not verify_password(data.password, user.hashed_password):
        if user:
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= _MAX_LOGIN_ATTEMPTS:
                user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=_LOCKOUT_MINUTES)
            db.commit()
        raise HTTPException(status_code=401, detail="Email sau parolă incorectă")

    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Contul nu este verificat. Verifică email-ul.")

    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()

    _set_auth_cookies(response, user)
    return user


@router.post("/refresh", response_model=UserOut)
def refresh(request: Request, response: Response, db: Session = Depends(get_db)):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="Refresh token lipsă")

    payload = decode_token(token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Refresh token invalid")

    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user:
        raise HTTPException(status_code=401, detail="Utilizator negăsit")

    if payload.get("ver", 0) != user.token_version:
        raise HTTPException(status_code=401, detail="Sesiune invalidată")

    _set_auth_cookies(response, user)
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    response: Response,
    _: User = Depends(get_current_user),
):
    _clear_auth_cookies(response)


@router.post("/resend-otp")
@limiter.limit("3/10minutes")
def resend_otp(request: Request, data: ResendOTPRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if user and not user.is_verified:
        _issue_otp(db, user)
    # Generic response — never reveal whether the email exists or is already verified.
    return {"message": "Dacă există un cont neconfirmat, vei primi un cod nou."}


@router.post("/forgot-password")
@limiter.limit("5/15minutes")
def forgot_password(request: Request, data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if user and user.is_verified:
        code = "".join(random.choices(string.digits, k=6))
        user.reset_token = code
        user.reset_token_expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
        user.reset_token_used = False
        db.commit()
        send_reset_email(user.email, user.name, code)
    return {"message": "Dacă email-ul există, vei primi un cod de resetare."}


@router.post("/verify-reset-code")
def verify_reset_code(data: VerifyResetCodeRequest, db: Session = Depends(get_db)):
    user = (
        db.query(User)
        .filter(
            User.email == data.email,
            User.reset_token == data.code,
            User.reset_token_expires_at > datetime.now(timezone.utc),
            User.reset_token_used == False,
        )
        .first()
    )
    if not user:
        raise HTTPException(status_code=400, detail="Cod invalid sau expirat")
    return {"valid": True}


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = (
        db.query(User)
        .filter(
            User.email == data.email,
            User.reset_token == data.code,
            User.reset_token_expires_at > datetime.now(timezone.utc),
        )
        .first()
    )
    if not user:
        raise HTTPException(status_code=400, detail="Cod invalid sau expirat")

    if user.reset_token_used:
        raise HTTPException(status_code=400, detail="Cod invalid sau expirat")

    user.reset_token_used = True
    db.flush()

    user.hashed_password = hash_password(data.new_password)
    user.reset_token = None
    user.reset_token_expires_at = None
    user.token_version += 1
    db.commit()
    return {"message": "Parola a fost resetată cu succes."}


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserOut)
def update_me(
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.name is not None:
        current_user.name = data.name
    if data.avatar_url is not None:
        current_user.avatar_url = data.avatar_url
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    data: ChangePasswordRequest,
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Parolă curentă incorectă")
    if len(data.new_password) < 8:
        raise HTTPException(status_code=400, detail="Parola trebuie să aibă cel puțin 8 caractere")
    current_user.hashed_password = hash_password(data.new_password)
    current_user.token_version += 1
    db.commit()
    _set_auth_cookies(response, current_user)


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_me(
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.delete(current_user)
    db.commit()
    _clear_auth_cookies(response)
