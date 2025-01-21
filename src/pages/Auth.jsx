import { useState } from "react";
import { auth } from "../lib/firebase";
import { useNavigate } from "react-router-dom";
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  getAuth,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { firestore } from "../lib/firebase";
import {
  Button,
  TextField,
  Typography,
  Container,
  Box,
  CircularProgress,
} from "@mui/material";
import { styled } from "@mui/system";

const AuthContainer = styled(Container)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
`;

const AuthForm = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 400px;
`;

const AuthButton = styled(Button)`
  background-color: #007bff;
  color: white;
  &:hover {
    background-color: #0056b3;
  }
`;

const AuthPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const emailLink = window.location.href;
  const urlParams = new URLSearchParams(window.location.search);
  const invited = urlParams.get("apiKey");

  const handleAuth = async () => {
    setLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate("/");
    } catch (err) {
      setError(
        `Failed to ${
          isSignUp ? "sign up" : "sign in"
        }. Please check your credentials.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate("/");
    } catch (err) {
      setError("Failed to authenticate with Google.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginAndAcceptInvitation = async (email) => {
    try {
      const authInstance = getAuth();
      if (!isSignInWithEmailLink(authInstance, emailLink)) {
        throw new Error("Invalid email link");
      }

      const result = await signInWithEmailLink(authInstance, email, emailLink);

      const invitationsRef = collection(getFirestore(), "invitations");
      const q = query(
        invitationsRef,
        where("email", "==", email),
        where("status", "==", "pending")
      );
      const invitationSnapshot = await getDocs(q);

      if (invitationSnapshot && invitationSnapshot.empty) {
        throw new Error("Invitation not found");
      }

      const invitationData = invitationSnapshot.docs[0].data();
      const documentId = invitationData.documentId;

      if (invitationData?.status !== "pending") {
        throw new Error("Invitation already accepted or expired");
      }

      const collaboratorRef = doc(
        firestore,
        "documents",
        documentId,
        "collaborators",
        result.user.uid
      );
      await setDoc(collaboratorRef, {
        // role: invitationData.role,
        lastActive: serverTimestamp(),
      });

      const invitationDocRef = doc(
        getFirestore(),
        "invitations",
        invitationSnapshot.docs[0].id
      );
      await updateDoc(invitationDocRef, {
        status: "accepted",
        acceptedAt: serverTimestamp(),
      });

      navigate(`/document/${documentId}`);
    } catch (error) {
      console.error("Error accepting invitation: ", error);
    }
  };

  const authText = isSignUp ? "Sign Up" : "Sign In";

  return (
    <AuthContainer>
      <Typography variant="h4" gutterBottom>
        {authText}
      </Typography>
      {error && (
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      )}
      {invited ? (
        <AuthForm>
          <TextField
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full mb-4 p-2 border rounded"
          />
          <Button
            onClick={() => handleLoginAndAcceptInvitation(email)}
            className="w-full mb-4 p-2 bg-blue-500 text-white rounded"
            disabled={loading}
          >
            {loading ? "Loading..." : "Accept Invitation"}
          </Button>
        </AuthForm>
      ) : (
        <AuthForm>
          <TextField
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            label="Email"
            variant="outlined"
            fullWidth
          />
          <TextField
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            label="Password"
            variant="outlined"
            fullWidth
          />
          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}
          <AuthButton
            variant="contained"
            onClick={handleAuth}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : authText}
          </AuthButton>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleGoogleAuth}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              `${authText} with Google`
            )}
          </Button>
          <Button variant="text" onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp
              ? "Already have an account? Sign In"
              : "Don't have an account? Sign Up"}
          </Button>
        </AuthForm>
      )}
    </AuthContainer>
  );
};

export default AuthPage;
