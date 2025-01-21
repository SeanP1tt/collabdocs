import { useState, useEffect, useRef } from "react";
import DOMPurify from "dompurify";
import { firestore } from "../lib/firebase";
import { debounce } from "lodash";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { doc, setDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import styled from "styled-components";

const EditorContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const ReactQuillWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;

  .ql-container {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .ql-editor {
    flex: 1;
    overflow-y: auto;
  }
`;

const Editor = ({ documentId, role }) => {
  const [editorValue, setEditorValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const isTyping = useRef(false);
  const typingTimeout = useRef(null);

  const docRef = doc(firestore, "documents", documentId);

  useEffect(() => {
    const unsubscribeDoc = onSnapshot(docRef, (docSnapshot) => {
      if (docSnapshot.exists() && !isTyping.current) {
        const content = docSnapshot.data()?.content || "";
        setEditorValue(content);
      }
    });

    return () => {
      unsubscribeDoc();
    };
  }, [documentId]);

  const debouncedSave = useRef(
    debounce(async (content) => {
      setIsSaving(true);
      const sanitizedContent = DOMPurify.sanitize(content);

      try {
        await setDoc(
          docRef,
          { content: sanitizedContent, lastUpdated: serverTimestamp() },
          { merge: true }
        );
      } catch (error) {
        console.error("Error saving document:", error);
      } finally {
        setIsSaving(false);
      }
    }, 500)
  ).current;

  const handleChange = (content) => {
    isTyping.current = true;
    setEditorValue(content);
    debouncedSave(content);

    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    typingTimeout.current = setTimeout(() => {
      isTyping.current = false;
    }, 2000);
  };

  return (
    <EditorContainer>
      <ReactQuillWrapper>
        <ReactQuill
          //   readOnly={role !== "editor" && role !== "owner"}
          value={editorValue}
          onChange={handleChange}
          style={{ height: "95%" }}
        />
      </ReactQuillWrapper>
    </EditorContainer>
  );
};

export default Editor;
