"use client";

import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from "@mui/material";
import { Block as CancelIcon } from "@mui/icons-material";

export default function CancelInvoiceDialog({
  open,
  onClose,
  selectedInvoice,
  cancelReason,
  setCancelReason,
  handleCancelInvoice,
  error,
}) {
  if (!selectedInvoice) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Cancel Invoice</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <Alert severity="warning">
            You are about to cancel invoice <strong>{selectedInvoice.invoiceNumber}</strong>
            {selectedInvoice.customerName && (
              <> for <strong>{selectedInvoice.customerName}</strong></>
            )}
            . This action cannot be undone.
          </Alert>

          <TextField
            label="Reason for Cancellation"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            fullWidth
            required
            multiline
            rows={3}
            placeholder="Enter the reason for cancelling this invoice..."
            autoFocus
          />

          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button
          onClick={handleCancelInvoice}
          variant="contained"
          color="error"
          startIcon={<CancelIcon />}
          disabled={!cancelReason.trim()}
        >
          Cancel Invoice
        </Button>
      </DialogActions>
    </Dialog>
  );
}
