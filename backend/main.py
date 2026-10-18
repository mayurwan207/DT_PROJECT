"""
main.py
-------
MessVerse FastAPI application entry point.

Responsibilities
----------------
  • Creates the FastAPI app with metadata (title, version, docs URLs)
  • Bootstraps the SQLite database schema on startup
  • Mounts CORS middleware (Vite dev server at http://localhost:5173)
  • Registers all API routers
  • Provides a health-check endpoint at GET /health
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routes.student import router as student_router
from app.routes.staff   import router as staff_router

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("messverse")


# ---------------------------------------------------------------------------
# Lifespan: create DB tables on startup (idempotent via checkfirst=True)
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("⚡ MessVerse starting — bootstrapping database schema …")
    Base.metadata.create_all(bind=engine, checkfirst=True)
    logger.info("✅ Database schema ready.")
    yield
    logger.info("MessVerse shutting down.")


# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------
app = FastAPI(
    title="MessVerse API",
    description=(
        "AI-Driven Canteen Demand & Gamified Waste Reduction Platform.\n\n"
        "Student endpoints handle RSVPs, streak check-ins, feedback, "
        "and leaderboard queries. Staff endpoints expose demand summaries."
    ),
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)


# ---------------------------------------------------------------------------
# CORS
# Allows the Vite dev server (http://localhost:5173) to call the API.
# In production replace origins with your actual domain(s).
# ---------------------------------------------------------------------------
ALLOWED_ORIGINS = [
    "http://localhost:5173",   # Vite dev server
    "http://127.0.0.1:5173",  # same, numeric form
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],       # GET, POST, PUT, PATCH, DELETE, OPTIONS
    allow_headers=["*"],       # Content-Type, Authorization, X-Request-ID …
)


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(student_router)
app.include_router(staff_router)

# Future routers (auth, admin) can be added here:
# app.include_router(auth_router)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get(
    "/health",
    tags=["ops"],
    summary="Service health check",
    response_description="Simple liveness probe — always returns 200 when the server is up.",
)
def health() -> dict:
    """
    Lightweight liveness probe used by load-balancers and CI pipelines.
    Returns HTTP 200 with a static payload when the service is running.
    """
    return {"status": "ok", "service": "messverse-api"}
