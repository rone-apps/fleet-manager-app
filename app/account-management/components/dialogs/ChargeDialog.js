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
  InputAdornment,
} from "@mui/material";

export default function ChargeDialog({
  open,
  onClose,
  editingCharge,
  chargeFormData,
  setChargeFormData,
  handleSaveCharge,
  cabs,
  drivers,
  error,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {editingCharge ? "Edit Charge" : "Add Charge"}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Trip Date"
                type="date"
                value={chargeFormData.tripDate}
                onChange={(e) => setChargeFormData({ ...chargeFormData, tripDate: e.target.value })}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Job Code"
                value={chargeFormData.jobCode}
                onChange={(e) => setChargeFormData({ ...chargeFormData, jobCode: e.target.value })}
                fullWidth
              />
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Start Time"
                type="time"
                value={chargeFormData.startTime}
                onChange={(e) => setChargeFormData({ ...chargeFormData, startTime: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="End Time"
                type="time"
                value={chargeFormData.endTime}
                onChange={(e) => setChargeFormData({ ...chargeFormData, endTime: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
          <TextField
            label="Pickup Address"
            value={chargeFormData.pickupAddress}
            onChange={(e) => setChargeFormData({ ...chargeFormData, pickupAddress: e.target.value })}
            fullWidth
          />
          <TextField
            label="Dropoff Address"
            value={chargeFormData.dropoffAddress}
            onChange={(e) => setChargeFormData({ ...chargeFormData, dropoffAddress: e.target.value })}
            fullWidth
          />
          <TextField
            label="Passenger Name"
            value={chargeFormData.passengerName}
            onChange={(e) => setChargeFormData({ ...chargeFormData, passengerName: e.target.value })}
            fullWidth
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Cab</InputLabel>
                <Select
                  value={chargeFormData.cabId}
                  label="Cab"
                  onChange={(e) => setChargeFormData({ ...chargeFormData, cabId: e.target.value })}
                >
                  <MenuItem value="">None</MenuItem>
                  {cabs.map((cab) => (
                    <MenuItem key={cab.id} value={cab.id}>
                      {cab.cabNumber} - {cab.cabType}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Driver</InputLabel>
                <Select
                  value={chargeFormData.driverId}
                  label="Driver"
                  onChange={(e) => setChargeFormData({ ...chargeFormData, driverId: e.target.value })}
                >
                  <MenuItem value="">None</MenuItem>
                  {drivers.map((driver) => (
                    <MenuItem key={driver.id} value={driver.id}>
                      {driver.firstName} {driver.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Fare Amount"
                type="number"
                value={chargeFormData.fareAmount}
                onChange={(e) => setChargeFormData({ ...chargeFormData, fareAmount: e.target.value })}
                fullWidth
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                inputProps={{ step: "0.01" }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Tip Amount"
                type="number"
                value={chargeFormData.tipAmount}
                onChange={(e) => setChargeFormData({ ...chargeFormData, tipAmount: e.target.value })}
                fullWidth
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                inputProps={{ step: "0.01" }}
              />
            </Grid>
          </Grid>
          <TextField
            label="Notes"
            value={chargeFormData.notes}
            onChange={(e) => setChargeFormData({ ...chargeFormData, notes: e.target.value })}
            fullWidth
            multiline
            rows={2}
          />
          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSaveCharge} variant="contained">
          {editingCharge ? "Update" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
