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
  Checkbox,
  FormControlLabel,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  DirectionsCar,
  Close as CloseIcon,
  Build as BuildIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  AirplanemodeActive as AirportIcon,
} from "@mui/icons-material";
import { getCurrentUser, API_BASE_URL } from "../lib/api";

export default function CabsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [cabs, setCabs] = useState([]);
  const [filteredCabs, setFilteredCabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCab, setSelectedCab] = useState(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [airportFilter, setAirportFilter] = useState("ALL");
  
  // Form data
  const [formData, setFormData] = useState({
    registrationNumber: "",
    make: "",
    model: "",
    year: "",
    color: "",
    cabType: "SEDAN",
    hasAirportLicense: false,
    airportLicenseNumber: "",
    airportLicenseExpiry: "",
    notes: "",
  });

  // Check authentication and load cabs
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/signin");
      return;
    }

    const user = getCurrentUser();
    setCurrentUser(user);

    // Check if user has access
    if (!["ADMIN", "MANAGER", "DISPATCHER"].includes(user?.role)) {
      router.push("/");
      return;
    }

    loadCabs();
  }, [router]);

  // Filter cabs whenever search/filter changes
  useEffect(() => {
    filterCabs();
  }, [searchTerm, statusFilter, typeFilter, airportFilter, cabs]);

  const loadCabs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cabs`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("🚗 Cabs loaded:", data);
        
        // ✅ Sort by cab number (numeric)
        const sortedCabs = data.sort((a, b) => {
          // Extract numeric part from cab number (e.g., "CAB-001" -> 1, "CAB-123" -> 123)
          const numA = parseInt(a.cabNumber?.replace(/\D/g, '') || '0');
          const numB = parseInt(b.cabNumber?.replace(/\D/g, '') || '0');
          return numA - numB;
        });
        
        setCabs(sortedCabs);
      } else {
        setError("Failed to load cabs");
      }
      setLoading(false);
    } catch (err) {
      console.error("Error loading cabs:", err);
      setError("Failed to load cabs");
      setLoading(false);
    }
  };

  const filterCabs = () => {
    let filtered = [...cabs];

    // Search by cab number, registration, make, model
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (cab) =>
          cab.cabNumber?.toLowerCase().includes(term) ||
          cab.registrationNumber?.toLowerCase().includes(term) ||
          cab.make?.toLowerCase().includes(term) ||
          cab.model?.toLowerCase().includes(term)
      );
    }

    // Filter by status
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((cab) => cab.status === statusFilter);
    }

    // Filter by type
    if (typeFilter !== "ALL") {
      filtered = filtered.filter((cab) => cab.cabType === typeFilter);
    }

    // Filter by airport license
    if (airportFilter === "LICENSED") {
      filtered = filtered.filter((cab) => cab.hasAirportLicense);
    } else if (airportFilter === "UNLICENSED") {
      filtered = filtered.filter((cab) => !cab.hasAirportLicense);
    }

    setFilteredCabs(filtered);
  };

  const handleOpenDialog = (cab = null) => {
    if (cab) {
      // Edit mode
      setEditMode(true);
      setSelectedCab(cab);
      setFormData({
        registrationNumber: cab.registrationNumber || "",
        make: cab.make || "",
        model: cab.model || "",
        year: cab.year || "",
        color: cab.color || "",
        cabType: cab.cabType || "SEDAN",
        hasAirportLicense: cab.hasAirportLicense || false,
        airportLicenseNumber: cab.airportLicenseNumber || "",
        airportLicenseExpiry: cab.airportLicenseExpiry || "",
        notes: cab.notes || "",
      });
    } else {
      // Create mode
      setEditMode(false);
      setSelectedCab(null);
      setFormData({
        registrationNumber: "",
        make: "",
        model: "",
        year: "",
        color: "",
        cabType: "SEDAN",
        hasAirportLicense: false,
        airportLicenseNumber: "",
        airportLicenseExpiry: "",
        notes: "",
      });
    }
    
    setError("");
    setSuccess("");
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCab(null);
    setFormData({
      registrationNumber: "",
      make: "",
      model: "",
      year: "",
      color: "",
      cabType: "SEDAN",
      hasAirportLicense: false,
      airportLicenseNumber: "",
      airportLicenseExpiry: "",
      notes: "",
    });
  };

  const handleSubmit = async () => {
    try {
      const url = editMode
        ? `${API_BASE_URL}/cabs/${selectedCab.id}`
        : `${API_BASE_URL}/cabs`;
      
      const method = editMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(data.message || `Cab ${editMode ? "updated" : "created"} successfully`);
        handleCloseDialog();
        loadCabs();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to save cab");
      }
    } catch (err) {
      console.error("Error saving cab:", err);
      setError("Failed to save cab");
    }
  };

  const handleStatusChange = async (cabId, action) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cabs/${cabId}/${action}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(data.message);
        loadCabs();
      } else {
        setError(`Failed to ${action} cab`);
      }
    } catch (err) {
      console.error(`Error changing cab status:`, err);
      setError(`Failed to ${action} cab`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/signin");
  };

  const getStatusColor = (status) => {
    const colors = {
      ACTIVE: "success",
      MAINTENANCE: "warning",
      RETIRED: "error",
    };
    return colors[status] || "default";
  };

  const getTypeColor = (type) => {
    const colors = {
      SEDAN: "primary",
      HANDICAP_VAN: "secondary",
    };
    return colors[type] || "default";
  };

  if (!currentUser) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  const hasActiveFilters = searchTerm || statusFilter !== "ALL" || typeFilter !== "ALL" || airportFilter !== "ALL";
  const canEdit = ["ADMIN", "MANAGER"].includes(currentUser.role);

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f6f9fc" }}>
      {/* Global Navigation */}
      <GlobalNav currentUser={currentUser} title="FareFlow - Cab Management" />

      {/* Main Content */}
      <Box sx={{ p: 3 }}>
        {/* Success/Error Messages */}
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
                  Active
                </Typography>
                <Typography variant="h4" color="success.main">
                  {cabs.filter((c) => c.status === "ACTIVE").length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  In Maintenance
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {cabs.filter((c) => c.status === "MAINTENANCE").length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Airport Licensed
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {cabs.filter((c) => c.hasAirportLicense).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters and Actions */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
            <TextField
              label="Search"
              placeholder="Cab#, Registration, Make, Model"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ minWidth: 250 }}
            />
            
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="ALL">All Status</MenuItem>
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
                <MenuItem value="RETIRED">Retired</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                label="Type"
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="ALL">All Types</MenuItem>
                <MenuItem value="SEDAN">Sedan</MenuItem>
                <MenuItem value="HANDICAP_VAN">Handicap Van</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Airport License</InputLabel>
              <Select
                value={airportFilter}
                label="Airport License"
                onChange={(e) => setAirportFilter(e.target.value)}
              >
                <MenuItem value="ALL">All</MenuItem>
                <MenuItem value="LICENSED">Licensed</MenuItem>
                <MenuItem value="UNLICENSED">Unlicensed</MenuItem>
              </Select>
            </FormControl>

            {hasActiveFilters && (
              <Button
                variant="outlined"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("ALL");
                  setTypeFilter("ALL");
                  setAirportFilter("ALL");
                }}
              >
                Clear Filters
              </Button>
            )}

            <Box sx={{ flexGrow: 1 }} />

            {canEdit && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Add Cab
              </Button>
            )}
          </Box>

          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="textSecondary">
              Showing {filteredCabs.length} of {cabs.length} cabs
              {hasActiveFilters && " (filtered)"}
            </Typography>
          </Box>
        </Paper>

        {/* Cabs Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell><strong>Cab #</strong></TableCell>
                <TableCell><strong>Registration</strong></TableCell>
                <TableCell><strong>Vehicle</strong></TableCell>
                <TableCell><strong>Type</strong></TableCell>
                <TableCell><strong>Airport</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                {canEdit && <TableCell align="center"><strong>Actions</strong></TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 7 : 6} align="center">
                    Loading cabs...
                  </TableCell>
                </TableRow>
              ) : filteredCabs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 7 : 6} align="center">
                    No cabs found
                  </TableCell>
                </TableRow>
              ) : (
                filteredCabs.map((cab) => (
                  <TableRow key={cab.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: "bold" }}>
                        {cab.cabNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{cab.registrationNumber}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {cab.year} {cab.make} {cab.model}
                        </Typography>
                        {cab.color && (
                          <Typography variant="caption" color="textSecondary">
                            {cab.color}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={cab.cabType === "HANDICAP_VAN" ? "Handicap Van" : "Sedan"}
                        color={getTypeColor(cab.cabType)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {cab.hasAirportLicense ? (
                        <Tooltip title={`License: ${cab.airportLicenseNumber || "N/A"} | Expiry: ${cab.airportLicenseExpiry || "N/A"}`}>
                          <Chip
                            icon={<AirportIcon />}
                            label={cab.airportLicenseExpired ? "Expired" : "Yes"}
                            color={cab.airportLicenseExpired ? "error" : "success"}
                            size="small"
                          />
                        </Tooltip>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          No
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={cab.status}
                        color={getStatusColor(cab.status)}
                        size="small"
                      />
                    </TableCell>
                    {canEdit && (
                      <TableCell align="center">
                        <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(cab)}
                              color="primary"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          {cab.status === "ACTIVE" && (
                            <Tooltip title="Set Maintenance">
                              <IconButton
                                size="small"
                                onClick={() => handleStatusChange(cab.id, "maintenance")}
                                color="warning"
                              >
                                <BuildIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          
                          {cab.status === "MAINTENANCE" && (
                            <Tooltip title="Activate">
                              <IconButton
                                size="small"
                                onClick={() => handleStatusChange(cab.id, "activate")}
                                color="success"
                              >
                                <CheckCircleIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          
                          {currentUser.role === "ADMIN" && cab.status !== "RETIRED" && (
                            <Tooltip title="Retire">
                              <IconButton
                                size="small"
                                onClick={() => handleStatusChange(cab.id, "retire")}
                                color="error"
                              >
                                <BlockIcon fontSize="small" />
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
      </Box>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">
              {editMode ? "Edit Cab" : "Add New Cab"}
            </Typography>
            <IconButton onClick={handleCloseDialog}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={2}>
            {editMode && (
              <Grid item xs={12}>
                <TextField
                  label="Cab Number"
                  value={selectedCab?.cabNumber || ""}
                  fullWidth
                  disabled
                  size="small"
                />
              </Grid>
            )}
            
            <Grid item xs={12}>
              <TextField
                required
                label="Registration Number"
                value={formData.registrationNumber}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                fullWidth
                size="small"
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="Make"
                placeholder="Toyota"
                value={formData.make}
                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                fullWidth
                size="small"
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="Model"
                placeholder="Camry"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                fullWidth
                size="small"
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="Year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                fullWidth
                size="small"
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="Color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                fullWidth
                size="small"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Cab Type</InputLabel>
                <Select
                  value={formData.cabType}
                  label="Cab Type"
                  onChange={(e) => setFormData({ ...formData, cabType: e.target.value })}
                >
                  <MenuItem value="SEDAN">Sedan</MenuItem>
                  <MenuItem value="HANDICAP_VAN">Handicap Van</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.hasAirportLicense}
                    onChange={(e) => setFormData({ ...formData, hasAirportLicense: e.target.checked })}
                  />
                }
                label="Has Airport License"
              />
            </Grid>

            {formData.hasAirportLicense && (
              <>
                <Grid item xs={6}>
                  <TextField
                    label="Airport License Number"
                    value={formData.airportLicenseNumber}
                    onChange={(e) => setFormData({ ...formData, airportLicenseNumber: e.target.value })}
                    fullWidth
                    size="small"
                  />
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    label="License Expiry"
                    type="date"
                    value={formData.airportLicenseExpiry}
                    onChange={(e) => setFormData({ ...formData, airportLicenseExpiry: e.target.value })}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <TextField
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                fullWidth
                multiline
                rows={3}
                size="small"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editMode ? "Update" : "Add"} Cab
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}