import React, { useEffect, useState } from "react";
import { auth, firestore } from "../lib/firebase";
import { useNavigate } from "react-router-dom";
import AuthPage from "./Auth";
import {
  collection,
  doc,
  query,
  where,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import styled from "styled-components";
import { InsertDriveFile, Delete } from "@mui/icons-material";
import Navbar from "../components/Navbar";
import ConfirmDeletionModal from "../components/ConfirmDeleteModal";
import { toast } from "react-toastify";

const Container = styled.div`
  padding: 16px;
`;

const DocumentsSection = styled.div`
  padding: 16px;
  margin-top: 80px;
`;

const DocumentsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
`;

const DocumentCard = styled.div`
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  position: relative;

  &:hover {
    background-color: #e9ecef;
  }
`;

const DocumentTitle = styled.div`
  margin-top: auto;
  padding: 8px;
  background-color: #007bff;
  color: white;
  text-align: center;
  border-radius: 0 0 4px 4px;
`;

const DeleteIconContainer = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  cursor: pointer;
`;

function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
      if (user) {
        fetchDocuments(user);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchDocuments = async (user) => {
    const invitesAcceptedByUser = await getDocs(
      query(
        collection(firestore, "invitations"),
        where("email", "==", user.email),
        where("status", "==", "accepted")
      )
    );
    const documentIds = invitesAcceptedByUser.docs.map(
      (doc) => doc.data().documentId
    );

    const chunkSize = 10;
    const documentChunks = [];
    for (let i = 0; i < documentIds.length; i += chunkSize) {
      documentChunks.push(documentIds.slice(i, i + chunkSize));
    }

    const docs = [];

    const creatorQuery = query(
      collection(firestore, "documents"),
      where("createdBy", "==", user.uid)
    );
    const creatorDocsSnapshot = await getDocs(creatorQuery);
    docs.push(
      ...creatorDocsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    );

    for (const chunk of documentChunks) {
      const collaboratorQuery = query(
        collection(firestore, "documents"),
        where("__name__", "in", chunk)
      );
      const collaboratorDocsSnapshot = await getDocs(collaboratorQuery);
      docs.push(
        ...collaboratorDocsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    }

    setDocuments(docs);
  };

  const handleDeleteClick = (doc) => {
    setSelectedDocument(doc);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedDocument) {
      try {
        await deleteDoc(doc(firestore, "documents", selectedDocument.id));
        setDocuments(documents.filter((d) => d.id !== selectedDocument.id));
        toast.success(`Document deleted`);
      } catch (error) {
        console.error("Error deleting document:", error);
        toast.error("Error deleting document");
      } finally {
        setIsModalOpen(false);
        setSelectedDocument(null);
      }
    }
  };

  const handleDeleteCancel = () => {
    setIsModalOpen(false);
    setSelectedDocument(null);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <Container>
      <Navbar user={user} />
      <DocumentsSection>
        <h2>Your Documents</h2>
        {documents.length === 0 ? (
          <p>No documents found. Create a new document to get started.</p>
        ) : (
          <DocumentsGrid>
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                onClick={() => navigate(`/document/${doc.id}`)}
              >
                <InsertDriveFile
                  style={{ fontSize: 100, alignSelf: "center" }}
                />
                <DocumentTitle>{doc.name || "Untitled Document"}</DocumentTitle>
                {doc.createdBy === auth.currentUser?.uid && (
                  <DeleteIconContainer
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(doc);
                    }}
                  >
                    <Delete color="error" />
                  </DeleteIconContainer>
                )}
              </DocumentCard>
            ))}
          </DocumentsGrid>
        )}
      </DocumentsSection>
      <ConfirmDeletionModal
        open={isModalOpen}
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteCancel}
        text={`Are you sure you want to delete "${
          selectedDocument?.name || "Untitled Document"
        }"?`}
        title={`Delete "${selectedDocument?.name || "Untitled Document"}"`}
      />
    </Container>
  );
}

export default Home;
