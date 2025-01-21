import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  collection,
  query,
  getDocs,
  where,
} from "firebase/firestore";
import { firestore, auth } from "../lib/firebase";
import Editor from "./editor";
import InviteCollaborator from "../components/InviteCollaborator";
import styled from "styled-components";
import { signOut } from "firebase/auth";
import { debounce } from "lodash";
import Navbar from "../components/Navbar";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
`;

const EditorContainer = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f1f3f4;
  padding: 16px;
  height: calc(100vh - 60px);
`;

const EditorWrapper = styled.div`
  width: 100%;
  max-width: 800px;
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 16px;
  height: 100%;
`;

const UserIconContainer = styled.div`
  position: relative;
  display: inline-block;
  cursor: pointer;
`;

const CollaboratorIconContainer = styled.div`
  position: relative;
  display: inline-block;
  cursor: pointer;
  margin-left: 8px;
`;

const DocumentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [newName, setNewName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCollaborators, setActiveCollaborators] = useState([]);
  //   const [role, setRole] = useState(null);
  const userId = auth.currentUser?.uid;
  const userEmail = auth.currentUser?.email;

  const debouncedSaveName = useRef(
    debounce(async (name) => {
      setIsSaving(true);
      try {
        const docRef = doc(firestore, "documents", id);
        await setDoc(docRef, { name }, { merge: true });
      } catch (error) {
        console.error("Error saving document name:", error);
      } finally {
        setIsSaving(false);
      }
    }, 1000)
  ).current;

  useEffect(() => {
    const fetchDocument = async () => {
      const docRef = doc(firestore, "documents", id);
      const docSnapshot = await getDoc(docRef);

      if (docSnapshot.exists()) {
        const docData = docSnapshot.data();

        const collaboratorsRef = collection(
          firestore,
          "documents",
          id,
          "collaborators"
        );
        const collaboratorQuery = query(
          collaboratorsRef,
          where("__name__", "==", userId)
        );
        const collaboratorSnapshot = await getDocs(collaboratorQuery);

        if (!collaboratorSnapshot.empty) {
          const collaboratorData = collaboratorSnapshot.docs[0].data();
          setDocument(docData);
          setNewName(docData.name || "");
          //   setRole(collaboratorData.role);
        } else {
          navigate("/");
        }
      } else {
        navigate("/");
      }
    };

    if (userId) {
      fetchDocument();
    }
  }, [id, userId, navigate]);

  useEffect(() => {
    const docRef = doc(firestore, "documents", id);

    const unsubscribe = onSnapshot(docRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const docData = docSnapshot.data();
        setDocument(docData);
        setNewName(docData.name || "");
      } else {
        navigate("/");
      }
    });

    return () => unsubscribe();
  }, [id, navigate]);

  useEffect(() => {
    const collaboratorsRef = collection(
      firestore,
      "documents",
      id,
      "collaborators"
    );

    const unsubscribeCollaborators = onSnapshot(
      collaboratorsRef,
      (snapshot) => {
        const newCollaborators = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.isViewing) {
            newCollaborators.push({ id: doc.id, email: data.email });
          }
        });
        setActiveCollaborators(newCollaborators);
      }
    );

    return () => unsubscribeCollaborators();
  }, [id]);

  useEffect(() => {
    const updateViewingStatus = async (isViewing) => {
      const collaboratorRef = doc(
        firestore,
        "documents",
        id,
        "collaborators",
        userId
      );
      await setDoc(
        collaboratorRef,
        { isViewing, email: userEmail },
        { merge: true }
      );
    };

    updateViewingStatus(true);

    return () => {
      updateViewingStatus(false);
    };
  }, [id, userId]);

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setNewName(newName);
    debouncedSaveName(newName);
  };

  const handleInvite = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/auth");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (!document) {
    return <div>Loading...</div>;
  }

  const isOwner = document.createdBy === auth.currentUser?.uid;

  return (
    <Container>
      <Navbar
        onBack={() => navigate("/")}
        onShare={handleInvite}
        userEmail={userEmail}
        onLogout={handleLogout}
        showShareButton={isOwner}
        documentName={newName || "Untitled Document"}
        onNameChange={handleNameChange}
        isOwner={isOwner}
        collaborators={activeCollaborators}
      />
      <InviteCollaborator
        documentId={id}
        open={isModalOpen}
        onClose={closeModal}
      />
      <EditorContainer>
        <EditorWrapper>
          <Editor
            documentId={id}
            //   role={role}
          />
        </EditorWrapper>
      </EditorContainer>
    </Container>
  );
};

export default DocumentPage;
