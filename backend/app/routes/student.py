"""
routes/student.py
-----------------
Student-facing API endpoints for MessVerse.

Endpoints
---------
  POST /api/v1/rsvp              — Submit or update a meal RSVP
  POST /api/v1/streak/check-in   — Record a clean-plate check-in (+50 XP, +1 streak)
  POST /api/v1/feedback          — Submit a meal rating + tags + comment (+1 review_count)
  GET  /api/v1/leaderboard       — Top-10 Zero-Waste Champions & Top-10 Review Superstars

Business rules
--------------
  • RSVP is upserted: one record per (student_id, meal_type, date).
    If one already exists the status is updated in-place.
  • A student may only check in once per calendar day; duplicate attempts
    return 409 Conflict.
  • A check-in with verified_clean_plate=True awards 50 XP and bumps
    streak_count. A non-clean plate resets streak_count to 0.
  • Every accepted feedback submission increments review_count by 1.
  • The leaderboard returns two ranked lists in a single response.
"""

import json
import logging
from datetime import date as _Date, timezone, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Feedback, RSVP, StreakCheckIn, User
from ..schemas import (
    FeedbackCreate,
    FeedbackOut,
    RSVPCreate,
    RSVPOut,
    StreakCheckInCreate,
    StreakCheckInOut,
)
from typing import List

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["student"])

# ---------------------------------------------------------------------------
# XP reward constants
# ---------------------------------------------------------------------------
XP_CLEAN_PLATE = 50


# ===========================================================================
# Helper: resolve & validate student
# ===========================================================================

def _get_student(student_id: int, db: Session) -> User:
    """
    Fetch a User by id and assert they exist and hold the 'student' role.
    Raises 404 or 403 respectively on failure.
    """
    user = db.get(User, student_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with id={student_id} not found.",
        )
    if user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can perform this action.",
        )
    return user


# ===========================================================================
# POST /api/v1/rsvp
# ===========================================================================

@router.post(
    "/rsvp",
    response_model=RSVPOut,
    status_code=status.HTTP_200_OK,
    summary="Submit or update a meal RSVP",
    response_description="The created or updated RSVP record.",
)
def upsert_rsvp(payload: RSVPCreate, db: Session = Depends(get_db)) -> RSVPOut:
    """
    Submit **or** update a student's RSVP for a specific meal and date.

    - If no RSVP exists for `(student_id, meal_type, date)` a new record is
      created and **HTTP 200** is returned.
    - If one already exists its `status` is updated in-place (upsert).

    The response always reflects the final persisted state.
    """
    student = _get_student(payload.student_id, db)

    meal_date = payload.meal_date  # internal field name (alias="date")

    # Look for an existing RSVP for this student/meal/date combination
    existing: RSVP | None = (
        db.query(RSVP)
        .filter(
            RSVP.student_id == payload.student_id,
            RSVP.meal_type  == payload.meal_type,
            RSVP.date       == meal_date,
        )
        .first()
    )

    if existing:
        existing.status = payload.status
        db.commit()
        db.refresh(existing)
        rsvp = existing
        logger.info(
            "RSVP updated: student=%d meal=%s date=%s status=%s",
            payload.student_id, payload.meal_type, meal_date, payload.status,
        )
    else:
        rsvp = RSVP(
            student_id=payload.student_id,
            meal_type=payload.meal_type,
            date=meal_date,
            status=payload.status,
        )
        db.add(rsvp)
        db.commit()
        db.refresh(rsvp)
        logger.info(
            "RSVP created: student=%d meal=%s date=%s status=%s",
            payload.student_id, payload.meal_type, meal_date, payload.status,
        )

    # Build RSVPOut manually to handle the meal_date ↔ date alias
    return RSVPOut(
        id=rsvp.id,
        student_id=rsvp.student_id,
        meal_type=rsvp.meal_type,
        meal_date=rsvp.date,
        status=rsvp.status,
    )


# ===========================================================================
# POST /api/v1/streak/check-in
# ===========================================================================

@router.post(
    "/streak/check-in",
    response_model=StreakCheckInOut,
    status_code=status.HTTP_201_CREATED,
    summary="Record a daily clean-plate check-in",
    response_description="The new check-in record with updated XP and streak.",
)
def streak_check_in(
    payload: StreakCheckInCreate, db: Session = Depends(get_db)
) -> StreakCheckInOut:
    """
    Record a student's clean-plate check-in for today.

    **Gamification rules applied atomically:**
    - `verified_clean_plate = True`  → +50 XP, +1 `streak_count`
    - `verified_clean_plate = False` → streak resets to 0 (no XP awarded)
    - Duplicate check-in for the same calendar day → **409 Conflict**
    """
    student = _get_student(payload.student_id, db)

    checkin_date = payload.checkin_date  # internal field name (alias="date")

    # Guard: one check-in per student per day
    duplicate = (
        db.query(StreakCheckIn)
        .filter(
            StreakCheckIn.student_id == payload.student_id,
            StreakCheckIn.date       == checkin_date,
        )
        .first()
    )
    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Check-in for student {payload.student_id} on {checkin_date} already recorded.",
        )

    # Persist the check-in
    checkin = StreakCheckIn(
        student_id=payload.student_id,
        date=checkin_date,
        verified_clean_plate=payload.verified_clean_plate,
    )
    db.add(checkin)

    # Apply gamification
    if payload.verified_clean_plate:
        student.xp_points    += XP_CLEAN_PLATE
        student.streak_count += 1
        logger.info(
            "Clean plate! student=%d new_xp=%d new_streak=%d",
            student.id, student.xp_points, student.streak_count,
        )
    else:
        student.streak_count = 0
        logger.info("Streak reset for student=%d (no clean plate)", student.id)

    db.commit()
    db.refresh(checkin)

    return StreakCheckInOut(
        id=checkin.id,
        student_id=checkin.student_id,
        checkin_date=checkin.date,
        verified_clean_plate=checkin.verified_clean_plate,
    )


# ===========================================================================
# POST /api/v1/feedback
# ===========================================================================

@router.post(
    "/feedback",
    response_model=FeedbackOut,
    status_code=status.HTTP_201_CREATED,
    summary="Submit meal feedback",
    response_description="The persisted feedback record.",
)
def submit_feedback(
    payload: FeedbackCreate, db: Session = Depends(get_db)
) -> FeedbackOut:
    """
    Submit a post-meal rating (1–5), optional keyword tags, and an
    optional free-text comment.

    - Increments the student's `review_count` by 1 on every accepted submission.
    - Tags are stored as a JSON string in the DB and returned as a list.
    """
    student = _get_student(payload.student_id, db)

    feedback = Feedback(
        student_id=payload.student_id,
        rating=payload.rating,
        tags=json.dumps(payload.tags),          # list → JSON string for storage
        comment=payload.comment,
        date=payload.feedback_date,             # internal field (alias="date")
    )
    db.add(feedback)

    # Gamification: increment review counter
    student.review_count += 1

    db.commit()
    db.refresh(feedback)

    logger.info(
        "Feedback submitted: student=%d rating=%d review_count=%d",
        student.id, payload.rating, student.review_count,
    )

    return FeedbackOut(
        id=feedback.id,
        student_id=feedback.student_id,
        rating=feedback.rating,
        tags=payload.tags,                      # already a list; skip re-parsing
        comment=feedback.comment,
        feedback_date=feedback.date,
    )


# ===========================================================================
# GET /api/v1/leaderboard
# ===========================================================================

# Response shape for the dual-leaderboard endpoint
from pydantic import BaseModel, Field as PField

class LeaderboardRow(BaseModel):
    rank:         int
    student_id:   int
    name:         str
    xp_points:    int
    streak_count: int
    review_count: int


class DualLeaderboardOut(BaseModel):
    zero_waste_champions: List[LeaderboardRow] = PField(
        description="Top 10 students ranked by streak_count (consecutive clean-plate days)"
    )
    review_superstars: List[LeaderboardRow] = PField(
        description="Top 10 students ranked by review_count (total feedback submissions)"
    )


@router.get(
    "/leaderboard",
    response_model=DualLeaderboardOut,
    status_code=status.HTTP_200_OK,
    summary="Fetch dual leaderboard",
    response_description=(
        "Two ranked lists: Zero-Waste Champions (by streak) "
        "and Review Superstars (by review count)."
    ),
)
def get_leaderboard(db: Session = Depends(get_db)) -> DualLeaderboardOut:
    """
    Returns **two** top-10 leaderboards in one request:

    | Board | Ranked by | Tiebreak |
    |---|---|---|
    | Zero-Waste Champions | `streak_count` DESC | `xp_points` DESC |
    | Review Superstars | `review_count` DESC | `xp_points` DESC |

    Only users with `role = 'student'` appear on the boards.
    """
    def _build_rows(users: List[User]) -> List[LeaderboardRow]:
        return [
            LeaderboardRow(
                rank=idx + 1,
                student_id=u.id,
                name=u.name,
                xp_points=u.xp_points,
                streak_count=u.streak_count,
                review_count=u.review_count,
            )
            for idx, u in enumerate(users)
        ]

    # --- Zero-Waste Champions: top 10 by streak_count ---
    streak_leaders: List[User] = (
        db.query(User)
        .filter(User.role == "student")
        .order_by(User.streak_count.desc(), User.xp_points.desc())
        .limit(10)
        .all()
    )

    # --- Review Superstars: top 10 by review_count ---
    review_leaders: List[User] = (
        db.query(User)
        .filter(User.role == "student")
        .order_by(User.review_count.desc(), User.xp_points.desc())
        .limit(10)
        .all()
    )

    return DualLeaderboardOut(
        zero_waste_champions=_build_rows(streak_leaders),
        review_superstars=_build_rows(review_leaders),
    )
