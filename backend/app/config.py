from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/stonetrail"
    cors_origins: str = "https://stonetrailvillas.com,https://www.stonetrailvillas.com"
    openai_api_key: str = ""
    openai_model: str = "gpt-4.1-mini"
    cloudbeds_api_key: str = ""
    cloudbeds_property_id: str = ""
    cloudbeds_base_url: str = "https://api.cloudbeds.com/api/v1.1"
    booking_engine_url: str = "https://us2.cloudbeds.com/reservation/XsjT4D"
    whatsapp_access_token: str = ""
    whatsapp_phone_number_id: str = ""
    whatsapp_staff_numbers: str = ""
    whatsapp_verify_token: str = ""
    whatsapp_app_secret: str = ""
    whatsapp_guest_number: str = ""
    hotel_phone: str = ""
    admin_api_key: str = ""
    max_history_messages: int = 20

    @field_validator("database_url")
    @classmethod
    def normalize_db_url(cls, value: str) -> str:
        if value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+asyncpg://", 1)
        if value.startswith("postgres://"):
            return value.replace("postgres://", "postgresql+asyncpg://", 1)
        return value

settings = Settings()
