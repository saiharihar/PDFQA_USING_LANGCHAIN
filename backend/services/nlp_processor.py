import os
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from dotenv import load_dotenv

load_dotenv()
class PDFProcessor:
    def __init__(self):
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-mpnet-base-v2"
        )
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )

    def process_pdf(self, filepath, doc_id):
        print(f"📄 Loading PDF: {filepath}")
        loader = PyPDFLoader(filepath)

        try:
            pages = loader.load_and_split(self.text_splitter)
            print(f"✅ Loaded and split {len(pages)} pages")
        except Exception as e:
            print(f"❌ Error splitting PDF: {e}")
            raise

        try:
            vectorstore = FAISS.from_documents(pages, self.embeddings)
            print(f"✅ Created vectorstore")
        except Exception as e:
            print(f"❌ Error creating vectorstore: {e}")
            raise

        os.makedirs("vectorstores", exist_ok=True)
        vectorstore.save_local(f"vectorstores/{doc_id}")
        print(f"✅ Vectorstore saved for doc_id={doc_id}")

        return len(pages)

