import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import styled from 'styled-components';
import PDFUpload from './components/PDFUpload';
import DocumentView from './components/DocumentView';
import Sidebar from './components/Sidebar';
import axios from 'axios';

const AppContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background: #f5f7fa;
`;

const MainContent = styled.div`
  flex: 1;
  padding: 2rem;
`;

function App() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/documents');
        setDocuments(response.data);
      } catch (error) {
        console.error("Error fetching documents:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  const handleUploadSuccess = (newDoc) => {
    setDocuments([...documents, newDoc]);
  };

  const handleDeleteDoc = async (docId) => {
    try {
      await axios.delete(`http://localhost:8000/api/documents/${docId}`);
      setDocuments((prevDocs) => prevDocs.filter((doc) => doc.id !== docId));
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  const handleSelectDoc = (doc) => {
    // Optional: handle selection logic if needed
    console.log("Selected doc:", doc);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Router>
      <AppContainer>
        <Sidebar
          documents={documents}
          onDeleteDoc={handleDeleteDoc}
          onSelectDoc={handleSelectDoc}
        />
        <MainContent>
          <Routes>
            <Route
              path="/"
              element={<PDFUpload onUploadSuccess={handleUploadSuccess} />}
            />
            <Route path="/document/:id" element={<DocumentView />} />
          </Routes>
        </MainContent>
      </AppContainer>
    </Router>
  );
}

export default App;
