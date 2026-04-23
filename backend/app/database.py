from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


def _async_url(url: str) -> str:
    """Ensure the SQLite URL uses the aiosqlite async driver."""
    if url.startswith("sqlite://") and "+aiosqlite" not in url:
        return url.replace("sqlite://", "sqlite+aiosqlite://", 1)
    return url


engine = create_async_engine(_async_url(settings.database_url), echo=False)

# Enable WAL mode on every new connection for better concurrent read performance
@event.listens_for(engine.sync_engine, "connect")
def set_wal_mode(dbapi_conn, _connection_record):
    dbapi_conn.execute("PRAGMA journal_mode=WAL")


AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
