"""POST /api/v1/agent/query — the core orchestrator endpoint.

Step 1: returns mocked responses.
Step 2 onwards: calls the real Groq-based orchestrator with tool-calling.
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.models.schemas import AgentQueryRequest, AgentQueryResponse
from app.models.database import get_db, ConversationTurnDB
from app.services.orchestrator import run_orchestrator

router = APIRouter(prefix="/api/v1/agent", tags=["Agent"])

# ── In-memory session store (keyed by session_id) ───────────────────────
# Stores list of {"role": ..., "text": ...} dicts per session.
_sessions: dict[str, list[dict]] = {}


@router.post("/query", response_model=AgentQueryResponse)
def agent_query(
    req: AgentQueryRequest,
    db: Session = Depends(get_db),
):
    """Handle a user query — text in, text + sources + flag out."""

    now = datetime.now(timezone.utc).isoformat()

    # ── Session resilience: pull prior turns if this session exists ───
    if req.session_id not in _sessions:
        # Check DB for prior turns (handles resumed sessions / network drops)
        prior = (
            db.query(ConversationTurnDB)
            .filter(ConversationTurnDB.session_id == req.session_id)
            .order_by(ConversationTurnDB.timestamp)
            .all()
        )
        _sessions[req.session_id] = [
            {"role": t.role, "text": t.text} for t in prior
        ]

    history = _sessions[req.session_id]

    # ── Run orchestrator (mocked in Step 1, real Groq in Step 2) ─────
    result = run_orchestrator(
        text=req.text,
        language=req.language,
        history=history,
    )

    # ── Persist user turn ────────────────────────────────────────────
    user_turn = ConversationTurnDB(
        id=str(uuid.uuid4()),
        session_id=req.session_id,
        role="user",
        text=req.text,
        timestamp=now,
        flagged=False,
        sources="[]",
    )
    db.add(user_turn)

    # ── Persist assistant turn ───────────────────────────────────────
    assistant_turn = ConversationTurnDB(
        id=str(uuid.uuid4()),
        session_id=req.session_id,
        role="assistant",
        text=result["response_text"],
        timestamp=datetime.now(timezone.utc).isoformat(),
        flagged=result["flagged"],
        sources=json.dumps(result["sources"]),
    )
    db.add(assistant_turn)
    db.commit()

    # ── Update in-memory history ─────────────────────────────────────
    history.append({"role": "user", "text": req.text})
    history.append({"role": "assistant", "text": result["response_text"]})

    return AgentQueryResponse(**result)
