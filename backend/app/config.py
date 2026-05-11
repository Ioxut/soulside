from pydantic_settings import BaseSettings
from functools import lru_cache


_WEAK_JWT_DEFAULTS = {
    "change-me-in-production",
    "your-super-secret-key-change-in-production",
    "secret",
}


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://soulside:soulside@localhost:5432/soulside"

    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "openai/gpt-oss-120b"

    RESEND_API_KEY: str = ""
    RESEND_FROM_EMAIL: str = "SoulSide <noreply@yourdomain.com>"

    FRONTEND_URL: str = "http://localhost:3000"
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"

    def validate_production(self) -> None:
        if self.ENVIRONMENT != "production":
            return
        if self.JWT_SECRET_KEY in _WEAK_JWT_DEFAULTS or len(self.JWT_SECRET_KEY) < 32:
            raise RuntimeError(
                "JWT_SECRET_KEY is insecure. Set a strong random value (>=32 chars) in production."
            )
        if not self.GROQ_API_KEY:
            raise RuntimeError("GROQ_API_KEY must be set in production.")
        if not self.RESEND_API_KEY:
            raise RuntimeError("RESEND_API_KEY must be set in production.")


@lru_cache
def get_settings() -> Settings:
    s = Settings()
    s.validate_production()
    return s


settings = get_settings()
