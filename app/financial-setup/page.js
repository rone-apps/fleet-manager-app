"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Chip,
  Alert,
  AlertTitle,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Category as CategoryIcon,
  Receipt as ReceiptIcon,
  Assignment as PlanIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as RevenueIcon,
  Block as BlockIcon,
} from "@mui/icons-material";
import GlobalNav from "../components/GlobalNav";
import { getCurrentUser } from "../lib/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export default function FinancialSetupPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Delete Warning Dialog
  const [deleteWarningDialog, setDeleteWarningDialog] = useState(false);
  const [deleteWarningData, setDeleteWarningData] = useState({
    type: "",
    error: "",
    reason: "",
    solution: ""
  });

  // Expense Categories
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [openExpenseCategoryDialog, setOpenExpenseCategoryDialog] = useState(false);
  const [editingExpenseCategory, setEditingExpenseCategory] = useState(null);
  const [expenseCategoryFormData, setExpenseCategoryFormData] = useState({
    categoryCode: "",
    categoryName: "",
    description: "",
    categoryType: "VARIABLE",
    appliesTo: "SHIFT",
  });

  // Revenue Categories
  const [revenueCategories, setRevenueCategories] = useState([]);
  const [openRevenueCategoryDialog, setOpenRevenueCategoryDialog] = useState(false);
  const [editingRevenueCategory, setEditingRevenueCategory] = useState(null);
  const [revenueCategoryFormData, setRevenueCategoryFormData] = useState({
    categoryCode: "",
    categoryName: "",
    description: "",
    categoryType: "VARIABLE",
    appliesTo: "DRIVER",
  });

  // Lease Plans
  const [leasePlans, setLeasePlans] = useState([]);
  const [openPlanDialog, setOpenPlanDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planFormData, setPlanFormData] = useState({
    planName: "",
    effectiveFrom: "",
    effectiveTo: "",
    notes: "",
  });

  // Lease Rates
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [leaseRates, setLeaseRates] = useState([]);
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

  const canEdit = currentUser?.role === "ADMIN" || currentUser?.role === "MANAGER";
  const canDelete = currentUser?.role === "ADMIN";

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || !["ADMIN", "MANAGER", "ACCOUNTANT", "DISPATCHER"].includes(user.role)) {
      window.location.href = "/";
      return;
    }
    setCurrentUser(user);
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadExpenseCategories(), 
        loadRevenueCategories(),
        loadLeasePlans()
      ]);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load financial configuration");
    } finally {
      setLoading(false);
    }
  };

  // ==================== Expense Categories ====================

  const loadExpenseCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/expense-categories`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setExpenseCategories(data);
      }
    } catch (err) {
      console.error("Error loading expense categories:", err);
    }
  };

  const handleOpenExpenseCategoryDialog = (category = null) => {
    if (category) {
      setEditingExpenseCategory(category);
      setExpenseCategoryFormData({
        categoryCode: category.categoryCode,
        categoryName: category.categoryName,
        description: category.description || "",
        categoryType: category.categoryType,
        appliesTo: category.appliesTo,
      });
    } else {
      setEditingExpenseCategory(null);
      setExpenseCategoryFormData({
        categoryCode: "",
        categoryName: "",
        description: "",
        categoryType: "VARIABLE",
        appliesTo: "SHIFT",
      });
    }
    setError("");
    setSuccess("");
    setOpenExpenseCategoryDialog(true);
  };

  const handleSaveExpenseCategory = async () => {
    if (!expenseCategoryFormData.categoryCode || !expenseCategoryFormData.categoryName) {
      setError("Category code and name are required");
      return;
    }

    try {
      const url = editingExpenseCategory
        ? `${API_BASE_URL}/expense-categories/${editingExpenseCategory.id}`
        : `${API_BASE_URL}/expense-categories`;
      
      const payload = {
        ...expenseCategoryFormData,
        isActive: editingExpenseCategory ? editingExpenseCategory.active : true
      };
      
      const response = await fetch(url, {
        method: editingExpenseCategory ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        setError(`Failed to save expense category: ${errorText}`);
        return;
      }

      setSuccess(editingExpenseCategory ? "Expense category updated" : "Expense category created");
      setOpenExpenseCategoryDialog(false);
      loadExpenseCategories();
    } catch (err) {
      console.error("Error saving expense category:", err);
      setError("Failed to save expense category: " + err.message);
    }
  };

  const handleToggleExpenseCategoryActive = async (category) => {
    try {
      const action = category.active ? "deactivate" : "activate";
      const response = await fetch(`${API_BASE_URL}/expense-categories/${category.id}/${action}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        setSuccess(`Expense category ${action}d successfully`);
        loadExpenseCategories();
      } else {
        setError(`Failed to ${action} expense category`);
      }
    } catch (err) {
      console.error(`Error toggling expense category:`, err);
      setError("Failed to update expense category status");
    }
  };

  // ==================== Revenue Categories ====================

  const loadRevenueCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/revenue-categories`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setRevenueCategories(data);
      }
    } catch (err) {
      console.error("Error loading revenue categories:", err);
    }
  };

  const handleOpenRevenueCategoryDialog = (category = null) => {
    if (category) {
      setEditingRevenueCategory(category);
      setRevenueCategoryFormData({
        categoryCode: category.categoryCode,
        categoryName: category.categoryName,
        description: category.description || "",
        categoryType: category.categoryType,
        appliesTo: category.appliesTo,
      });
    } else {
      setEditingRevenueCategory(null);
      setRevenueCategoryFormData({
        categoryCode: "",
        categoryName: "",
        description: "",
        categoryType: "VARIABLE",
        appliesTo: "DRIVER",
      });
    }
    setError("");
    setSuccess("");
    setOpenRevenueCategoryDialog(true);
  };

  const handleSaveRevenueCategory = async () => {
    if (!revenueCategoryFormData.categoryCode || !revenueCategoryFormData.categoryName) {
      setError("Category code and name are required");
      return;
    }

    try {
      const url = editingRevenueCategory
        ? `${API_BASE_URL}/revenue-categories/${editingRevenueCategory.id}`
        : `${API_BASE_URL}/revenue-categories`;
      
      const payload = {
        ...revenueCategoryFormData,
        isActive: editingRevenueCategory ? editingRevenueCategory.active : true
      };
      
      const response = await fetch(url, {
        method: editingRevenueCategory ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        setError(`Failed to save revenue category: ${errorText}`);
        return;
      }

      setSuccess(editingRevenueCategory ? "Revenue category updated" : "Revenue category created");
      setOpenRevenueCategoryDialog(false);
      loadRevenueCategories();
    } catch (err) {
      console.error("Error saving revenue category:", err);
      setError("Failed to save revenue category: " + err.message);
    }
  };

  const handleToggleRevenueCategoryActive = async (category) => {
    try {
      const action = category.active ? "deactivate" : "activate";
      const response = await fetch(`${API_BASE_URL}/revenue-categories/${category.id}/${action}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        setSuccess(`Revenue category ${action}d successfully`);
        loadRevenueCategories();
      } else {
        setError(`Failed to ${action} revenue category`);
      }
    } catch (err) {
      console.error(`Error toggling revenue category:`, err);
      setError("Failed to update revenue category status");
    }
  };

  // ==================== Lease Plans (keeping existing code) ====================

  const loadLeasePlans = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/lease-plans`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setLeasePlans(data);
      }
    } catch (err) {
      console.error("Error loading lease plans:", err);
    }
  };

  // ... (keep all existing lease plan and lease rate functions)

  if (!currentUser) return null;

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f6f9fc" }}>
      <GlobalNav currentUser={currentUser} />

      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: "#3e5244" }}>
          Financial Configuration
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Manage expense categories, revenue categories, lease plans, and rates
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
            {success}
          </Alert>
        )}

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CategoryIcon color="error" />
                  <Box>
                    <Typography color="textSecondary" variant="body2">
                      Expense Categories
                    </Typography>
                    <Typography variant="h5">{expenseCategories.length}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <RevenueIcon color="success" />
                  <Box>
                    <Typography color="textSecondary" variant="body2">
                      Revenue Categories
                    </Typography>
                    <Typography variant="h5">{revenueCategories.length}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PlanIcon color="primary" />
                  <Box>
                    <Typography color="textSecondary" variant="body2">
                      Lease Plans
                    </Typography>
                    <Typography variant="h5">{leasePlans.length}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <MoneyIcon color="primary" />
                  <Box>
                    <Typography color="textSecondary" variant="body2">
                      Lease Rates
                    </Typography>
                    <Typography variant="h5">{leaseRates.length}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper>
          <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
            <Tab label="Expense Categories" icon={<CategoryIcon />} iconPosition="start" />
            <Tab label="Revenue Categories" icon={<RevenueIcon />} iconPosition="start" />
            <Tab label="Lease Plans & Rates" icon={<ReceiptIcon />} iconPosition="start" />
          </Tabs>

          {/* Tab 0: Expense Categories */}
          {currentTab === 0 && (
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6">Expense Categories</Typography>
                {canEdit && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenExpenseCategoryDialog()}
                  >
                    Add Expense Category
                  </Button>
                )}
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Code</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Applies To</TableCell>
                      <TableCell>Status</TableCell>
                      {canEdit && <TableCell align="right">Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {expenseCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          <Chip label={category.categoryCode} size="small" />
                        </TableCell>
                        <TableCell>{category.categoryName}</TableCell>
                        <TableCell>
                          <Chip 
                            label={category.categoryType} 
                            color={category.categoryType === "FIXED" ? "primary" : "default"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip label={category.appliesTo} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={category.active ? <ActiveIcon /> : <InactiveIcon />}
                            label={category.active ? "Active" : "Inactive"}
                            color={category.active ? "success" : "default"}
                            size="small"
                          />
                        </TableCell>
                        {canEdit && (
                          <TableCell align="right">
                            <IconButton size="small" onClick={() => handleOpenExpenseCategoryDialog(category)}>
                              <EditIcon />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={() => handleToggleExpenseCategoryActive(category)}
                              color={category.active ? "default" : "success"}
                            >
                              {category.active ? <InactiveIcon /> : <ActiveIcon />}
                            </IconButton>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Tab 1: Revenue Categories */}
          {currentTab === 1 && (
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6">Revenue Categories</Typography>
                {canEdit && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenRevenueCategoryDialog()}
                  >
                    Add Revenue Category
                  </Button>
                )}
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Code</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Applies To</TableCell>
                      <TableCell>Status</TableCell>
                      {canEdit && <TableCell align="right">Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {revenueCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          <Chip label={category.categoryCode} size="small" color="success" />
                        </TableCell>
                        <TableCell>{category.categoryName}</TableCell>
                        <TableCell>
                          <Chip 
                            label={category.categoryType} 
                            color={category.categoryType === "FIXED" ? "primary" : "default"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip label={category.appliesTo} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={category.active ? <ActiveIcon /> : <InactiveIcon />}
                            label={category.active ? "Active" : "Inactive"}
                            color={category.active ? "success" : "default"}
                            size="small"
                          />
                        </TableCell>
                        {canEdit && (
                          <TableCell align="right">
                            <IconButton size="small" onClick={() => handleOpenRevenueCategoryDialog(category)}>
                              <EditIcon />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={() => handleToggleRevenueCategoryActive(category)}
                              color={category.active ? "default" : "success"}
                            >
                              {category.active ? <InactiveIcon /> : <ActiveIcon />}
                            </IconButton>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Tab 2: Lease Plans & Rates (keep existing content) */}
          {currentTab === 2 && (
            <Box sx={{ p: 3 }}>
              <Typography>Lease Plans & Rates (existing content)</Typography>
            </Box>
          )}
        </Paper>
      </Box>

      {/* Expense Category Dialog */}
      <Dialog open={openExpenseCategoryDialog} onClose={() => setOpenExpenseCategoryDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingExpenseCategory ? "Edit Expense Category" : "Add Expense Category"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <TextField
              label="Category Code"
              value={expenseCategoryFormData.categoryCode}
              onChange={(e) => setExpenseCategoryFormData({ ...expenseCategoryFormData, categoryCode: e.target.value.toUpperCase() })}
              required
              placeholder="E.g., FUEL"
            />
            <TextField
              label="Category Name"
              value={expenseCategoryFormData.categoryName}
              onChange={(e) => setExpenseCategoryFormData({ ...expenseCategoryFormData, categoryName: e.target.value })}
              required
              placeholder="E.g., Fuel Expenses"
            />
            <TextField
              label="Description"
              value={expenseCategoryFormData.description}
              onChange={(e) => setExpenseCategoryFormData({ ...expenseCategoryFormData, description: e.target.value })}
              multiline
              rows={3}
            />
            <FormControl fullWidth>
              <InputLabel>Category Type</InputLabel>
              <Select
                value={expenseCategoryFormData.categoryType}
                label="Category Type"
                onChange={(e) => setExpenseCategoryFormData({ ...expenseCategoryFormData, categoryType: e.target.value })}
              >
                <MenuItem value="FIXED">Fixed</MenuItem>
                <MenuItem value="VARIABLE">Variable</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Applies To</InputLabel>
              <Select
                value={expenseCategoryFormData.appliesTo}
                label="Applies To"
                onChange={(e) => setExpenseCategoryFormData({ ...expenseCategoryFormData, appliesTo: e.target.value })}
              >
                <MenuItem value="CAB">Cab</MenuItem>
                <MenuItem value="COMPANY">Company</MenuItem>
                <MenuItem value="DRIVER">Driver</MenuItem>
                <MenuItem value="OWNER">Owner</MenuItem>
                <MenuItem value="SHIFT">Shift</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenExpenseCategoryDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveExpenseCategory} variant="contained">
            {editingExpenseCategory ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Revenue Category Dialog */}
      <Dialog open={openRevenueCategoryDialog} onClose={() => setOpenRevenueCategoryDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: "success.light" }}>
          {editingRevenueCategory ? "Edit Revenue Category" : "Add Revenue Category"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <TextField
              label="Category Code"
              value={revenueCategoryFormData.categoryCode}
              onChange={(e) => setRevenueCategoryFormData({ ...revenueCategoryFormData, categoryCode: e.target.value.toUpperCase() })}
              required
              placeholder="E.g., LEASE_DAY"
            />
            <TextField
              label="Category Name"
              value={revenueCategoryFormData.categoryName}
              onChange={(e) => setRevenueCategoryFormData({ ...revenueCategoryFormData, categoryName: e.target.value })}
              required
              placeholder="E.g., Lease Revenue - Day Shift"
            />
            <TextField
              label="Description"
              value={revenueCategoryFormData.description}
              onChange={(e) => setRevenueCategoryFormData({ ...revenueCategoryFormData, description: e.target.value })}
              multiline
              rows={3}
            />
            <FormControl fullWidth>
              <InputLabel>Category Type</InputLabel>
              <Select
                value={revenueCategoryFormData.categoryType}
                label="Category Type"
                onChange={(e) => setRevenueCategoryFormData({ ...revenueCategoryFormData, categoryType: e.target.value })}
              >
                <MenuItem value="FIXED">Fixed</MenuItem>
                <MenuItem value="VARIABLE">Variable</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Applies To</InputLabel>
              <Select
                value={revenueCategoryFormData.appliesTo}
                label="Applies To"
                onChange={(e) => setRevenueCategoryFormData({ ...revenueCategoryFormData, appliesTo: e.target.value })}
              >
                <MenuItem value="CAB">Cab</MenuItem>
                <MenuItem value="COMPANY">Company</MenuItem>
                <MenuItem value="DRIVER">Driver</MenuItem>
                <MenuItem value="OWNER">Owner</MenuItem>
                <MenuItem value="SHIFT">Shift</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRevenueCategoryDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveRevenueCategory} variant="contained" color="success">
            {editingRevenueCategory ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}