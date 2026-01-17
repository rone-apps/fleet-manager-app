"use client";

import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from "@mui/material";
import { Save as SaveIcon } from "@mui/icons-material";

export default function BulkEditConfirmDialog({
  open,
  onClose,
  onConfirm,
  chargesCount,
  customerName = null,
  isAllCharges = false,
  affectedCustomers = [],
}) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SaveIcon color="primary" />
        Confirm Bulk Update
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            You are about to update <strong>{chargesCount}</strong> charge(s)
            {isAllCharges ? (
              <> across <strong>multiple customers</strong></>
            ) : (
              <> for <strong>{customerName}</strong></>
            )}
          </Alert>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            This action will:
          </Typography>
          <Box component="ul" sx={{ mt: 1, pl: 2 }}>
            <Typography component="li" variant="body2">
              Update all edited fields (job codes, addresses, fares, etc.)
            </Typography>
            <Typography component="li" variant="body2">
              Recalculate totals based on new fare and tip amounts
            </Typography>
            <Typography component="li" variant="body2">
              Save changes to the database immediately
            </Typography>
          </Box>
          {isAllCharges && affectedCustomers.length > 0 && (
            <Typography variant="body2" sx={{ mt: 2, fontWeight: 'bold' }}>
              Affected customers: {affectedCustomers.join(', ')}
            </Typography>
          )}
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            This action cannot be undone.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={onConfirm} variant="contained" color="success" startIcon={<SaveIcon />}>
          Confirm & Save All
        </Button>
      </DialogActions>
    </Dialog>
  );
}
