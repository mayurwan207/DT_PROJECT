"""
routes/staff.py
---------------
Staff-facing analytics API for MessVerse.

Endpoints
---------
  GET /api/v1/staff/analytics?date=YYYY-MM-DD
      Demand breakdown + expected diner counts + prep quantities +
      waste-reduction estimate + operational badges — per meal for a given date.

  GET /api/v1/staff/feedback-summary
      Aggregated average ratings and ranked tag frequency from the past 7 days.

Analytics formulas (as specified in IDEA.md)
--------------------------------------------
  Expected Diners   = attending + (unsure × 0.5)
  Prep Qty (kg)     = expected_diners × 0.25
  Waste Reduction % = max(0, (1 − expected_diners / MAX_CAPACITY) × 100)

Operational badge thresholds
-----------------------------
  demand_ratio = expected_diners / MAX_CAPACITY

  ≥ 0.80  →  🔥 High Demand   — Cook Full Batch
  0.50–0.79 → ✅ Moderate Demand — Cook Standard Batch
  0.30–0.49 → ⚠️ Low Demand    — Reduce Batch by 20%
  < 0.30   →  🧊 Very Low Demand — Reduce Batch by 40%
"""

import json
import logging
from collections import Counter
from datetime import date as _Date, timedelta, datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Feedback, RSVP, RSVPStatus, MealType

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/staff", tags=["staff"])

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
MAX_CAPACITY:      int   = 500    # Maximum seating / cooking capacity per meal
FOOD_KG_PER_DINER: float = 0.25   # kg of food prepared per expected diner
UNSURE_FACTOR:     float = 0.5    # Fraction of "unsure" RSVPs treated as attending
FEEDBACK_LOOKBACK: int   = 7      # Days of history for the feedback summary

MEAL_ORDER = [MealType.breakfast, MealType.lunch, MealType.dinner]


# ===========================================================================
# Badge logic (pure function — easy to unit-test in isolation)
# ===========================================================================

def _operational_badge(demand_ratio: float) -> str:
    """
    Map the demand ratio (0–1) to a human-readable operational badge.

    Parameters
    ----------
    demand_ratio : float
        expected_diners / MAX_CAPACITY — clamped to [0, 1] by callers.

    Returns
    -------
    str
        Emoji-prefixed badge string consumed by the staff dashboard.
    """
    if demand_ratio >= 0.80:
        return "🔥 High Demand — Cook Full Batch"
    if demand_ratio >= 0.50:
        return "✅ Moderate Demand — Cook Standard Batch"
    if demand_ratio >= 0.30:
        return "⚠️ Low Demand — Reduce Batch by 20%"
    return "🧊 Very Low Demand — Reduce Batch by 40%"


# ===========================================================================
# Response Pydantic models (defined inline to keep the file self-contained)
# ===========================================================================

from pydantic import BaseModel, Field


class MealAnalytics(BaseModel):
    """Analytics row for a single meal slot (breakfast / lunch / dinner)."""

    meal_type:          str   = Field(description="breakfast | lunch | dinner")
    attending:          int   = Field(ge=0, description="RSVPs with status='attending'")
    skipping:           int   = Field(ge=0, description="RSVPs with status='skipping'")
    unsure:             int   = Field(ge=0, description="RSVPs with status='unsure'")
    total_rsvps:        int   = Field(ge=0, description="Total RSVPs submitted for this meal")
    expected_diners:    float = Field(
        description="Projected headcount: attending + (unsure × 0.5)"
    )
    prep_qty_kg:        float = Field(
        description="Recommended food prep in kg: expected_diners × 0.25"
    )
    waste_reduction_pct: float = Field(
        description=(
            "Estimated waste reduction % vs cooking for full capacity: "
            "max(0, (1 − expected_diners / MAX_CAPACITY) × 100)"
        )
    )
    demand_ratio:       float = Field(
        description="expected_diners / MAX_CAPACITY (0–1)"
    )
    badge:              str   = Field(description="Operational action badge for kitchen staff")


class DailyAnalyticsOut(BaseModel):
    """Full analytics response for a single calendar date."""

    query_date:   str              = Field(description="Date queried (YYYY-MM-DD)")
    max_capacity: int              = Field(description="Assumed canteen max capacity")
    meals:        List[MealAnalytics]


# ---------------------------------------------------------------------------

class TagFrequency(BaseModel):
    tag:   str = Field(description="Feedback tag keyword")
    count: int = Field(ge=0, description="How many times this tag appeared in the window")


class FeedbackSummaryOut(BaseModel):
    """Aggregated feedback analytics for the past 7 days."""

    window_days:    int              = Field(description="Number of days looked back")
    from_date:      str              = Field(description="Start of window (inclusive, YYYY-MM-DD)")
    to_date:        str              = Field(description="End of window (inclusive, YYYY-MM-DD)")
    total_reviews:  int              = Field(ge=0)
    average_rating: Optional[float] = Field(
        default=None,
        description="Mean rating across all reviews in the window (null if no reviews)",
    )
    rating_breakdown: dict           = Field(
        description="Count per star level, e.g. {1: 2, 2: 0, 3: 5, 4: 10, 5: 3}"
    )
    top_tags:       List[TagFrequency] = Field(
        description="Tags ranked by frequency (descending), top 10 shown"
    )


# ===========================================================================
# GET /api/v1/staff/analytics?date=YYYY-MM-DD
# ===========================================================================

@router.get(
    "/analytics",
    response_model=DailyAnalyticsOut,
    summary="Daily demand analytics for kitchen staff",
    response_description=(
        "Per-meal RSVP breakdown, expected diner count, prep quantities, "
        "waste-reduction estimate, and an operational badge."
    ),
)
def daily_analytics(
    date: _Date = Query(
        ...,
        description="Target date in YYYY-MM-DD format",
        examples=["2026-10-15"],
    ),
    db: Session = Depends(get_db),
) -> DailyAnalyticsOut:
    """
    Compute per-meal demand analytics for **one calendar date**.

    ### Formulas applied

    | Metric | Formula |
    |---|---|
    | Expected Diners | `attending + (unsure × 0.5)` |
    | Prep Qty (kg) | `expected_diners × 0.25` |
    | Waste Reduction % | `max(0, (1 − expected_diners / 500) × 100)` |
    | Demand Ratio | `expected_diners / 500` |

    ### Badge thresholds

    | Demand Ratio | Badge |
    |---|---|
    | ≥ 0.80 | 🔥 High Demand — Cook Full Batch |
    | 0.50–0.79 | ✅ Moderate Demand — Cook Standard Batch |
    | 0.30–0.49 | ⚠️ Low Demand — Reduce Batch by 20% |
    | < 0.30 | 🧊 Very Low Demand — Reduce Batch by 40% |
    """

    # ── 1. Aggregate RSVP counts per (meal_type, status) in one query ────────
    #    Result: [(meal_type, status, count), ...]
    rows = (
        db.query(
            RSVP.meal_type,
            RSVP.status,
            func.count(RSVP.id).label("cnt"),
        )
        .filter(RSVP.date == date)
        .group_by(RSVP.meal_type, RSVP.status)
        .all()
    )

    # ── 2. Pivot into a nested dict: {meal_type: {status: count}} ────────────
    counts: dict[str, dict[str, int]] = {
        m.value: {s.value: 0 for s in RSVPStatus}
        for m in MealType
    }
    for meal_type, status, cnt in rows:
        # meal_type / status may be enum members or raw strings depending on
        # the SQLite driver — normalise to plain strings for safety
        mt  = meal_type.value  if hasattr(meal_type,  "value") else str(meal_type)
        st  = status.value     if hasattr(status,     "value") else str(status)
        counts[mt][st] = cnt

    # ── 3. Build per-meal analytics ──────────────────────────────────────────
    meal_rows: List[MealAnalytics] = []

    for meal in MEAL_ORDER:
        mt = meal.value
        attending = counts[mt]["attending"]
        skipping  = counts[mt]["skipping"]
        unsure    = counts[mt]["unsure"]
        total     = attending + skipping + unsure

        expected_diners    = attending + unsure * UNSURE_FACTOR
        prep_qty_kg        = round(expected_diners * FOOD_KG_PER_DINER, 2)
        demand_ratio       = min(expected_diners / MAX_CAPACITY, 1.0)
        waste_reduction    = round(max(0.0, (1 - demand_ratio) * 100), 2)

        meal_rows.append(
            MealAnalytics(
                meal_type=mt,
                attending=attending,
                skipping=skipping,
                unsure=unsure,
                total_rsvps=total,
                expected_diners=round(expected_diners, 2),
                prep_qty_kg=prep_qty_kg,
                waste_reduction_pct=waste_reduction,
                demand_ratio=round(demand_ratio, 4),
                badge=_operational_badge(demand_ratio),
            )
        )

    logger.info(
        "Staff analytics computed for date=%s  meals=%d",
        date, len(meal_rows),
    )

    return DailyAnalyticsOut(
        query_date=str(date),
        max_capacity=MAX_CAPACITY,
        meals=meal_rows,
    )


# ===========================================================================
# GET /api/v1/staff/feedback-summary
# ===========================================================================

@router.get(
    "/feedback-summary",
    response_model=FeedbackSummaryOut,
    summary="Feedback summary for the past 7 days",
    response_description=(
        "Average rating, per-star breakdown, and top-10 tags "
        "from all feedback submitted in the last 7 days."
    ),
)
def feedback_summary(db: Session = Depends(get_db)) -> FeedbackSummaryOut:
    """
    Summarise student feedback collected over the past **7 calendar days**.

    Returns:
    - `total_reviews` — how many feedback records were submitted
    - `average_rating` — mean star rating (null if no reviews)
    - `rating_breakdown` — count of reviews per star level (1–5)
    - `top_tags` — tag keywords ranked by frequency, top 10 shown
    """
    today     = _Date.today()
    from_date = today - timedelta(days=FEEDBACK_LOOKBACK - 1)   # inclusive

    # ── 1. Pull all feedback in the window ───────────────────────────────────
    feedbacks = (
        db.query(Feedback.rating, Feedback.tags)
        .filter(Feedback.date >= from_date, Feedback.date <= today)
        .all()
    )

    total_reviews = len(feedbacks)

    # ── 2. Rating stats ───────────────────────────────────────────────────────
    rating_breakdown: dict[int, int] = {star: 0 for star in range(1, 6)}
    rating_sum = 0

    for rating, _ in feedbacks:
        if rating in rating_breakdown:
            rating_breakdown[rating] += 1
            rating_sum += rating

    average_rating: Optional[float] = (
        round(rating_sum / total_reviews, 2) if total_reviews else None
    )

    # ── 3. Tag frequency ─────────────────────────────────────────────────────
    tag_counter: Counter = Counter()

    for _, tags_json in feedbacks:
        if not tags_json:
            continue
        try:
            tags: list = json.loads(tags_json)
        except (json.JSONDecodeError, TypeError):
            tags = []
        tag_counter.update(t for t in tags if isinstance(t, str))

    top_tags: List[TagFrequency] = [
        TagFrequency(tag=tag, count=count)
        for tag, count in tag_counter.most_common(10)
    ]

    logger.info(
        "Feedback summary: window=%s–%s  reviews=%d  avg_rating=%s",
        from_date, today, total_reviews, average_rating,
    )

    return FeedbackSummaryOut(
        window_days=FEEDBACK_LOOKBACK,
        from_date=str(from_date),
        to_date=str(today),
        total_reviews=total_reviews,
        average_rating=average_rating,
        rating_breakdown={str(k): v for k, v in rating_breakdown.items()},
        top_tags=top_tags,
    )
