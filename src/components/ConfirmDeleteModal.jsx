import React from "react";
import { Modal, Button, Box, Typography } from "@mui/material";

const ConfirmDeleteModal = ({ open, onClose, onConfirm, title, text }) => {
  return (
    <Modal open={open} onClose={onClose}>
      <Box
        p={3}
        bgcolor="white"
        borderRadius={4}
        textAlign="center"
        boxShadow={3}
        style={{ margin: "auto", marginTop: "20vh", maxWidth: "400px" }}
      >
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body1" gutterBottom>
          {text}
        </Typography>
        <Box mt={2}>
          <Button
            onClick={onConfirm}
            color="error"
            variant="contained"
            style={{ marginRight: "8px" }}
          >
            Confirm
          </Button>
          <Button onClick={onClose} color="" variant="contained">
            Cancel
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default ConfirmDeleteModal;
