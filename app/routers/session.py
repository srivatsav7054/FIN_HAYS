"""GET /api/v1/session/{session_id}/history — conversation audit trail."""

from __future__ import annotations

import json

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.models.schemas import SessionHistory, ConversationTurn
from app.models.database import get_db, ConversationTurnDB

router = APIRouter(prefix="/api/v1/session", tags=["Session"])


@router.get("/{session_id}/history", response_model=SessionHistory)
def get_session_history(session_id: str, db: Session = Depends(get_db)):
    """Return the full conversation log for a session — audit trail."""
    turns = (
        db.query(ConversationTurnDB)
        .filter(ConversationTurnDB.session_id == session_id)
        .order_by(ConversationTurnDB.timestamp)
        .all()
    )
    return SessionHistory(
        session_id=session_id,
        turns=[
            ConversationTurn(
                role=t.role,
                text=t.text,
                timestamp=t.timestamp,
                flagged=t.flagged,
            )
            for t in turns
        ],
    )
