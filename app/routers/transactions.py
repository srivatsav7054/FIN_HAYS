"""GET/POST /api/v1/user/{user_id}/transactions — transaction CRUD."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.models.schemas import Transaction
from app.models.database import get_db, TransactionDB

router = APIRouter(prefix="/api/v1/user", tags=["Transactions"])


@router.get("/{user_id}/transactions", response_model=list[Transaction])
def get_transactions(user_id: str, db: Session = Depends(get_db)):
    """List all transactions for a user."""
    rows = (
        db.query(TransactionDB)
        .filter(TransactionDB.user_id == user_id)
        .order_by(TransactionDB.date.desc())
        .all()
    )
    return [
        Transaction(
            id=r.id,
            date=r.date,
            type=r.type,
            category=r.category,
            amount=r.amount,
            note=r.note,
        )
        for r in rows
    ]


@router.post("/{user_id}/transactions", response_model=Transaction)
def add_transaction(user_id: str, body: Transaction, db: Session = Depends(get_db)):
    """Add a new transaction for a user."""
    tx_id = body.id or str(uuid.uuid4())
    row = TransactionDB(
        id=tx_id,
        user_id=user_id,
        date=body.date,
        type=body.type.value,
        category=body.category,
        amount=body.amount,
        note=body.note,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return Transaction(
        id=row.id,
        date=row.date,
        type=row.type,
        category=row.category,
        amount=row.amount,
        note=row.note,
    )
