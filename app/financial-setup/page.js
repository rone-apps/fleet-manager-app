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
    type: "",      // 'plan' or 'rate'
    error: "",
    reason: "",
    solution: ""
  });

  // Expense Categories
  const [categories, setCategories] = useState([]);
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryFormData, setCategoryFormData] = useState({
    categoryCode: "",
    categoryName: "",
    description: "",
    categoryType: "VARIABLE",
    appliesTo: "SHIFT",
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
      await Promise.all([loadCategories(), loadLeasePlans()]);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load financial configuration");
    } finally {
      setLoading(false);
    }
  };

  // ==================== Expense Categories ====================

  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/expense-categories`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (err) {
      console.error("Error loading categories:", err);
    }
  };

  const handleOpenCategoryDialog = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setCategoryFormData({
        categoryCode: category.categoryCode,
        categoryName: category.categoryName,
        description: category.description || "",
        categoryType: category.categoryType,
        appliesTo: category.appliesTo,
      });
    } else {
      setEditingCategory(null);
      setCategoryFormData({
        categoryCode: "",
        categoryName: "",
        description: "",
        categoryType: "VARIABLE",
        appliesTo: "SHIFT",
      });
    }
    setError("");
    setSuccess("");
    setOpenCategoryDialog(true);
  };

  const handleSaveCategory = async () => {
    // Validate required fields
    if (!categoryFormData.categoryCode || !categoryFormData.categoryName) {
      setError("Category code and name are required");
      return;
    }

    try {
      const url = editingCategory
        ? `${API_BASE_URL}/expense-categories/${editingCategory.id}`
        : `${API_BASE_URL}/expense-categories`;
      
      const payload = {
        ...categoryFormData,
        isActive: editingCategory ? editingCategory.active : true
      };
      
      console.log("Saving category:", {
        url,
        method: editingCategory ? "PUT" : "POST",
        data: payload
      });
      
      const response = await fetch(url, {
        method: editingCategory ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        setError(`Failed to save category (${response.status}): ${errorText}`);
        return;
      }

      setSuccess(editingCategory ? "Category updated successfully" : "Category created successfully");
      setOpenCategoryDialog(false);
      loadCategories();
    } catch (err) {
      console.error("Error saving category:", err);
      setError("Failed to save category: " + err.message);
    }
  };

  const handleDeleteCategory = async (id) => {
    // Show dialog explaining categories can't be deleted
    setDeleteWarningData({
      type: 'category',
      error: 'Expense categories cannot be deleted',
      reason: 'Deleting categories would affect historical expense records and reporting. Categories are referenced by existing expenses.',
      solution: 'Use the deactivate button to disable this category instead. Inactive categories won\'t appear in new expense forms but will remain available for historical data.'
    });
    setDeleteWarningDialog(true);
  };

  const handleToggleCategoryActive = async (category) => {
    try {
      const action = category.active ? "deactivate" : "activate";
      const response = await fetch(`${API_BASE_URL}/expense-categories/${category.id}/${action}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        setSuccess(`Category ${action}d successfully`);
        loadCategories();
      } else {
        setError(`Failed to ${action} category`);
      }
    } catch (err) {
      console.error(`Error toggling category:`, err);
      setError("Failed to update category status");
    }
  };

  // ==================== Lease Plans ====================

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

  const handleOpenPlanDialog = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanFormData({
        planName: plan.planName,
        effectiveFrom: plan.effectiveFrom,
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
    setError("");
    setSuccess("");
    setOpenPlanDialog(true);
  };

  const handleSavePlan = async () => {
    try {
      const url = editingPlan
        ? `${API_BASE_URL}/lease-plans/${editingPlan.id}`
        : `${API_BASE_URL}/lease-plans`;
      
      const payload = {
        planName: planFormData.planName,
        effectiveFrom: planFormData.effectiveFrom,
        effectiveTo: planFormData.effectiveTo || null,
        notes: planFormData.notes || null,
        isActive: true,
      };

      const response = await fetch(url, {
        method: editingPlan ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSuccess(editingPlan ? "Plan updated successfully" : "Plan created successfully");
        setOpenPlanDialog(false);
        loadLeasePlans();
      } else {
        // Safely handle error response - may not contain JSON
        let errorMessage = "Failed to save plan";
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } else {
            const errorText = await response.text();
            errorMessage = errorText || `Error: ${response.status} ${response.statusText}`;
          }
        } catch (parseError) {
          errorMessage = `Error: ${response.status} ${response.statusText}`;
        }
        setError(errorMessage);
      }
    } catch (err) {
      console.error("Error saving plan:", err);
      setError("Failed to save plan");
    }
  };

  const handleDeletePlan = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/lease-plans/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.status === 405) {
        // Method Not Allowed - show our custom dialog
        const data = await response.json();
        setDeleteWarningData({
          type: 'plan',
          error: data.error,
          reason: data.reason,
          solution: data.solution
        });
        setDeleteWarningDialog(true);
        return;
      }
      
      if (response.ok) {
        setSuccess("Plan deleted successfully");
        loadLeasePlans();
      } else {
        setError("Failed to delete plan");
      }
    } catch (err) {
      console.error("Error deleting plan:", err);
      setError("Failed to delete plan");
    }
  };

  const handleSelectPlan = async (plan) => {
    setSelectedPlan(plan);
    loadLeaseRates(plan.id);
  };

  // ==================== Lease Rates ====================

  const loadLeaseRates = async (planId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/lease-plans/${planId}/rates`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setLeaseRates(data);
      }
    } catch (err) {
      console.error("Error loading lease rates:", err);
    }
  };

  const handleOpenRateDialog = (rate = null) => {
    if (!selectedPlan) {
      setError("Please select a lease plan first");
      return;
    }

    if (rate) {
      setEditingRate(rate);
      setRateFormData({
        cabType: rate.cabType,
        hasAirportLicense: rate.hasAirportLicense,
        shiftType: rate.shiftType,
        dayOfWeek: rate.dayOfWeek,
        baseRate: rate.baseRate,
        mileageRate: rate.mileageRate,
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
    setError("");
    setSuccess("");
    setOpenRateDialog(true);
  };

  const handleSaveRate = async () => {
    try {
      const url = editingRate
        ? `${API_BASE_URL}/lease-plans/rates/${editingRate.id}`
        : `${API_BASE_URL}/lease-plans/${selectedPlan.id}/rate`;
      
      const response = await fetch(url, {
        method: editingRate ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(rateFormData),
      });

      if (response.ok) {
        setSuccess(editingRate ? "Rate updated successfully" : "Rate created successfully");
        setOpenRateDialog(false);
        loadLeaseRates(selectedPlan.id);
      } else {
        // Safely handle error response - may not contain JSON
        let errorMessage = "Failed to save rate";
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } else {
            const errorText = await response.text();
            errorMessage = errorText || `Error: ${response.status} ${response.statusText}`;
          }
        } catch (parseError) {
          errorMessage = `Error: ${response.status} ${response.statusText}`;
        }
        setError(errorMessage);
      }
    } catch (err) {
      console.error("Error saving rate:", err);
      setError("Failed to save rate");
    }
  };

  const handleDeleteRate = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/lease-plans/rates/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.status === 405) {
        // Method Not Allowed - show our custom dialog
        const data = await response.json();
        setDeleteWarningData({
          type: 'rate',
          error: data.error,
          reason: data.reason,
          solution: data.solution
        });
        setDeleteWarningDialog(true);
        return;
      }
      
      if (response.ok) {
        setSuccess("Rate deleted successfully");
        loadLeaseRates(selectedPlan.id);
      } else {
        setError("Failed to delete rate");
      }
    } catch (err) {
      console.error("Error deleting rate:", err);
      setError("Failed to delete rate");
    }
  };

  if (loading) {
    return (
      <Box>
        <GlobalNav currentUser={currentUser} title="Financial Setup" />
        <Box sx={{ p: 3, textAlign: "center" }}>
          <Typography>Loading...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <GlobalNav currentUser={currentUser} title="Financial Setup" />
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Financial Setup
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Configure expense categories and lease rate plans
          </Typography>
        </Box>

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

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CategoryIcon color="primary" />
                  <Box>
                    <Typography color="textSecondary" variant="body2">
                      Expense Categories
                    </Typography>
                    <Typography variant="h5">{categories.length}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <ActiveIcon color="success" />
                  <Box>
                    <Typography color="textSecondary" variant="body2">
                      Active Categories
                    </Typography>
                    <Typography variant="h5">{categories.filter(c => c.active).length}</Typography>
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
            <Tab label="Lease Plans & Rates" icon={<ReceiptIcon />} iconPosition="start" />
          </Tabs>

          {/* Tab 1: Expense Categories */}
          {currentTab === 0 && (
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6">Expense Categories</Typography>
                {canEdit && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenCategoryDialog()}
                  >
                    Add Category
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
                    {categories.map((category) => (
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
                            <IconButton size="small" onClick={() => handleOpenCategoryDialog(category)}>
                              <EditIcon />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={() => handleToggleCategoryActive(category)}
                              color={category.active ? "default" : "success"}
                            >
                              {category.active ? <InactiveIcon /> : <ActiveIcon />}
                            </IconButton>
                            {canDelete && (
                              <IconButton 
                                size="small" 
                                onClick={() => handleDeleteCategory(category.id)}
                                color="error"
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
            </Box>
          )}

          {/* Tab 2: Lease Plans & Rates */}
          {currentTab === 1 && (
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                {/* Left: Lease Plans */}
                <Grid item xs={12} md={5}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography variant="h6">Lease Plans</Typography>
                    {canEdit && (
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenPlanDialog()}
                      >
                        Add Plan
                      </Button>
                    )}
                  </Box>

                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Plan Name</TableCell>
                          <TableCell>Effective</TableCell>
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
                              <Typography variant="body2" fontWeight={selectedPlan?.id === plan.id ? "bold" : "normal"}>
                                {plan.planName}
                              </Typography>
                              {plan.active && (
                                <Chip label="Active" color="success" size="small" sx={{ mt: 0.5 }} />
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" display="block">
                                From: {plan.effectiveFrom}
                              </Typography>
                              {plan.effectiveTo && (
                                <Typography variant="caption" display="block">
                                  To: {plan.effectiveTo}
                                </Typography>
                              )}
                            </TableCell>
                            {canEdit && (
                              <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                                <IconButton size="small" onClick={() => handleOpenPlanDialog(plan)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                {canDelete && (
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleDeletePlan(plan.id)}
                                    color="error"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                )}
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                {/* Right: Lease Rates */}
                <Grid item xs={12} md={7}>
                  {selectedPlan ? (
                    <>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                        <Typography variant="h6">Rates for {selectedPlan.planName}</Typography>
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
                      </Box>

                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Cab Type</TableCell>
                              <TableCell>Airport</TableCell>
                              <TableCell>Shift</TableCell>
                              <TableCell>Day</TableCell>
                              <TableCell align="right">Base Rate</TableCell>
                              <TableCell align="right">Mile Rate</TableCell>
                              {canEdit && <TableCell align="right">Actions</TableCell>}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {leaseRates.map((rate) => (
                              <TableRow key={rate.id}>
                                <TableCell>{rate.cabType}</TableCell>
                                <TableCell>
                                  <Chip 
                                    label={rate.hasAirportLicense ? "Yes" : "No"}
                                    color={rate.hasAirportLicense ? "primary" : "default"}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>{rate.shiftType}</TableCell>
                                <TableCell>{rate.dayOfWeek}</TableCell>
                                <TableCell align="right">${rate.baseRate}</TableCell>
                                <TableCell align="right">${rate.mileageRate}</TableCell>
                                {canEdit && (
                                  <TableCell align="right">
                                    <IconButton size="small" onClick={() => handleOpenRateDialog(rate)}>
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                    {canDelete && (
                                      <IconButton 
                                        size="small" 
                                        onClick={() => handleDeleteRate(rate.id)}
                                        color="error"
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    )}
                                  </TableCell>
                                )}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </>
                  ) : (
                    <Paper sx={{ p: 5, textAlign: "center" }} variant="outlined">
                      <PlanIcon sx={{ fontSize: 60, color: "#ccc", mb: 2 }} />
                      <Typography variant="h6" color="textSecondary">
                        Select a lease plan to view its rates
                      </Typography>
                    </Paper>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
        </Paper>

        {/* Category Dialog */}
        <Dialog open={openCategoryDialog} onClose={() => setOpenCategoryDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Category Code"
                value={categoryFormData.categoryCode}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, categoryCode: e.target.value.toUpperCase() })}
                fullWidth
                required
                disabled={!!editingCategory}
                placeholder="e.g., FUEL, MAINT"
              />
              <TextField
                label="Category Name"
                value={categoryFormData.categoryName}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, categoryName: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Description"
                value={categoryFormData.description}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                fullWidth
                multiline
                rows={2}
              />
              <FormControl fullWidth required>
                <InputLabel>Category Type</InputLabel>
                <Select
                  value={categoryFormData.categoryType}
                  label="Category Type"
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, categoryType: e.target.value })}
                >
                  <MenuItem value="FIXED">Fixed (Recurring)</MenuItem>
                  <MenuItem value="VARIABLE">Variable (One-time)</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth required>
                <InputLabel>Applies To</InputLabel>
                <Select
                  value={categoryFormData.appliesTo}
                  label="Applies To"
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, appliesTo: e.target.value })}
                >
                  <MenuItem value="CAB">Cab</MenuItem>
                  <MenuItem value="SHIFT">Shift</MenuItem>
                  <MenuItem value="OWNER">Owner</MenuItem>
                  <MenuItem value="DRIVER">Driver</MenuItem>
                  <MenuItem value="COMPANY">Company</MenuItem>
                </Select>
              </FormControl>
              {error && <Alert severity="error">{error}</Alert>}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCategoryDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveCategory} variant="contained">
              {editingCategory ? "Update" : "Create"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Plan Dialog */}
        <Dialog open={openPlanDialog} onClose={() => setOpenPlanDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editingPlan ? "Edit Lease Plan" : "Add Lease Plan"}</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
              {!editingPlan && (
                <Alert severity="warning" sx={{ mb: 1 }}>
                  <AlertTitle>⚠️ Important</AlertTitle>
                  <Typography variant="body2">
                    • Plans are <strong>permanent</strong> and cannot be deleted
                    <br/>
                    • Rates added to plans cannot be edited or removed
                    <br/>
                    • To change rates: create new plan and close current one
                  </Typography>
                </Alert>
              )}
              <TextField
                label="Plan Name"
                value={planFormData.planName}
                onChange={(e) => setPlanFormData({ ...planFormData, planName: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Effective From"
                type="date"
                value={planFormData.effectiveFrom}
                onChange={(e) => setPlanFormData({ ...planFormData, effectiveFrom: e.target.value })}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Effective To (Optional)"
                type="date"
                value={planFormData.effectiveTo}
                onChange={(e) => setPlanFormData({ ...planFormData, effectiveTo: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Notes"
                value={planFormData.notes}
                onChange={(e) => setPlanFormData({ ...planFormData, notes: e.target.value })}
                fullWidth
                multiline
                rows={3}
              />
              {error && <Alert severity="error">{error}</Alert>}
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
          <DialogTitle>{editingRate ? "Edit Lease Rate" : "Add Lease Rate"}</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
              {!editingRate && (
                <Alert severity="info" sx={{ mb: 1 }}>
                  <AlertTitle>Rates Are Final</AlertTitle>
                  <Typography variant="body2">
                    • Once saved, rates <strong>cannot be edited or deleted</strong>
                    <br/>
                    • Verify all amounts before saving
                  </Typography>
                </Alert>
              )}
              <FormControl fullWidth required>
                <InputLabel>Cab Type</InputLabel>
                <Select
                  value={rateFormData.cabType}
                  label="Cab Type"
                  onChange={(e) => setRateFormData({ ...rateFormData, cabType: e.target.value })}
                  disabled={!!editingRate}
                >
                  <MenuItem value="SEDAN">Sedan</MenuItem>
                  <MenuItem value="HANDICAP_VAN">Handicap Van</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth required>
                <InputLabel>Airport License</InputLabel>
                <Select
                  value={rateFormData.hasAirportLicense}
                  label="Airport License"
                  onChange={(e) => setRateFormData({ ...rateFormData, hasAirportLicense: e.target.value })}
                  disabled={!!editingRate}
                >
                  <MenuItem value={false}>No</MenuItem>
                  <MenuItem value={true}>Yes</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth required>
                <InputLabel>Shift Type</InputLabel>
                <Select
                  value={rateFormData.shiftType}
                  label="Shift Type"
                  onChange={(e) => setRateFormData({ ...rateFormData, shiftType: e.target.value })}
                  disabled={!!editingRate}
                >
                  <MenuItem value="DAY">Day</MenuItem>
                  <MenuItem value="NIGHT">Night</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth required>
                <InputLabel>Day of Week</InputLabel>
                <Select
                  value={rateFormData.dayOfWeek}
                  label="Day of Week"
                  onChange={(e) => setRateFormData({ ...rateFormData, dayOfWeek: e.target.value })}
                  disabled={!!editingRate}
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
              <TextField
                label="Base Rate"
                type="number"
                value={rateFormData.baseRate}
                onChange={(e) => setRateFormData({ ...rateFormData, baseRate: e.target.value })}
                fullWidth
                required
                InputProps={{ startAdornment: "$" }}
              />
              <TextField
                label="Mileage Rate (per mile)"
                type="number"
                value={rateFormData.mileageRate}
                onChange={(e) => setRateFormData({ ...rateFormData, mileageRate: e.target.value })}
                fullWidth
                required
                InputProps={{ startAdornment: "$" }}
                inputProps={{ step: "0.01" }}
              />
              <TextField
                label="Notes"
                value={rateFormData.notes}
                onChange={(e) => setRateFormData({ ...rateFormData, notes: e.target.value })}
                fullWidth
                multiline
                rows={2}
              />
              {error && <Alert severity="error">{error}</Alert>}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenRateDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveRate} variant="contained">
              {editingRate ? "Update" : "Create"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Warning Dialog */}
        <Dialog 
          open={deleteWarningDialog} 
          onClose={() => setDeleteWarningDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BlockIcon color="error" fontSize="large" />
              <Typography variant="h6" color="error">
                {deleteWarningData.type === 'plan' 
                  ? 'Cannot Delete Lease Plan' 
                  : deleteWarningData.type === 'rate'
                  ? 'Cannot Delete Lease Rate'
                  : 'Cannot Delete Expense Category'}
              </Typography>
            </Box>
          </DialogTitle>
          
          <DialogContent>
            <Alert severity="error" sx={{ mb: 3 }}>
              <AlertTitle sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                {deleteWarningData.error}
              </AlertTitle>
            </Alert>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" color="error" sx={{ fontWeight: 'bold', mb: 1 }}>
                Why This Rule Exists:
              </Typography>
              <Typography variant="body1" paragraph>
                {deleteWarningData.reason}
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                What You Should Do Instead:
              </Typography>
              <Typography variant="body1" paragraph>
                {deleteWarningData.solution}
              </Typography>
            </Box>

            {deleteWarningData.type === 'plan' && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <AlertTitle>Recommended Workflow</AlertTitle>
                <Typography variant="body2" component="div">
                  <ol style={{ margin: 0, paddingLeft: '20px' }}>
                    <li>Click the <strong>Edit</strong> button to set an end date for this plan</li>
                    <li>The plan will remain in the system for historical records</li>
                    <li>Create a new plan if you need different rates</li>
                  </ol>
                </Typography>
              </Alert>
            )}

            {deleteWarningData.type === 'rate' && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <AlertTitle>Recommended Workflow</AlertTitle>
                <Typography variant="body2" component="div">
                  <ol style={{ margin: 0, paddingLeft: '20px' }}>
                    <li>Create a new lease plan with the correct rates</li>
                    <li>Set an end date on the current plan</li>
                    <li>New plan will take effect on its start date</li>
                    <li>Historical expenses will remain accurate</li>
                  </ol>
                </Typography>
              </Alert>
            )}

            {deleteWarningData.type === 'category' && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <AlertTitle>Recommended Workflow</AlertTitle>
                <Typography variant="body2" component="div">
                  <ol style={{ margin: 0, paddingLeft: '20px' }}>
                    <li>Click the <strong>Deactivate</strong> button (toggle icon) for this category</li>
                    <li>Category will no longer appear in new expense forms</li>
                    <li>Existing expenses will keep their category assignments</li>
                    <li>You can reactivate the category later if needed</li>
                  </ol>
                </Typography>
              </Alert>
            )}
          </DialogContent>
          
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button 
              onClick={() => setDeleteWarningDialog(false)} 
              variant="contained" 
              color="primary"
              size="large"
            >
              I Understand
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}