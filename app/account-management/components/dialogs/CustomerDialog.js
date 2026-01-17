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

export default function CustomerDialog({
  open,
  onClose,
  editingCustomer,
  customerFormData,
  setCustomerFormData,
  handleSaveCustomer,
  error,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {editingCustomer ? "Edit Customer" : "Add Customer"}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Account ID"
            value={customerFormData.accountId}
            onChange={(e) => setCustomerFormData({ ...customerFormData, accountId: e.target.value })}
            fullWidth
            required
            disabled={editingCustomer}
            helperText={editingCustomer ? "Account ID cannot be changed" : "Enter unique account identifier"}
          />
          <TextField
            label="Company Name"
            value={customerFormData.companyName}
            onChange={(e) => setCustomerFormData({ ...customerFormData, companyName: e.target.value })}
            fullWidth
            required
          />
          <TextField
            label="Contact Person"
            value={customerFormData.contactPerson}
            onChange={(e) => setCustomerFormData({ ...customerFormData, contactPerson: e.target.value })}
            fullWidth
          />
          <TextField
            label="Street Address"
            value={customerFormData.streetAddress}
            onChange={(e) => setCustomerFormData({ ...customerFormData, streetAddress: e.target.value })}
            fullWidth
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="City"
                value={customerFormData.city}
                onChange={(e) => setCustomerFormData({ ...customerFormData, city: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Province"
                value={customerFormData.province}
                onChange={(e) => setCustomerFormData({ ...customerFormData, province: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Postal Code"
                value={customerFormData.postalCode}
                onChange={(e) => setCustomerFormData({ ...customerFormData, postalCode: e.target.value })}
                fullWidth
              />
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Phone Number"
                value={customerFormData.phoneNumber}
                onChange={(e) => setCustomerFormData({ ...customerFormData, phoneNumber: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Email"
                type="email"
                value={customerFormData.email}
                onChange={(e) => setCustomerFormData({ ...customerFormData, email: e.target.value })}
                fullWidth
              />
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Billing Period</InputLabel>
                <Select
                  value={customerFormData.billingPeriod}
                  label="Billing Period"
                  onChange={(e) => setCustomerFormData({ ...customerFormData, billingPeriod: e.target.value })}
                >
                  <MenuItem value="WEEKLY">Weekly</MenuItem>
                  <MenuItem value="BI_WEEKLY">Bi-Weekly</MenuItem>
                  <MenuItem value="MONTHLY">Monthly</MenuItem>
                  <MenuItem value="CUSTOM">Custom</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Credit Limit"
                type="number"
                value={customerFormData.creditLimit}
                onChange={(e) => setCustomerFormData({ ...customerFormData, creditLimit: e.target.value })}
                fullWidth
                InputProps={{ startAdornment: "$" }}
              />
            </Grid>
          </Grid>
          <TextField
            label="Notes"
            value={customerFormData.notes}
            onChange={(e) => setCustomerFormData({ ...customerFormData, notes: e.target.value })}
            fullWidth
            multiline
            rows={3}
          />
          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSaveCustomer} variant="contained">
          {editingCustomer ? "Update" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
