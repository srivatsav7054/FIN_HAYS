"""SQLAlchemy models and database setup — SQLite via aiosqlite.

We use async SQLAlchemy so FastAPI endpoint handlers stay non-blocking.
The database file (sh105.db) is created automatically on first run.
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    String,
    Boolean,
    Text,
    create_engine,
)
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import get_settings

Base = declarative_base()


# ── ORM Models ───────────────────────────────────────────────────────────

class UserProfileDB(Base):
    __tablename__ = "user_profiles"

    user_id = Column(String, primary_key=True)
    name = Column(String, default="")
    preferred_language = Column(String, default="en")
    phone_number = Column(String, default="")
    monthly_income = Column(Float, default=0.0)
    monthly_expenses = Column(Float, default=0.0)
    savings_goal = Column(Float, default=0.0)


class TransactionDB(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True)
    user_id = Column(String, index=True)
    date = Column(String, default="")
    type = Column(String, default="expense")  # "income" | "expense"
    category = Column(String, default="")
    amount = Column(Float, default=0.0)
    note = Column(String, default="")


class ConversationTurnDB(Base):
    __tablename__ = "conversation_turns"

    id = Column(String, primary_key=True)
    session_id = Column(String, index=True)
    role = Column(String)  # "user" | "assistant"
    text = Column(Text)
    timestamp = Column(String, default="")
    flagged = Column(Boolean, default=False)
    sources = Column(Text, default="[]")  # JSON-encoded list of source strings


# ── Engine / Session Factory ─────────────────────────────────────────────

# For Step 1 we use synchronous SQLite — simple, zero config.
# We'll move to async (aiosqlite) when the async endpoints need it.
_settings = get_settings()
_db_url = _settings.database_url.replace("sqlite+aiosqlite", "sqlite")

engine = create_engine(_db_url, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def init_db() -> None:
    """Create all tables if they don't already exist."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """FastAPI dependency that yields a DB session and closes it after."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
