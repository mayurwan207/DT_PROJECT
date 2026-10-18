"""
database.py
-----------
SQLAlchemy engine + session factory for MessVerse.
Uses a local SQLite file (messverse.db) during development.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# ---------------------------------------------------------------------------
# Database URL
# ---------------------------------------------------------------------------
DATABASE_URL = "sqlite:///./messverse.db"

# ---------------------------------------------------------------------------
# Engine
# connect_args is SQLite-specific: allows the same connection to be used
# across multiple threads (required by FastAPI's thread-pool workers).
# ---------------------------------------------------------------------------
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,          # Set True locally to log all SQL statements
)

# ---------------------------------------------------------------------------
# Session factory
# autocommit=False  → explicit transaction control
# autoflush=False   → no implicit flushes before queries (safer for tests)
# ---------------------------------------------------------------------------
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# ---------------------------------------------------------------------------
# Declarative Base
# All ORM models inherit from this single Base so that
# Base.metadata.create_all(engine) can bootstrap the entire schema.
# ---------------------------------------------------------------------------
class Base(DeclarativeBase):
    pass


# ---------------------------------------------------------------------------
# FastAPI dependency — yields a DB session and guarantees cleanup
# ---------------------------------------------------------------------------
def get_db():
    """
    Dependency to be injected into FastAPI route handlers via Depends(get_db).
    Ensures the session is always closed after the request, even on errors.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
