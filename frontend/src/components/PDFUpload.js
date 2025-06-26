// frontend/src/components/PDFUpload.js
import React, { useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';

const UploadContainer = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
`;

const DropZone = styled.div`
  border: 2px dashed #ccc;
  border-radius: 4px;
  padding: 3rem;
  text-align: center;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    border-color: #4f46e5;
    background: #f8f9ff;
  }
`;

const UploadButton = styled.button`
  background: #4f46e5;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #4338ca;
  }

  &:disabled {
    background: #c7d2fe;
    cursor: not-allowed;
  }
`;

function PDFUpload({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await axios.post('http://localhost:8000/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onUploadSuccess(response.data);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <UploadContainer>
      <h2>Upload PDF Document</h2>
      <p>Upload a PDF file to start asking questions about its content</p>
      
      <DropZone onClick={() => document.getElementById('file-input').click()}>
        <input 
          id="file-input"
          type="file" 
          accept=".pdf" 
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        {file ? (
          <p>{file.name} selected</p>
        ) : (
          <p>Drag and drop your PDF here, or click to browse</p>
        )}
      </DropZone>
      
      <UploadButton onClick={handleUpload} disabled={!file || isUploading}>
        {isUploading ? 'Processing...' : 'Upload Document'}
      </UploadButton>
    </UploadContainer>
  );
}

export default PDFUpload;