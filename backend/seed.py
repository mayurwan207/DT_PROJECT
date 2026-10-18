"""
seed.py
-------
Database seeding script for MessVerse.
Populates SQLite (messverse.db) with 20 realistic mock students,
staff accounts, RSVPs across meal slots, clean-plate check-in streaks,
and multi-day qualitative feedback submissions.

Run from /backend:
    python seed.py
"""

import json
import random
import sys
from datetime import date, timedelta
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).parent.resolve()))

from app.database import Base, SessionLocal, engine
from app.models import (
    Feedback,
    MealType,
    RSVP,
    RSVPStatus,
    StreakCheckIn,
    User,
    UserRole,
)

STUDENT_ROSTER = [
    ("Aarav Sharma", 18, 14, 950),
    ("Ananya Deshmukh", 29, 28, 1550),
    ("Rohan Verma", 24, 19, 1250),
    ("Diya Sen", 7, 32, 1150),
    ("Kabir Mehta", 12, 38, 1400),
    ("Sneha Patel", 14, 16, 750),
    ("Pooja Nair", 10, 14, 550),
    ("Vikram Joshi", 8, 9, 420),
    ("Arjun Reddy", 5, 7, 280),
    ("Meera Iyer", 4, 11, 230),
    ("Siddharth Rao", 16, 12, 820),
    ("Tanvi Kulkarni", 21, 15, 1080),
    ("Devansh Gupta", 3, 5, 160),
    ("Riya Banerjee", 9, 8, 470),
    ("Aditya Singh", 13, 10, 680),
    ("Ishita Kapoor", 6, 13, 340),
    ("Pranav Nair", 11, 7, 560),
    ("Anika Choudhury", 2, 4, 110),
    ("Varun Nair", 15, 11, 790),
    ("Kriti Saxena", 1, 3, 70),
]

STAFF_ROSTER = [
    ("Chef Ramesh Kumar", "staff"),
    ("Manager Sunita Rao", "staff"),
]

SAMPLE_FEEDBACK = [
    (5, ["tasty", "perfect", "clean_plate"], "Paneer butter masala and fresh rotis were outstanding today!"),
    (5, ["tasty", "fresh", "good_portion"], "Breakfast masala dosa was crisp and sambhar was piping hot!"),
    (4, ["tasty", "good_portion"], "Great dal tadka and jeera rice, very filling portion."),
    (4, ["clean_plate", "tasty"], "Plate cleared in under 10 minutes. Loved the kulfi dessert!"),
    (3, ["good_portion"], "Decent lunch today, but gravies could use slightly more seasoning."),
    (3, ["too_bland"], "Dal needed salt, otherwise rice and curd were fresh."),
    (2, ["too_spicy", "portion_small"], "Biryani was way too spicy and portion size was on the smaller side."),
    (2, ["cold"], "Rotis were served cold by the time our batch arrived."),
    (1, ["tasteless", "wasted"], "Vegetable curry had no flavor today, please improve gravy base."),
    (4, ["fresh", "clean_plate"], "Super hygienic serving and quick counter distribution."),
]

def seed_database():
    print("=" * 60)
    print("⚡ MessVerse SQLite Database Seeder")
    print("=" * 60)

    # Recreate tables cleanly
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("✓ Dropped and created fresh schema in messverse.db")

    db = SessionLocal()
    random.seed(42)

    try:
        # 1. Seed Staff Accounts
        for name, role in STAFF_ROSTER:
            staff_user = User(
                name=name,
                role=UserRole.staff,
                streak_count=0,
                review_count=0,
                xp_points=0,
            )
            db.add(staff_user)

        # 2. Seed 20 Students
        student_entities = []
        for name, streak, reviews, xp in STUDENT_ROSTER:
            student = User(
                name=name,
                role=UserRole.student,
                streak_count=streak,
                review_count=reviews,
                xp_points=xp,
            )
            db.add(student)
            student_entities.append(student)

        db.commit()
        for s in student_entities:
            db.refresh(s)

        print(f"✓ Seeded {len(student_entities)} students and {len(STAFF_ROSTER)} staff members.")

        # Reference target dates (Today = 2026-10-15, plus past 7 days)
        target_today = date(2026, 10, 15)
        date_window = [target_today - timedelta(days=d) for d in range(7, -1, -1)]

        # 3. Seed RSVPs across breakfast, lunch, dinner
        total_rsvps = 0
        meal_types = [MealType.breakfast, MealType.lunch, MealType.dinner]

        for cur_date in date_window:
            for student in student_entities:
                for meal in meal_types:
                    # Realistic distribution: 75% attending, 15% skipping, 10% unsure
                    r = random.random()
                    if r < 0.75:
                        status = RSVPStatus.attending
                    elif r < 0.90:
                        status = RSVPStatus.skipping
                    else:
                        status = RSVPStatus.unsure

                    rsvp = RSVP(
                        student_id=student.id,
                        meal_type=meal,
                        date=cur_date,
                        status=status,
                    )
                    db.add(rsvp)
                    total_rsvps += 1

        db.commit()
        print(f"✓ Seeded {total_rsvps} meal RSVPs across 8 calendar days.")

        # 4. Seed Streak Check-ins
        total_checkins = 0
        for student in student_entities:
            # Check-in for their active streak days up to target date
            streak_days = min(student.streak_count, len(date_window))
            for i in range(streak_days):
                check_date = target_today - timedelta(days=i)
                checkin = StreakCheckIn(
                    student_id=student.id,
                    date=check_date,
                    verified_clean_plate=True,
                )
                db.add(checkin)
                total_checkins += 1

        db.commit()
        print(f"✓ Seeded {total_checkins} verified clean-plate streak check-ins.")

        # 5. Seed Feedback submissions
        total_feedback = 0
        for student in student_entities:
            # Generate 2 to 4 feedback submissions per student within the window
            num_fb = min(student.review_count, random.randint(2, 4))
            for _ in range(num_fb):
                fb_date = target_today - timedelta(days=random.randint(0, 6))
                rating, tags, comment = random.choice(SAMPLE_FEEDBACK)

                fb = Feedback(
                    student_id=student.id,
                    rating=rating,
                    tags=json.dumps(tags),
                    comment=comment,
                    date=fb_date,
                )
                db.add(fb)
                total_feedback += 1

        db.commit()
        print(f"✓ Seeded {total_feedback} qualitative post-meal reviews.")

        print("\n" + "=" * 60)
        print("🎉 Database successfully seeded with 20 mock students!")
        print(f"Top Streak: {student_entities[1].name} ({student_entities[1].streak_count} Days 🔥)")
        print(f"Top Reviewer: {student_entities[4].name} ({student_entities[4].review_count} Reviews ⭐)")
        print("=" * 60)

    except Exception as e:
        db.rollback()
        print(f"❌ Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
