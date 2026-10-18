"""
Integration smoke-test for MessVerse STAFF routes.
Run from /backend:  python test_staff_routes.py
"""
import sys, json
from datetime import date, timedelta

sys.path.insert(0, ".")

from app.database import Base, engine, SessionLocal
from app.models import User, RSVP, Feedback
from main import app
from fastapi.testclient import TestClient

client = TestClient(app)

# ── clean slate ──────────────────────────────────────────────────────────────
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

def ok(label): print(f"OK  {label}")
def fail(label, detail): print(f"FAIL {label}: {detail}"); sys.exit(1)

# ── seed data ─────────────────────────────────────────────────────────────────
db = SessionLocal()
today = date.today()
target = today  # analytics date

# one student
student = User(name="Priya", role="student")
db.add(student)
db.commit(); db.refresh(student)

# RSVPs for today: 300 attending, 100 skipping, 60 unsure for lunch
rsvp_data = [
    ("breakfast",  80, "attending"), ("breakfast",  20, "skipping"), ("breakfast",  10, "unsure"),
    ("lunch",     300, "attending"), ("lunch",      100, "skipping"), ("lunch",       60, "unsure"),
    ("dinner",     50, "attending"), ("dinner",      10, "skipping"), ("dinner",       5, "unsure"),
]
for meal, n, status in rsvp_data:
    for _ in range(n):
        db.add(RSVP(student_id=student.id, meal_type=meal, date=today, status=status))

# Feedback last 3 days
tags_pool = [["tasty", "good_portion"], ["too_spicy"], ["fresh", "hygienic"], ["stale"]]
for i in range(20):
    fb_date = today - timedelta(days=i % 3)
    db.add(Feedback(
        student_id=student.id,
        rating=(i % 5) + 1,
        tags=json.dumps(tags_pool[i % len(tags_pool)]),
        date=fb_date,
    ))

db.commit()
db.close()
print(f"    Seeded RSVPs and feedback for date={today}")

# ── GET /api/v1/staff/analytics ──────────────────────────────────────────────
r = client.get(f"/api/v1/staff/analytics?date={today}")
assert r.status_code == 200, fail("GET /staff/analytics", r.text)
body = r.json()

assert body["query_date"] == str(today)
assert body["max_capacity"] == 500
assert len(body["meals"]) == 3

# Validate lunch row formulas
lunch = next(m for m in body["meals"] if m["meal_type"] == "lunch")
assert lunch["attending"]     == 300, fail("lunch attending", lunch)
assert lunch["skipping"]      == 100, fail("lunch skipping", lunch)
assert lunch["unsure"]        == 60,  fail("lunch unsure",   lunch)
assert lunch["total_rsvps"]   == 460, fail("lunch total_rsvps", lunch)

# expected_diners = 300 + 60*0.5 = 330
assert abs(lunch["expected_diners"] - 330.0) < 0.01, fail("expected_diners", lunch["expected_diners"])
# prep_qty_kg = 330 * 0.25 = 82.5
assert abs(lunch["prep_qty_kg"] - 82.5) < 0.01,      fail("prep_qty_kg", lunch["prep_qty_kg"])
# demand_ratio = 330/500 = 0.66  → badge = Moderate
assert "Moderate" in lunch["badge"],                  fail("badge", lunch["badge"])
# waste_reduction_pct = (1 - 0.66) * 100 = 34%
assert abs(lunch["waste_reduction_pct"] - 34.0) < 0.5, fail("waste_reduction_pct", lunch["waste_reduction_pct"])

ok(f"GET /api/v1/staff/analytics → lunch: expected_diners={lunch['expected_diners']}  prep={lunch['prep_qty_kg']}kg  badge={lunch['badge']!r}")

# breakfast: expected = 80 + 10*0.5 = 85  ratio = 85/500 = 0.17 → Very Low
bfast = next(m for m in body["meals"] if m["meal_type"] == "breakfast")
assert "Very Low" in bfast["badge"], fail("breakfast badge", bfast["badge"])
ok(f"GET /api/v1/staff/analytics → breakfast badge={bfast['badge']!r}")

# dinner: expected = 50 + 5*0.5 = 52.5  ratio = 52.5/500 = 0.105 → Very Low
dinner = next(m for m in body["meals"] if m["meal_type"] == "dinner")
assert "Very Low" in dinner["badge"], fail("dinner badge", dinner["badge"])
ok(f"GET /api/v1/staff/analytics → dinner badge={dinner['badge']!r}")

# ── GET /api/v1/staff/feedback-summary ───────────────────────────────────────
r = client.get("/api/v1/staff/feedback-summary")
assert r.status_code == 200, fail("GET /staff/feedback-summary", r.text)
fs = r.json()

assert fs["total_reviews"] == 20,                 fail("total_reviews", fs["total_reviews"])
assert fs["average_rating"] is not None,          fail("average_rating None", fs)
assert 1.0 <= fs["average_rating"] <= 5.0,        fail("average_rating range", fs["average_rating"])
assert len(fs["top_tags"]) > 0,                   fail("top_tags empty", fs)
assert fs["top_tags"][0]["count"] >= fs["top_tags"][-1]["count"], fail("top_tags not sorted", fs["top_tags"])

ok(
    f"GET /api/v1/staff/feedback-summary → "
    f"reviews={fs['total_reviews']}  avg={fs['average_rating']}  "
    f"top_tag={fs['top_tags'][0]['tag']}(×{fs['top_tags'][0]['count']})"
)

# Pretty-print full response for visual inspection
print("\n── Analytics snapshot ──────────────────────────────────────────")
for m in body["meals"]:
    print(
        f"  {m['meal_type']:10s}  attend={m['attending']:3d}  "
        f"expected={m['expected_diners']:6.1f}  "
        f"prep={m['prep_qty_kg']:5.1f}kg  "
        f"waste_red={m['waste_reduction_pct']:5.1f}%  {m['badge']}"
    )

print("\n── Feedback summary ─────────────────────────────────────────────")
print(f"  Period : {fs['from_date']} → {fs['to_date']}  ({fs['window_days']} days)")
print(f"  Reviews: {fs['total_reviews']}   Avg rating: {fs['average_rating']} ⭐")
print(f"  Top tags: { [(t['tag'], t['count']) for t in fs['top_tags']] }")

print()
print("=" * 55)
print("ALL STAFF ROUTE INTEGRATION CHECKS PASSED ✅")
print("=" * 55)
