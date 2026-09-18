"""Pydantic schemas — the API contract.

These shapes are locked and must not change without coordinating with the
frontend team (they are already building against them).
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


# ── Agent ────────────────────────────────────────────────────────────────

class AgentQueryRequest(BaseModel):
    session_id: str
    text: str
    language: str = "en"


class AgentQueryResponse(BaseModel):
    response_text: str
    sources: list[str] = []
    flagged: bool = False


# ── User Profile ─────────────────────────────────────────────────────────

class UserProfile(BaseModel):
    user_id: str
    name: str = ""
    preferred_language: str = "en"
    phone_number: str = ""
    monthly_income: float = 0.0
    monthly_expenses: float = 0.0
    savings_goal: float = 0.0


# ── Transactions ─────────────────────────────────────────────────────────

class TransactionType(str, Enum):
    income = "income"
    expense = "expense"


class Transaction(BaseModel):
    id: str = ""
    date: str = ""  # ISO date string
    type: TransactionType
    category: str = ""
    amount: float = 0.0
    note: str = ""


# ── Session History ──────────────────────────────────────────────────────

class ConversationTurn(BaseModel):
    role: str  # "user" | "assistant"
    text: str
    timestamp: str = ""
    flagged: bool = False


class SessionHistory(BaseModel):
    session_id: str
    turns: list[ConversationTurn] = []
