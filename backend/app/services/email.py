import logging
import resend
from app.config import settings

logger = logging.getLogger(__name__)
resend.api_key = settings.RESEND_API_KEY


def send_reset_email(to_email: str, name: str, code: str) -> bool:
    try:
        resend.Emails.send({
            "from": settings.RESEND_FROM_EMAIL,
            "to": [to_email],
            "subject": "Codul tău de resetare parolă SoulSide",
            "html": f"""
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0f0f1a; color: #e2e8f0; padding: 40px; border-radius: 16px;">
                <h1 style="color: #a78bfa; margin-bottom: 8px;">SoulSide</h1>
                <p style="color: #94a3b8; margin-bottom: 32px;">Companionul tău AI pentru sănătate mentală</p>
                <p>Bună, <strong>{name}</strong>!</p>
                <p>Codul tău de resetare a parolei este:</p>
                <div style="background: #1e1b4b; border: 1px solid #4c1d95; border-radius: 12px; padding: 28px; text-align: center; margin: 24px 0;">
                    <span style="font-size: 42px; font-weight: bold; letter-spacing: 12px; color: #a78bfa;">{code}</span>
                </div>
                <p style="color: #94a3b8; font-size: 14px;">Codul expiră în <strong>15 minute</strong>. Dacă nu ai solicitat resetarea, ignoră acest email.</p>
                <hr style="border-color: #1e1b4b; margin: 32px 0;" />
                <p style="color: #475569; font-size: 12px;">Nu distribui acest cod nimănui.</p>
            </div>
            """,
        })
        return True
    except Exception as e:
        logger.error("Failed to send email to %s: %s", to_email, e)
        return False


def send_otp_email(to_email: str, name: str, code: str) -> bool:
    try:
        resend.Emails.send({
            "from": settings.RESEND_FROM_EMAIL,
            "to": [to_email],
            "subject": "Codul tău de verificare SoulSide",
            "html": f"""
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0f0f1a; color: #e2e8f0; padding: 40px; border-radius: 16px;">
                <h1 style="color: #a78bfa; margin-bottom: 8px;">SoulSide</h1>
                <p style="color: #94a3b8; margin-bottom: 32px;">Companionul tău AI pentru sănătate mentală</p>
                <p>Bună, <strong>{name}</strong>!</p>
                <p>Codul tău de verificare este:</p>
                <div style="background: #1e1b4b; border: 1px solid #4c1d95; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                    <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #a78bfa;">{code}</span>
                </div>
                <p style="color: #94a3b8; font-size: 14px;">Codul expiră în <strong>10 minute</strong>. Nu îl distribui nimănui.</p>
                <hr style="border-color: #1e1b4b; margin: 32px 0;" />
                <p style="color: #475569; font-size: 12px;">Dacă nu ai solicitat acest cod, ignoră acest email.</p>
            </div>
            """,
        })
        return True
    except Exception as e:
        logger.error("Failed to send email to %s: %s", to_email, e)
        return False
