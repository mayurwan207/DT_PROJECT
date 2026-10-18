# backend/app/__init__.py
# Exposes the database layer as a package.
from .database import Base, SessionLocal, engine, get_db
from . import models, schemas

__all__ = ["Base", "SessionLocal", "engine", "get_db", "models", "schemas"]
