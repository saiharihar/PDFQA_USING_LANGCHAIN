# backend/services/__init__.py
"""
Business logic and service classes.

Contains core functionality for PDF processing and NLP.
"""

from .nlp_processor import PDFProcessor

__all__ = [
    'PDFProcessor'
]