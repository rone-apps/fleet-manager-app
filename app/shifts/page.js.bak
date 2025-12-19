"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import GlobalNav from "../components/GlobalNav";
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
  Paper,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Tooltip,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import {
  Add as AddIcon,
  SwapHoriz as TransferIcon,
  History as HistoryIcon,
  Close as CloseIcon,
  WbSunny as DayIcon,
  NightsStay as NightIcon,
  DirectionsCar,
  Person,
  AttachMoney,
  Search as SearchIcon,
} from "@mui/icons-material";
import { getCurrentUser } from "../lib/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export default function ShiftsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [cabs, setCabs] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [selectedCab, setSelectedCab] = useState(null);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Filter states
  const [cabFilter, setCabFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [viewMode, setViewMode] = useState("by-cab"); // "by-cab" or "by-owner"
  
  // Search states for lists
  const [cabSearchText, setCabSearchText] = useState("");
  const [ownerSearchText, setOwnerSearchText] = useState("");
  
  // Dialog states
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openTransferDialog, setOpenTransferDialog] = useState(false);
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [ownershipHistory, setOwnershipHistory] = useState([]);
  
  // Tab state
  const [tabValue, setTabValue] = useState(0);
  
  // Form data
  const [createFormData, setCreateFormData] = useState({
    cabId: "",
    shiftType: "DAY",
    startTime: "06:00",
    endTime: "18:00",
    ownerId: "",
    acquisitionType: "INITIAL_ASSIGNMENT",
    acquisitionPrice: "",
    notes: "",
  });

  const [transferFormData, setTransferFormData] = useState({
    newOwnerId: "",
    transferDate: "",
    acquisitionType: "PURCHASE",
    salePrice: "",
    acquisitionPrice: "",
    notes: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/signin");
      return;
    }

    const user = getCurrentUser();
    setCurrentUser(user);

    if (!["ADMIN", "MANAGER", "DISPATCHER"].includes(user?.role)) {
      router.push("/");
      return;
    }

    loadData();
  }, [router]);

  const loadData = async () => {
    await Promise.all([loadCabs(), loadDrivers()]);
    setLoading(false);
  };

  const loadCabs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cabs`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCabs(data);
      }
    } catch (err) {
      console.error("Error loading cabs:", err);
    }
  };

  const loadDrivers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/drivers`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Filter only owner-drivers
        setDrivers(data.filter(d => d.isOwner));
      }
    } catch (err) {
      console.error("Error loading drivers:", err);
    }
  };

  const loadShiftsForCab = async (cabId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/shifts/cab/${cabId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setShifts(data);
        setSelectedCab(cabs.find(c => c.id === cabId));
        setSelectedOwner(null);
        setViewMode("by-cab");
      } else {
        setShifts([]);
      }
    } catch (err) {
      console.error("Error loading shifts:", err);
      setShifts([]);
    }
  };

  const loadShiftsByOwner = async (ownerId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/shifts/owner/${ownerId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setShifts(data);
        setSelectedOwner(drivers.find(d => d.id === ownerId));
        setSelectedCab(null);
        setViewMode("by-owner");
      } else {
        setShifts([]);
      }
    } catch (err) {
      console.error("Error loading shifts:", err);
      setShifts([]);
    }
  };

  // Compute filtered shifts based on current filters
  const getFilteredShifts = () => {
    let filtered = [...shifts];

    // Filter by cab if in owner view mode
    if (viewMode === "by-owner" && cabFilter) {
      filtered = filtered.filter(shift => 
        shift.cabNumber.toLowerCase().includes(cabFilter.toLowerCase()) ||
        shift.cabRegistration.toLowerCase().includes(cabFilter.toLowerCase())
      );
    }

    // Filter by owner if in cab view mode
    if (viewMode === "by-cab" && ownerFilter) {
      filtered = filtered.filter(shift =>
        shift.currentOwnerName.toLowerCase().includes(ownerFilter.toLowerCase()) ||
        shift.currentOwnerDriverNumber.toLowerCase().includes(ownerFilter.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredShifts = getFilteredShifts();

  // Filter cab list based on search
  const getFilteredCabs = () => {
    if (!cabSearchText) return cabs;
    
    const searchLower = cabSearchText.toLowerCase();
    return cabs.filter(cab =>
      cab.cabNumber.toLowerCase().includes(searchLower) ||
      cab.registrationNumber.toLowerCase().includes(searchLower) ||
      cab.make.toLowerCase().includes(searchLower) ||
      cab.model.toLowerCase().includes(searchLower)
    );
  };

  // Filter owner list based on search
  const getFilteredOwners = () => {
    if (!ownerSearchText) return drivers;
    
    const searchLower = ownerSearchText.toLowerCase();
    return drivers.filter(driver =>
      driver.firstName.toLowerCase().includes(searchLower) ||
      driver.lastName.toLowerCase().includes(searchLower) ||
      driver.driverNumber.toLowerCase().includes(searchLower) ||
      `${driver.firstName} ${driver.lastName}`.toLowerCase().includes(searchLower)
    );
  };

  const filteredCabs = getFilteredCabs();
  const filteredOwners = getFilteredOwners();

  const handleOpenCreateDialog = () => {
    setCreateFormData({
      cabId: selectedCab?.id || "",
      shiftType: "DAY",
      startTime: "06:00",
      endTime: "18:00",
      ownerId: "",
      acquisitionType: "INITIAL_ASSIGNMENT",
      acquisitionPrice: "",
      notes: "",
    });
    setError("");
    setSuccess("");
    setOpenCreateDialog(true);
  };

  const handleShiftTypeChange = (newShiftType) => {
    // Set default times based on shift type
    const defaults = {
      DAY: { startTime: "06:00", endTime: "18:00" },
      NIGHT: { startTime: "18:00", endTime: "06:00" },
    };
    
    setCreateFormData({
      ...createFormData,
      shiftType: newShiftType,
      startTime: defaults[newShiftType].startTime,
      endTime: defaults[newShiftType].endTime,
    });
  };

  const handleCreateShift = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/shifts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...createFormData,
          acquisitionPrice: createFormData.acquisitionPrice ? parseFloat(createFormData.acquisitionPrice) : null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(data.message || "Shift created successfully");
        setOpenCreateDialog(false);
        if (selectedCab) {
          loadShiftsForCab(selectedCab.id);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to create shift");
      }
    } catch (err) {
      console.error("Error creating shift:", err);
      setError("Failed to create shift");
    }
  };

  const handleOpenTransferDialog = (shift) => {
    setSelectedShift(shift);
    setTransferFormData({
      newOwnerId: "",
      transferDate: new Date().toISOString().split('T')[0],
      acquisitionType: "PURCHASE",
      salePrice: "",
      acquisitionPrice: "",
      notes: "",
    });
    setError("");
    setSuccess("");
    setOpenTransferDialog(true);
  };

  const handleTransferOwnership = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/shifts/${selectedShift.id}/transfer`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...transferFormData,
          salePrice: transferFormData.salePrice ? parseFloat(transferFormData.salePrice) : null,
          acquisitionPrice: transferFormData.acquisitionPrice ? parseFloat(transferFormData.acquisitionPrice) : null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(data.message || "Ownership transferred successfully");
        setOpenTransferDialog(false);
        if (selectedCab) {
          loadShiftsForCab(selectedCab.id);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to transfer ownership");
      }
    } catch (err) {
      console.error("Error transferring ownership:", err);
      setError("Failed to transfer ownership");
    }
  };

  const handleOpenHistoryDialog = async (shift) => {
    setSelectedShift(shift);
    setOpenHistoryDialog(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/shifts/${shift.id}/ownership-history`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOwnershipHistory(data);
      }
    } catch (err) {
      console.error("Error loading history:", err);
    }
  };

  const canEdit = ["ADMIN", "MANAGER"].includes(currentUser?.role);

  if (!currentUser) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f6f9fc" }}>
      <GlobalNav currentUser={currentUser} title="FareFlow - Shift Ownership" />

      <Box sx={{ p: 3 }}>
        {success && (
          <Alert severity="success" onClose={() => setSuccess("")} sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        {error && (
          <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Cabs
                </Typography>
                <Typography variant="h4">{cabs.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Shifts
                </Typography>
                <Typography variant="h4">{shifts.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Owner Drivers
                </Typography>
                <Typography variant="h4">{drivers.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Shifts
                </Typography>
                <Typography variant="h4" color="success.main">
                  {shifts.filter(s => s.isActive).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Main Content */}
        <Grid container spacing={3}>
          {/* Left Panel - Cab/Owner Selection */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Tabs
                value={viewMode === "by-cab" ? 0 : 1}
                onChange={(e, newValue) => {
                  if (newValue === 0) {
                    setViewMode("by-cab");
                    setShifts([]);
                    setSelectedCab(null);
                    setSelectedOwner(null);
                    setCabFilter("");
                    setOwnerFilter("");
                    setCabSearchText("");
                    setOwnerSearchText("");
                  } else {
                    setViewMode("by-owner");
                    setShifts([]);
                    setSelectedCab(null);
                    setSelectedOwner(null);
                    setCabFilter("");
                    setOwnerFilter("");
                    setCabSearchText("");
                    setOwnerSearchText("");
                  }
                }}
                sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}
              >
                <Tab label="By Cab" />
                <Tab label="By Owner" />
              </Tabs>

              {viewMode === "by-cab" ? (
                <>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                    Select Cab
                  </Typography>
                  
                  {/* Search box for cabs */}
                  <TextField
                    placeholder="Search cabs..."
                    value={cabSearchText}
                    onChange={(e) => setCabSearchText(e.target.value)}
                    size="small"
                    fullWidth
                    sx={{ mb: 2 }}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />,
                    }}
                  />
                  
                  {filteredCabs.length === 0 ? (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      No cabs match "{cabSearchText}"
                    </Alert>
                  ) : (
                    <>
                      {cabSearchText && (
                        <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: "block" }}>
                          Showing {filteredCabs.length} of {cabs.length} cabs
                        </Typography>
                      )}
                      <List>
                        {filteredCabs.map((cab) => (
                          <ListItem
                            key={cab.id}
                            button
                            selected={selectedCab?.id === cab.id}
                            onClick={() => loadShiftsForCab(cab.id)}
                            sx={{
                              borderRadius: 1,
                              mb: 1,
                              "&.Mui-selected": {
                                backgroundColor: "#e3f2fd",
                              },
                            }}
                          >
                            <DirectionsCar sx={{ mr: 2, color: "#1976d2" }} />
                            <ListItemText
                              primary={cab.cabNumber}
                              secondary={`${cab.registrationNumber} - ${cab.make} ${cab.model}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                    Select Owner
                  </Typography>
                  
                  {/* Search box for owners */}
                  <TextField
                    placeholder="Search owners..."
                    value={ownerSearchText}
                    onChange={(e) => setOwnerSearchText(e.target.value)}
                    size="small"
                    fullWidth
                    sx={{ mb: 2 }}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />,
                    }}
                  />
                  
                  {filteredOwners.length === 0 ? (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      No owners match "{ownerSearchText}"
                    </Alert>
                  ) : (
                    <>
                      {ownerSearchText && (
                        <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: "block" }}>
                          Showing {filteredOwners.length} of {drivers.length} owners
                        </Typography>
                      )}
                      <List>
                        {filteredOwners.map((driver) => (
                          <ListItem
                            key={driver.id}
                            button
                            selected={selectedOwner?.id === driver.id}
                            onClick={() => loadShiftsByOwner(driver.id)}
                            sx={{
                              borderRadius: 1,
                              mb: 1,
                              "&.Mui-selected": {
                                backgroundColor: "#e3f2fd",
                              },
                            }}
                          >
                            <Person sx={{ mr: 2, color: "#1976d2" }} />
                            <ListItemText
                              primary={`${driver.firstName} ${driver.lastName}`}
                              secondary={driver.driverNumber}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </>
                  )}
                </>
              )}
            </Paper>
          </Grid>

          {/* Right Panel - Shift Details */}
          <Grid item xs={12} md={8}>
            {(selectedCab || selectedOwner) ? (
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {viewMode === "by-cab" 
                        ? `${selectedCab?.cabNumber} - Shifts`
                        : `${selectedOwner?.firstName} ${selectedOwner?.lastName}'s Shifts`
                      }
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {viewMode === "by-cab"
                        ? `${selectedCab?.registrationNumber}`
                        : `${selectedOwner?.driverNumber} - ${shifts.length} shift(s) owned`
                      }
                    </Typography>
                  </Box>
                  {canEdit && viewMode === "by-cab" && shifts.length < 2 && (
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleOpenCreateDialog}
                    >
                      Create Shift
                    </Button>
                  )}
                </Box>

                {/* Filter Box for Owner View */}
                {viewMode === "by-owner" && shifts.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <TextField
                      label="Filter by Cab"
                      placeholder="Search cab number or registration..."
                      value={cabFilter}
                      onChange={(e) => setCabFilter(e.target.value)}
                      size="small"
                      fullWidth
                      InputProps={{
                        startAdornment: <DirectionsCar sx={{ mr: 1, color: "text.secondary" }} />,
                      }}
                    />
                    {cabFilter && (
                      <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: "block" }}>
                        Showing {filteredShifts.length} of {shifts.length} shifts
                      </Typography>
                    )}
                  </Box>
                )}

                {/* Filter Box for Cab View */}
                {viewMode === "by-cab" && shifts.length > 1 && (
                  <Box sx={{ mb: 3 }}>
                    <TextField
                      label="Filter by Owner"
                      placeholder="Search owner name or driver number..."
                      value={ownerFilter}
                      onChange={(e) => setOwnerFilter(e.target.value)}
                      size="small"
                      fullWidth
                      InputProps={{
                        startAdornment: <Person sx={{ mr: 1, color: "text.secondary" }} />,
                      }}
                    />
                    {ownerFilter && (
                      <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: "block" }}>
                        Showing {filteredShifts.length} of {shifts.length} shifts
                      </Typography>
                    )}
                  </Box>
                )}

                {filteredShifts.length === 0 ? (
                  <Alert severity="info">
                    {shifts.length === 0 
                      ? (viewMode === "by-cab" 
                          ? "No shifts created yet. Click 'Create Shift' to add DAY and NIGHT shifts."
                          : "This owner doesn't have any shifts yet.")
                      : "No shifts match your filter."
                    }
                  </Alert>
                ) : (
                  <Grid container spacing={3}>
                    {filteredShifts.map((shift) => (
                      <Grid item xs={12} key={shift.id}>
                        <Card sx={{ border: shift.isActive ? "2px solid #4caf50" : "1px solid #ddd" }}>
                          <CardContent>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                {shift.shiftType === "DAY" ? (
                                  <DayIcon sx={{ fontSize: 40, color: "#ff9800" }} />
                                ) : (
                                  <NightIcon sx={{ fontSize: 40, color: "#3f51b5" }} />
                                )}
                                <Box>
                                  <Typography variant="h6" fontWeight="bold">
                                    {shift.shiftTypeDisplay}
                                  </Typography>
                                  <Typography variant="body2" color="textSecondary">
                                    {shift.shiftHours}
                                  </Typography>
                                </Box>
                              </Box>
                              <Chip
                                label={shift.status}
                                color={shift.isActive ? "success" : "default"}
                                size="small"
                              />
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            {/* Show cab info in owner view, owner info in cab view */}
                            {viewMode === "by-owner" ? (
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                  Cab
                                </Typography>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  <DirectionsCar />
                                  <Typography variant="body1" fontWeight="bold">
                                    {shift.cabNumber}
                                  </Typography>
                                  <Chip label={shift.cabRegistration} size="small" />
                                </Box>
                              </Box>
                            ) : (
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                  Current Owner
                                </Typography>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  <Person />
                                  <Typography variant="body1" fontWeight="bold">
                                    {shift.currentOwnerName}
                                  </Typography>
                                  <Chip label={shift.currentOwnerDriverNumber} size="small" />
                                </Box>
                              </Box>
                            )}

                            {canEdit && (
                              <Box sx={{ display: "flex", gap: 1 }}>
                                <Button
                                  variant="outlined"
                                  startIcon={<TransferIcon />}
                                  onClick={() => handleOpenTransferDialog(shift)}
                                  size="small"
                                >
                                  Transfer
                                </Button>
                                <Button
                                  variant="outlined"
                                  startIcon={<HistoryIcon />}
                                  onClick={() => handleOpenHistoryDialog(shift)}
                                  size="small"
                                >
                                  History
                                </Button>
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Paper>
            ) : (
              <Paper sx={{ p: 5, textAlign: "center" }}>
                {viewMode === "by-cab" ? (
                  <>
                    <DirectionsCar sx={{ fontSize: 80, color: "#ccc", mb: 2 }} />
                    <Typography variant="h6" color="textSecondary">
                      Select a cab to view its shifts
                    </Typography>
                  </>
                ) : (
                  <>
                    <Person sx={{ fontSize: 80, color: "#ccc", mb: 2 }} />
                    <Typography variant="h6" color="textSecondary">
                      Select an owner to view their shifts
                    </Typography>
                  </>
                )}
              </Paper>
            )}
          </Grid>
        </Grid>
      </Box>

      {/* Create Shift Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">Create New Shift</Typography>
            <IconButton onClick={() => setOpenCreateDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Cab"
                value={selectedCab?.cabNumber || ""}
                fullWidth
                disabled
                size="small"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Shift Type</InputLabel>
                <Select
                  value={createFormData.shiftType}
                  label="Shift Type"
                  onChange={(e) => handleShiftTypeChange(e.target.value)}
                >
                  <MenuItem value="DAY">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <DayIcon /> Day Shift
                    </Box>
                  </MenuItem>
                  <MenuItem value="NIGHT">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <NightIcon /> Night Shift
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="Start Time"
                type="time"
                value={createFormData.startTime}
                onChange={(e) => setCreateFormData({ ...createFormData, startTime: e.target.value })}
                fullWidth
                size="small"
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="End Time"
                type="time"
                value={createFormData.endTime}
                onChange={(e) => setCreateFormData({ ...createFormData, endTime: e.target.value })}
                fullWidth
                size="small"
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Owner</InputLabel>
                <Select
                  value={createFormData.ownerId}
                  label="Owner"
                  onChange={(e) => setCreateFormData({ ...createFormData, ownerId: e.target.value })}
                >
                  {drivers.map((driver) => (
                    <MenuItem key={driver.id} value={driver.id}>
                      {driver.driverNumber} - {driver.firstName} {driver.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Acquisition Type</InputLabel>
                <Select
                  value={createFormData.acquisitionType}
                  label="Acquisition Type"
                  onChange={(e) => setCreateFormData({ ...createFormData, acquisitionType: e.target.value })}
                >
                  <MenuItem value="INITIAL_ASSIGNMENT">Initial Assignment</MenuItem>
                  <MenuItem value="PURCHASE">Purchase</MenuItem>
                  <MenuItem value="TRANSFER">Transfer</MenuItem>
                  <MenuItem value="INHERITANCE">Inheritance</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Acquisition Price"
                type="number"
                value={createFormData.acquisitionPrice}
                onChange={(e) => setCreateFormData({ ...createFormData, acquisitionPrice: e.target.value })}
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: <AttachMoney />,
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Notes"
                value={createFormData.notes}
                onChange={(e) => setCreateFormData({ ...createFormData, notes: e.target.value })}
                fullWidth
                multiline
                rows={3}
                size="small"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateShift} variant="contained" color="primary">
            Create Shift
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transfer Ownership Dialog */}
      <Dialog open={openTransferDialog} onClose={() => setOpenTransferDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">Transfer Shift Ownership</Typography>
            <IconButton onClick={() => setOpenTransferDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          {selectedShift && (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                Transferring {selectedShift.shiftTypeDisplay} from {selectedShift.currentOwnerName}
              </Alert>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small" required>
                    <InputLabel>New Owner</InputLabel>
                    <Select
                      value={transferFormData.newOwnerId}
                      label="New Owner"
                      onChange={(e) => setTransferFormData({ ...transferFormData, newOwnerId: e.target.value })}
                    >
                      {drivers
                        .filter(d => d.id !== selectedShift.currentOwnerId)
                        .map((driver) => (
                          <MenuItem key={driver.id} value={driver.id}>
                            {driver.driverNumber} - {driver.firstName} {driver.lastName}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Transfer Date"
                    type="date"
                    value={transferFormData.transferDate}
                    onChange={(e) => setTransferFormData({ ...transferFormData, transferDate: e.target.value })}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Acquisition Type</InputLabel>
                    <Select
                      value={transferFormData.acquisitionType}
                      label="Acquisition Type"
                      onChange={(e) => setTransferFormData({ ...transferFormData, acquisitionType: e.target.value })}
                    >
                      <MenuItem value="PURCHASE">Purchase</MenuItem>
                      <MenuItem value="TRANSFER">Transfer</MenuItem>
                      <MenuItem value="INHERITANCE">Inheritance</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    label="Sale Price (from current owner)"
                    type="number"
                    value={transferFormData.salePrice}
                    onChange={(e) => setTransferFormData({ ...transferFormData, salePrice: e.target.value })}
                    fullWidth
                    size="small"
                    InputProps={{
                      startAdornment: <AttachMoney />,
                    }}
                  />
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    label="Acquisition Price (to new owner)"
                    type="number"
                    value={transferFormData.acquisitionPrice}
                    onChange={(e) => setTransferFormData({ ...transferFormData, acquisitionPrice: e.target.value })}
                    fullWidth
                    size="small"
                    InputProps={{
                      startAdornment: <AttachMoney />,
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Notes"
                    value={transferFormData.notes}
                    onChange={(e) => setTransferFormData({ ...transferFormData, notes: e.target.value })}
                    fullWidth
                    multiline
                    rows={3}
                    size="small"
                  />
                </Grid>
              </Grid>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTransferDialog(false)}>Cancel</Button>
          <Button onClick={handleTransferOwnership} variant="contained" color="primary">
            Transfer Ownership
          </Button>
        </DialogActions>
      </Dialog>

      {/* Ownership History Dialog */}
      <Dialog open={openHistoryDialog} onClose={() => setOpenHistoryDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">Ownership History</Typography>
            <IconButton onClick={() => setOpenHistoryDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedShift && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {selectedShift.shiftTypeDisplay} - {selectedShift.cabNumber}
            </Alert>
          )}

          {ownershipHistory.length === 0 ? (
            <Typography color="textSecondary">No ownership history found.</Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell><strong>Owner</strong></TableCell>
                    <TableCell><strong>Period</strong></TableCell>
                    <TableCell><strong>Type</strong></TableCell>
                    <TableCell align="right"><strong>Acquired For</strong></TableCell>
                    <TableCell align="right"><strong>Sold For</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ownershipHistory.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {record.ownerName}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {record.ownerDriverNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {record.startDate}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          to {record.endDate || "Present"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={record.acquisitionType?.replace("_", " ")} 
                          size="small" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        {record.acquisitionPrice ? `$${record.acquisitionPrice.toLocaleString()}` : "-"}
                      </TableCell>
                      <TableCell align="right">
                        {record.salePrice ? `$${record.salePrice.toLocaleString()}` : "-"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={record.isCurrent ? "Current" : "Ended"}
                          color={record.isCurrent ? "success" : "default"}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenHistoryDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
