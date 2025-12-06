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
  Grid,
} from "@mui/material";
import { Description as InvoiceIcon } from "@mui/icons-material";

export default function GenerateInvoiceDialog({
  open,
  onClose,
  customers,
  generateInvoiceFormData,
  setGenerateInvoiceFormData,
  handleGenerateInvoice,
  error,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Generate Invoice</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <FormControl fullWidth required>
            <InputLabel>Customer</InputLabel>
            <Select
              value={generateInvoiceFormData.customerId || ""}
              label="Customer"
              onChange={(e) => setGenerateInvoiceFormData({ ...generateInvoiceFormData, customerId: e.target.value })}
            >
              {customers.filter(c => c.active).map((customer) => (
                <MenuItem key={customer.id} value={customer.id}>
                  {customer.companyName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Period Start"
                type="date"
                value={generateInvoiceFormData.periodStart}
                onChange={(e) => setGenerateInvoiceFormData({ ...generateInvoiceFormData, periodStart: e.target.value })}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Period End"
                type="date"
                value={generateInvoiceFormData.periodEnd}
                onChange={(e) => setGenerateInvoiceFormData({ ...generateInvoiceFormData, periodEnd: e.target.value })}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          <TextField
            label="Tax Rate (%)"
            type="number"
            value={generateInvoiceFormData.taxRate}
            onChange={(e) => setGenerateInvoiceFormData({ ...generateInvoiceFormData, taxRate: e.target.value })}
            fullWidth
            inputProps={{ step: "0.1", min: "0", max: "100" }}
            helperText="e.g., 5.0 for 5% GST, 13.0 for 13% HST"
          />

          <TextField
            label="Terms"
            value={generateInvoiceFormData.terms}
            onChange={(e) => setGenerateInvoiceFormData({ ...generateInvoiceFormData, terms: e.target.value })}
            fullWidth
            multiline
            rows={3}
            helperText="Payment terms and conditions"
          />

          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleGenerateInvoice} variant="contained" startIcon={<InvoiceIcon />}>
          Generate
        </Button>
      </DialogActions>
    </Dialog>
  );
}
