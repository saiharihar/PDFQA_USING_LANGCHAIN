from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
import google.generativeai as genai
import os
from dotenv import load_dotenv
import traceback
import uuid
import tempfile
from typing import Optional

# Load environment variables
load_dotenv()

# Initialize Gemini
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise RuntimeError("GOOGLE_API_KEY not found in environment variables")

genai.configure(api_key=GOOGLE_API_KEY)
gemini_model = genai.GenerativeModel('gemini-1.5-flash')

# ✅ FIX: Remove redundant prefix here
router = APIRouter(
    tags=["QA"],
    responses={404: {"description": "Not found"}}
)

# Embeddings model
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-mpnet-base-v2",
    model_kwargs={'device': 'cpu'}
)

class QuestionRequest(BaseModel):
    document_id: str
    question: str

@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    try:
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(400, detail="Only PDF files are supported")

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        pdf_text = extract_text_from_pdf(tmp_path)
        os.unlink(tmp_path)

        doc_id = str(uuid.uuid4())
        vectorstore_path = f"vectorstores/{doc_id}"
        os.makedirs(vectorstore_path, exist_ok=True)

        with open(f"{vectorstore_path}/raw_text.txt", "w", encoding="utf-8") as f:
            f.write(pdf_text)

        from langchain_text_splitters import RecursiveCharacterTextSplitter
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunks = text_splitter.split_text(pdf_text)
        vectorstore = FAISS.from_texts(chunks, embeddings)
        vectorstore.save_local(vectorstore_path)

        return {
            "document_id": doc_id,
            "status": "success",
            "chunks": len(chunks)
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(500, detail=str(e))

def extract_text_from_pdf(pdf_path: str) -> str:
    try:
        with open(pdf_path, "rb") as f:
            pdf_data = f.read()

        response = gemini_model.generate_content(
            {
                "parts": [
                    {"text": "Extract all text from this PDF exactly as shown:"},
                    {"mime_type": "application/pdf", "data": pdf_data}
                ]
            },
            generation_config={"temperature": 0}
        )
        return response.text
    except Exception as e:
        raise Exception(f"PDF extraction failed: {str(e)}")

@router.post("/ask")
async def ask_question(request: QuestionRequest):
    try:
        if not request.question.strip():
            raise HTTPException(400, detail="Question cannot be empty")

        vectorstore_path = f"vectorstores/{request.document_id}"
        if not os.path.exists(vectorstore_path):
            raise HTTPException(404, detail="Document not found")

        vectorstore = FAISS.load_local(
            vectorstore_path,
            embeddings,
            allow_dangerous_deserialization=True
        )
        docs = vectorstore.similarity_search(request.question, k=3)
        context = "\n\n".join([doc.page_content for doc in docs])

        prompt = f"""Answer this question based on the context:
        
        Context: {context}
        
        Question: {request.question}
        Answer:"""

        response = gemini_model.generate_content(prompt)
        return {
            "answer": response.text.strip(),
            "sources": [doc.page_content for doc in docs]
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(500, detail=str(e))
