import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const SidebarContainer = styled.div`
  width: 250px;
  background: #1e293b;
  color: white;
  padding: 1.5rem;
`;

const Logo = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #334155;
`;

const DocumentList = styled.ul`
  list-style: none;
  padding: 0;
`;

const DocumentItem = styled.li`
  margin-bottom: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const DocumentLink = styled(Link)`
  color: #e2e8f0;
  text-decoration: none;
  padding: 0.5rem;
  border-radius: 4px;
  flex: 1;
  transition: background 0.2s;

  &:hover {
    background: #334155;
  }

  &.active {
    background: #4f46e5;
  }
`;

const DeleteButton = styled.button`
  background: transparent;
  color: #f87171;
  border: none;
  margin-left: 0.5rem;
  font-size: 0.9rem;
  cursor: pointer;

  &:hover {
    color: #ef4444;
  }
`;

function Sidebar({ documents, onSelectDoc, onDeleteDoc }) {
  return (
    <SidebarContainer>
      <Logo>PDF Q&A</Logo>
      <nav>
        <DocumentList>
          <DocumentItem>
            <DocumentLink to="/">Upload New</DocumentLink>
          </DocumentItem>
          {documents.map((doc) => (
            <DocumentItem key={doc.id}>
              <DocumentLink
                to={`/document/${doc.id}`}
                onClick={() => onSelectDoc && onSelectDoc(doc)}
              >
                {doc.filename}
              </DocumentLink>
              <DeleteButton onClick={() => onDeleteDoc(doc.id)}>✕</DeleteButton>
            </DocumentItem>
          ))}
        </DocumentList>
      </nav>
    </SidebarContainer>
  );
}

export default Sidebar;
