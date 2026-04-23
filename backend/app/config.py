from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    openai_api_key: str
    database_url: str = "sqlite+aiosqlite:////app/data/database.db"
    upload_dir: str = "/app/uploads"
    max_file_size_mb: int = 50
    max_pages: int = 100

    @property
    def max_file_size_bytes(self) -> int:
        return self.max_file_size_mb * 1024 * 1024

    @property
    def sync_database_url(self) -> str:
        """Sync URL for Alembic migrations (strips +aiosqlite driver)."""
        return self.database_url.replace("sqlite+aiosqlite", "sqlite")


settings = Settings()
