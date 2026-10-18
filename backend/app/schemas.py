"""
schemas.py
----------
Pydantic v2 schemas for MessVerse request/response validation.

Naming convention
-----------------
  <Entity>Base    — shared fields (no id, no computed fields)
  <Entity>Create  — inbound payload for POST requests
  <Entity>Update  — inbound payload for PATCH requests (all fields optional)
  <Entity>Out     — outbound serialisation (includes id, read-only fields)

Special schemas
---------------
  LeaderboardEntry — a single rank row in the XP leaderboard
  LeaderboardOut   — full leaderboard response with metadata
  DemandSummaryOut — staff-facing meal demand aggregation

Notes
-----
* `datetime.date` is aliased to `_Date` to avoid clashing with field names
  called `date` inside Pydantic model bodies (Pydantic v2.12+ raises
  PydanticUserError when a field name shadows its own annotation type).
* `Literal[...]` type aliases are used for enum-like fields instead of
  `Annotated[str, Field(pattern=...)]` which cannot be used as plain type
  aliases in Pydantic v2 class bodies.
"""

import json
from datetime import date as _Date
from typing import Any, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


# ===========================================================================
# Literal type aliases
# ===========================================================================

UserRoleLiteral   = Literal["student", "staff"]
MealTypeLiteral   = Literal["breakfast", "lunch", "dinner"]
RSVPStatusLiteral = Literal["attending", "skipping", "unsure"]


# ===========================================================================
# User schemas
# ===========================================================================

class UserBase(BaseModel):
    name: str             = Field(..., min_length=1, max_length=120, examples=["Aditya Sharma"])
    role: UserRoleLiteral = Field(default="student", examples=["student"])


class UserCreate(UserBase):
    """Payload for POST /users"""
    pass


class UserUpdate(BaseModel):
    """Payload for PATCH /users/{id} — every field is optional."""
    name: Optional[str]             = Field(default=None, min_length=1, max_length=120)
    role: Optional[UserRoleLiteral] = None


class UserOut(UserBase):
    """Serialised user returned by the API."""
    model_config = ConfigDict(from_attributes=True)

    id:           int
    streak_count: int = Field(default=0, ge=0, description="Consecutive clean-plate days")
    review_count: int = Field(default=0, ge=0, description="Total feedback submissions")
    xp_points:    int = Field(default=0, ge=0, description="Cumulative XP earned")


# ===========================================================================
# RSVP schemas
# ===========================================================================

class RSVPBase(BaseModel):
    meal_type:  MealTypeLiteral   = Field(..., examples=["lunch"])
    meal_date:  _Date             = Field(..., alias="date", examples=["2026-10-15"])
    status:     RSVPStatusLiteral = Field(default="unsure", examples=["attending"])

    model_config = ConfigDict(populate_by_name=True)


class RSVPCreate(RSVPBase):
    """Payload for POST /rsvps — student_id resolved from auth context."""
    student_id: int = Field(..., gt=0)


class RSVPUpdate(BaseModel):
    """Payload for PATCH /rsvps/{id}"""
    status:    Optional[RSVPStatusLiteral] = None
    meal_date: Optional[_Date]             = Field(default=None, alias="date")

    model_config = ConfigDict(populate_by_name=True)


class RSVPOut(BaseModel):
    """Serialised RSVP returned by the API."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id:         int
    student_id: int
    meal_type:  str
    meal_date:  _Date = Field(serialization_alias="date")
    status:     str


# ===========================================================================
# Feedback schemas
# ===========================================================================

# Predefined tag vocabulary — kept here for reuse in docs / validation
VALID_TAGS = {
    "tasty", "too_spicy", "too_bland", "good_portion",
    "small_portion", "large_portion", "fresh", "stale",
    "clean_plate", "wasted", "value_for_money", "hygienic",
    "tasteless", "cold", "portion_small", "perfect",
}


class FeedbackBase(BaseModel):
    rating:       int           = Field(..., ge=1, le=5, examples=[4])
    tags:         List[str]     = Field(default_factory=list, examples=[["tasty", "good_portion"]])
    comment:      Optional[str] = Field(default=None, max_length=1000, examples=["Great dal today!"])
    feedback_date: _Date        = Field(..., alias="date", examples=["2026-10-15"])

    model_config = ConfigDict(populate_by_name=True)

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: List[str]) -> List[str]:
        invalid = set(v) - VALID_TAGS
        if invalid:
            raise ValueError(
                f"Unknown tag(s): {invalid}. "
                f"Allowed tags: {sorted(VALID_TAGS)}"
            )
        return v


class FeedbackCreate(FeedbackBase):
    """Payload for POST /feedback"""
    student_id: int = Field(..., gt=0)


class FeedbackUpdate(BaseModel):
    """Payload for PATCH /feedback/{id}"""
    rating:  Optional[int]       = Field(default=None, ge=1, le=5)
    tags:    Optional[List[str]] = None
    comment: Optional[str]       = Field(default=None, max_length=1000)

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v is None:
            return v
        invalid = set(v) - VALID_TAGS
        if invalid:
            raise ValueError(f"Unknown tag(s): {invalid}.")
        return v


class FeedbackOut(BaseModel):
    """
    Serialised feedback response.
    `tags` is stored as a JSON string in the DB; we deserialise it back to a
    list in the `parse_tags_json` validator before Pydantic processes fields.
    """
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id:            int
    student_id:    int
    rating:        int
    tags:          List[str]      = Field(default_factory=list)
    comment:       Optional[str]  = None
    feedback_date: _Date          = Field(serialization_alias="date")

    @model_validator(mode="before")
    @classmethod
    def parse_tags_json(cls, data: Any) -> Any:
        """Convert the raw TEXT column value to a Python list before validation."""
        raw_tags = (
            getattr(data, "tags", None)
            if not isinstance(data, dict)
            else data.get("tags")
        )
        if isinstance(raw_tags, str):
            try:
                parsed = json.loads(raw_tags)
            except (json.JSONDecodeError, TypeError):
                parsed = []
            if isinstance(data, dict):
                data["tags"] = parsed
            else:
                # ORM object → convert to dict for Pydantic
                obj_dict = {
                    col: getattr(data, col)
                    for col in ["id", "student_id", "rating", "comment"]
                }
                obj_dict["feedback_date"] = getattr(data, "date", None)
                obj_dict["tags"] = parsed
                return obj_dict
        return data


# ===========================================================================
# StreakCheckIn schemas
# ===========================================================================

class StreakCheckInBase(BaseModel):
    checkin_date:         _Date = Field(..., alias="date", examples=["2026-10-15"])
    verified_clean_plate: bool  = Field(default=False, examples=[True])

    model_config = ConfigDict(populate_by_name=True)


class StreakCheckInCreate(StreakCheckInBase):
    """Payload for POST /checkins"""
    student_id: int = Field(..., gt=0)


class StreakCheckInUpdate(BaseModel):
    """Payload for PATCH /checkins/{id}"""
    verified_clean_plate: Optional[bool] = None


class StreakCheckInOut(BaseModel):
    """Serialised check-in returned by the API."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id:                   int
    student_id:           int
    checkin_date:         _Date = Field(serialization_alias="date")
    verified_clean_plate: bool


# ===========================================================================
# Leaderboard schemas
# ===========================================================================

class LeaderboardEntry(BaseModel):
    """A single student's rank in the XP leaderboard."""
    model_config = ConfigDict(from_attributes=True)

    rank:         int = Field(..., ge=1, description="Position (1 = top)")
    student_id:   int
    name:         str
    xp_points:    int = Field(..., ge=0)
    streak_count: int = Field(..., ge=0)
    review_count: int = Field(..., ge=0)


class LeaderboardOut(BaseModel):
    """Full leaderboard response with pagination metadata."""
    total:   int                   = Field(..., description="Total number of ranked students")
    page:    int                   = Field(default=1, ge=1)
    limit:   int                   = Field(default=20, ge=1, le=100)
    entries: List[LeaderboardEntry]


# ===========================================================================
# Staff / Demand summary schemas
# ===========================================================================

class MealDemandRow(BaseModel):
    """Expected attendance count for one meal on one date."""
    meal_type:   str
    demand_date: _Date = Field(..., alias="date")
    attending:   int   = Field(..., ge=0, description="Count of 'attending' RSVPs")
    skipping:    int   = Field(..., ge=0)
    unsure:      int   = Field(..., ge=0)
    total_rsvps: int   = Field(..., ge=0)

    model_config = ConfigDict(populate_by_name=True)


class DemandSummaryOut(BaseModel):
    """
    Aggregated RSVP demand for a date range.
    Consumed by the staff dashboard to set cooking targets.
    """
    from_date: _Date
    to_date:   _Date
    rows:      List[MealDemandRow]
