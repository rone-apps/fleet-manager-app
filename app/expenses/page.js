"use client";

import { useState, useEffect } from "react";
import {
  Box, Typography, Paper, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, FormControl, InputLabel, Select, IconButton, Chip,
  Alert, AlertTitle, Card, CardContent, Grid, Tabs, Tab, InputAdornment,
  Switch, FormControlLabel,
} from "@mui/material";
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon, Search as SearchIcon,
  Repeat as RecurringIcon, EventNote as OneTimeIcon, CheckCircle as ActiveIcon,
  Cancel as InactiveIcon, Block as BlockIcon, AccountBalance as RevenueIcon,
} from "@mui/icons-material";
import GlobalNav from "../components/GlobalNav";
import { getCurrentUser } from "../lib/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export default function ExpensesRevenuesPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [oneTimeExpenses, setOneTimeExpenses] = useState([]);
  const [otherRevenues, setOtherRevenues] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [revenueCategories, setRevenueCategories] = useState([]);
  const [cabs, setCabs] = useState([]);
  const [drivers, setDrivers] = useState([]);

  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterEntityType, setFilterEntityType] = useState("");
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [searchText, setSearchText] = useState("");

  const [openRecurringDialog, setOpenRecurringDialog] = useState(false);
  const [openOneTimeDialog, setOpenOneTimeDialog] = useState(false);
  const [openRevenueDialog, setOpenRevenueDialog] = useState(false);
  const [openEditWarningDialog, setOpenEditWarningDialog] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState(null);
  const [editingOneTime, setEditingOneTime] = useState(null);
  const [editingRevenue, setEditingRevenue] = useState(null);

  const [recurringFormData, setRecurringFormData] = useState({
    expenseCategoryId: "", entityType: "CAB", entityId: "", shiftType: "", amount: "",
    billingMethod: "MONTHLY", effectiveFrom: "", effectiveTo: "", notes: "", isActive: true,
  });
  
  const [oneTimeFormData, setOneTimeFormData] = useState({
    expenseCategoryId: "", entityType: "CAB", entityId: "", shiftType: "", amount: "",
    expenseDate: new Date().toISOString().split('T')[0], paidBy: "COMPANY",
    responsibleParty: "COMPANY", description: "", vendor: "", receiptUrl: "",
    invoiceNumber: "", isReimbursable: false, notes: "",
  });

  const [revenueFormData, setRevenueFormData] = useState({
    revenueCategoryId: "", entityType: "DRIVER", entityId: "", shiftType: "", amount: "",
    revenueDate: new Date().toISOString().split('T')[0], revenueType: "CREDIT",
    description: "", referenceNumber: "", paymentStatus: "PENDING", paymentMethod: "", notes: "",
  });

  const canEdit = ["ADMIN", "MANAGER", "ACCOUNTANT"].includes(currentUser?.role);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || !["ADMIN", "MANAGER", "ACCOUNTANT", "DISPATCHER"].includes(user.role)) {
      window.location.href = "/";
      return;
    }
    setCurrentUser(user);
    const today = new Date();
    setFilterStartDate(new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]);
    setFilterEndDate(new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]);
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadExpenseCategories(), 
        loadRevenueCategories(), 
        loadCabs(), 
        loadDrivers(), 
        loadRecurringExpenses()
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
    } else if (currentTab === 2 && filterStartDate && filterEndDate) {
      loadOtherRevenues();
    }
  }, [currentTab, filterStartDate, filterEndDate]);

  const loadExpenseCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/expense-categories?active=true`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.ok) setExpenseCategories(await response.json());
    } catch (err) { console.error(err); }
  };

  const loadRevenueCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/revenue-categories/active`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.ok) setRevenueCategories(await response.json());
    } catch (err) { console.error(err); }
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
    } catch (err) { console.error(err); }
  };

  const loadDrivers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/drivers`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.ok) setDrivers(await response.json());
    } catch (err) { console.error(err); }
  };

  const loadRecurringExpenses = async () => {
    try {
      const endpoint = showActiveOnly ? `${API_BASE_URL}/recurring-expenses/active` : `${API_BASE_URL}/recurring-expenses`;
      const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      if (response.ok) setRecurringExpenses(await response.json());
    } catch (err) { console.error(err); }
  };

  const loadOneTimeExpenses = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/one-time-expenses/between?startDate=${filterStartDate}&endDate=${filterEndDate}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      if (response.ok) setOneTimeExpenses(await response.json());
    } catch (err) { console.error(err); }
  };

  const loadOtherRevenues = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/other-revenues?startDate=${filterStartDate}&endDate=${filterEndDate}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      if (response.ok) setOtherRevenues(await response.json());
    } catch (err) { console.error(err); }
  };

  const handleOpenRecurringDialog = (expense = null) => {
    if (expense) {
      setEditingRecurring(expense);
      setRecurringFormData({
        expenseCategoryId: expense.expenseCategory?.id || "",
        entityType: expense.entityType,
        entityId: expense.entityId,
        shiftType: expense.shiftType || "",
        amount: expense.amount,
        billingMethod: expense.billingMethod,
        effectiveFrom: expense.effectiveFrom,
        effectiveTo: expense.effectiveTo || "",
        notes: expense.notes || "",
        isActive: expense.isActive !== undefined ? expense.isActive : true,
      });
    } else {
      setEditingRecurring(null);
      const today = new Date();
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      setRecurringFormData({
        expenseCategoryId: "", entityType: "CAB", entityId: "", shiftType: "", amount: "",
        billingMethod: "MONTHLY", effectiveFrom: firstOfMonth, effectiveTo: "", notes: "", isActive: true,
      });
    }
    setError("");
    setSuccess("");
    setOpenRecurringDialog(true);
  };

  const handleSaveRecurring = async () => {
    if (!recurringFormData.expenseCategoryId || !recurringFormData.entityId || !recurringFormData.amount || !recurringFormData.effectiveFrom) {
      setError("Category, entity, amount, and effective date are required");
      return;
    }
    if (recurringFormData.entityType === "SHIFT" && !recurringFormData.shiftType) {
      setError("Shift type required");
      return;
    }
    try {
      const url = editingRecurring ? `${API_BASE_URL}/recurring-expenses/${editingRecurring.id}` : `${API_BASE_URL}/recurring-expenses`;
      const response = await fetch(url, {
        method: editingRecurring ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" },
        body: JSON.stringify(recurringFormData),
      });
      if (response.ok) {
        setSuccess(editingRecurring ? "Updated" : "Created");
        setOpenRecurringDialog(false);
        loadRecurringExpenses();
      } else {
        setError(await response.text() || "Failed");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleRecurringActive = async (id, currentStatus) => {
    try {
      const endpoint = currentStatus ? `${API_BASE_URL}/recurring-expenses/${id}/deactivate` : `${API_BASE_URL}/recurring-expenses/${id}/reactivate`;
      const response = await fetch(endpoint, { method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      if (response.ok || response.status === 204) {
        setSuccess(`${currentStatus ? 'Deactivated' : 'Activated'}`);
        loadRecurringExpenses();
      }
    } catch (err) { setError(err.message); }
  };

  const handleOpenOneTimeDialog = (expense = null) => {
    if (expense) {
      // Don't allow editing - show warning instead
      setOpenEditWarningDialog(true);
      return;
    } else {
      setEditingOneTime(null);
      setOneTimeFormData({
        expenseCategoryId: "", entityType: "CAB", entityId: "", shiftType: "", amount: "",
        expenseDate: new Date().toISOString().split('T')[0], paidBy: "COMPANY",
        responsibleParty: "COMPANY", description: "", vendor: "", receiptUrl: "",
        invoiceNumber: "", isReimbursable: false, notes: "",
      });
    }
    setError("");
    setSuccess("");
    setOpenOneTimeDialog(true);
  };

  const handleSaveOneTime = async () => {
    if (!oneTimeFormData.expenseCategoryId || !oneTimeFormData.entityId || !oneTimeFormData.amount || !oneTimeFormData.expenseDate) {
      setError("Required fields missing");
      return;
    }
    try {
      const url = editingOneTime ? `${API_BASE_URL}/one-time-expenses/${editingOneTime.id}` : `${API_BASE_URL}/one-time-expenses`;
      const response = await fetch(url, {
        method: editingOneTime ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" },
        body: JSON.stringify(oneTimeFormData),
      });
      if (response.ok) {
        setSuccess(editingOneTime ? "Updated" : "Created");
        setOpenOneTimeDialog(false);
        loadOneTimeExpenses();
      } else {
        setError(await response.text() || "Failed");
      }
    } catch (err) { setError(err.message); }
  };

  const handleOpenRevenueDialog = (revenue = null) => {
    if (revenue) {
      // Don't allow editing - show warning instead
      setOpenEditWarningDialog(true);
      return;
    } else {
      setEditingRevenue(null);
      setRevenueFormData({
        revenueCategoryId: "", entityType: "DRIVER", entityId: "", shiftType: "", amount: "",
        revenueDate: new Date().toISOString().split('T')[0], revenueType: "CREDIT",
        description: "", referenceNumber: "", paymentStatus: "PENDING", paymentMethod: "", notes: "",
      });
    }
    setError("");
    setSuccess("");
    setOpenRevenueDialog(true);
  };

  const handleSaveRevenue = async () => {
    if (!revenueFormData.revenueCategoryId || !revenueFormData.entityId || !revenueFormData.amount || !revenueFormData.revenueDate) {
      setError("Required fields missing");
      return;
    }
    try {
      const selectedEntityPerson =
        (revenueFormData.entityType === "DRIVER" || revenueFormData.entityType === "OWNER")
          ? drivers.find((d) => String(d.id) === String(revenueFormData.entityId))
          : null;

      const payload = {
        revenueDate: revenueFormData.revenueDate,
        amount: parseFloat(revenueFormData.amount),
        entityType: revenueFormData.entityType,
        entityId: parseInt(revenueFormData.entityId), // ✅ ADDED entityId
        revenueType: revenueFormData.revenueType,
        description: revenueFormData.description,
        referenceNumber: revenueFormData.referenceNumber,
        paymentStatus: revenueFormData.paymentStatus,
        paymentMethod: revenueFormData.paymentMethod,
        notes: revenueFormData.notes,
        category: { id: revenueFormData.revenueCategoryId },
      };
      if (revenueFormData.entityType === "DRIVER" && selectedEntityPerson?.driverNumber != null) {
        payload.driverNumber = selectedEntityPerson.driverNumber;
      }
      if (revenueFormData.entityType === "OWNER" && selectedEntityPerson?.driverNumber != null) {
        payload.ownerDriverNumber = selectedEntityPerson.driverNumber;
      }
      if (revenueFormData.entityType === "DRIVER") payload.driver = { id: revenueFormData.entityId };
      else if (revenueFormData.entityType === "OWNER") payload.owner = { id: revenueFormData.entityId };
      else if (revenueFormData.entityType === "CAB") payload.cab = { id: revenueFormData.entityId };
      else if (revenueFormData.entityType === "SHIFT") payload.shift = { id: revenueFormData.shiftType === "DAY" ? 1 : 2, shiftType: revenueFormData.shiftType };
      
      const url = editingRevenue ? `${API_BASE_URL}/other-revenues/${editingRevenue.id}` : `${API_BASE_URL}/other-revenues`;
      const response = await fetch(url, {
        method: editingRevenue ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        setSuccess(editingRevenue ? "Updated" : "Created");
        setOpenRevenueDialog(false);
        loadOtherRevenues();
      } else {
        setError(await response.text() || "Failed");
      }
    } catch (err) { setError(err.message); }
  };

  const getEntityDisplay = (entityType, entityId, shiftType, driver, owner, cab) => {
    if (entityType === "CAB") {
      const cabData = cab || cabs.find(c => c.id === entityId);
      return cabData ? `Cab ${cabData.cabNumber}` : `Cab #${entityId}`;
    } else if (entityType === "SHIFT") {
      return shiftType === "DAY" ? "Day Shift" : "Night Shift";
    } else if (entityType === "DRIVER") {
      const driverData = driver || drivers.find(d => d.id === entityId);
      return driverData ? `${driverData.firstName} ${driverData.lastName}` : `Driver #${entityId}`;
    } else if (entityType === "OWNER") {
      const ownerData = owner || drivers.find(d => d.id === entityId);
      return ownerData ? `${ownerData.firstName} ${ownerData.lastName}` : `Owner #${entityId}`;
    }
    return entityType;
  };

  const getFilteredRecurring = () => {
    let filtered = recurringExpenses;
    if (filterCategory) filtered = filtered.filter(e => e.expenseCategory?.id === parseInt(filterCategory));
    if (filterEntityType) filtered = filtered.filter(e => e.entityType === filterEntityType);
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(e => (e.expenseCategory?.categoryName?.toLowerCase().includes(searchLower)) || (e.notes?.toLowerCase().includes(searchLower)));
    }
    return filtered;
  };

  const getFilteredOneTime = () => {
    let filtered = oneTimeExpenses;
    if (filterCategory) filtered = filtered.filter(e => e.expenseCategory?.id === parseInt(filterCategory));
    if (filterEntityType) filtered = filtered.filter(e => e.entityType === filterEntityType);
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(e =>
        (e.expenseCategory?.categoryName?.toLowerCase().includes(searchLower)) ||
        (e.description?.toLowerCase().includes(searchLower)) ||
        (e.vendor?.toLowerCase().includes(searchLower))
      );
    }
    return filtered;
  };

  const getFilteredRevenues = () => {
    let filtered = otherRevenues;
    if (filterCategory) filtered = filtered.filter(r => r.category?.id === parseInt(filterCategory));
    if (filterEntityType) filtered = filtered.filter(r => r.entityType === filterEntityType);
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(r =>
        (r.category?.categoryName?.toLowerCase().includes(searchLower)) ||
        (r.description?.toLowerCase().includes(searchLower)) ||
        (r.revenueType?.toLowerCase().includes(searchLower))
      );
    }
    return filtered;
  };

  const calculateTotalRecurring = () => getFilteredRecurring().reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  const calculateTotalOneTime = () => getFilteredOneTime().reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  const calculateTotalRevenue = () => getFilteredRevenues().reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

  const filteredRecurring = getFilteredRecurring();
  const filteredOneTime = getFilteredOneTime();
  const filteredRevenues = getFilteredRevenues();

  if (loading) {
    return (
      <Box>
        <GlobalNav currentUser={currentUser} title="Expenses & Revenues" />
        <Box sx={{ p: 3, textAlign: "center" }}><Typography>Loading...</Typography></Box>
      </Box>
    );
  }

  return (
    <Box>
      <GlobalNav currentUser={currentUser} title="Expenses & Revenues" />
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>Expense & Revenue Management</Typography>
          <Typography variant="body2" color="textSecondary">Manage recurring expenses, one-time expenses, and other revenues/credits</Typography>
        </Box>

        {success && <Alert severity="success" onClose={() => setSuccess("")} sx={{ mb: 2 }}>{success}</Alert>}
        {error && <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>{error}</Alert>}

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card><CardContent><Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <RecurringIcon color="primary" />
              <Box><Typography color="textSecondary" variant="body2">Recurring Expenses</Typography><Typography variant="h6">{filteredRecurring.length}</Typography></Box>
            </Box></CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card><CardContent><Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <OneTimeIcon color="error" />
              <Box><Typography color="textSecondary" variant="body2">One-Time Expenses</Typography><Typography variant="h6">{filteredOneTime.length}</Typography></Box>
            </Box></CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card><CardContent><Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <RevenueIcon color="success" />
              <Box><Typography color="textSecondary" variant="body2">Other Revenues</Typography><Typography variant="h6">{filteredRevenues.length}</Typography></Box>
            </Box></CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card><CardContent><Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <TrendingDownIcon color="error" />
              <Box><Typography color="textSecondary" variant="body2">Expense Total</Typography><Typography variant="h6" color="error">${(calculateTotalRecurring() + calculateTotalOneTime()).toFixed(2)}</Typography></Box>
            </Box></CardContent></Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card><CardContent><Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <TrendingUpIcon color="success" />
              <Box><Typography color="textSecondary" variant="body2">Revenue Total</Typography><Typography variant="h6" color="success.main">${calculateTotalRevenue().toFixed(2)}</Typography></Box>
            </Box></CardContent></Card>
          </Grid>
        </Grid>

        <Paper>
          <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)}>
            <Tab label="Recurring Expenses" icon={<RecurringIcon />} iconPosition="start" />
            <Tab label="One-Time Expenses" icon={<OneTimeIcon />} iconPosition="start" />
            <Tab label="Other Revenues" icon={<RevenueIcon />} iconPosition="start" />
          </Tabs>

          {currentTab === 0 && (
            <Box sx={{ p: 3 }}>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Category</InputLabel>
                    <Select value={filterCategory} label="Category" onChange={(e) => setFilterCategory(e.target.value)}>
                      <MenuItem value="">All</MenuItem>
                      {expenseCategories.map(cat => <MenuItem key={cat.id} value={cat.id}>{cat.categoryName}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Entity Type</InputLabel>
                    <Select value={filterEntityType} label="Entity Type" onChange={(e) => setFilterEntityType(e.target.value)}>
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="CAB">Cab</MenuItem>
                      <MenuItem value="SHIFT">Shift</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField placeholder="Search..." value={searchText} onChange={(e) => setSearchText(e.target.value)} fullWidth size="small" 
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} />
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControlLabel control={<Switch checked={showActiveOnly} onChange={(e) => { setShowActiveOnly(e.target.checked); loadRecurringExpenses(); }} />} label="Active Only" />
                </Grid>
                <Grid item xs={12} md={4}>
                  {canEdit && <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenRecurringDialog()} fullWidth>Add Recurring Expense</Button>}
                </Grid>
              </Grid>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Category</TableCell>
                      <TableCell>Entity</TableCell>
                      <TableCell>Billing</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>From</TableCell>
                      <TableCell>To</TableCell>
                      <TableCell>Status</TableCell>
                      {canEdit && <TableCell align="right">Actions</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRecurring.map(expense => (
                      <TableRow key={expense.id}>
                        <TableCell><Chip label={expense.expenseCategory?.categoryName} size="small" color="primary" /></TableCell>
                        <TableCell>{getEntityDisplay(expense.entityType, expense.entityId, expense.shiftType)}</TableCell>
                        <TableCell><Chip label={expense.billingMethod} size="small" variant="outlined" /></TableCell>
                        <TableCell align="right"><Typography variant="body2" fontWeight="bold">${parseFloat(expense.amount).toFixed(2)}</Typography></TableCell>
                        <TableCell>{expense.effectiveFrom}</TableCell>
                        <TableCell>{expense.effectiveTo || "Ongoing"}</TableCell>
                        <TableCell><Chip icon={expense.isActive ? <ActiveIcon /> : <InactiveIcon />} label={expense.isActive ? "Active" : "Inactive"} color={expense.isActive ? "success" : "default"} size="small" /></TableCell>
                        {canEdit && (
                          <TableCell align="right">
                            <IconButton size="small" onClick={() => handleOpenRecurringDialog(expense)}><EditIcon fontSize="small" /></IconButton>
                            <IconButton size="small" onClick={() => handleToggleRecurringActive(expense.id, expense.isActive)} color={expense.isActive ? "default" : "success"}>
                              {expense.isActive ? <InactiveIcon fontSize="small" /> : <ActiveIcon fontSize="small" />}
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

          {currentTab === 1 && (
            <Box sx={{ p: 3 }}>
              <Typography sx={{ fontWeight: 700, color: 'error.main', mb: 2 }}>
                Once created, you cannot edit this entry as this will mess up the reports. Please create a counter entry (reversal) if you need to correct it.
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={2}>
                  <TextField label="Start Date" type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField label="End Date" type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={12} md={6}></Grid>
                <Grid item xs={12} md={2}>
                  {canEdit && <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenOneTimeDialog()} fullWidth>Add Expense</Button>}
                </Grid>
              </Grid>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Entity</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Vendor</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredOneTime.map(expense => (
                      <TableRow key={expense.id}>
                        <TableCell>{expense.expenseDate}</TableCell>
                        <TableCell><Chip label={expense.expenseCategory?.categoryName} size="small" color="secondary" /></TableCell>
                        <TableCell>{getEntityDisplay(expense.entityType, expense.entityId, expense.shiftType)}</TableCell>
                        <TableCell>{expense.description || "-"}</TableCell>
                        <TableCell>{expense.vendor || "-"}</TableCell>
                        <TableCell align="right"><Typography variant="body2" fontWeight="bold" color="error">${parseFloat(expense.amount).toFixed(2)}</Typography></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {currentTab === 2 && (
            <Box sx={{ p: 3 }}>
              <Typography sx={{ fontWeight: 700, color: 'error.main', mb: 2 }}>
                Once created, you cannot edit this entry as this will mess up the reports. Please create a counter entry (reversal) if you need to correct it.
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={2}>
                  <TextField label="Start Date" type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField label="End Date" type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={12} md={6}></Grid>
                <Grid item xs={12} md={2}>
                  {canEdit && <Button variant="contained" color="success" startIcon={<AddIcon />} onClick={() => handleOpenRevenueDialog()} fullWidth>Add Revenue</Button>}
                </Grid>
              </Grid>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Entity</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Payment Status</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRevenues.map(revenue => (
                      <TableRow key={revenue.id}>
                        <TableCell>{revenue.revenueDate}</TableCell>
                        <TableCell><Chip label={revenue.category?.categoryName} size="small" color="success" /></TableCell>
                        <TableCell><Chip label={revenue.revenueType} size="small" variant="outlined" color="success" /></TableCell>
                        <TableCell>{getEntityDisplay(revenue.entityType, revenue.driver?.id || revenue.owner?.id || revenue.cab?.id, revenue.shift?.shiftType, revenue.driver, revenue.owner, revenue.cab)}</TableCell>
                        <TableCell>{revenue.description || "-"}</TableCell>
                        <TableCell><Chip label={revenue.paymentStatus} size="small" color={revenue.paymentStatus === "PAID" ? "success" : "warning"} /></TableCell>
                        <TableCell align="right"><Typography variant="body2" fontWeight="bold" color="success.main">${parseFloat(revenue.amount).toFixed(2)}</Typography></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Paper>

        {/* Recurring Expense Dialog */}
        <Dialog open={openRecurringDialog} onClose={() => setOpenRecurringDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>{editingRecurring ? "Edit Recurring Expense" : "Add Recurring Expense"}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ pt: 2 }}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select value={recurringFormData.expenseCategoryId} label="Category" onChange={(e) => setRecurringFormData({ ...recurringFormData, expenseCategoryId: e.target.value })} disabled={!!editingRecurring}>
                    {expenseCategories.filter(c => c.categoryType === "FIXED").map(cat => <MenuItem key={cat.id} value={cat.id}>{cat.categoryName}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Billing Method</InputLabel>
                  <Select value={recurringFormData.billingMethod} label="Billing Method" onChange={(e) => setRecurringFormData({ ...recurringFormData, billingMethod: e.target.value })} disabled={!!editingRecurring}>
                    <MenuItem value="MONTHLY">Monthly</MenuItem>
                    <MenuItem value="DAILY">Daily</MenuItem>
                    <MenuItem value="PER_SHIFT">Per Shift</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Entity Type</InputLabel>
                  <Select value={recurringFormData.entityType} label="Entity Type" onChange={(e) => setRecurringFormData({ ...recurringFormData, entityType: e.target.value, entityId: "", shiftType: "" })} disabled={!!editingRecurring}>
                    <MenuItem value="CAB">Cab</MenuItem>
                    <MenuItem value="DRIVER">Driver</MenuItem>
                    <MenuItem value="SHIFT">Shift</MenuItem>
                    <MenuItem value="COMPANY">Company</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {recurringFormData.entityType === "SHIFT" ? (
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Shift Type</InputLabel>
                    <Select value={recurringFormData.shiftType} label="Shift Type" onChange={(e) => setRecurringFormData({ ...recurringFormData, shiftType: e.target.value, entityId: e.target.value === "DAY" ? "1" : "2" })} disabled={!!editingRecurring}>
                      <MenuItem value="DAY">Day Shift</MenuItem>
                      <MenuItem value="NIGHT">Night Shift</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              ) : recurringFormData.entityType === "DRIVER" ? (
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Driver</InputLabel>
                    <Select
                      value={recurringFormData.entityId}
                      label="Driver"
                      onChange={(e) => setRecurringFormData({ ...recurringFormData, entityId: e.target.value })}
                      disabled={!!editingRecurring}
                    >
                      {drivers.map(driver => (
                        <MenuItem key={driver.id} value={driver.id}>
                          {driver.firstName} {driver.lastName} ({driver.driverNumber})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              ) : recurringFormData.entityType === "CAB" ? (
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Cab</InputLabel>
                    <Select value={recurringFormData.entityId} label="Cab" onChange={(e) => setRecurringFormData({ ...recurringFormData, entityId: e.target.value })} disabled={!!editingRecurring}>
                      {cabs.map(cab => <MenuItem key={cab.id} value={cab.id}>Cab {cab.cabNumber}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
              ) : (
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Entity</InputLabel>
                    <Select value={recurringFormData.entityId} label="Entity" onChange={(e) => setRecurringFormData({ ...recurringFormData, entityId: e.target.value })} disabled={!!editingRecurring}>
                      <MenuItem value="1">Company</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
              <Grid item xs={12} md={6}>
                <TextField label="Amount" type="number" value={recurringFormData.amount} onChange={(e) => setRecurringFormData({ ...recurringFormData, amount: e.target.value })} 
                  fullWidth required InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} inputProps={{ step: "0.01", min: "0" }} disabled={!!editingRecurring} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Effective From" type="date" value={recurringFormData.effectiveFrom} onChange={(e) => setRecurringFormData({ ...recurringFormData, effectiveFrom: e.target.value })} 
                  fullWidth required InputLabelProps={{ shrink: true }} disabled={!!editingRecurring} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="End Date (Optional)"
                  type="date"
                  value={recurringFormData.effectiveTo}
                  onChange={(e) => setRecurringFormData({ ...recurringFormData, effectiveTo: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Notes" value={recurringFormData.notes} onChange={(e) => setRecurringFormData({ ...recurringFormData, notes: e.target.value })} fullWidth multiline rows={2} />
              </Grid>
            </Grid>
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenRecurringDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveRecurring} variant="contained">{editingRecurring ? "Update" : "Save"}</Button>
          </DialogActions>
        </Dialog>

        {/* One-Time Expense Dialog */}
        <Dialog open={openOneTimeDialog} onClose={() => setOpenOneTimeDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>{editingOneTime ? "Edit Expense" : "Add One-Time Expense"}</DialogTitle>
          <DialogContent>
            <Typography sx={{ fontWeight: 700, mb: 2 }}>
              You will not be able to edit the entry once made. You will have to create a counter entry (reversal), so be careful.
            </Typography>
            <Grid container spacing={2} sx={{ pt: 2 }}>
              <Grid item xs={12} md={6}>
                <TextField label="Expense Date" type="date" value={oneTimeFormData.expenseDate} onChange={(e) => setOneTimeFormData({ ...oneTimeFormData, expenseDate: e.target.value })} 
                  fullWidth required InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select value={oneTimeFormData.expenseCategoryId} label="Category" onChange={(e) => setOneTimeFormData({ ...oneTimeFormData, expenseCategoryId: e.target.value })}>
                    {expenseCategories.filter(c => c.categoryType === "VARIABLE").map(cat => <MenuItem key={cat.id} value={cat.id}>{cat.categoryName}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Entity Type</InputLabel>
                  <Select value={oneTimeFormData.entityType} label="Entity Type" onChange={(e) => setOneTimeFormData({ ...oneTimeFormData, entityType: e.target.value, entityId: "", shiftType: "" })}>
                    <MenuItem value="CAB">Cab</MenuItem>
                    <MenuItem value="DRIVER">Driver</MenuItem>
                    <MenuItem value="SHIFT">Shift</MenuItem>
                    <MenuItem value="COMPANY">Company</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {oneTimeFormData.entityType === "SHIFT" ? (
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Shift Type</InputLabel>
                    <Select value={oneTimeFormData.shiftType} label="Shift Type" onChange={(e) => setOneTimeFormData({ ...oneTimeFormData, shiftType: e.target.value, entityId: e.target.value === "DAY" ? "1" : "2" })}>
                      <MenuItem value="DAY">Day Shift</MenuItem>
                      <MenuItem value="NIGHT">Night Shift</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              ) : oneTimeFormData.entityType === "DRIVER" ? (
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Driver</InputLabel>
                    <Select
                      value={oneTimeFormData.entityId}
                      label="Driver"
                      onChange={(e) => setOneTimeFormData({ ...oneTimeFormData, entityId: e.target.value })}
                    >
                      {drivers.map(driver => (
                        <MenuItem key={driver.id} value={driver.id}>
                          {driver.firstName} {driver.lastName} ({driver.driverNumber})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              ) : oneTimeFormData.entityType === "CAB" ? (
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Cab</InputLabel>
                    <Select value={oneTimeFormData.entityId} label="Cab" onChange={(e) => setOneTimeFormData({ ...oneTimeFormData, entityId: e.target.value })}>
                      {cabs.map(cab => <MenuItem key={cab.id} value={cab.id}>Cab {cab.cabNumber}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
              ) : (
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Entity</InputLabel>
                    <Select value={oneTimeFormData.entityId} label="Entity" onChange={(e) => setOneTimeFormData({ ...oneTimeFormData, entityId: e.target.value })}>
                      <MenuItem value="1">Company</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
              <Grid item xs={12} md={6}>
                <TextField label="Amount" type="number" value={oneTimeFormData.amount} onChange={(e) => setOneTimeFormData({ ...oneTimeFormData, amount: e.target.value })} 
                  fullWidth required InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} inputProps={{ step: "0.01", min: "0" }} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Vendor" value={oneTimeFormData.vendor} onChange={(e) => setOneTimeFormData({ ...oneTimeFormData, vendor: e.target.value })} fullWidth />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Description" value={oneTimeFormData.description} onChange={(e) => setOneTimeFormData({ ...oneTimeFormData, description: e.target.value })} fullWidth multiline rows={2} />
              </Grid>
            </Grid>
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenOneTimeDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveOneTime} variant="contained">{editingOneTime ? "Update" : "Save"}</Button>
          </DialogActions>
        </Dialog>

        {/* Revenue Dialog */}
        <Dialog open={openRevenueDialog} onClose={() => setOpenRevenueDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ bgcolor: "success.light" }}>{editingRevenue ? "Edit Revenue" : "Add Other Revenue"}</DialogTitle>
          <DialogContent>
            <Typography sx={{ fontWeight: 700, mb: 2 }}>
              You will not be able to edit the entry once made. You will have to create a counter entry (reversal), so be careful.
            </Typography>
            <Grid container spacing={2} sx={{ pt: 2 }}>
              <Grid item xs={12} md={6}>
                <TextField label="Revenue Date" type="date" value={revenueFormData.revenueDate} onChange={(e) => setRevenueFormData({ ...revenueFormData, revenueDate: e.target.value })} 
                  fullWidth required InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select value={revenueFormData.revenueCategoryId} label="Category" onChange={(e) => setRevenueFormData({ ...revenueFormData, revenueCategoryId: e.target.value })}>
                    {revenueCategories.map(cat => <MenuItem key={cat.id} value={cat.id}>{cat.categoryName}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Revenue Type</InputLabel>
                  <Select value={revenueFormData.revenueType} label="Revenue Type" onChange={(e) => setRevenueFormData({ ...revenueFormData, revenueType: e.target.value })}>
                    <MenuItem value="BONUS">Bonus</MenuItem>
                    <MenuItem value="CREDIT">Credit</MenuItem>
                    <MenuItem value="ADJUSTMENT">Adjustment</MenuItem>
                    <MenuItem value="REFERRAL">Referral Fee</MenuItem>
                    <MenuItem value="INCENTIVE">Incentive</MenuItem>
                    <MenuItem value="COMMISSION">Commission</MenuItem>
                    <MenuItem value="OTHER">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Entity Type</InputLabel>
                  <Select value={revenueFormData.entityType} label="Entity Type" onChange={(e) => setRevenueFormData({ ...revenueFormData, entityType: e.target.value, entityId: "", shiftType: "" })}>
                    <MenuItem value="DRIVER">Driver</MenuItem>
                    <MenuItem value="OWNER">Owner</MenuItem>
                    <MenuItem value="CAB">Cab</MenuItem>
                    <MenuItem value="SHIFT">Shift</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {revenueFormData.entityType === "SHIFT" ? (
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Shift Type</InputLabel>
                    <Select value={revenueFormData.shiftType} label="Shift Type" onChange={(e) => setRevenueFormData({ ...revenueFormData, shiftType: e.target.value, entityId: e.target.value === "DAY" ? "1" : "2" })}>
                      <MenuItem value="DAY">Day Shift</MenuItem>
                      <MenuItem value="NIGHT">Night Shift</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              ) : revenueFormData.entityType === "CAB" ? (
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Cab</InputLabel>
                    <Select value={revenueFormData.entityId} label="Cab" onChange={(e) => setRevenueFormData({ ...revenueFormData, entityId: e.target.value })}>
                      {cabs.map(cab => <MenuItem key={cab.id} value={cab.id}>Cab {cab.cabNumber}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
              ) : (
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Entity</InputLabel>
                    <Select value={revenueFormData.entityId} label="Entity" onChange={(e) => setRevenueFormData({ ...revenueFormData, entityId: e.target.value })}>
                      {(revenueFormData.entityType === "DRIVER" || revenueFormData.entityType === "OWNER") && drivers.map(driver => <MenuItem key={driver.id} value={driver.id}>{driver.firstName} {driver.lastName}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              <Grid item xs={12} md={6}>
                <TextField label="Amount" type="number" value={revenueFormData.amount} onChange={(e) => setRevenueFormData({ ...revenueFormData, amount: e.target.value })} 
                  fullWidth required InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} inputProps={{ step: "0.01", min: "0" }} />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Payment Status</InputLabel>
                  <Select value={revenueFormData.paymentStatus} label="Payment Status" onChange={(e) => setRevenueFormData({ ...revenueFormData, paymentStatus: e.target.value })}>
                    <MenuItem value="PENDING">Pending</MenuItem>
                    <MenuItem value="PAID">Paid</MenuItem>
                    <MenuItem value="CANCELLED">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField label="Description" value={revenueFormData.description} onChange={(e) => setRevenueFormData({ ...revenueFormData, description: e.target.value })} fullWidth multiline rows={2} />
              </Grid>
            </Grid>
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenRevenueDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveRevenue} variant="contained" color="success">{editingRevenue ? "Update" : "Save"}</Button>
          </DialogActions>
        </Dialog>

        {/* Edit Warning Dialog */}
        <Dialog open={openEditWarningDialog} onClose={() => setOpenEditWarningDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BlockIcon color="error" fontSize="large" />
              <Typography variant="h6" color="error">Editing Not Allowed</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Alert severity="error" sx={{ mb: 3 }}>
              <AlertTitle>Cannot Edit Once Entered</AlertTitle>
              Expenses and revenues are <strong>immutable</strong> once created.
            </Alert>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Why?</Typography>
            <Typography paragraph>
              Editing existing records would change historical financial reports and calculations that have already been generated, 
              breaking the audit trail and making reconciliation impossible.
            </Typography>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Solution:</Typography>
            <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
              <Typography paragraph fontWeight="bold">
                ✅ Create a Counter Entry (Reversal)
              </Typography>
              <Typography paragraph>
                1. Create a new entry with the <strong>same details</strong><br/>
                2. Enter a <strong>negative amount</strong> to reverse the incorrect entry<br/>
                3. Then create a new entry with the <strong>correct information</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Example: If you entered $100 by mistake, create a new entry for -$100, then create the correct entry.
              </Typography>
            </Box>

            <Alert severity="info" sx={{ mt: 2 }}>
              This approach maintains the complete financial audit trail and ensures report accuracy.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEditWarningDialog(false)} variant="contained" color="primary">I Understand</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}