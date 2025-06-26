// frontend/src/components/DocumentView.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { useParams } from 'react-router-dom';

const DocumentContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const DocumentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const QAContainer = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  padding: 2rem;
`;

const QuestionInput = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;

  input {
    flex: 1;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }

  button {
    background: #4f46e5;
    color: white;
    border: none;
    padding: 0 1.5rem;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: #4338ca;
    }

    &:disabled {
      background: #c7d2fe;
      cursor: not-allowed;
    }
  }
`;

const AnswerSection = styled.div`
  background: #f9fafb;
  border-radius: 4px;
  padding: 1.5rem;
  margin-top: 1rem;
`;

function DocumentView() {
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAsking, setIsAsking] = useState(false);

  useEffect(() => {
    const fetchDocument = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`http://localhost:8000/api/documents/${id}`);
        setDocument(response.data);
      } catch (error) {
        console.error("Error fetching document:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocument();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    
    setIsAsking(true);
    try {
      const response = await axios.post('http://localhost:8000/api/ask', {
        document_id: id,
        question: question
      });
      setAnswer(response.data.answer);
      setQuestion('');
    } catch (error) {
      console.error("Error asking question:", error);
    } finally {
      setIsAsking(false);
    }
  };

  if (isLoading) return <div>Loading document...</div>;
  if (!document) return <div>Document not found</div>;

  return (
    <DocumentContainer>
      <DocumentHeader>
        <h2>{document.filename}</h2>
        <span>Uploaded: {new Date(document.upload_time).toLocaleDateString()}</span>
      </DocumentHeader>

      <QAContainer>
        <h3>Ask about this document</h3>
        <form onSubmit={handleSubmit}>
          <QuestionInput>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type your question here..."
              disabled={isAsking}
            />
            <button type="submit" disabled={isAsking || !question.trim()}>
              {isAsking ? 'Thinking...' : 'Ask'}
            </button>
          </QuestionInput>
        </form>

        {answer && (
          <AnswerSection>
            <h4>Answer:</h4>
            <p>{answer}</p>
          </AnswerSection>
        )}
      </QAContainer>
    </DocumentContainer>
  );
}

export default DocumentView;