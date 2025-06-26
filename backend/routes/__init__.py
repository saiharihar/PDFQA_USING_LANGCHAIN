# backend/routes/__init__.py
"""
API endpoint definitions.

Organizes all FastAPI routers and route handlers.
"""

from .documents import router as documents_router
from .questions import router as questions_router

routers = [
    documents_router,
    questions_router
]

__all__ = [
    'routers',
    'documents_router',
    'questions_router'
]