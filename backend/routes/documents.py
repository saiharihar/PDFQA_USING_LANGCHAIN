import os
import uuid
import sqlite3
import traceback
from datetime import datetime
from typing import List
import shutil

from fastapi import status, APIRouter, UploadFile, File, HTTPException

from models.document import DocumentIn, DocumentOut
from services.nlp_processor import PDFProcessor

router = APIRouter()
processor = PDFProcessor()

# Database setup
conn = sqlite3.connect("pdf_qa.db", check_same_thread=False)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    filepath TEXT NOT NULL,
    upload_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed BOOLEAN DEFAULT FALSE
)
""")
conn.commit()

@router.post("/upload", response_model=DocumentOut)
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files accepted")
    
    doc_id = str(uuid.uuid4())
    filepath = f"uploads/{doc_id}_{file.filename}"
    os.makedirs("uploads", exist_ok=True)

    try:
        with open(filepath, "wb") as buffer:
            buffer.write(await file.read())
        print(f"✅ Saved uploaded file to: {filepath}")

        print("🔧 Calling processor.process_pdf()...")
        page_count = processor.process_pdf(filepath, doc_id)
        print(f"✅ PDF processed: {page_count} chunks")

        cursor.execute(
            "INSERT INTO documents (id, filename, filepath, processed) VALUES (?, ?, ?, ?)",
            (doc_id, file.filename, filepath, True)
        )
        conn.commit()

        return {
            "id": doc_id,
            "filename": file.filename,
            "filepath": filepath,
            "upload_time": datetime.utcnow(),
            "processed": True
        }

    except Exception as e:
        print("❌ Exception during upload:")
        traceback.print_exc()
        if os.path.exists(filepath):
            os.remove(filepath)
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/documents", response_model=List[DocumentOut])
async def list_documents():
    cursor.execute("SELECT id, filename, filepath, upload_time, processed FROM documents")
    return [dict(row) for row in cursor.fetchall()]


@router.get("/documents/{doc_id}", response_model=DocumentOut)
async def get_document(doc_id: str):
    cursor.execute(
        "SELECT id, filename, filepath, upload_time, processed FROM documents WHERE id = ?",
        (doc_id,)
    )
    doc = cursor.fetchone()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return dict(doc)


@router.delete("/documents/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(doc_id: str):
    # Delete from DB
    cursor.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
    conn.commit()

    # Remove uploaded PDF file
    for file in os.listdir("uploads"):
        if file.startswith(doc_id):
            try:
                os.remove(os.path.join("uploads", file))
            except Exception as e:
                print(f"Error deleting uploaded file: {e}")

    # Remove vectorstore directory or files
    vectorstore_prefix = f"vectorstores/{doc_id}"
    for ext in ["", ".faiss", ".json"]:
        path = f"{vectorstore_prefix}{ext}"
        try:
            if os.path.isdir(path):
                shutil.rmtree(path, ignore_errors=True)
            elif os.path.exists(path):
                os.remove(path)
        except Exception as e:
            print(f"Error deleting vectorstore data: {e}")
