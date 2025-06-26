# backend/models/__init__.py
"""
Data models for the PDF Q&A application.

Defines all Pydantic models and database schemas.
"""

from .document import DocumentIn, DocumentOut

__all__ = [
    'DocumentIn',
    'DocumentOut'
]