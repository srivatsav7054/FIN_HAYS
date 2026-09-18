"""GET/POST /api/v1/user/{user_id}/profile — user profile CRUD."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.models.schemas import UserProfile
from app.models.database import get_db, UserProfileDB

router = APIRouter(prefix="/api/v1/user", tags=["User"])


@router.get("/{user_id}/profile", response_model=UserProfile)
def get_profile(user_id: str, db: Session = Depends(get_db)):
    """Retrieve a user profile by ID."""
    profile = db.query(UserProfileDB).filter(UserProfileDB.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")
    return UserProfile(
        user_id=profile.user_id,
        name=profile.name,
        preferred_language=profile.preferred_language,
        phone_number=profile.phone_number,
        monthly_income=profile.monthly_income,
        monthly_expenses=profile.monthly_expenses,
        savings_goal=profile.savings_goal,
    )


@router.post("/{user_id}/profile", response_model=UserProfile)
def upsert_profile(user_id: str, body: UserProfile, db: Session = Depends(get_db)):
    """Create or update a user profile."""
    existing = db.query(UserProfileDB).filter(UserProfileDB.user_id == user_id).first()
    if existing:
        existing.name = body.name
        existing.preferred_language = body.preferred_language
        existing.phone_number = body.phone_number
        existing.monthly_income = body.monthly_income
        existing.monthly_expenses = body.monthly_expenses
        existing.savings_goal = body.savings_goal
    else:
        existing = UserProfileDB(
            user_id=user_id,
            name=body.name,
            preferred_language=body.preferred_language,
            phone_number=body.phone_number,
            monthly_income=body.monthly_income,
            monthly_expenses=body.monthly_expenses,
            savings_goal=body.savings_goal,
        )
        db.add(existing)
    db.commit()
    db.refresh(existing)
    return UserProfile(
        user_id=existing.user_id,
        name=existing.name,
        preferred_language=existing.preferred_language,
        phone_number=existing.phone_number,
        monthly_income=existing.monthly_income,
        monthly_expenses=existing.monthly_expenses,
        savings_goal=existing.savings_goal,
    )
