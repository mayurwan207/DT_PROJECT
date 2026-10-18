"""
models.py
---------
SQLAlchemy ORM models for MessVerse.

Tables
------
  users           — Students and canteen staff accounts
  rsvps           — Meal attendance declarations per student per day
  feedbacks       — Post-meal ratings, tags, and comments
  streak_checkins — Daily clean-plate verification records
"""

import enum
from datetime import date as Date

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from .database import Base


# ---------------------------------------------------------------------------
# Enumerations — enforced at the Python layer; stored as VARCHAR in SQLite
# ---------------------------------------------------------------------------

class UserRole(str, enum.Enum):
    student = "student"
    staff   = "staff"


class MealType(str, enum.Enum):
    breakfast = "breakfast"
    lunch     = "lunch"
    dinner    = "dinner"


class RSVPStatus(str, enum.Enum):
    attending = "attending"
    skipping  = "skipping"
    unsure    = "unsure"


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------

class User(Base):
    """
    Represents both students and canteen staff.

    Columns
    -------
    id            : Auto-increment primary key.
    name          : Display name of the user.
    role          : 'student' | 'staff' — drives access control & gamification.
    streak_count  : Current consecutive days of clean-plate check-ins.
    review_count  : Total number of feedback submissions.
    xp_points     : Cumulative XP earned through RSVPs, check-ins, and reviews.
    """

    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String(120), nullable=False)
    role          = Column(
                        Enum(UserRole, name="user_role"),
                        nullable=False,
                        default=UserRole.student,
                    )
    streak_count  = Column(Integer, nullable=False, default=0)
    review_count  = Column(Integer, nullable=False, default=0)
    xp_points     = Column(Integer, nullable=False, default=0)

    # Relationships (lazy-loaded; use joinedload in queries when needed)
    rsvps         = relationship("RSVP",          back_populates="student", cascade="all, delete-orphan")
    feedbacks     = relationship("Feedback",       back_populates="student", cascade="all, delete-orphan")
    checkins      = relationship("StreakCheckIn",  back_populates="student", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User id={self.id} name={self.name!r} role={self.role}>"


# ---------------------------------------------------------------------------
# RSVP
# ---------------------------------------------------------------------------

class RSVP(Base):
    """
    Records a student's meal attendance declaration for a specific date & meal.

    Columns
    -------
    id         : Auto-increment primary key.
    student_id : FK → users.id (the declaring student).
    meal_type  : Which meal — 'breakfast' | 'lunch' | 'dinner'.
    date       : Calendar date of the meal.
    status     : 'attending' | 'skipping' | 'unsure'.
    """

    __tablename__ = "rsvps"

    id         = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    meal_type  = Column(Enum(MealType,  name="meal_type"),  nullable=False)
    date       = Column(Date,                               nullable=False)
    status     = Column(Enum(RSVPStatus, name="rsvp_status"), nullable=False, default=RSVPStatus.unsure)

    student    = relationship("User", back_populates="rsvps")

    def __repr__(self) -> str:
        return (
            f"<RSVP id={self.id} student_id={self.student_id} "
            f"meal={self.meal_type} date={self.date} status={self.status}>"
        )


# ---------------------------------------------------------------------------
# Feedback
# ---------------------------------------------------------------------------

class Feedback(Base):
    """
    Stores a student's post-meal rating and qualitative feedback.

    Columns
    -------
    id         : Auto-increment primary key.
    student_id : FK → users.id.
    rating     : Integer score from 1 (terrible) to 5 (excellent).
    tags       : JSON-encoded list of keyword tags  e.g. '["tasty","too_spicy"]'.
                 Stored as TEXT because SQLite lacks a native JSON column type;
                 serialisation/deserialisation is handled at the schema layer.
    comment    : Optional free-text review (up to 1 000 chars recommended).
    date       : Calendar date the feedback was submitted.
    """

    __tablename__ = "feedbacks"

    id         = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    rating     = Column(Integer, nullable=False)           # validated 1–5 in schema
    tags       = Column(Text,    nullable=True,  default="[]")  # JSON string
    comment    = Column(Text,    nullable=True)
    date       = Column(Date,    nullable=False)

    student    = relationship("User", back_populates="feedbacks")

    def __repr__(self) -> str:
        return f"<Feedback id={self.id} student_id={self.student_id} rating={self.rating} date={self.date}>"


# ---------------------------------------------------------------------------
# StreakCheckIn
# ---------------------------------------------------------------------------

class StreakCheckIn(Base):
    """
    Tracks daily clean-plate verification for gamification streaks.

    Columns
    -------
    id                  : Auto-increment primary key.
    student_id          : FK → users.id.
    date                : Date of the check-in.
    verified_clean_plate: True if the student finished their meal (no waste).
                          Drives streak_count increments on the User model.
    """

    __tablename__ = "streak_checkins"

    id                   = Column(Integer, primary_key=True, index=True)
    student_id           = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    date                 = Column(Date,    nullable=False)
    verified_clean_plate = Column(Boolean, nullable=False, default=False)

    student              = relationship("User", back_populates="checkins")

    def __repr__(self) -> str:
        return (
            f"<StreakCheckIn id={self.id} student_id={self.student_id} "
            f"date={self.date} clean={self.verified_clean_plate}>"
        )
