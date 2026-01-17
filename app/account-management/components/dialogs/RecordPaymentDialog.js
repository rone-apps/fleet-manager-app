"use client";

import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  InputAdornment,
} from "@mui/material";
import { Payment as PaymentIcon } from "@mui/icons-material";
import { formatCurrency } from "../../utils/helpers";

export default function RecordPaymentDialog({
  open,
  onClose,
  selectedInvoice,
  paymentFormData,
  setPaymentFormData,
  handleRecordPayment,
  error,
}) {
  if (!selectedInvoice) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Record Payment</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <Alert severity="info">
            Recording payment for invoice <strong>{selectedInvoice.invoiceNumber}</strong>
            <br />
            Balance Due: <strong>{formatCurrency(selectedInvoice.balanceDue)}</strong>
          </Alert>

          <TextField
            label="Payment Amount"
            type="number"
            value={paymentFormData.amount}
            onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
            fullWidth
            required
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            inputProps={{ step: "0.01", min: "0", max: selectedInvoice.balanceDue }}
          />

          <TextField
            label="Payment Date"
            type="date"
            value={paymentFormData.paymentDate}
            onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentDate: e.target.value })}
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
          />

          <FormControl fullWidth required>
            <InputLabel>Payment Method</InputLabel>
            <Select
              value={paymentFormData.paymentMethod}
              label="Payment Method"
              onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentMethod: e.target.value })}
            >
              <MenuItem value="CASH">Cash</MenuItem>
              <MenuItem value="CHECK">Check</MenuItem>
              <MenuItem value="CREDIT_CARD">Credit Card</MenuItem>
              <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
              <MenuItem value="OTHER">Other</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Reference Number"
            value={paymentFormData.referenceNumber}
            onChange={(e) => setPaymentFormData({ ...paymentFormData, referenceNumber: e.target.value })}
            fullWidth
            helperText="Check number, transaction ID, etc."
          />

          <TextField
            label="Notes"
            value={paymentFormData.notes}
            onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
            fullWidth
            multiline
            rows={2}
          />

          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleRecordPayment} variant="contained" color="success" startIcon={<PaymentIcon />}>
          Record Payment
        </Button>
      </DialogActions>
    </Dialog>
  );
}
