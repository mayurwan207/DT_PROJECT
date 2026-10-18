"""
Integration smoke-test for MessVerse student routes.
Run from /backend:  python test_routes.py
"""
import sys
sys.path.insert(0, ".")

from app.database import Base, engine, SessionLocal
from app.models import User
from app.routes.student import router, DualLeaderboardOut
from main import app

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

client = TestClient(app)

# ── clean slate ──────────────────────────────────────────────────────────────
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

# ── helpers ───────────────────────────────────────────────────────────────────
def ok(label: str):
    print(f"OK  {label}")

def fail(label: str, detail):
    print(f"FAIL {label}: {detail}")
    sys.exit(1)

# ── health check ─────────────────────────────────────────────────────────────
r = client.get("/health")
assert r.status_code == 200, fail("GET /health", r.text)
ok(f"GET /health → {r.json()}")

# ── seed a student ────────────────────────────────────────────────────────────
db: Session = SessionLocal()
student = User(name="Test Student", role="student")
db.add(student)
db.commit()
db.refresh(student)
sid = student.id
print(f"    Seeded student id={sid}")

# ── POST /api/v1/rsvp  (create) ───────────────────────────────────────────────
r = client.post("/api/v1/rsvp", json={
    "student_id": sid, "meal_type": "lunch",
    "date": "2026-10-15", "status": "attending",
})
assert r.status_code == 200, fail("POST /rsvp create", r.text)
ok(f"POST /api/v1/rsvp (create) → {r.json()}")

# ── POST /api/v1/rsvp  (upsert) ──────────────────────────────────────────────
r = client.post("/api/v1/rsvp", json={
    "student_id": sid, "meal_type": "lunch",
    "date": "2026-10-15", "status": "skipping",
})
assert r.status_code == 200, fail("POST /rsvp upsert", r.text)
data = r.json()
assert data["status"] == "skipping", fail("upsert status", data)
ok(f"POST /api/v1/rsvp (upsert) → status={data['status']}")

# ── POST /api/v1/streak/check-in ─────────────────────────────────────────────
r = client.post("/api/v1/streak/check-in", json={
    "student_id": sid, "date": "2026-10-15", "verified_clean_plate": True,
})
assert r.status_code == 201, fail("POST /streak/check-in", r.text)
ok(f"POST /api/v1/streak/check-in → {r.json()}")

db.refresh(student)
assert student.xp_points == 50,    fail("xp_points", student.xp_points)
assert student.streak_count == 1,  fail("streak_count", student.streak_count)
ok(f"XP={student.xp_points}  streak={student.streak_count}")

# ── duplicate check-in → 409 ─────────────────────────────────────────────────
r = client.post("/api/v1/streak/check-in", json={
    "student_id": sid, "date": "2026-10-15", "verified_clean_plate": True,
})
assert r.status_code == 409, fail("duplicate check-in should be 409", r.status_code)
ok("Duplicate check-in → 409 Conflict")

# ── POST /api/v1/feedback ────────────────────────────────────────────────────
r = client.post("/api/v1/feedback", json={
    "student_id": sid, "rating": 4, "tags": ["tasty"],
    "comment": "Great dal!", "date": "2026-10-15",
})
assert r.status_code == 201, fail("POST /feedback", r.text)
fb = r.json()
assert fb["tags"] == ["tasty"], fail("tags", fb)
ok(f"POST /api/v1/feedback → rating={fb['rating']} tags={fb['tags']}")

db.refresh(student)
assert student.review_count == 1, fail("review_count", student.review_count)
ok(f"review_count={student.review_count}")

# ── GET /api/v1/leaderboard ──────────────────────────────────────────────────
r = client.get("/api/v1/leaderboard")
assert r.status_code == 200, fail("GET /leaderboard", r.text)
lb = r.json()
assert "zero_waste_champions" in lb, fail("missing zero_waste_champions", lb)
assert "review_superstars"    in lb, fail("missing review_superstars", lb)
assert lb["zero_waste_champions"][0]["student_id"] == sid
assert lb["review_superstars"][0]["student_id"]    == sid
ok(
    f"GET /api/v1/leaderboard → "
    f"champion={lb['zero_waste_champions'][0]['name']}  "
    f"superstar={lb['review_superstars'][0]['name']}"
)

db.close()
print()
print("=" * 50)
print("ALL INTEGRATION CHECKS PASSED ✅")
print("=" * 50)
