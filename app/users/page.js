"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import GlobalNav from "../components/GlobalNav";
import {
  Box,
  Container,
  Typography,
  Button,
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
  Work,
  Search,
  FilterList,
  Clear,
} from "@mui/icons-material";
import { getCurrentUser, logout, isAuthenticated, apiRequest, API_BASE_URL } from "../lib/api";

const USER_ROLES = [
  { value: "ADMIN", label: "Administrator", description: "Full system access" },
  { value: "DRIVER", label: "Driver", description: "Operate shifts and view own data" },
  { value: "ACCOUNTANT", label: "Accountant", description: "Manage expenses and financials" },
  { value: "DISPATCHER", label: "Dispatcher", description: "Manage shift assignments" },
  { value: "MANAGER", label: "Manager", description: "Oversee operations" },
  { value: "VIEWER", label: "Viewer", description: "Read-only access" },
];

export default function UsersPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Search and filter
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("create"); // "create" or "edit"
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    role: "DRIVER",
    licenseNumber: "",
  });
  
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/signin");
      return;
    }

    const user = getCurrentUser();
    setCurrentUser(user);

    // Check if user is admin
    if (user?.role !== "ADMIN") {
      router.push("/");
      return;
    }

    loadUsers();
  }, [router]);

  // Filter users whenever search/filter changes
  useEffect(() => {
    filterUsers();
  }, [searchTerm, roleFilter, statusFilter, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/users');
      
      if (!response.ok) {
        throw new Error('Failed to load users');
      }
      
      const data = await response.json();
      setUsers(data);
      setFilteredUsers(data);
    } catch (err) {
      console.error("Error loading users:", err);
      setError("Failed to load users. " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Search by name or username
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((user) =>
        user.username.toLowerCase().includes(search) ||
        user.firstName.toLowerCase().includes(search) ||
        user.lastName.toLowerCase().includes(search) ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(search)
      );
    }

    // Filter by role
    if (roleFilter !== "ALL") {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    // Filter by status
    if (statusFilter !== "ALL") {
      const isActive = statusFilter === "ACTIVE";
      filtered = filtered.filter((user) => user.isActive === isActive);
    }

    setFilteredUsers(filtered);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setRoleFilter("ALL");
    setStatusFilter("ALL");
  };

  const handleOpenDialog = (mode, user = null) => {
    setDialogMode(mode);
    setEditingUser(user);
    
    if (mode === "create") {
      setFormData({
        username: "",
        password: "",
        email: "",
        firstName: "",
        lastName: "",
        phone: "",
        role: "DRIVER",
        licenseNumber: "",
      });
    } else {
      // Edit mode - populate form with user data
      setFormData({
        username: user.username,
        password: "", // Don't populate password for security
        email: user.email || "",
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || "",
        role: user.role,
        licenseNumber: "", // Would need to fetch from driver table
      });
    }
    
    setError("");
    setSuccess("");
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setShowPassword(false);
    setEditingUser(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const validateForm = () => {
    if (dialogMode === "create") {
      if (formData.username.length < 3) {
        setError("Username must be at least 3 characters");
        return false;
      }

      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters");
        return false;
      }
    } else {
      // Edit mode - password is optional
      if (formData.password && formData.password.length < 6) {
        setError("Password must be at least 6 characters if provided");
        return false;
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }

    if (!formData.firstName || !formData.lastName) {
      setError("First name and last name are required");
      return false;
    }

    if (formData.role === "DRIVER" && dialogMode === "create" && !formData.licenseNumber) {
      setError("License number is required for drivers");
      return false;
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
        // Create new user
        const requestBody = {
          username: formData.username,
          password: formData.password,
          email: formData.email || null,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || null,
          role: formData.role,
        };

        if (formData.role === "DRIVER") {
          requestBody.licenseNumber = formData.licenseNumber;
        }

        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(requestBody),
        });

        if (response.ok) {
          const data = await response.json();
          setSuccess(`User "${formData.username}" created successfully!`);
          handleCloseDialog();
          
          setTimeout(() => {
            loadUsers();
            setSuccess("");
          }, 2000);
        } else {
          const errorData = await response.json().catch(() => ({}));
          setError(errorData.message || "Failed to create user");
        }
      } else {
        // Update existing user
        const requestBody = {
          email: formData.email || null,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || null,
          role: formData.role,
        };

        // Only include password if provided
        if (formData.password) {
          requestBody.password = formData.password;
        }

        const response = await fetch(`${API_BASE_URL}/users/${editingUser.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(requestBody),
        });

        if (response.ok) {
          setSuccess(`User "${formData.username}" updated successfully!`);
          handleCloseDialog();
          loadUsers();
          
          setTimeout(() => {
            setSuccess("");
          }, 3000);
        } else {
          const errorData = await response.json().catch(() => ({}));
          setError(errorData.message || "Failed to update user");
        }
      }
    } catch (err) {
      console.error("Submit error:", err);
      setError("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (user) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${user.id}/toggle-active`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const newStatus = !user.isActive;
        const action = newStatus ? "activated" : "deactivated";
        
        setSuccess(`User "${user.username}" ${action} successfully!`);
        loadUsers();
        
        setTimeout(() => {
          setSuccess("");
        }, 3000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || "Failed to update user status");
      }
    } catch (err) {
      console.error("Toggle active error:", err);
      setError("Failed to update user status");
    }
  };

  const handleLogout = () => {
    logout();
  };

  const getRoleColor = (role) => {
    const colors = {
      ADMIN: "error",
      DRIVER: "primary",
      ACCOUNTANT: "success",
      DISPATCHER: "info",
      MANAGER: "warning",
      VIEWER: "default",
    };
    return colors[role] || "default";
  };

  if (!currentUser) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  const isDriver = formData.role === "DRIVER";
  const hasActiveFilters = searchTerm || roleFilter !== "ALL" || statusFilter !== "ALL";

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f6f9fc" }}>
      {/* Global Navigation */}
      <GlobalNav currentUser={currentUser} title="FareFlow - User Management" />

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Header with Create Button */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: "bold", color: "#3e5244" }}>
            User Management
          </Typography>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog("create")}
            sx={{
              backgroundColor: "#3e5244",
              "&:hover": { backgroundColor: "#2d3d32" },
            }}
          >
            Create User
          </Button>
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
                placeholder="Search by name or username..."
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

            {/* Filter by Role */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Filter by Role</InputLabel>
                <Select
                  value={roleFilter}
                  label="Filter by Role"
                  onChange={(e) => setRoleFilter(e.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <FilterList />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="ALL">All Roles</MenuItem>
                  {USER_ROLES.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Filter by Status */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Filter by Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Filter by Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="ALL">All Status</MenuItem>
                  <MenuItem value="ACTIVE">Active Only</MenuItem>
                  <MenuItem value="INACTIVE">Inactive Only</MenuItem>
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
              Showing {filteredUsers.length} of {users.length} users
              {hasActiveFilters && " (filtered)"}
            </Typography>
          </Box>
        </Paper>

        {/* Users Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell><strong>Username</strong></TableCell>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Phone</strong></TableCell>
                <TableCell><strong>Role</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="textSecondary">
                      {users.length === 0 ? "No users found" : "No users match your filters"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: "500" }}>
                        {user.username}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell>{user.email || "-"}</TableCell>
                    <TableCell>{user.phone || "-"}</TableCell>
                    <TableCell>
                      <Chip 
                        label={user.role} 
                        color={getRoleColor(user.role)} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.isActive ? "Active" : "Inactive"}
                        color={user.isActive ? "success" : "default"}
                        size="small"
                        icon={user.isActive ? <CheckCircle /> : <Block />}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit User">
                        <IconButton 
                          size="small" 
                          color="primary" 
                          onClick={() => handleOpenDialog("edit", user)}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title={user.isActive ? "Deactivate User" : "Activate User"}>
                        <IconButton 
                          size="small" 
                          color={user.isActive ? "warning" : "success"}
                          onClick={() => handleToggleActive(user)}
                        >
                          {user.isActive ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>

      {/* Create/Edit User Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === "create" ? "Create New User" : `Edit User: ${editingUser?.username}`}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Username - Read-only in edit mode */}
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="username"
                label="Username"
                value={formData.username}
                onChange={handleChange}
                disabled={dialogMode === "edit"}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person />
                    </InputAdornment>
                  ),
                }}
                helperText={dialogMode === "edit" ? "Username cannot be changed" : "At least 3 characters"}
              />
            </Grid>

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
            <Grid item xs={12}>
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

            {/* Role */}
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                select
                name="role"
                label="Role"
                value={formData.role}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Work />
                    </InputAdornment>
                  ),
                }}
                helperText="Select user role in the system"
              >
                {USER_ROLES.map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    <Box>
                      <Typography variant="body1">{role.label}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {role.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* License Number (Drivers only, create mode only) */}
            {isDriver && dialogMode === "create" && (
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="licenseNumber"
                  label="Driver License Number"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Badge />
                      </InputAdornment>
                    ),
                  }}
                  helperText="Required for driver accounts"
                />
              </Grid>
            )}

            {/* Password */}
            <Grid item xs={12}>
              <TextField
                required={dialogMode === "create"}
                fullWidth
                name="password"
                label={dialogMode === "edit" ? "New Password (leave blank to keep current)" : "Password"}
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
            {loading ? (dialogMode === "create" ? "Creating..." : "Updating...") : (dialogMode === "create" ? "Create User" : "Update User")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
