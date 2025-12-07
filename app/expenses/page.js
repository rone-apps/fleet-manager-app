"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
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
  Tabs,
  Tab,
  InputAdornment,
  Switch,
  FormControlLabel,
  Tooltip,
  Badge,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon,
  DirectionsCar as CabIcon,
  Person as DriverIcon,
  Category as CategoryIcon,
  DateRange as DateIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Search as SearchIcon,
  Repeat as RecurringIcon,
  EventNote as OneTimeIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Info as InfoIcon,
  History as HistoryIcon,
  AttachFile as AttachFileIcon,
  MoneyOff as ReimbursableIcon,
  Block as BlockIcon,
} from "@mui/icons-material";
import GlobalNav from "../components/GlobalNav";
import { getCurrentUser } from "../lib/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export default function ExpensesPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTab, setCurrentTab] = useState(0); // 0=Recurring, 1=OneTime
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Delete Warning Dialog
  const [deleteWarningDialog, setDeleteWarningDialog] = useState(false);
  const [deleteWarningData, setDeleteWarningData] = useState({
    type: "",      // 'recurring' or 'onetime'
    error: "",
    reason: "",
    solution: ""
  });

  // Data
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [oneTimeExpenses, setOneTimeExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cabs, setCabs] = useState([]);
  const [drivers, setDrivers] = useState([]);

  // Filters
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterEntityType, setFilterEntityType] = useState("");
  const [filterEntityId, setFilterEntityId] = useState("");
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [searchText, setSearchText] = useState("");

  // Dialogs
  const [openRecurringDialog, setOpenRecurringDialog] = useState(false);
  const [openOneTimeDialog, setOpenOneTimeDialog] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState(null);
  const [editingOneTime, setEditingOneTime] = useState(null);

  // Recurring Expense Form
  const [recurringFormData, setRecurringFormData] = useState({
    expenseCategoryId: "",
    entityType: "CAB",
    entityId: "",
    amount: "",
    billingMethod: "MONTHLY",
    effectiveFrom: "",
    effectiveTo: "",
    notes: "",
  });

  // OneTime Expense Form
  const [oneTimeFormData, setOneTimeFormData] = useState({
    expenseCategoryId: "",
    entityType: "CAB",
    entityId: "",
    amount: "",
    expenseDate: new Date().toISOString().split('T')[0],
    paidBy: "COMPANY",
    responsibleParty: "COMPANY",
    description: "",
    vendor: "",
    receiptUrl: "",
    invoiceNumber: "",
    isReimbursable: false,
    notes: "",
  });

  const canEdit = ["ADMIN", "MANAGER", "ACCOUNTANT"].includes(currentUser?.role);
  const canDelete = currentUser?.role === "ADMIN";

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || !["ADMIN", "MANAGER", "ACCOUNTANT", "DISPATCHER"].includes(user.role)) {
      window.location.href = "/";
      return;
    }
    setCurrentUser(user);
    
    // Set default date range (current month)
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    setFilterStartDate(firstDay.toISOString().split('T')[0]);
    setFilterEndDate(lastDay.toISOString().split('T')[0]);
    
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadCategories(),
        loadCabs(),
        loadDrivers(),
        loadRecurringExpenses(),
      ]);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentTab === 1 && filterStartDate && filterEndDate) {
      loadOneTimeExpenses();
    }
  }, [currentTab, filterStartDate, filterEndDate, filterCategory, filterEntityType, filterEntityId]);

  // ==================== Load Data Functions ====================

  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/expense-categories?active=true`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (err) {
      console.error("Error loading categories:", err);
    }
  };

  const loadCabs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cabs`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCabs(data.sort((a, b) => parseInt(a.cabNumber) - parseInt(b.cabNumber)));
      }
    } catch (err) {
      console.error("Error loading cabs:", err);
    }
  };

  const loadDrivers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/drivers`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.ok) {
        const data = await response.json();
        setDrivers(data);
      }
    } catch (err) {
      console.error("Error loading drivers:", err);
    }
  };

  const loadRecurringExpenses = async () => {
    try {
      const endpoint = showActiveOnly 
        ? `${API_BASE_URL}/recurring-expenses/active`
        : `${API_BASE_URL}/recurring-expenses`;
      
      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecurringExpenses(data);
      }
    } catch (err) {
      console.error("Error loading recurring expenses:", err);
    }
  };

  const loadOneTimeExpenses = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/one-time-expenses/between?startDate=${filterStartDate}&endDate=${filterEndDate}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setOneTimeExpenses(data);
      }
    } catch (err) {
      console.error("Error loading one-time expenses:", err);
    }
  };

  // ==================== Recurring Expense Handlers ====================

  const handleOpenRecurringDialog = (expense = null) => {
    if (expense) {
      setEditingRecurring(expense);
      setRecurringFormData({
        expenseCategoryId: expense.expenseCategory?.id || "",
        entityType: expense.entityType,
        entityId: expense.entityId,
        amount: expense.amount,
        billingMethod: expense.billingMethod,
        effectiveFrom: expense.effectiveFrom,
        effectiveTo: expense.effectiveTo || "",
        notes: expense.notes || "",
      });
    } else {
      setEditingRecurring(null);
      const today = new Date();
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString().split('T')[0];
      
      setRecurringFormData({
        expenseCategoryId: "",
        entityType: "CAB",
        entityId: "",
        amount: "",
        billingMethod: "MONTHLY",
        effectiveFrom: firstOfMonth,
        effectiveTo: "",
        notes: "",
      });
    }
    setError("");
    setSuccess("");
    setOpenRecurringDialog(true);
  };

  const handleSaveRecurring = async () => {
    if (!recurringFormData.expenseCategoryId || !recurringFormData.entityId || 
        !recurringFormData.amount || !recurringFormData.effectiveFrom) {
      setError("Category, entity, amount, and effective date are required");
      return;
    }

    try {
      const url = editingRecurring
        ? `${API_BASE_URL}/recurring-expenses/${editingRecurring.id}`
        : `${API_BASE_URL}/recurring-expenses`;
      
      const response = await fetch(url, {
        method: editingRecurring ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(recurringFormData),
      });

      if (response.ok) {
        setSuccess(editingRecurring ? "Recurring expense updated" : "Recurring expense created");
        setOpenRecurringDialog(false);
        loadRecurringExpenses();
      } else {
        const errorText = await response.text();
        setError(errorText || "Failed to save recurring expense");
      }
    } catch (err) {
      console.error("Error saving recurring expense:", err);
      setError(`Failed to save: ${err.message}`);
    }
  };

  const handleDeleteRecurring = async (id) => {
    // Show dialog explaining recurring expenses can't be deleted
    setDeleteWarningData({
      type: 'recurring',
      error: 'Recurring expenses cannot be deleted',
      reason: 'Deleting recurring expenses would corrupt historical financial records and make past calculations impossible to verify. These expenses are referenced in monthly calculations, reports, and audit trails.',
      solution: 'Use the deactivate button (toggle icon) to stop this expense. Set an "Effective To" date to end it at a specific time. The expense will remain in the system for historical accuracy but won\'t be charged going forward.'
    });
    setDeleteWarningDialog(true);
  };

  const handleToggleRecurringActive = async (id, currentStatus) => {
    try {
      const endpoint = currentStatus 
        ? `${API_BASE_URL}/recurring-expenses/${id}/deactivate`
        : `${API_BASE_URL}/recurring-expenses/${id}/reactivate`;
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (response.ok || response.status === 204) {
        setSuccess(`Recurring expense ${currentStatus ? 'deactivated' : 'activated'}`);
        loadRecurringExpenses();
      } else {
        setError("Failed to toggle expense status");
      }
    } catch (err) {
      console.error("Error toggling recurring expense:", err);
      setError("Failed to toggle expense status");
    }
  };

  // ==================== OneTime Expense Handlers ====================

  const handleOpenOneTimeDialog = (expense = null) => {
    if (expense) {
      setEditingOneTime(expense);
      setOneTimeFormData({
        expenseCategoryId: expense.expenseCategory?.id || "",
        entityType: expense.entityType,
        entityId: expense.entityId,
        amount: expense.amount,
        expenseDate: expense.expenseDate,
        paidBy: expense.paidBy,
        responsibleParty: expense.responsibleParty,
        description: expense.description || "",
        vendor: expense.vendor || "",
        receiptUrl: expense.receiptUrl || "",
        invoiceNumber: expense.invoiceNumber || "",
        isReimbursable: expense.isReimbursable || false,
        notes: expense.notes || "",
      });
    } else {
      setEditingOneTime(null);
      setOneTimeFormData({
        expenseCategoryId: "",
        entityType: "CAB",
        entityId: "",
        amount: "",
        expenseDate: new Date().toISOString().split('T')[0],
        paidBy: "COMPANY",
        responsibleParty: "COMPANY",
        description: "",
        vendor: "",
        receiptUrl: "",
        invoiceNumber: "",
        isReimbursable: false,
        notes: "",
      });
    }
    setError("");
    setSuccess("");
    setOpenOneTimeDialog(true);
  };

  const handleSaveOneTime = async () => {
    if (!oneTimeFormData.expenseCategoryId || !oneTimeFormData.entityId || 
        !oneTimeFormData.amount || !oneTimeFormData.expenseDate) {
      setError("Category, entity, amount, and date are required");
      return;
    }

    try {
      const url = editingOneTime
        ? `${API_BASE_URL}/one-time-expenses/${editingOneTime.id}`
        : `${API_BASE_URL}/one-time-expenses`;
      
      const response = await fetch(url, {
        method: editingOneTime ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(oneTimeFormData),
      });

      if (response.ok) {
        setSuccess(editingOneTime ? "Expense updated" : "Expense recorded");
        setOpenOneTimeDialog(false);
        loadOneTimeExpenses();
      } else {
        const errorText = await response.text();
        setError(errorText || "Failed to save expense");
      }
    } catch (err) {
      console.error("Error saving one-time expense:", err);
      setError(`Failed to save: ${err.message}`);
    }
  };

  const handleDeleteOneTime = async (id) => {
    // Show dialog explaining expenses can't be deleted
    setDeleteWarningData({
      type: 'onetime',
      error: 'Expenses cannot be deleted once entered',
      reason: 'Deleting expense records would break the audit trail and make financial reconciliation impossible. All expenses must remain in the system for accounting accuracy, tax compliance, and historical reporting.',
      solution: 'If this expense was entered in error, create a counter entry (reversal) with a negative amount to balance it out. Add a note explaining it\'s a correction. This maintains the complete audit trail while fixing the error.'
    });
    setDeleteWarningDialog(true);
  };

  // ==================== Helper Functions ====================

  const getEntityDisplay = (entityType, entityId) => {
    if (entityType === "CAB") {
      const cab = cabs.find(c => c.id === entityId);
      return cab ? `Cab ${cab.cabNumber}` : `Cab #${entityId}`;
    } else if (entityType === "SHIFT") {
      return entityId === 1 || entityId === "1" ? "Day Shift" : "Night Shift";
    } else if (entityType === "DRIVER" || entityType === "OWNER") {
      const driver = drivers.find(d => d.id === entityId);
      return driver ? `${driver.firstName} ${driver.lastName}` : `Driver #${entityId}`;
    } else if (entityType === "COMPANY") {
      return "Company";
    }
    return entityType;
  };

  const getFilteredRecurring = () => {
    let filtered = recurringExpenses;
    
    if (filterCategory) {
      filtered = filtered.filter(e => e.expenseCategory?.id === parseInt(filterCategory));
    }
    
    if (filterEntityType) {
      filtered = filtered.filter(e => e.entityType === filterEntityType);
    }
    
    if (filterEntityId) {
      filtered = filtered.filter(e => e.entityId === parseInt(filterEntityId));
    }
    
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(e =>
        (e.expenseCategory?.categoryName && e.expenseCategory.categoryName.toLowerCase().includes(searchLower)) ||
        (e.notes && e.notes.toLowerCase().includes(searchLower))
      );
    }
    
    return filtered;
  };

  const getFilteredOneTime = () => {
    let filtered = oneTimeExpenses;
    
    if (filterCategory) {
      filtered = filtered.filter(e => e.expenseCategory?.id === parseInt(filterCategory));
    }
    
    if (filterEntityType) {
      filtered = filtered.filter(e => e.entityType === filterEntityType);
    }
    
    if (filterEntityId) {
      filtered = filtered.filter(e => e.entityId === parseInt(filterEntityId));
    }
    
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(e =>
        (e.expenseCategory?.categoryName && e.expenseCategory.categoryName.toLowerCase().includes(searchLower)) ||
        (e.description && e.description.toLowerCase().includes(searchLower)) ||
        (e.vendor && e.vendor.toLowerCase().includes(searchLower)) ||
        (e.invoiceNumber && e.invoiceNumber.toLowerCase().includes(searchLower))
      );
    }
    
    return filtered;
  };

  const calculateTotalRecurring = () => {
    return getFilteredRecurring().reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  };

  const calculateTotalOneTime = () => {
    return getFilteredOneTime().reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  };

  const filteredRecurring = getFilteredRecurring();
  const filteredOneTime = getFilteredOneTime();

  if (loading) {
    return (
      <Box>
        <GlobalNav currentUser={currentUser} title="Expenses" />
        <Box sx={{ p: 3, textAlign: "center" }}>
          <Typography>Loading...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <GlobalNav currentUser={currentUser} title="Expenses" />
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Expense Management
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Manage recurring fixed expenses and one-time variable expenses
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
                  <RecurringIcon color="primary" />
                  <Box>
                    <Typography color="textSecondary" variant="body2">
                      Recurring Expenses
                    </Typography>
                    <Typography variant="h5">{filteredRecurring.length}</Typography>
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
                      Recurring Total
                    </Typography>
                    <Typography variant="h5">
                      ${calculateTotalRecurring().toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <OneTimeIcon color="secondary" />
                  <Box>
                    <Typography color="textSecondary" variant="body2">
                      One-Time Expenses
                    </Typography>
                    <Typography variant="h5">{filteredOneTime.length}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <TrendingUpIcon color="success" />
                  <Box>
                    <Typography color="textSecondary" variant="body2">
                      One-Time Total
                    </Typography>
                    <Typography variant="h5">
                      ${calculateTotalOneTime().toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Main Content */}
        <Paper>
          <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
            <Tab 
              label="Recurring Expenses" 
              icon={<RecurringIcon />} 
              iconPosition="start" 
            />
            <Tab 
              label="One-Time Expenses" 
              icon={<OneTimeIcon />} 
              iconPosition="start" 
            />
          </Tabs>

          {/* Tab 1: Recurring Expenses */}
          {currentTab === 0 && (
            <Box sx={{ p: 3 }}>
              {/* Filters */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={filterCategory}
                      label="Category"
                      onChange={(e) => setFilterCategory(e.target.value)}
                    >
                      <MenuItem value="">All Categories</MenuItem>
                      {categories.map((cat) => (
                        <MenuItem key={cat.id} value={cat.id}>
                          {cat.categoryName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Entity Type</InputLabel>
                    <Select
                      value={filterEntityType}
                      label="Entity Type"
                      onChange={(e) => setFilterEntityType(e.target.value)}
                    >
                      <MenuItem value="">All Types</MenuItem>
                      <MenuItem value="CAB">Cab</MenuItem>
                      <MenuItem value="SHIFT">Shift</MenuItem>
                      <MenuItem value="OWNER">Owner</MenuItem>
                      <MenuItem value="DRIVER">Driver</MenuItem>
                      <MenuItem value="COMPANY">Company</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    placeholder="Search..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    fullWidth
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showActiveOnly}
                        onChange={(e) => {
                          setShowActiveOnly(e.target.checked);
                          loadRecurringExpenses();
                        }}
                      />
                    }
                    label="Active Only"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  {canEdit && (
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => handleOpenRecurringDialog()}
                      fullWidth
                    >
                      Add Recurring Expense
                    </Button>
                  )}
                </Grid>
              </Grid>

              {/* Recurring Expenses Table */}
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Category</TableCell>
                      <TableCell>Entity</TableCell>
                      <TableCell>Billing Method</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>Effective From</TableCell>
                      <TableCell>Effective To</TableCell>
                      <TableCell>Status</TableCell>
                      {canEdit && <TableCell align="right">Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRecurring.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>
                          <Chip 
                            label={expense.expenseCategory?.categoryName || "N/A"} 
                            size="small"
                            color="primary"
                          />
                        </TableCell>
                        <TableCell>
                          {getEntityDisplay(expense.entityType, expense.entityId)}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={expense.billingMethod} 
                            size="small" 
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold">
                            ${parseFloat(expense.amount).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>{expense.effectiveFrom}</TableCell>
                        <TableCell>{expense.effectiveTo || "Ongoing"}</TableCell>
                        <TableCell>
                          <Chip
                            icon={expense.isActive ? <ActiveIcon /> : <InactiveIcon />}
                            label={expense.isActive ? "Active" : "Inactive"}
                            color={expense.isActive ? "success" : "default"}
                            size="small"
                          />
                        </TableCell>
                        {canEdit && (
                          <TableCell align="right">
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenRecurringDialog(expense)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleToggleRecurringActive(expense.id, expense.isActive)}
                              color={expense.isActive ? "default" : "success"}
                            >
                              {expense.isActive ? <InactiveIcon fontSize="small" /> : <ActiveIcon fontSize="small" />}
                            </IconButton>
                            {canDelete && (
                              <IconButton 
                                size="small" 
                                onClick={() => handleDeleteRecurring(expense.id)}
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                    {filteredRecurring.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={canEdit ? 8 : 7} align="center">
                          <Typography color="textSecondary" sx={{ py: 3 }}>
                            No recurring expenses found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Tab 2: One-Time Expenses */}
          {currentTab === 1 && (
            <Box sx={{ p: 3 }}>
              {/* Filters */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={2}>
                  <TextField
                    label="Start Date"
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    label="End Date"
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={filterCategory}
                      label="Category"
                      onChange={(e) => setFilterCategory(e.target.value)}
                    >
                      <MenuItem value="">All Categories</MenuItem>
                      {categories.map((cat) => (
                        <MenuItem key={cat.id} value={cat.id}>
                          {cat.categoryName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Entity Type</InputLabel>
                    <Select
                      value={filterEntityType}
                      label="Entity Type"
                      onChange={(e) => setFilterEntityType(e.target.value)}
                    >
                      <MenuItem value="">All Types</MenuItem>
                      <MenuItem value="CAB">Cab</MenuItem>
                      <MenuItem value="SHIFT">Shift</MenuItem>
                      <MenuItem value="OWNER">Owner</MenuItem>
                      <MenuItem value="DRIVER">Driver</MenuItem>
                      <MenuItem value="COMPANY">Company</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    placeholder="Search..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    fullWidth
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  {canEdit && (
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => handleOpenOneTimeDialog()}
                      fullWidth
                    >
                      Add Expense
                    </Button>
                  )}
                </Grid>
              </Grid>

              {/* One-Time Expenses Table */}
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Entity</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Vendor</TableCell>
                      <TableCell>Paid By</TableCell>
                      <TableCell>Responsible</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>Status</TableCell>
                      {canEdit && <TableCell align="right">Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredOneTime.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>{expense.expenseDate}</TableCell>
                        <TableCell>
                          <Chip 
                            label={expense.expenseCategory?.categoryName || "N/A"} 
                            size="small"
                            color="secondary"
                          />
                        </TableCell>
                        <TableCell>
                          {getEntityDisplay(expense.entityType, expense.entityId)}
                        </TableCell>
                        <TableCell>
                          {expense.description || "-"}
                          {expense.invoiceNumber && (
                            <Typography variant="caption" display="block" color="textSecondary">
                              Invoice: {expense.invoiceNumber}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{expense.vendor || "-"}</TableCell>
                        <TableCell>
                          <Chip label={expense.paidBy} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Chip label={expense.responsibleParty} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold" color="error">
                            ${parseFloat(expense.amount).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 0.5 }}>
                            {expense.receiptUrl && (
                              <Tooltip title="Has Receipt">
                                <AttachFileIcon fontSize="small" color="success" />
                              </Tooltip>
                            )}
                            {expense.isReimbursable && !expense.isReimbursed && (
                              <Tooltip title="Pending Reimbursement">
                                <ReimbursableIcon fontSize="small" color="warning" />
                              </Tooltip>
                            )}
                            {expense.isReimbursed && (
                              <Tooltip title="Reimbursed">
                                <CheckCircle fontSize="small" color="success" />
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                        {canEdit && (
                          <TableCell align="right">
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenOneTimeDialog(expense)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            {canDelete && (
                              <IconButton 
                                size="small" 
                                onClick={() => handleDeleteOneTime(expense.id)}
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                    {filteredOneTime.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={canEdit ? 10 : 9} align="center">
                          <Typography color="textSecondary" sx={{ py: 3 }}>
                            No one-time expenses found for selected date range
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Paper>

        {/* Recurring Expense Dialog */}
        <Dialog 
          open={openRecurringDialog} 
          onClose={() => setOpenRecurringDialog(false)} 
          maxWidth="md" 
          fullWidth
        >
          <DialogTitle>
            {editingRecurring ? "Edit Recurring Expense" : "Add Recurring Expense"}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ pt: 2 }}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={recurringFormData.expenseCategoryId}
                    label="Category"
                    onChange={(e) => setRecurringFormData({ 
                      ...recurringFormData, 
                      expenseCategoryId: e.target.value 
                    })}
                  >
                    {categories.filter(c => c.categoryType === "FIXED").map((cat) => (
                      <MenuItem key={cat.id} value={cat.id}>
                        {cat.categoryName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Billing Method</InputLabel>
                  <Select
                    value={recurringFormData.billingMethod}
                    label="Billing Method"
                    onChange={(e) => setRecurringFormData({ 
                      ...recurringFormData, 
                      billingMethod: e.target.value 
                    })}
                  >
                    <MenuItem value="MONTHLY">Monthly</MenuItem>
                    <MenuItem value="DAILY">Daily</MenuItem>
                    <MenuItem value="PER_SHIFT">Per Shift</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Entity Type</InputLabel>
                  <Select
                    value={recurringFormData.entityType}
                    label="Entity Type"
                    onChange={(e) => setRecurringFormData({ 
                      ...recurringFormData, 
                      entityType: e.target.value,
                      entityId: "" 
                    })}
                  >
                    <MenuItem value="CAB">Cab</MenuItem>
                    <MenuItem value="SHIFT">Shift</MenuItem>
                    <MenuItem value="OWNER">Owner</MenuItem>
                    <MenuItem value="DRIVER">Driver</MenuItem>
                    <MenuItem value="COMPANY">Company</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Entity</InputLabel>
                  <Select
                    value={recurringFormData.entityId}
                    label="Entity"
                    onChange={(e) => setRecurringFormData({ 
                      ...recurringFormData, 
                      entityId: e.target.value 
                    })}
                  >
                    {recurringFormData.entityType === "CAB" && cabs.map((cab) => (
                      <MenuItem key={cab.id} value={cab.id}>
                        Cab {cab.cabNumber} - {cab.registrationNumber}
                      </MenuItem>
                    ))}
                    {recurringFormData.entityType === "SHIFT" && [
                      <MenuItem key="1" value="1">Day Shift</MenuItem>,
                      <MenuItem key="2" value="2">Night Shift</MenuItem>
                    ]}
                    {(recurringFormData.entityType === "DRIVER" || 
                      recurringFormData.entityType === "OWNER") && 
                      drivers.map((driver) => (
                      <MenuItem key={driver.id} value={driver.id}>
                        {driver.firstName} {driver.lastName} - {driver.driverNumber}
                      </MenuItem>
                    ))}
                    {recurringFormData.entityType === "COMPANY" && (
                      <MenuItem value="1">Company</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Amount"
                  type="number"
                  value={recurringFormData.amount}
                  onChange={(e) => setRecurringFormData({ 
                    ...recurringFormData, 
                    amount: e.target.value 
                  })}
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  inputProps={{ step: "0.01", min: "0" }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Effective From"
                  type="date"
                  value={recurringFormData.effectiveFrom}
                  onChange={(e) => setRecurringFormData({ 
                    ...recurringFormData, 
                    effectiveFrom: e.target.value 
                  })}
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  helperText="Should be first day of month"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Effective To (Optional)"
                  type="date"
                  value={recurringFormData.effectiveTo}
                  onChange={(e) => setRecurringFormData({ 
                    ...recurringFormData, 
                    effectiveTo: e.target.value 
                  })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  helperText="Leave empty for ongoing"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Notes"
                  value={recurringFormData.notes}
                  onChange={(e) => setRecurringFormData({ 
                    ...recurringFormData, 
                    notes: e.target.value 
                  })}
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenRecurringDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveRecurring} variant="contained">
              {editingRecurring ? "Update" : "Save"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* One-Time Expense Dialog */}
        <Dialog 
          open={openOneTimeDialog} 
          onClose={() => setOpenOneTimeDialog(false)} 
          maxWidth="md" 
          fullWidth
        >
          <DialogTitle>
            {editingOneTime ? "Edit Expense" : "Add One-Time Expense"}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ pt: 2 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Expense Date"
                  type="date"
                  value={oneTimeFormData.expenseDate}
                  onChange={(e) => setOneTimeFormData({ 
                    ...oneTimeFormData, 
                    expenseDate: e.target.value 
                  })}
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={oneTimeFormData.expenseCategoryId}
                    label="Category"
                    onChange={(e) => setOneTimeFormData({ 
                      ...oneTimeFormData, 
                      expenseCategoryId: e.target.value 
                    })}
                  >
                    {categories.filter(c => c.categoryType === "VARIABLE").map((cat) => (
                      <MenuItem key={cat.id} value={cat.id}>
                        {cat.categoryName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Entity Type</InputLabel>
                  <Select
                    value={oneTimeFormData.entityType}
                    label="Entity Type"
                    onChange={(e) => setOneTimeFormData({ 
                      ...oneTimeFormData, 
                      entityType: e.target.value,
                      entityId: "" 
                    })}
                  >
                    <MenuItem value="CAB">Cab</MenuItem>
                    <MenuItem value="SHIFT">Shift</MenuItem>
                    <MenuItem value="OWNER">Owner</MenuItem>
                    <MenuItem value="DRIVER">Driver</MenuItem>
                    <MenuItem value="COMPANY">Company</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Entity</InputLabel>
                  <Select
                    value={oneTimeFormData.entityId}
                    label="Entity"
                    onChange={(e) => setOneTimeFormData({ 
                      ...oneTimeFormData, 
                      entityId: e.target.value 
                    })}
                  >
                    {oneTimeFormData.entityType === "CAB" && cabs.map((cab) => (
                      <MenuItem key={cab.id} value={cab.id}>
                        Cab {cab.cabNumber} - {cab.registrationNumber}
                      </MenuItem>
                    ))}
                    {oneTimeFormData.entityType === "SHIFT" && [
                      <MenuItem key="1" value="1">Day Shift</MenuItem>,
                      <MenuItem key="2" value="2">Night Shift</MenuItem>
                    ]}
                    {(oneTimeFormData.entityType === "DRIVER" || 
                      oneTimeFormData.entityType === "OWNER") && 
                      drivers.map((driver) => (
                      <MenuItem key={driver.id} value={driver.id}>
                        {driver.firstName} {driver.lastName} - {driver.driverNumber}
                      </MenuItem>
                    ))}
                    {oneTimeFormData.entityType === "COMPANY" && (
                      <MenuItem value="1">Company</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Amount"
                  type="number"
                  value={oneTimeFormData.amount}
                  onChange={(e) => setOneTimeFormData({ 
                    ...oneTimeFormData, 
                    amount: e.target.value 
                  })}
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  inputProps={{ step: "0.01", min: "0" }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Paid By</InputLabel>
                  <Select
                    value={oneTimeFormData.paidBy}
                    label="Paid By"
                    onChange={(e) => setOneTimeFormData({ 
                      ...oneTimeFormData, 
                      paidBy: e.target.value 
                    })}
                  >
                    <MenuItem value="DRIVER">Driver</MenuItem>
                    <MenuItem value="OWNER">Owner</MenuItem>
                    <MenuItem value="COMPANY">Company</MenuItem>
                    <MenuItem value="THIRD_PARTY">Third Party</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Responsible Party</InputLabel>
                  <Select
                    value={oneTimeFormData.responsibleParty}
                    label="Responsible Party"
                    onChange={(e) => setOneTimeFormData({ 
                      ...oneTimeFormData, 
                      responsibleParty: e.target.value 
                    })}
                  >
                    <MenuItem value="DRIVER">Driver</MenuItem>
                    <MenuItem value="OWNER">Owner</MenuItem>
                    <MenuItem value="COMPANY">Company</MenuItem>
                    <MenuItem value="SHARED">Shared</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Vendor"
                  value={oneTimeFormData.vendor}
                  onChange={(e) => setOneTimeFormData({ 
                    ...oneTimeFormData, 
                    vendor: e.target.value 
                  })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Invoice Number"
                  value={oneTimeFormData.invoiceNumber}
                  onChange={(e) => setOneTimeFormData({ 
                    ...oneTimeFormData, 
                    invoiceNumber: e.target.value 
                  })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Receipt URL"
                  value={oneTimeFormData.receiptUrl}
                  onChange={(e) => setOneTimeFormData({ 
                    ...oneTimeFormData, 
                    receiptUrl: e.target.value 
                  })}
                  fullWidth
                  placeholder="https://..."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  value={oneTimeFormData.description}
                  onChange={(e) => setOneTimeFormData({ 
                    ...oneTimeFormData, 
                    description: e.target.value 
                  })}
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Notes"
                  value={oneTimeFormData.notes}
                  onChange={(e) => setOneTimeFormData({ 
                    ...oneTimeFormData, 
                    notes: e.target.value 
                  })}
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={oneTimeFormData.isReimbursable}
                      onChange={(e) => setOneTimeFormData({ 
                        ...oneTimeFormData, 
                        isReimbursable: e.target.checked 
                      })}
                    />
                  }
                  label="Requires Reimbursement"
                />
              </Grid>
            </Grid>
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenOneTimeDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveOneTime} variant="contained">
              {editingOneTime ? "Update" : "Save"}
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
                {deleteWarningData.type === 'recurring' 
                  ? 'Cannot Delete Recurring Expense' 
                  : 'Cannot Delete Expense Record'}
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

            {deleteWarningData.type === 'recurring' && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <AlertTitle>Recommended Workflow for Recurring Expenses</AlertTitle>
                <Typography variant="body2" component="div">
                  <ol style={{ margin: 0, paddingLeft: '20px' }}>
                    <li>Click the <strong>Edit</strong> button on the expense</li>
                    <li>Set the <strong>"Effective To"</strong> date to when it should end</li>
                    <li>Or click the <strong>Deactivate</strong> button (toggle icon) to stop it immediately</li>
                    <li>The expense remains in the system for historical accuracy</li>
                    <li>You can reactivate it later if needed</li>
                  </ol>
                </Typography>
              </Alert>
            )}

            {deleteWarningData.type === 'onetime' && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <AlertTitle>Recommended Workflow for Correcting Errors</AlertTitle>
                <Typography variant="body2" component="div">
                  <ol style={{ margin: 0, paddingLeft: '20px' }}>
                    <li>Click <strong>"Add Expense"</strong> to create a reversal entry</li>
                    <li>Use the same category and entity as the original expense</li>
                    <li>Enter a <strong>negative amount</strong> (e.g., -$150.00)</li>
                    <li>In the description, note: "Reversal of [original expense] - entered in error"</li>
                    <li>Both entries remain in the system showing the correction</li>
                    <li>Net effect is zero, maintaining audit trail</li>
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