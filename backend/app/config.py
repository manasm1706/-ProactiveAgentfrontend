from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ai_provider: str = "groq"
    groq_api_key: str = ""
    model_name: str = "openai/gpt-oss-120b"
    database_url: str = "sqlite:///./ps22.db"
    dataset_path: str = ""
    mcp_server_url: str = "http://127.0.0.1:8001/mcp"
    mcp_host: str = "127.0.0.1"
    mcp_port: int = 8001
    start_mcp_server: bool = True
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()


def get_cors_origins() -> list[str]:
    return [origin.strip().rstrip("/") for origin in settings.cors_origins.split(",") if origin.strip()]
