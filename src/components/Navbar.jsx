import React, { useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AccountCircle, ArrowBack, ShareOutlined } from "@mui/icons-material";
import styled from "styled-components";
import {
  Button,
  Tooltip,
  IconButton,
  Box,
  Typography,
  Menu,
  MenuItem,
  TextField,
} from "@mui/material";
import reactLogo from "../assets/react.svg";
import {
  collection,
  addDoc,
  setDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, firestore } from "../lib/firebase";
import { signOut } from "firebase/auth";
import { debounce } from "lodash";

const NavbarContainer = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #fff;
  border-bottom: 1px solid #e0e0e0;
  height: 60px;
`;

const CollaboratorIconContainer = styled(Box)`
  position: relative;
  display: inline-block;
  cursor: pointer;
  margin-right: 8px;
`;

const CollaboratorIcon = styled(Box)`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${(props) => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  font-weight: bold;
`;

const TitleContainer = styled(Box)`
  display: flex;
  align-items: center;
`;

const Logo = styled.img`
  height: 40px;
`;

const colors = [
  "#FF5733",
  "#33FF57",
  "#3357FF",
  "#FF33A1",
  "#FF8C33",
  "#33FFF5",
];

const Navbar = ({ user, onShare, documentName, isOwner, collaborators }) => {
  const navigate = useNavigate();
  const { id: documentId } = useParams();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(documentName);
  const [isSaving, setIsSaving] = useState(false);
  const userEmail = auth.currentUser?.email;

  const debouncedSaveName = useRef(
    debounce(async (name) => {
      setIsSaving(true);
      try {
        const docRef = doc(firestore, "documents", documentId);
        await setDoc(docRef, { name }, { merge: true });
      } catch (error) {
        console.error("Error saving document name:", error);
      } finally {
        setIsSaving(false);
      }
    }, 1000)
  ).current;

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNameChange = (e) => {
    setNewName(e.target.value);
  };

  const handleNameBlur = () => {
    setIsEditing(false);
    debouncedSaveName(newName);
  };

  const createNewDocument = async () => {
    const userId = auth.currentUser?.uid;
    const docRef = await addDoc(collection(firestore, "documents"), {
      createdBy: user.uid,
      content: "",
      createdAt: serverTimestamp(),
    });

    await setDoc(
      doc(
        collection(firestore, "documents", docRef.id, "collaborators"),
        userId
      ),
      {
        role: "owner",
        lastActive: serverTimestamp(),
      }
    );
    navigate(`/document/${docRef.id}`);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/auth");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <NavbarContainer>
      <TitleContainer>
        {documentId ? (
          <IconButton
            onClick={() => navigate("/")}
            style={{ marginRight: "16px" }}
          >
            <ArrowBack />
          </IconButton>
        ) : (
          <Logo src={reactLogo} alt="Vite Logo" />
        )}
        {documentId && (
          <Box display="flex" alignItems="center">
            {isEditing ? (
              <TextField
                value={newName}
                onChange={handleNameChange}
                onBlur={handleNameBlur}
                autoFocus
                variant="outlined"
                size="small"
              />
            ) : (
              <Typography
                variant="h6"
                onClick={() => isOwner && setIsEditing(true)}
                style={{ cursor: isOwner ? "pointer" : "default" }}
              >
                {documentName}
              </Typography>
            )}
          </Box>
        )}
      </TitleContainer>
      <Box display="flex" alignItems="center">
        {documentId &&
          collaborators.map((collaborator, index) => (
            <Tooltip key={collaborator.id} title={collaborator.email}>
              <CollaboratorIconContainer>
                <CollaboratorIcon color={colors[index % colors.length]}>
                  <Typography variant="h6" color="#fff">
                    {collaborator.email.charAt(0).toUpperCase()}
                  </Typography>
                </CollaboratorIcon>
              </CollaboratorIconContainer>
            </Tooltip>
          ))}
        {documentId && isOwner && (
          <Button
            startIcon={<ShareOutlined />}
            onClick={onShare}
            variant="contained"
            color="primary"
            style={{ marginRight: "16px" }}
          >
            Share
          </Button>
        )}
        {!documentId && (
          <Button
            onClick={createNewDocument}
            variant="contained"
            color="primary"
          >
            + New Document
          </Button>
        )}
        <Tooltip title={userEmail}>
          <IconButton onClick={handleMenuOpen}>
            <AccountCircle style={{ fontSize: 40 }} />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleLogout}>Logout</MenuItem>
        </Menu>
      </Box>
    </NavbarContainer>
  );
};

export default Navbar;
