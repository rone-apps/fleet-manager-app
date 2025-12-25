"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import GlobalNav from "../components/GlobalNav";
import {
  Box,
  Container,
  Typography,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Chip,
  AppBar,
  Toolbar,
  Grid,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import {
  Add,
  Edit,
  Block,
  CheckCircle,
  Logout,
  Person,
  Visibility,
  VisibilityOff,
  Email,
  Phone,
  Badge,
  Search,
  FilterList,
  Clear,
  Star,
  DirectionsCar,
  Home,
} from "@mui/icons-material";
import { getCurrentUser, logout, isAuthenticated, apiRequest, API_BASE_URL } from "../lib/api";

const DRIVER_STATUSES = [
  { value: "ACTIVE", label: "Active", description: "Currently driving" },
  { value: "INACTIVE", label: "Inactive", description: "Temporarily not driving" },
  { value: "SUSPENDED", label: "Suspended", description: "Under review" },
  { value: "TERMINATED", label: "Terminated", description: "No longer with company" },
];

export default function DriversPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Search and filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [ownerFilter, setOwnerFilter] = useState("ALL");
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("create"); // "create" or "edit"
  const [editingDriver, setEditingDriver] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    licenseNumber: "",
    licenseExpiry: "",
    phone: "",
    email: "",
    address: "",
    joinedDate: "",
    notes: "",
    isOwner: false,
    createUser: false,
    username: "",
    password: "",
  });
  
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
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

    loadDrivers();
  }, [router]);

  // Filter drivers whenever search/filter changes
  useEffect(() => {
    filterDrivers();
  }, [searchTerm, statusFilter, ownerFilter, drivers]);

  const loadDrivers = async () => {
    try {
      setPageLoading(true);
      const response = await fetch(`${API_BASE_URL}/drivers`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("🚗 Drivers loaded:", data);
        console.log("🔍 First driver isOwner:", data[0]?.isOwner, "Type:", typeof data[0]?.isOwner);
        const sortedDrivers = (Array.isArray(data) ? [...data] : []).sort((a, b) => {
          const nameA = `${a?.firstName || ""} ${a?.lastName || ""}`.trim().toLowerCase();
          const nameB = `${b?.firstName || ""} ${b?.lastName || ""}`.trim().toLowerCase();
          return nameA.localeCompare(nameB);
        });
        setDrivers(sortedDrivers);
      } else {
        setError("Failed to load drivers");
        setDrivers([]);
        setFilteredDrivers([]);
      }
    } catch (err) {
      console.error("Error loading drivers:", err);
      setError("Failed to load drivers");
      setDrivers([]);
      setFilteredDrivers([]);
    } finally {
      setPageLoading(false);
    }
  };

  const filterDrivers = () => {
    let filtered = [...drivers];

    // Search by name or driver number
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((driver) =>
        driver.firstName.toLowerCase().includes(search) ||
        driver.lastName.toLowerCase().includes(search) ||
        driver.fullName.toLowerCase().includes(search) ||
        driver.driverNumber.toLowerCase().includes(search) ||
        (driver.licenseNumber && driver.licenseNumber.toLowerCase().includes(search))
      );
    }

    // Filter by status
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((driver) => driver.status === statusFilter);
    }

    // Filter by owner status
    if (ownerFilter !== "ALL") {
      const isOwner = ownerFilter === "OWNER";
      filtered = filtered.filter((driver) => driver.isOwner === isOwner);
    }

    setFilteredDrivers(filtered);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setOwnerFilter("ALL");
  };

  const handleOpenDialog = (mode, driver = null) => {
    setDialogMode(mode);
    setEditingDriver(driver);
    
    if (mode === "create") {
      setFormData({
        firstName: "",
        lastName: "",
        licenseNumber: "",
        licenseExpiry: "",
        phone: "",
        email: "",
        address: "",
        joinedDate: new Date().toISOString().split('T')[0],
        notes: "",
        isOwner: false,
        createUser: true,
        username: "",
        password: "",
      });
    } else {
      // Edit mode - populate form with driver data
      setFormData({
        firstName: driver.firstName,
        lastName: driver.lastName,
        licenseNumber: driver.licenseNumber || "",
        licenseExpiry: driver.licenseExpiry || "",
        phone: driver.phone || "",
        email: driver.email || "",
        address: driver.address || "",
        joinedDate: driver.joinedDate || "",
        notes: driver.notes || "",
        isOwner: driver.isOwner || false,
        createUser: false,
        username: "",
        password: "",
      });
    }
    
    setError("");
    setSuccess("");
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setShowPassword(false);
    setEditingDriver(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError("");
  };

  const validateForm = () => {
    if (!formData.firstName || formData.firstName.length < 2) {
      setError("First name must be at least 2 characters");
      return false;
    }

    if (!formData.lastName || formData.lastName.length < 2) {
      setError("Last name must be at least 2 characters");
      return false;
    }

    if (dialogMode === "create" && !formData.licenseNumber) {
      setError("License number is required");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }

    if (dialogMode === "create" && formData.createUser) {
      if (!formData.username || formData.username.length < 3) {
        setError("Username must be at least 3 characters");
        return false;
      }
      if (!formData.password || formData.password.length < 6) {
        setError("Password must be at least 6 characters");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (dialogMode === "create") {
        // Create new driver
        const requestBody = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          licenseNumber: formData.licenseNumber,
          licenseExpiry: formData.licenseExpiry || null,
          phone: formData.phone || null,
          email: formData.email || null,
          address: formData.address || null,
          joinedDate: formData.joinedDate || null,
          notes: formData.notes || null,
          isOwner: formData.isOwner,
          createUser: formData.createUser,
          username: formData.createUser ? formData.username : null,
          password: formData.createUser ? formData.password : null,
        };

        const response = await fetch(`${API_BASE_URL}/drivers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(requestBody),
        });

        if (response.ok) {
          const data = await response.json();
          setSuccess(`Driver "${formData.firstName} ${formData.lastName}" created successfully!`);
          handleCloseDialog();
          
          setTimeout(() => {
            loadDrivers();
            setSuccess("");
          }, 2000);
        } else {
          const errorData = await response.json().catch(() => ({}));
          setError(errorData.error || errorData.message || "Failed to create driver");
        }
      } else {
        // Update existing driver
        const requestBody = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          licenseNumber: formData.licenseNumber || null,
          licenseExpiry: formData.licenseExpiry || null,
          phone: formData.phone || null,
          email: formData.email || null,
          address: formData.address || null,
          joinedDate: formData.joinedDate || null,
          notes: formData.notes || null,
          isOwner: formData.isOwner,
        };

        const response = await fetch(`${API_BASE_URL}/drivers/${editingDriver.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(requestBody),
        });

        if (response.ok) {
          setSuccess(`Driver "${formData.firstName} ${formData.lastName}" updated successfully!`);
          handleCloseDialog();
          
          setTimeout(() => {
            loadDrivers();
            setSuccess("");
          }, 2000);
        } else {
          const errorData = await response.json().catch(() => ({}));
          setError(errorData.error || errorData.message || "Failed to update driver");
        }
      }
    } catch (err) {
      console.error("Submit error:", err);
      setError("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (driver) => {
    try {
      let endpoint;
      let newStatus;
      
      if (driver.status === "ACTIVE") {
        endpoint = `${API_BASE_URL}/drivers/${driver.id}/suspend`;
        newStatus = "SUSPENDED";
      } else {
        endpoint = `${API_BASE_URL}/drivers/${driver.id}/activate`;
        newStatus = "ACTIVE";
      }

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const action = newStatus === "ACTIVE" ? "activated" : "suspended";
        setSuccess(`Driver "${driver.fullName}" ${action} successfully!`);
        
        // Update local state
        setDrivers(drivers.map(d => 
          d.id === driver.id 
            ? { ...d, status: newStatus }
            : d
        ));
        
        setTimeout(() => {
          setSuccess("");
        }, 3000);
      } else {
        setError("Failed to update driver status");
      }
    } catch (err) {
      console.error("Toggle status error:", err);
      setError("Failed to update driver status");
    }
  };

  const handleLogout = () => {
    logout();
  };

  const getStatusColor = (status) => {
    const colors = {
      ACTIVE: "success",
      INACTIVE: "default",
      SUSPENDED: "warning",
      TERMINATED: "error",
    };
    return colors[status] || "default";
  };

  if (!currentUser) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  const hasActiveFilters = searchTerm || statusFilter !== "ALL" || ownerFilter !== "ALL";
  const canEdit = ["ADMIN", "MANAGER"].includes(currentUser.role);

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f6f9fc" }}>
      {/* Global Navigation */}
      <GlobalNav currentUser={currentUser} title="FareFlow - Driver Management" />

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {pageLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Header with Create Button */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <DirectionsCar sx={{ fontSize: 40, color: "#3e5244" }} />
                <Typography variant="h4" sx={{ fontWeight: "bold", color: "#3e5244" }}>
                  Driver Management
                </Typography>
              </Box>

              {canEdit && (
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => handleOpenDialog("create")}
                  sx={{
                    backgroundColor: "#3e5244",
                    "&:hover": { backgroundColor: "#2d3d32" },
                  }}
                >
                  Add Driver
                </Button>
              )}
            </Box>

            {/* Success Message */}
            {success && (
              <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
                {success}
              </Alert>
            )}

            {/* Error Message */}
            {error && !openDialog && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
                {error}
              </Alert>
            )}

            {/* Search and Filter Section */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                {/* Search by Name */}
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    placeholder="Search by name, driver#, or license..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

            {/* Filter by Status */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Filter by Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Filter by Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <FilterList />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="ALL">All Status</MenuItem>
                  {DRIVER_STATUSES.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Filter by Owner */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Filter by Type</InputLabel>
                <Select
                  value={ownerFilter}
                  label="Filter by Type"
                  onChange={(e) => setOwnerFilter(e.target.value)}
                >
                  <MenuItem value="ALL">All Drivers</MenuItem>
                  <MenuItem value="OWNER">Owners Only</MenuItem>
                  <MenuItem value="NON_OWNER">Drivers Only</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Clear Filters */}
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Clear />}
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                sx={{ height: "56px" }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>

          {/* Results Count */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="textSecondary">
              Showing {filteredDrivers.length} of {drivers.length} drivers
              {hasActiveFilters && " (filtered)"}
            </Typography>
          </Box>
        </Paper>

        {/* Drivers Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell><strong>Driver #</strong></TableCell>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>License</strong></TableCell>
                <TableCell><strong>Phone</strong></TableCell>
                <TableCell><strong>Type</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDrivers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="textSecondary">
                      {drivers.length === 0 ? "No drivers found" : "No drivers match your filters"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDrivers.map((driver) => {
                  console.log(`Driver ${driver.driverNumber}: isOwner =`, driver.isOwner, typeof driver.isOwner);
                  return (
                  <TableRow key={driver.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: "500", fontFamily: "monospace" }}>
                        {driver.driverNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {driver.fullName}
                        {driver.isOwner && (
                          <Tooltip title="Owner">
                            <Star sx={{ color: "#FFD700", fontSize: 20 }} />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{driver.licenseNumber || "-"}</Typography>
                        {driver.licenseExpiry && (
                          <Typography variant="caption" color={driver.licenseExpired ? "error" : "textSecondary"}>
                            Exp: {driver.licenseExpiry}
                            {driver.licenseExpired && " (EXPIRED)"}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{driver.phone || "-"}</TableCell>
                    <TableCell>
                      <Chip 
                        icon={driver.isOwner ? <Star /> : <Person />}
                        label={driver.isOwner ? "Owner" : "Driver"} 
                        color={driver.isOwner ? "warning" : "default"}
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={driver.status}
                        color={getStatusColor(driver.status)}
                        size="small"
                        icon={driver.status === "ACTIVE" ? <CheckCircle /> : <Block />}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {canEdit && (
                        <>
                          <Tooltip title="Edit Driver">
                            <IconButton 
                              size="small" 
                              color="primary" 
                              onClick={() => handleOpenDialog("edit", driver)}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title={driver.status === "ACTIVE" ? "Suspend Driver" : "Activate Driver"}>
                            <IconButton 
                              size="small" 
                              color={driver.status === "ACTIVE" ? "warning" : "success"}
                              onClick={() => handleToggleStatus(driver)}
                            >
                              {driver.status === "ACTIVE" ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

          </>
        )}
      </Container>

      {/* Create/Edit Driver Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === "create" ? "Add New Driver" : `Edit Driver: ${editingDriver?.driverNumber}`}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* First Name & Last Name */}
            <Grid item xs={6}>
              <TextField
                required
                fullWidth
                name="firstName"
                label="First Name"
                value={formData.firstName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                required
                fullWidth
                name="lastName"
                label="Last Name"
                value={formData.lastName}
                onChange={handleChange}
              />
            </Grid>

            {/* License Number & Expiry */}
            <Grid item xs={6}>
              <TextField
                required={dialogMode === "create"}
                fullWidth
                name="licenseNumber"
                label="License Number"
                value={formData.licenseNumber}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Badge />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                name="licenseExpiry"
                label="License Expiry"
                type="date"
                value={formData.licenseExpiry}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Email */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="email"
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Phone */}
            <Grid item xs={6}>
              <TextField
                fullWidth
                name="phone"
                label="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Joined Date */}
            <Grid item xs={6}>
              <TextField
                fullWidth
                name="joinedDate"
                label="Joined Date"
                type="date"
                value={formData.joinedDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Address */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="address"
                label="Address"
                value={formData.address}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Home />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                name="notes"
                label="Notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Additional information about the driver..."
              />
            </Grid>

            {/* Owner Checkbox */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isOwner}
                    onChange={handleChange}
                    name="isOwner"
                    color="warning"
                  />
                }
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Star sx={{ color: "#FFD700" }} />
                    <Typography>This driver is an owner</Typography>
                  </Box>
                }
              />
            </Grid>

            {/* Create User Account Section (Create mode only) */}
            {dialogMode === "create" && (
              <>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.createUser}
                        onChange={handleChange}
                        name="createUser"
                        color="primary"
                      />
                    }
                    label="Create user account for this driver"
                  />
                </Grid>

                {formData.createUser && (
                  <>
                    <Grid item xs={12}>
                      <TextField
                        required
                        fullWidth
                        name="username"
                        label="Username"
                        value={formData.username}
                        onChange={handleChange}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Person />
                            </InputAdornment>
                          ),
                        }}
                        helperText="At least 3 characters"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleChange}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        helperText="At least 6 characters"
                      />
                    </Grid>
                  </>
                )}
              </>
            )}
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            sx={{
              backgroundColor: "#3e5244",
              "&:hover": { backgroundColor: "#2d3d32" },
            }}
          >
            {loading ? 
              (dialogMode === "create" ? "Creating..." : "Updating...") : 
              (dialogMode === "create" ? "Add Driver" : "Update Driver")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
