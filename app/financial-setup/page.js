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
  Autocomplete,
  Tooltip,
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
  CreditCard as MerchantIcon,
  Event as CalendarIcon,
} from "@mui/icons-material";
import GlobalNav from "../components/GlobalNav";
import { getCurrentUser, API_BASE_URL } from "../lib/api";

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

  // Merchant to Cab Mappings
  const [merchant2CabMappings, setMerchant2CabMappings] = useState([]);
  const [allCabs, setAllCabs] = useState([]);
  const [openMerchantMappingDialog, setOpenMerchantMappingDialog] = useState(false);
  const [editingMerchantMapping, setEditingMerchantMapping] = useState(null);
  const [merchantMappingFormData, setMerchantMappingFormData] = useState({
    cabNumber: "",
    merchantNumber: "",
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    notes: "",
  });
  const [openEndMappingDialog, setOpenEndMappingDialog] = useState(false);
  const [endingMapping, setEndingMapping] = useState(null);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [showActiveMappingsOnly, setShowActiveMappingsOnly] = useState(true);

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
        loadLeasePlans(),
        loadAllCabs(),
        loadMerchant2CabMappings(),
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

  const handleDeleteExpenseCategory = (category) => {
    setDeleteWarningData({
      type: "Expense Category",
      error: `The expense category "${category.categoryName}" cannot be deleted.`,
      reason: "Expense categories are part of the core financial configuration. Deleting them could affect historical expense records and reporting accuracy.",
      solution: "If you no longer need this category, deactivate it instead. This will hide it from new expense entries while preserving all historical data and reports."
    });
    setDeleteWarningDialog(true);
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

  const handleDeleteRevenueCategory = (category) => {
    setDeleteWarningData({
      type: "Revenue Category",
      error: `The revenue category "${category.categoryName}" cannot be deleted.`,
      reason: "Revenue categories are part of the core financial configuration. Deleting them could affect historical revenue records and reporting accuracy.",
      solution: "If you no longer need this category, deactivate it instead. This will hide it from new revenue entries while preserving all historical data and reports."
    });
    setDeleteWarningDialog(true);
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

  // ==================== Merchant to Cab Mappings ====================

  const loadAllCabs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cabs`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAllCabs(data);
      }
    } catch (err) {
      console.error("Error loading cabs:", err);
    }
  };

  const loadMerchant2CabMappings = async () => {
    try {
      const endpoint = showActiveMappingsOnly 
        ? `${API_BASE_URL}/financial/merchant2cab/active`
        : `${API_BASE_URL}/financial/merchant2cab`;
      
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setMerchant2CabMappings(data);
      }
    } catch (err) {
      console.error("Error loading merchant2cab mappings:", err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadMerchant2CabMappings();
    }
  }, [showActiveMappingsOnly]);

  const handleOpenMerchantMappingDialog = (mapping = null) => {
    if (mapping) {
      setEditingMerchantMapping(mapping);
      setMerchantMappingFormData({
        cabNumber: mapping.cabNumber,
        merchantNumber: mapping.merchantNumber,
        startDate: mapping.startDate,
        endDate: mapping.endDate || "",
        notes: mapping.notes || "",
      });
    } else {
      setEditingMerchantMapping(null);
      setMerchantMappingFormData({
        cabNumber: "",
        merchantNumber: "",
        startDate: new Date().toISOString().split('T')[0],
        endDate: "",
        notes: "",
      });
    }
    setError("");
    setSuccess("");
    setOpenMerchantMappingDialog(true);
  };

  const handleSaveMerchantMapping = async () => {
    if (!merchantMappingFormData.cabNumber || !merchantMappingFormData.merchantNumber) {
      setError("Cab number and merchant number are required");
      return;
    }

    try {
      const url = editingMerchantMapping
        ? `${API_BASE_URL}/financial/merchant2cab/${editingMerchantMapping.id}`
        : `${API_BASE_URL}/financial/merchant2cab`;
      
      const payload = {
        ...merchantMappingFormData,
        endDate: merchantMappingFormData.endDate || null,
      };
      
      const response = await fetch(url, {
        method: editingMerchantMapping ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to save merchant mapping");
        return;
      }

      setSuccess(editingMerchantMapping ? "Merchant mapping updated" : "Merchant mapping created");
      setOpenMerchantMappingDialog(false);
      loadMerchant2CabMappings();
    } catch (err) {
      console.error("Error saving merchant mapping:", err);
      setError("Failed to save merchant mapping: " + err.message);
    }
  };

  const handleOpenEndMappingDialog = (mapping) => {
    setEndingMapping(mapping);
    setEndDate(new Date().toISOString().split('T')[0]);
    setOpenEndMappingDialog(true);
  };

  const handleEndMerchantMapping = async () => {
    if (!endDate) {
      setError("End date is required");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/financial/merchant2cab/${endingMapping.id}/end?endDate=${endDate}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to end merchant mapping");
        return;
      }

      setSuccess("Merchant mapping ended successfully");
      setOpenEndMappingDialog(false);
      loadMerchant2CabMappings();
    } catch (err) {
      console.error("Error ending merchant mapping:", err);
      setError("Failed to end merchant mapping: " + err.message);
    }
  };

  const handleDeleteMerchantMapping = (id) => {
    const mapping = merchant2CabMappings.find(m => m.id === id);
    setDeleteWarningData({
      type: "Merchant Mapping",
      error: `The merchant mapping for cab "${mapping?.cabNumber || 'N/A'}" cannot be deleted.`,
      reason: "Merchant mappings link credit card transactions to cabs. Deleting this mapping could affect historical transaction records and revenue reports.",
      solution: "If this mapping is no longer active, use the 'End Mapping' button to set an end date instead. This preserves the historical link while preventing future use."
    });
    setDeleteWarningDialog(true);
  };

  const getCabDescription = (mapping) => {
    const parts = [];
    if (mapping.year) parts.push(mapping.year);
    if (mapping.make) parts.push(mapping.make);
    if (mapping.model) parts.push(mapping.model);
    if (mapping.color) parts.push(mapping.color);
    return parts.length > 0 ? parts.join(' ') : '-';
  };

  // ==================== Lease Plans ====================

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
    setError("");
    setSuccess("");
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
          Authorization: `Bearer ${localStorage.getItem("token")}`,
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
      console.error("Error saving lease plan:", err);
      setError("Failed to save lease plan: " + err.message);
    }
  };

  const handleDeletePlan = (id) => {
    const plan = leasePlans.find(p => p.id === id);
    setDeleteWarningData({
      type: "Lease Plan",
      error: `The lease plan "${plan?.planName || 'selected'}" cannot be deleted.`,
      reason: "Lease plans are used to calculate driver lease charges. Deleting a plan could affect historical financial records and break lease calculations for past shifts.",
      solution: "If this plan is no longer needed, set an 'Effective To' end date on it instead. This will prevent it from being used for future calculations while preserving historical data."
    });
    setDeleteWarningDialog(true);
  };

  const handleSelectPlan = async (plan) => {
    setSelectedPlan(plan);
    await loadLeaseRates(plan.id);
  };

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
      } else {
        setLeaseRates([]);
      }
    } catch (err) {
      console.error("Error loading lease rates:", err);
      setLeaseRates([]);
    }
  };

  // ==================== Lease Rates ====================

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
    setError("");
    setSuccess("");
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
      
      const payload = {
        ...rateFormData,
        baseRate: parseFloat(rateFormData.baseRate) || 0,
        mileageRate: parseFloat(rateFormData.mileageRate) || 0,
      };
      
      const response = await fetch(url, {
        method: editingRate ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
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
      console.error("Error saving lease rate:", err);
      setError("Failed to save lease rate: " + err.message);
    }
  };

  const handleDeleteRate = (id) => {
    const rate = leaseRates.find(r => r.id === id);
    setDeleteWarningData({
      type: "Lease Rate",
      error: `This lease rate cannot be deleted.`,
      reason: `Lease rates (${rate?.cabType || 'N/A'} - ${rate?.shiftType || 'N/A'} - ${rate?.dayOfWeek || 'N/A'}) are used to calculate driver charges. Deleting rates could cause incorrect calculations for historical and future shifts.`,
      solution: "If the rate is incorrect, edit it instead of deleting. If this rate configuration is no longer needed, consider creating a new lease plan with updated rates for future use."
    });
    setDeleteWarningDialog(true);
  };

  if (!currentUser) return null;

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f6f9fc" }}>
      <GlobalNav currentUser={currentUser} />

      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: "#3e5244" }}>
          Financial Configuration
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Manage expense categories, revenue categories, lease plans, rates, and merchant mappings
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
          <Grid item xs={12} sm={6} md={2.4}>
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
          <Grid item xs={12} sm={6} md={2.4}>
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
          <Grid item xs={12} sm={6} md={2.4}>
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
          <Grid item xs={12} sm={6} md={2.4}>
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
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <MerchantIcon color="info" />
                  <Box>
                    <Typography color="textSecondary" variant="body2">
                      Merchant Mappings
                    </Typography>
                    <Typography variant="h5">
                      {merchant2CabMappings.filter(m => m.active).length}
                    </Typography>
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
            <Tab label="Merchant Mappings" icon={<MerchantIcon />} iconPosition="start" />
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
                              title={category.active ? "Deactivate" : "Activate"}
                            >
                              {category.active ? <InactiveIcon /> : <ActiveIcon />}
                            </IconButton>
                            {canDelete && (
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleDeleteExpenseCategory(category)}
                                title="Delete"
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
                              title={category.active ? "Deactivate" : "Activate"}
                            >
                              {category.active ? <InactiveIcon /> : <ActiveIcon />}
                            </IconButton>
                            {canDelete && (
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleDeleteRevenueCategory(category)}
                                title="Delete"
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
          {currentTab === 2 && (
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                {/* Left Side: Lease Plans List */}
                <Grid item xs={12} md={selectedPlan ? 5 : 12}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
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
                              <TableCell>{plan.effectiveFrom || '-'}</TableCell>
                              <TableCell>{plan.effectiveTo || 'Current'}</TableCell>
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
                                    onClick={(e) => { e.stopPropagation(); handleOpenPlanDialog(plan); }}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                  {canDelete && (
                                    <IconButton 
                                      size="small" 
                                      color="error"
                                      onClick={(e) => { e.stopPropagation(); handleDeletePlan(plan.id); }}
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

                {/* Right Side: Lease Rates for Selected Plan */}
                {selectedPlan && (
                  <Grid item xs={12} md={7}>
                    <Paper sx={{ p: 2 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                        <Box>
                          <Typography variant="h6">
                            Rates for: {selectedPlan.planName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {selectedPlan.effectiveFrom || 'N/A'} - {selectedPlan.effectiveTo || 'Current'}
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
                                  <TableCell align="right">${parseFloat(rate.baseRate || 0).toFixed(2)}</TableCell>
                                  <TableCell align="right">${parseFloat(rate.mileageRate || 0).toFixed(2)}</TableCell>
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
            </Box>
          )}

          {/* Tab 3: Merchant to Cab Mappings */}
          {currentTab === 3 && (
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Typography variant="h6">Merchant Number to Cab Mappings</Typography>
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <Select
                      value={showActiveMappingsOnly ? "active" : "all"}
                      onChange={(e) => setShowActiveMappingsOnly(e.target.value === "active")}
                    >
                      <MenuItem value="active">Active Only</MenuItem>
                      <MenuItem value="all">All Mappings</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                {canEdit && (
                  <Button
                    variant="contained"
                    color="info"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenMerchantMappingDialog()}
                  >
                    Add Merchant Mapping
                  </Button>
                )}
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Cab Number</TableCell>
                      <TableCell>Vehicle</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Owner</TableCell>
                      <TableCell>Merchant Number</TableCell>
                      <TableCell>Start Date</TableCell>
                      <TableCell>End Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Notes</TableCell>
                      {canEdit && <TableCell align="right">Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {merchant2CabMappings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            No merchant mappings found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      merchant2CabMappings.map((mapping) => (
                        <TableRow key={mapping.id}>
                          <TableCell>
                            <Chip label={mapping.cabNumber} size="small" color="primary" />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {getCabDescription(mapping)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {mapping.cabType && (
                              <Chip 
                                label={mapping.cabType.replace('_', ' ')} 
                                size="small" 
                                variant="outlined"
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {mapping.ownerDriverName || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              {mapping.merchantNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>{mapping.startDate}</TableCell>
                          <TableCell>{mapping.endDate || 'Current'}</TableCell>
                          <TableCell>
                            <Chip
                              icon={mapping.active ? <ActiveIcon /> : <InactiveIcon />}
                              label={mapping.active ? "Active" : "Ended"}
                              color={mapping.active ? "success" : "default"}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Tooltip title={mapping.notes || ''}>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  maxWidth: 150, 
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {mapping.notes || '-'}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          {canEdit && (
                            <TableCell align="right">
                              <IconButton 
                                size="small" 
                                onClick={() => handleOpenMerchantMappingDialog(mapping)}
                                title="Edit"
                              >
                                <EditIcon />
                              </IconButton>
                              {mapping.active && (
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleOpenEndMappingDialog(mapping)}
                                  title="End mapping"
                                  color="warning"
                                >
                                  <CalendarIcon />
                                </IconButton>
                              )}
                              {canDelete && (
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleDeleteMerchantMapping(mapping.id)}
                                  title="Delete"
                                  color="error"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
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

      {/* Merchant Mapping Dialog */}
      <Dialog open={openMerchantMappingDialog} onClose={() => setOpenMerchantMappingDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: "info.light" }}>
          {editingMerchantMapping ? "Edit Merchant Mapping" : "Add Merchant Mapping"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <Autocomplete
              options={allCabs}
              getOptionLabel={(option) => `${option.cabNumber} - ${option.make || ''} ${option.model || ''}`}
              value={allCabs.find(c => c.cabNumber === merchantMappingFormData.cabNumber) || null}
              onChange={(e, newValue) => 
                setMerchantMappingFormData({ 
                  ...merchantMappingFormData, 
                  cabNumber: newValue?.cabNumber || "" 
                })
              }
              disabled={!!editingMerchantMapping}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Cab Number"
                  required
                  helperText={editingMerchantMapping ? "Cannot change cab number on existing mapping" : ""}
                />
              )}
            />
            <TextField
              label="Merchant Number"
              value={merchantMappingFormData.merchantNumber}
              onChange={(e) => setMerchantMappingFormData({ ...merchantMappingFormData, merchantNumber: e.target.value })}
              required
              placeholder="e.g., 123456789"
            />
            <TextField
              label="Start Date"
              type="date"
              value={merchantMappingFormData.startDate}
              onChange={(e) => setMerchantMappingFormData({ ...merchantMappingFormData, startDate: e.target.value })}
              required
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End Date"
              type="date"
              value={merchantMappingFormData.endDate}
              onChange={(e) => setMerchantMappingFormData({ ...merchantMappingFormData, endDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              helperText="Leave empty for current mapping"
              inputProps={{
                min: merchantMappingFormData.startDate
              }}
            />
            <TextField
              label="Notes"
              value={merchantMappingFormData.notes}
              onChange={(e) => setMerchantMappingFormData({ ...merchantMappingFormData, notes: e.target.value })}
              multiline
              rows={3}
              placeholder="Optional notes about this mapping..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMerchantMappingDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveMerchantMapping} variant="contained" color="info">
            {editingMerchantMapping ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* End Mapping Dialog */}
      <Dialog open={openEndMappingDialog} onClose={() => setOpenEndMappingDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>End Merchant Mapping</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            {endingMapping && (
              <Alert severity="info">
                <AlertTitle>Ending Mapping</AlertTitle>
                <Typography variant="body2">
                  <strong>Cab:</strong> {endingMapping.cabNumber}
                </Typography>
                <Typography variant="body2">
                  <strong>Merchant:</strong> {endingMapping.merchantNumber}
                </Typography>
                <Typography variant="body2">
                  <strong>Start Date:</strong> {endingMapping.startDate}
                </Typography>
              </Alert>
            )}
            <TextField
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              InputLabelProps={{ shrink: true }}
              inputProps={{
                min: endingMapping?.startDate
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEndMappingDialog(false)}>Cancel</Button>
          <Button onClick={handleEndMerchantMapping} variant="contained" color="warning">
            End Mapping
          </Button>
        </DialogActions>
      </Dialog>

      {/* Lease Plan Dialog */}
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
              onChange={(e) => setPlanFormData({ ...planFormData, effectiveFrom: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Effective To"
              type="date"
              value={planFormData.effectiveTo}
              onChange={(e) => setPlanFormData({ ...planFormData, effectiveTo: e.target.value })}
              InputLabelProps={{ shrink: true }}
              helperText="Leave empty for currently active plan"
            />
            <TextField
              label="Notes"
              value={planFormData.notes}
              onChange={(e) => setPlanFormData({ ...planFormData, notes: e.target.value })}
              multiline
              rows={3}
              placeholder="Optional notes about this plan..."
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

      {/* Delete Warning Dialog */}
      <Dialog open={deleteWarningDialog} onClose={() => setDeleteWarningDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: "error.light", color: "error.contrastText", display: "flex", alignItems: "center", gap: 1 }}>
          <BlockIcon />
          Cannot Delete {deleteWarningData.type}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              <AlertTitle>Deletion Blocked</AlertTitle>
              {deleteWarningData.error}
            </Alert>
            
            {deleteWarningData.reason && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Reason:
                </Typography>
                <Typography variant="body2">
                  {deleteWarningData.reason}
                </Typography>
              </Box>
            )}
            
            {deleteWarningData.solution && (
              <Box sx={{ p: 2, bgcolor: "info.lighter", borderRadius: 1 }}>
                <Typography variant="subtitle2" color="info.main" gutterBottom>
                  What you can do:
                </Typography>
                <Typography variant="body2">
                  {deleteWarningData.solution}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteWarningDialog(false)} 
            variant="contained"
          >
            I Understand
          </Button>
        </DialogActions>
      </Dialog>

      {/* Lease Rate Dialog */}
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
                onChange={(e) => setRateFormData({ ...rateFormData, hasAirportLicense: e.target.value })}
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
              onChange={(e) => setRateFormData({ ...rateFormData, mileageRate: e.target.value })}
              inputProps={{ step: "0.01", min: "0" }}
            />
            <TextField
              label="Notes"
              value={rateFormData.notes}
              onChange={(e) => setRateFormData({ ...rateFormData, notes: e.target.value })}
              multiline
              rows={2}
              placeholder="Optional notes..."
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
    </Box>
  );
}