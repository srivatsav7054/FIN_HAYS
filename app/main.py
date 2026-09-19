"""SH-105 — AI Financial Empowerment for Rural Women

FastAPI application entry point.
Run with: uvicorn app.main:app --reload
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

from app.models.database import init_db
from app.rag.retriever import seed_database
from app.routers import agent, user, transactions, session, voice
from app.telephony.audiosocket import start_audiosocket_server
from app.config import reset_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    # Reset cached settings and API clients so fresh .env values are always picked up
    reset_settings()
    from app.services.orchestrator import reset_client as reset_llm_client
    from app.telephony.stt import reset_client as reset_stt_client
    reset_llm_client()
    reset_stt_client()

    # Create tables on startup
    init_db()
    print("[OK] Database initialized (SQLite)")
    
    # Seed RAG database on startup
    seed_database()
    print("[OK] RAG ChromaDB initialized and seeded")

    # Start AudioSocket TCP server for Asterisk integration
    audiosocket_port = int(os.environ.get("AUDIOSOCKET_PORT", "9092"))
    audiosocket_server = await start_audiosocket_server(
        host="0.0.0.0", port=audiosocket_port
    )

    print("[OK] SH-105 backend ready -- Step 6 (Full pipeline + AudioSocket)")
    yield
    # Shutdown: close AudioSocket server
    audiosocket_server.close()
    await audiosocket_server.wait_closed()


app = FastAPI(
    title="SH-105 — AI Financial Empowerment for Rural Women",
    description=(
        "Voice-first conversational AI agent for rural women and "
        "low-financial-literacy users. Provides multilingual financial "
        "literacy guidance via phone calls and text queries."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

# ── CORS — allow all origins (hackathon build, localhost only) ───────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Mount routers ────────────────────────────────────────────────────────
app.include_router(agent.router)
app.include_router(user.router)
app.include_router(transactions.router)
app.include_router(session.router)
app.include_router(voice.router)


@app.get("/", tags=["Health"])
def health_check():
    """Simple health check endpoint."""
    return {"status": "ok", "project": "SH-105", "step": "6 — AudioSocket integrated"}
