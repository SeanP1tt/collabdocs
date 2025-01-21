import { useState } from "react";
import { firestore, auth } from "../lib/firebase";
import { serverTimestamp, addDoc, collection } from "firebase/firestore";
import { sendSignInLinkToEmail } from "firebase/auth";
import {
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Box,
  Modal,
} from "@mui/material";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const InviteCollaborator = ({ documentId, open, onClose }) => {
  const [email, setEmail] = useState("");
  // const [role, setRole] = useState("viewer");

  const inviteUserToDocument = async () => {
    try {
      const invitationRef = await addDoc(collection(firestore, "invitations"), {
        email,
        documentId: documentId,
        // role,
        status: "pending",
        timestamp: serverTimestamp(),
      });

      const actionCodeSettings = {
        url: `${window.location.origin}/auth`,
        handleCodeInApp: true,
      };

      await sendSignInLinkToEmail(auth, email, actionCodeSettings);

      toast.success(`Passwordless login link sent to ${email}`);

      onClose();
    } catch (error) {
      toast.error("Error sending invitation: " + error.message);
      console.error("Error sending invitation: ", error);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        p={5}
        bgcolor="white"
        borderRadius={4}
        textAlign="center"
        boxShadow={3}
        position="absolute"
        top="50%"
        left="50%"
        style={{ transform: "translate(-50%, -50%)" }}
      >
        <TextField
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email"
          label="Email"
          variant="outlined"
          fullWidth
          margin="normal"
        />
        {/* <FormControl variant="outlined" fullWidth margin="normal">
          <InputLabel>Role</InputLabel>
          <Select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            label="Role"
          >
            <MenuItem value="viewer">Viewer</MenuItem>
            <MenuItem value="editor">Editor</MenuItem>
          </Select>
        </FormControl> */}
        <Button
          variant="contained"
          color="primary"
          onClick={inviteUserToDocument}
        >
          Invite
        </Button>
      </Box>
    </Modal>
  );
};

export default InviteCollaborator;
