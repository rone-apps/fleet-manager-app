import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Paper,
  Grid,
  Tooltip,
  Tabs,
  Tab,
  Alert,
  Autocomplete,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ToggleOn,
  ToggleOff,
  Block as BlockIcon,
} from "@mui/icons-material";
import { AlertTitle } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { API_BASE_URL } from "../../lib/api";

export default function LeaseRateOverridesTab({
  canEdit,
  canDelete,
  setError,
  setSuccess,
  updateStats,
}) {
  const [owners, setOwners] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState("");
  const [loadAllRates, setLoadAllRates] = useState(false);
  const [ownerCabs, setOwnerCabs] = useState([]);
  const [ownerShiftTypes, setOwnerShiftTypes] = useState([]); // Available shift types for selected owner
  const [leaseRateOverrides, setLeaseRateOverrides] = useState([]);

  // Delete Warning Dialog
  const [openDeleteWarning, setOpenDeleteWarning] = useState(false);
  const [deleteWarningData, setDeleteWarningData] = useState({ info: "" });

  const [openOverrideDialog, setOpenOverrideDialog] = useState(false);
  const [editingOverride, setEditingOverride] = useState(null);
  const [overrideTabValue, setOverrideTabValue] = useState(0);
  const [overrideFormData, setOverrideFormData] = useState({
    ownerDriverNumber: "",
    cabNumber: "",
    shiftType: "",
    dayOfWeek: "",
    leaseRate: "",
    startDate: new Date(),
    endDate: null,
    notes: "",
    isActive: true,
  });
  const [bulkOverrideFormData, setBulkOverrideFormData] = useState({
    ownerDriverNumber: "",
    cabNumber: "",
    shiftType: "",
    daysOfWeek: [],
    leaseRate: "",
    startDate: new Date(),
    endDate: null,
    notes: "",
  });

  const daysOfWeek = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ];

  useEffect(() => {
    loadOwners();
  }, []);

  const loadOwners = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/drivers`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });
      if (response.ok) {
        const data = await response.json();
        const ownerDrivers = data.filter((d) => d.isOwner);
        setOwners(ownerDrivers);
      }
    } catch (err) {
      console.error("Error loading owners:", err);
    }
  };

  const loadOwnerCabs = async (ownerId) => {
    if (!ownerId) {
      setOwnerCabs([]);
      return;
    }

    try {
      // Fetch shifts for this owner to get their cabs
      const response = await fetch(
        `${API_BASE_URL}/shifts/owner/${ownerId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          },
        }
      );
      if (response.ok) {
        const shiftsData = await response.json();
        // Extract unique cabs from shifts
        const uniqueCabNumbers = [...new Set(shiftsData.map((s) => s.cabNumber))].filter(Boolean);
        const cabs = uniqueCabNumbers.map((cabNumber) => {
          const shift = shiftsData.find((s) => s.cabNumber === cabNumber);
          return {
            cabNumber,
            cabType: shift?.cabType,
            hasAirportLicense: shift?.hasAirportLicense,
          };
        });
        setOwnerCabs(cabs);

        // Extract unique shift types owned by this owner
        const uniqueShiftTypes = [...new Set(shiftsData.map((s) => s.shiftType))].filter(Boolean);
        setOwnerShiftTypes(uniqueShiftTypes);
      } else {
        setOwnerCabs([]);
        setOwnerShiftTypes([]);
      }
    } catch (err) {
      console.error("Error loading owner cabs:", err);
      setOwnerCabs([]);
      setOwnerShiftTypes([]);
    }
  };

  const loadLeaseRateOverrides = async (ownerNumber) => {
    if (!ownerNumber) {
      setLeaseRateOverrides([]);
      updateStats({ leaseRateOverrides: 0 });
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/lease-rate-overrides/owner/${ownerNumber}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          },
        }
      );
      if (response.ok) {
        const result = await response.json();
        const overrides = result.data || [];
        setLeaseRateOverrides(overrides);
        updateStats({
          leaseRateOverrides: overrides.filter((o) => o.isActive).length,
        });
      }
    } catch (err) {
      console.error("Error loading lease rate overrides:", err);
    }
  };

  const loadAllLeaseRateOverrides = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/lease-rate-overrides`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          },
        }
      );
      if (response.ok) {
        const result = await response.json();
        const overrides = result.data || result || [];
        setLeaseRateOverrides(overrides);
        updateStats({
          leaseRateOverrides: overrides.filter((o) => o.isActive).length,
        });
      }
    } catch (err) {
      console.error("Error loading all lease rate overrides:", err);
    }
  };

  const handleOwnerChange = (ownerNumber) => {
    setSelectedOwner(ownerNumber);
    // Find the owner's database ID from the owners list
    const owner = owners.find((o) => o.driverNumber === ownerNumber);
    if (owner) {
      loadOwnerCabs(owner.id);
    } else {
      setOwnerCabs([]);
    }
    if (ownerNumber) {
      setLoadAllRates(false); // Uncheck "Load All" when selecting an owner
      loadLeaseRateOverrides(ownerNumber);
    } else {
      setLeaseRateOverrides([]);
    }
  };

  const handleLoadAllChange = (event) => {
    const checked = event.target.checked;
    setLoadAllRates(checked);
    if (checked) {
      setSelectedOwner(""); // Clear owner selection when loading all
      setOwnerCabs([]);
      setOwnerShiftTypes([]);
      loadAllLeaseRateOverrides();
    } else {
      setLeaseRateOverrides([]);
      updateStats({ leaseRateOverrides: 0 });
    }
  };

  const handleOpenOverrideDialog = (override = null) => {
    if (override) {
      setEditingOverride(override);
      setOverrideFormData({
        ownerDriverNumber: override.ownerDriverNumber,
        cabNumber: override.cabNumber || "",
        shiftType: override.shiftType || "",
        dayOfWeek: override.dayOfWeek || "",
        leaseRate: override.leaseRate,
        startDate: new Date(override.startDate),
        endDate: override.endDate ? new Date(override.endDate) : null,
        notes: override.notes || "",
        isActive: override.isActive,
      });
    } else {
      setEditingOverride(null);
      setOverrideFormData({
        ownerDriverNumber: selectedOwner,
        cabNumber: "",
        shiftType: "",
        dayOfWeek: "",
        leaseRate: "",
        startDate: new Date(),
        endDate: null,
        notes: "",
        isActive: true,
      });
    }
    setOverrideTabValue(0);
    setOpenOverrideDialog(true);
  };

  const handleSaveOverride = async () => {
    if (!overrideFormData.leaseRate) {
      setError("Lease rate is required");
      return;
    }

    try {
      const url = editingOverride
        ? `${API_BASE_URL}/lease-rate-overrides/${editingOverride.id}`
        : `${API_BASE_URL}/lease-rate-overrides`;

      const payload = {
        ...overrideFormData,
        startDate: overrideFormData.startDate.toISOString().split("T")[0],
        endDate: overrideFormData.endDate
          ? overrideFormData.endDate.toISOString().split("T")[0]
          : null,
        cabNumber: overrideFormData.cabNumber || null,
        shiftType: overrideFormData.shiftType || null,
        dayOfWeek: overrideFormData.dayOfWeek || null,
        leaseRate: parseFloat(overrideFormData.leaseRate),
      };

      const response = await fetch(url, {
        method: editingOverride ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to save override");
        return;
      }

      setSuccess(editingOverride ? "Override updated" : "Override created");
      setOpenOverrideDialog(false);
      if (loadAllRates) {
        loadAllLeaseRateOverrides();
      } else {
        loadLeaseRateOverrides(selectedOwner);
      }
    } catch (err) {
      console.error("Error saving override:", err);
      setError("Failed to save override: " + err.message);
    }
  };

  const handleBulkSaveOverride = async () => {
    if (bulkOverrideFormData.daysOfWeek.length === 0) {
      setError("Please select at least one day of week");
      return;
    }

    if (!bulkOverrideFormData.leaseRate) {
      setError("Lease rate is required");
      return;
    }

    try {
      const payload = {
        ownerDriverNumber:
          bulkOverrideFormData.ownerDriverNumber || selectedOwner,
        cabNumber: bulkOverrideFormData.cabNumber || null,
        shiftType: bulkOverrideFormData.shiftType || null,
        daysOfWeek: bulkOverrideFormData.daysOfWeek,
        leaseRate: parseFloat(bulkOverrideFormData.leaseRate),
        startDate: bulkOverrideFormData.startDate.toISOString().split("T")[0],
        endDate: bulkOverrideFormData.endDate
          ? bulkOverrideFormData.endDate.toISOString().split("T")[0]
          : null,
        notes: bulkOverrideFormData.notes,
      };

      const response = await fetch(`${API_BASE_URL}/lease-rate-overrides/bulk`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to create bulk overrides");
        return;
      }

      const result = await response.json();
      setSuccess(`Created ${result.count} overrides successfully`);
      setOpenOverrideDialog(false);
      if (loadAllRates) {
        loadAllLeaseRateOverrides();
      } else {
        loadLeaseRateOverrides(selectedOwner);
      }

      setBulkOverrideFormData({
        ownerDriverNumber: selectedOwner,
        cabNumber: "",
        shiftType: "",
        daysOfWeek: [],
        leaseRate: "",
        startDate: new Date(),
        endDate: null,
        notes: "",
      });
    } catch (err) {
      console.error("Error creating bulk overrides:", err);
      setError("Failed to create bulk overrides: " + err.message);
    }
  };

  const handleToggleOverrideActive = async (override) => {
    try {
      const endpoint = override.isActive ? "deactivate" : "activate";
      const response = await fetch(
        `${API_BASE_URL}/lease-rate-overrides/${override.id}/${endpoint}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          },
        }
      );

      if (!response.ok) {
        setError(`Failed to ${endpoint} override`);
        return;
      }

      setSuccess(`Override ${endpoint}d successfully`);
      if (loadAllRates) {
        loadAllLeaseRateOverrides();
      } else {
        loadLeaseRateOverrides(selectedOwner);
      }
    } catch (err) {
      console.error("Error toggling override:", err);
      setError("Failed to toggle override status");
    }
  };

  const handleDeleteOverride = (id) => {
    const override = leaseRateOverrides.find((o) => o.id === id);
    setDeleteWarningData({
      info: `${override?.cabNumber || "All Cabs"} - ${override?.shiftType || "Both"} - ${override?.dayOfWeek || "All Days"}`,
    });
    setOpenDeleteWarning(true);
  };

  const getDisplayValue = (value, defaultText = "All") => {
    return value || defaultText;
  };

  const getPriorityColor = (priority) => {
    if (priority >= 80) return "error";
    if (priority >= 50) return "warning";
    return "info";
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Owner Selection */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={loadAllRates}
                  onChange={handleLoadAllChange}
                  color="primary"
                />
              }
              label="Load All Rates"
            />
          </Grid>
          <Grid item xs={12} sm={5}>
            <Autocomplete
              options={[...owners].sort((a, b) => {
                const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
                const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
                return nameA.localeCompare(nameB);
              })}
              getOptionLabel={(option) =>
                `${option.driverNumber} - ${option.firstName} ${option.lastName}`
              }
              value={owners.find((o) => o.driverNumber === selectedOwner) || null}
              onChange={(e, newValue) =>
                handleOwnerChange(newValue?.driverNumber || "")
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search Owner"
                  placeholder="Type to search..."
                />
              )}
              isOptionEqualToValue={(option, value) =>
                option.driverNumber === value.driverNumber
              }
              fullWidth
              disabled={loadAllRates}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            {canEdit && (selectedOwner || loadAllRates) && (
              <Button
                variant="contained"
                color="secondary"
                startIcon={<AddIcon />}
                onClick={() => handleOpenOverrideDialog()}
                fullWidth
                disabled={loadAllRates && !selectedOwner}
              >
                New Override
              </Button>
            )}
            {loadAllRates && !selectedOwner && canEdit && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Select an owner to create new overrides
              </Typography>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Overrides Table */}
      {(selectedOwner || loadAllRates) && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "grey.100" }}>
                {loadAllRates && <TableCell>Owner</TableCell>}
                <TableCell>Cab</TableCell>
                <TableCell>Shift</TableCell>
                <TableCell>Day of Week</TableCell>
                <TableCell align="right">Rate</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell align="center">Priority</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell>Notes</TableCell>
                {canEdit && <TableCell align="center">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {leaseRateOverrides.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={loadAllRates ? 11 : 10} align="center">
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ py: 4 }}
                    >
                      {loadAllRates 
                        ? "No overrides found in the system."
                        : "No overrides found. Click \"New Override\" to create one."}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                leaseRateOverrides.map((override) => (
                  <TableRow
                    key={override.id}
                    sx={{
                      "&:hover": { bgcolor: "action.hover" },
                      opacity: override.isActive ? 1 : 0.6,
                    }}
                  >
                    {loadAllRates && (
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {override.ownerDriverNumber}
                        </Typography>
                        {override.ownerName && (
                          <Typography variant="caption" color="text.secondary">
                            {override.ownerName}
                          </Typography>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {getDisplayValue(override.cabNumber, "All Cabs")}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getDisplayValue(override.shiftType, "Both")}
                        size="small"
                        color={
                          override.shiftType === "DAY"
                            ? "primary"
                            : override.shiftType === "NIGHT"
                            ? "secondary"
                            : "default"
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {getDisplayValue(override.dayOfWeek, "All Days")}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        color="success.main"
                      >
                        ${parseFloat(override.leaseRate).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(override.startDate).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {override.endDate ? (
                        <Typography variant="body2">
                          {new Date(override.endDate).toLocaleDateString()}
                        </Typography>
                      ) : (
                        <Chip label="Ongoing" size="small" color="info" />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={override.priority}
                        size="small"
                        color={getPriorityColor(override.priority)}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={override.isActive ? "Active" : "Inactive"}
                        size="small"
                        color={override.isActive ? "success" : "default"}
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title={override.notes || "No notes"}>
                        <Typography
                          variant="body2"
                          sx={{
                            maxWidth: 150,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {override.notes || "-"}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    {canEdit && (
                      <TableCell align="center">
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenOverrideDialog(override)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip
                            title={
                              override.isActive ? "Deactivate" : "Activate"
                            }
                          >
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleToggleOverrideActive(override)
                              }
                            >
                              {override.isActive ? (
                                <ToggleOn fontSize="small" color="success" />
                              ) : (
                                <ToggleOff fontSize="small" />
                              )}
                            </IconButton>
                          </Tooltip>
                          {canDelete && (
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleDeleteOverride(override.id)
                                }
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Override Dialog */}
      <Dialog
        open={openOverrideDialog}
        onClose={() => setOpenOverrideDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "secondary.light" }}>
          {editingOverride ? "Edit Override" : "Create New Override"}
        </DialogTitle>
        <DialogContent>
          <Tabs
            value={overrideTabValue}
            onChange={(e, v) => setOverrideTabValue(v)}
            sx={{ mb: 3, mt: 1 }}
          >
            <Tab label="Single Override" />
            <Tab label="Bulk Create" disabled={!!editingOverride} />
          </Tabs>

          {overrideTabValue === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Cab Number</InputLabel>
                  <Select
                    value={overrideFormData.cabNumber}
                    onChange={(e) =>
                      setOverrideFormData({
                        ...overrideFormData,
                        cabNumber: e.target.value,
                      })
                    }
                    label="Cab Number"
                  >
                    <MenuItem value="">All Cabs</MenuItem>
                    {ownerCabs.map((cab) => (
                      <MenuItem key={cab.cabNumber} value={cab.cabNumber}>
                        {cab.cabNumber}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Shift Type</InputLabel>
                  <Select
                    value={
                      ownerShiftTypes.length === 1
                        ? ownerShiftTypes[0]
                        : overrideFormData.shiftType
                    }
                    onChange={(e) =>
                      setOverrideFormData({
                        ...overrideFormData,
                        shiftType: e.target.value,
                      })
                    }
                    label="Shift Type"
                    disabled={ownerShiftTypes.length === 1}
                  >
                    {ownerShiftTypes.length > 1 && (
                      <MenuItem value="">Both Shifts</MenuItem>
                    )}
                    {ownerShiftTypes.includes("DAY") && (
                      <MenuItem value="DAY">DAY</MenuItem>
                    )}
                    {ownerShiftTypes.includes("NIGHT") && (
                      <MenuItem value="NIGHT">NIGHT</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Day of Week</InputLabel>
                  <Select
                    value={overrideFormData.dayOfWeek}
                    onChange={(e) =>
                      setOverrideFormData({
                        ...overrideFormData,
                        dayOfWeek: e.target.value,
                      })
                    }
                    label="Day of Week"
                  >
                    <MenuItem value="">All Days</MenuItem>
                    {daysOfWeek.map((day) => (
                      <MenuItem key={day} value={day}>
                        {day}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Lease Rate"
                  type="number"
                  value={overrideFormData.leaseRate}
                  onChange={(e) =>
                    setOverrideFormData({
                      ...overrideFormData,
                      leaseRate: e.target.value,
                    })
                  }
                  InputProps={{ startAdornment: "$" }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Start Date"
                  value={overrideFormData.startDate}
                  onChange={(date) =>
                    setOverrideFormData({
                      ...overrideFormData,
                      startDate: date,
                    })
                  }
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="End Date (Optional)"
                  value={overrideFormData.endDate}
                  onChange={(date) =>
                    setOverrideFormData({ ...overrideFormData, endDate: date })
                  }
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={2}
                  value={overrideFormData.notes}
                  onChange={(e) =>
                    setOverrideFormData({
                      ...overrideFormData,
                      notes: e.target.value,
                    })
                  }
                />
              </Grid>
            </Grid>
          )}

          {overrideTabValue === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Alert severity="info">
                  Bulk create allows you to create multiple overrides for
                  different days with the same rate.
                </Alert>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Cab Number</InputLabel>
                  <Select
                    value={bulkOverrideFormData.cabNumber}
                    onChange={(e) =>
                      setBulkOverrideFormData({
                        ...bulkOverrideFormData,
                        cabNumber: e.target.value,
                      })
                    }
                    label="Cab Number"
                  >
                    <MenuItem value="">All Cabs</MenuItem>
                    {ownerCabs.map((cab) => (
                      <MenuItem key={cab.cabNumber} value={cab.cabNumber}>
                        {cab.cabNumber}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Shift Type</InputLabel>
                  <Select
                    value={
                      ownerShiftTypes.length === 1
                        ? ownerShiftTypes[0]
                        : bulkOverrideFormData.shiftType
                    }
                    onChange={(e) =>
                      setBulkOverrideFormData({
                        ...bulkOverrideFormData,
                        shiftType: e.target.value,
                      })
                    }
                    label="Shift Type"
                    disabled={ownerShiftTypes.length === 1}
                  >
                    {ownerShiftTypes.length > 1 && (
                      <MenuItem value="">Both Shifts</MenuItem>
                    )}
                    {ownerShiftTypes.includes("DAY") && (
                      <MenuItem value="DAY">DAY</MenuItem>
                    )}
                    {ownerShiftTypes.includes("NIGHT") && (
                      <MenuItem value="NIGHT">NIGHT</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Days of Week</InputLabel>
                  <Select
                    multiple
                    value={bulkOverrideFormData.daysOfWeek}
                    onChange={(e) =>
                      setBulkOverrideFormData({
                        ...bulkOverrideFormData,
                        daysOfWeek: e.target.value,
                      })
                    }
                    label="Days of Week"
                    renderValue={(selected) => (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {daysOfWeek.map((day) => (
                      <MenuItem key={day} value={day}>
                        {day}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Lease Rate"
                  type="number"
                  value={bulkOverrideFormData.leaseRate}
                  onChange={(e) =>
                    setBulkOverrideFormData({
                      ...bulkOverrideFormData,
                      leaseRate: e.target.value,
                    })
                  }
                  InputProps={{ startAdornment: "$" }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Start Date"
                  value={bulkOverrideFormData.startDate}
                  onChange={(date) =>
                    setBulkOverrideFormData({
                      ...bulkOverrideFormData,
                      startDate: date,
                    })
                  }
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />
              </Grid>
              <Grid item xs={12}>
                <DatePicker
                  label="End Date (Optional)"
                  value={bulkOverrideFormData.endDate}
                  onChange={(date) =>
                    setBulkOverrideFormData({
                      ...bulkOverrideFormData,
                      endDate: date,
                    })
                  }
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={2}
                  value={bulkOverrideFormData.notes}
                  onChange={(e) =>
                    setBulkOverrideFormData({
                      ...bulkOverrideFormData,
                      notes: e.target.value,
                    })
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <Alert severity="success">
                  This will create {bulkOverrideFormData.daysOfWeek.length}{" "}
                  override(s)
                </Alert>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenOverrideDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={
              overrideTabValue === 0
                ? handleSaveOverride
                : handleBulkSaveOverride
            }
          >
            {editingOverride ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Warning Dialog */}
      <Dialog
        open={openDeleteWarning}
        onClose={() => setOpenDeleteWarning(false)}
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
          Cannot Delete Lease Rate Override
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              <AlertTitle>Deletion Blocked</AlertTitle>
              The lease rate override ({deleteWarningData.info}) cannot be deleted.
            </Alert>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Reason:
              </Typography>
              <Typography variant="body2">
                Lease rate overrides may have been used to calculate driver
                charges. Deleting them could affect historical financial
                calculations and audit trails.
              </Typography>
            </Box>

            <Box sx={{ p: 2, bgcolor: "info.lighter", borderRadius: 1 }}>
              <Typography variant="subtitle2" color="info.main" gutterBottom>
                What you can do:
              </Typography>
              <Typography variant="body2">
                If this override is no longer needed, deactivate it instead. This
                will prevent it from being used for future calculations while
                preserving historical data.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenDeleteWarning(false)}
            variant="contained"
          >
            I Understand
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}