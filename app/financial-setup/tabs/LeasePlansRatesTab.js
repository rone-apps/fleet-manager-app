import { useState, useEffect } from "react";
import {
  Box, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, FormControl,
  InputLabel, Select, MenuItem, IconButton, Chip, Paper, Grid,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as PlanIcon,
  AttachMoney as MoneyIcon,
  Block as BlockIcon,
} from "@mui/icons-material";
import { Alert, AlertTitle } from "@mui/material";
import { API_BASE_URL } from "../../lib/api";

export default function LeasePlansRatesTab({
  canEdit,
  canDelete,
  setError,
  setSuccess,
  updateStats,
}) {
  const [leasePlans, setLeasePlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [leaseRates, setLeaseRates] = useState([]);
  
  // Plan Dialog
  const [openPlanDialog, setOpenPlanDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planFormData, setPlanFormData] = useState({
    planName: "",
    effectiveFrom: "",
    effectiveTo: "",
    notes: "",
  });

  // Rate Dialog
  const [openRateDialog, setOpenRateDialog] = useState(false);
  const [editingRate, setEditingRate] = useState(null);
  const [rateFormData, setRateFormData] = useState({
    cabType: "SEDAN",
    hasAirportLicense: false,
    shiftType: "DAY",
    dayOfWeek: "MONDAY",
    baseRate: "",
    mileageRate: "",
    notes: "",
  });

  // Delete Warning Dialogs
  const [openPlanDeleteWarning, setOpenPlanDeleteWarning] = useState(false);
  const [planDeleteWarningData, setPlanDeleteWarningData] = useState({ name: "" });
  const [openRateDeleteWarning, setOpenRateDeleteWarning] = useState(false);
  const [rateDeleteWarningData, setRateDeleteWarningData] = useState({ info: "" });

  useEffect(() => {
    loadLeasePlans();
  }, []);

  const loadLeasePlans = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/lease-plans`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });
      if (response.ok) {
        const data = await response.json();
        setLeasePlans(data);
        updateStats({ leasePlans: data.length });
      }
    } catch (err) {
      console.error("Error loading lease plans:", err);
    }
  };

  const loadLeaseRates = async (planId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/lease-plans/${planId}/rates`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });
      if (response.ok) {
        const data = await response.json();
        setLeaseRates(data);
        updateStats({ leaseRates: data.length });
      } else {
        setLeaseRates([]);
        updateStats({ leaseRates: 0 });
      }
    } catch (err) {
      console.error("Error loading lease rates:", err);
      setLeaseRates([]);
    }
  };

  const handleSelectPlan = async (plan) => {
    setSelectedPlan(plan);
    await loadLeaseRates(plan.id);
  };

  // ============ PLAN CRUD ============
  const handleOpenPlanDialog = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanFormData({
        planName: plan.planName || "",
        effectiveFrom: plan.effectiveFrom || "",
        effectiveTo: plan.effectiveTo || "",
        notes: plan.notes || "",
      });
    } else {
      setEditingPlan(null);
      setPlanFormData({
        planName: "",
        effectiveFrom: "",
        effectiveTo: "",
        notes: "",
      });
    }
    setOpenPlanDialog(true);
  };

  const handleSavePlan = async () => {
    if (!planFormData.planName) {
      setError("Plan name is required");
      return;
    }

    try {
      const url = editingPlan
        ? `${API_BASE_URL}/lease-plans/${editingPlan.id}`
        : `${API_BASE_URL}/lease-plans`;

      const payload = {
        ...planFormData,
        effectiveFrom: planFormData.effectiveFrom || null,
        effectiveTo: planFormData.effectiveTo || null,
      };

      const response = await fetch(url, {
        method: editingPlan ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        setError(`Failed to save lease plan: ${errorText}`);
        return;
      }

      setSuccess(editingPlan ? "Lease plan updated" : "Lease plan created");
      setOpenPlanDialog(false);
      loadLeasePlans();
    } catch (err) {
      setError("Failed to save lease plan: " + err.message);
    }
  };

  const handleDeletePlan = (id) => {
    const plan = leasePlans.find((p) => p.id === id);
    setPlanDeleteWarningData({ name: plan?.planName || "" });
    setOpenPlanDeleteWarning(true);
  };

  // ============ RATE CRUD ============
  const handleOpenRateDialog = (rate = null) => {
    if (rate) {
      setEditingRate(rate);
      setRateFormData({
        cabType: rate.cabType || "SEDAN",
        hasAirportLicense: rate.hasAirportLicense || false,
        shiftType: rate.shiftType || "DAY",
        dayOfWeek: rate.dayOfWeek || "MONDAY",
        baseRate: rate.baseRate?.toString() || "",
        mileageRate: rate.mileageRate?.toString() || "",
        notes: rate.notes || "",
      });
    } else {
      setEditingRate(null);
      setRateFormData({
        cabType: "SEDAN",
        hasAirportLicense: false,
        shiftType: "DAY",
        dayOfWeek: "MONDAY",
        baseRate: "",
        mileageRate: "",
        notes: "",
      });
    }
    setOpenRateDialog(true);
  };

  const handleSaveRate = async () => {
    if (!rateFormData.baseRate) {
      setError("Base rate is required");
      return;
    }

    try {
      const url = editingRate
        ? `${API_BASE_URL}/lease-plans/${selectedPlan.id}/rates/${editingRate.id}`
        : `${API_BASE_URL}/lease-plans/${selectedPlan.id}/rates`;

      const rateData = {
        ...rateFormData,
        baseRate: parseFloat(rateFormData.baseRate) || 0,
        mileageRate: parseFloat(rateFormData.mileageRate) || 0,
      };

      // POST expects an array, PUT expects a single object
      const payload = editingRate ? rateData : [rateData];

      const response = await fetch(url, {
        method: editingRate ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        setError(`Failed to save lease rate: ${errorText}`);
        return;
      }

      setSuccess(editingRate ? "Lease rate updated" : "Lease rate created");
      setOpenRateDialog(false);
      loadLeaseRates(selectedPlan.id);
      loadLeasePlans(); // Refresh to update rate count
    } catch (err) {
      setError("Failed to save lease rate: " + err.message);
    }
  };

  const handleDeleteRate = (id) => {
    const rate = leaseRates.find((r) => r.id === id);
    setRateDeleteWarningData({
      info: `${rate?.cabType || "N/A"} - ${rate?.shiftType || "N/A"} - ${rate?.dayOfWeek || "N/A"}`,
    });
    setOpenRateDeleteWarning(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Left: Lease Plans List */}
        <Grid item xs={12} md={selectedPlan ? 5 : 12}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="h6">Lease Plans</Typography>
            {canEdit && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenPlanDialog()}
              >
                Add Lease Plan
              </Button>
            )}
          </Box>

          {leasePlans.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: "center" }}>
              <PlanIcon sx={{ fontSize: 60, color: "text.disabled", mb: 2 }} />
              <Typography color="text.secondary">
                No lease plans found. Create your first lease plan to get started.
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Plan Name</TableCell>
                    <TableCell>Effective From</TableCell>
                    <TableCell>Effective To</TableCell>
                    <TableCell>Rates</TableCell>
                    {canEdit && <TableCell align="right">Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leasePlans.map((plan) => (
                    <TableRow
                      key={plan.id}
                      hover
                      selected={selectedPlan?.id === plan.id}
                      onClick={() => handleSelectPlan(plan)}
                      sx={{ cursor: "pointer" }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {plan.planName}
                        </Typography>
                        {plan.notes && (
                          <Typography variant="caption" color="text.secondary">
                            {plan.notes}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{plan.effectiveFrom || "-"}</TableCell>
                      <TableCell>{plan.effectiveTo || "Current"}</TableCell>
                      <TableCell>
                        <Chip
                          label={`${plan.rateCount || 0} rates`}
                          size="small"
                          color={plan.rateCount > 0 ? "primary" : "default"}
                        />
                      </TableCell>
                      {canEdit && (
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenPlanDialog(plan);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                          {canDelete && (
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePlan(plan.id);
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Grid>

        {/* Right: Lease Rates for Selected Plan */}
        {selectedPlan && (
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Box>
                  <Typography variant="h6">Rates for: {selectedPlan.planName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedPlan.effectiveFrom || "N/A"} -{" "}
                    {selectedPlan.effectiveTo || "Current"}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                  {canEdit && (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => handleOpenRateDialog()}
                    >
                      Add Rate
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setSelectedPlan(null)}
                  >
                    Close
                  </Button>
                </Box>
              </Box>

              {leaseRates.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <MoneyIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                  <Typography color="text.secondary">
                    No rates defined for this plan yet.
                  </Typography>
                </Box>
              ) : (
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Cab Type</TableCell>
                        <TableCell>Shift</TableCell>
                        <TableCell>Day</TableCell>
                        <TableCell>Airport</TableCell>
                        <TableCell align="right">Base Rate</TableCell>
                        <TableCell align="right">Mileage Rate</TableCell>
                        {canEdit && <TableCell align="right">Actions</TableCell>}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {leaseRates.map((rate) => (
                        <TableRow key={rate.id} hover>
                          <TableCell>
                            <Chip label={rate.cabType} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>{rate.shiftType}</TableCell>
                          <TableCell>{rate.dayOfWeek}</TableCell>
                          <TableCell>
                            <Chip
                              label={rate.hasAirportLicense ? "Yes" : "No"}
                              size="small"
                              color={rate.hasAirportLicense ? "success" : "default"}
                            />
                          </TableCell>
                          <TableCell align="right">
                            ${parseFloat(rate.baseRate || 0).toFixed(2)}
                          </TableCell>
                          <TableCell align="right">
                            ${parseFloat(rate.mileageRate || 0).toFixed(2)}
                          </TableCell>
                          {canEdit && (
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenRateDialog(rate)}
                              >
                                <EditIcon />
                              </IconButton>
                              {canDelete && (
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteRate(rate.id)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Plan Dialog */}
      <Dialog open={openPlanDialog} onClose={() => setOpenPlanDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: "primary.light" }}>
          {editingPlan ? "Edit Lease Plan" : "Add Lease Plan"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <TextField
              label="Plan Name"
              value={planFormData.planName}
              onChange={(e) => setPlanFormData({ ...planFormData, planName: e.target.value })}
              required
              placeholder="E.g., Standard Lease Plan 2024"
            />
            <TextField
              label="Effective From"
              type="date"
              value={planFormData.effectiveFrom}
              onChange={(e) =>
                setPlanFormData({ ...planFormData, effectiveFrom: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Effective To"
              type="date"
              value={planFormData.effectiveTo}
              onChange={(e) =>
                setPlanFormData({ ...planFormData, effectiveTo: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
              helperText="Leave empty for currently active plan"
            />
            <TextField
              label="Notes"
              value={planFormData.notes}
              onChange={(e) => setPlanFormData({ ...planFormData, notes: e.target.value })}
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPlanDialog(false)}>Cancel</Button>
          <Button onClick={handleSavePlan} variant="contained">
            {editingPlan ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rate Dialog */}
      <Dialog open={openRateDialog} onClose={() => setOpenRateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: "secondary.light" }}>
          {editingRate ? "Edit Lease Rate" : "Add Lease Rate"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Cab Type</InputLabel>
              <Select
                value={rateFormData.cabType}
                label="Cab Type"
                onChange={(e) => setRateFormData({ ...rateFormData, cabType: e.target.value })}
              >
                <MenuItem value="SEDAN">Sedan</MenuItem>
                <MenuItem value="SUV">SUV</MenuItem>
                <MenuItem value="VAN">Van</MenuItem>
                <MenuItem value="WHEELCHAIR">Wheelchair</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Shift Type</InputLabel>
              <Select
                value={rateFormData.shiftType}
                label="Shift Type"
                onChange={(e) => setRateFormData({ ...rateFormData, shiftType: e.target.value })}
              >
                <MenuItem value="DAY">Day</MenuItem>
                <MenuItem value="NIGHT">Night</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Day of Week</InputLabel>
              <Select
                value={rateFormData.dayOfWeek}
                label="Day of Week"
                onChange={(e) => setRateFormData({ ...rateFormData, dayOfWeek: e.target.value })}
              >
                <MenuItem value="MONDAY">Monday</MenuItem>
                <MenuItem value="TUESDAY">Tuesday</MenuItem>
                <MenuItem value="WEDNESDAY">Wednesday</MenuItem>
                <MenuItem value="THURSDAY">Thursday</MenuItem>
                <MenuItem value="FRIDAY">Friday</MenuItem>
                <MenuItem value="SATURDAY">Saturday</MenuItem>
                <MenuItem value="SUNDAY">Sunday</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Has Airport License</InputLabel>
              <Select
                value={rateFormData.hasAirportLicense}
                label="Has Airport License"
                onChange={(e) =>
                  setRateFormData({ ...rateFormData, hasAirportLicense: e.target.value })
                }
              >
                <MenuItem value={true}>Yes</MenuItem>
                <MenuItem value={false}>No</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Base Rate ($)"
              type="number"
              value={rateFormData.baseRate}
              onChange={(e) => setRateFormData({ ...rateFormData, baseRate: e.target.value })}
              required
              inputProps={{ step: "0.01", min: "0" }}
            />
            <TextField
              label="Mileage Rate ($ per mile)"
              type="number"
              value={rateFormData.mileageRate}
              onChange={(e) =>
                setRateFormData({ ...rateFormData, mileageRate: e.target.value })
              }
              inputProps={{ step: "0.01", min: "0" }}
            />
            <TextField
              label="Notes"
              value={rateFormData.notes}
              onChange={(e) => setRateFormData({ ...rateFormData, notes: e.target.value })}
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRateDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveRate} variant="contained" color="secondary">
            {editingRate ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Plan Delete Warning Dialog */}
      <Dialog
        open={openPlanDeleteWarning}
        onClose={() => setOpenPlanDeleteWarning(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            bgcolor: "error.light",
            color: "error.contrastText",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <BlockIcon />
          Cannot Delete Lease Plan
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              <AlertTitle>Deletion Blocked</AlertTitle>
              The lease plan "{planDeleteWarningData.name}" cannot be deleted.
            </Alert>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Reason:
              </Typography>
              <Typography variant="body2">
                Lease plans are used to calculate driver lease charges. Deleting
                a plan could affect historical financial records and break lease
                calculations for past shifts.
              </Typography>
            </Box>

            <Box sx={{ p: 2, bgcolor: "info.lighter", borderRadius: 1 }}>
              <Typography variant="subtitle2" color="info.main" gutterBottom>
                What you can do:
              </Typography>
              <Typography variant="body2">
                If this plan is no longer needed, set an "Effective To" end date
                on it instead. This will prevent it from being used for future
                calculations while preserving historical data.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenPlanDeleteWarning(false)}
            variant="contained"
          >
            I Understand
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rate Delete Warning Dialog */}
      <Dialog
        open={openRateDeleteWarning}
        onClose={() => setOpenRateDeleteWarning(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            bgcolor: "error.light",
            color: "error.contrastText",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <BlockIcon />
          Cannot Delete Lease Rate
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              <AlertTitle>Deletion Blocked</AlertTitle>
              The lease rate ({rateDeleteWarningData.info}) cannot be deleted.
            </Alert>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Reason:
              </Typography>
              <Typography variant="body2">
                Lease rates are used to calculate driver charges. Deleting rates
                could cause incorrect calculations for historical and future
                shifts.
              </Typography>
            </Box>

            <Box sx={{ p: 2, bgcolor: "info.lighter", borderRadius: 1 }}>
              <Typography variant="subtitle2" color="info.main" gutterBottom>
                What you can do:
              </Typography>
              <Typography variant="body2">
                If the rate is incorrect, edit it instead of deleting. If this
                rate configuration is no longer needed, consider creating a new
                lease plan with updated rates for future use.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenRateDeleteWarning(false)}
            variant="contained"
          >
            I Understand
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}