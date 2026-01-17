"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import GlobalNav from "../components/GlobalNav";
import {
  Box, Container, Typography, Button, Paper, Grid, TextField,
  Tabs, Tab, Autocomplete, Card, CardContent, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from "@mui/material";
import {
  Assessment, TrendingUp, TrendingDown, AccountBalance, CheckCircle,
  Visibility, Download, Print, Email,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import axios from "axios";

import RevenueTab from "./components/RevenueTab";
import ExpenseTab from "./components/ExpenseTab";
import { API_BASE_URL } from "../lib/api";

// ✅ FIXED: Proper date formatting function that handles timezones correctly
const formatDateForAPI = (date) => {
  if (!date || !(date instanceof Date)) return null;
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

export default function ReportsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // ✅ Driver-specific state
  const [isDriverRole, setIsDriverRole] = useState(false);
  const [currentDriverNumber, setCurrentDriverNumber] = useState(null);
  
  // ✅ ALL report data cached here - fetched ONCE
  const [reportData, setReportData] = useState(null);

  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const getCurrentUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;
      const response = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}`, "X-Tenant-ID": localStorage.getItem("tenantSchema") },
      });
      return response.data;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/signin");
        return;
      }
      const user = await getCurrentUser();
      if (!user) {
        router.push("/signin");
        return;
      }
      setCurrentUser(user);
      
      // ✅ CHECK IF USER IS DRIVER
      if (user.role === 'DRIVER') {
        setIsDriverRole(true);
        // ✅ Auto-select current driver
        const driverId = user.driverId;
        if (driverId) {
          try {
            const driverResponse = await axios.get(`${API_BASE_URL}/drivers/${driverId}`, {
              headers: { Authorization: `Bearer ${token}`, "X-Tenant-ID": localStorage.getItem("tenantSchema") },
            });
            const driver = driverResponse.data;
            setCurrentDriverNumber(driver.driverNumber);
            setSelectedDriver(driver);
            setDrivers([driver]); // Only show this driver
          } catch (error) {
            console.error("Error fetching driver info:", error);
            setError("Failed to load your driver information");
          }
        }
      } else {
        setIsDriverRole(false);
        fetchDrivers(); // Load all drivers for admin/manager/accountant
      }
    };
    checkAuth();
  }, [router]);

  const fetchDrivers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/drivers`, {
        headers: { Authorization: `Bearer ${token}`, "X-Tenant-ID": localStorage.getItem("tenantSchema") },
      });
      const allDrivers = response.data.sort((a, b) => {
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
      setDrivers(allDrivers);
    } catch (error) {
      console.error("Error fetching drivers:", error);
      setError("Failed to fetch drivers");
    }
  };

  // ✅ Fetch ALL data ONCE when Generate Report is clicked
  const fetchAllReportData = async () => {
    if (!selectedDriver || !startDate || !endDate) return;

    setLoading(true);
    setError("");
    
    try {
      const token = localStorage.getItem("token");
      
      // ✅ FIXED: Use proper date formatting
      const formattedStartDate = formatDateForAPI(startDate);
      const formattedEndDate = formatDateForAPI(endDate);

      console.log('🚀 Fetching ALL report data for driver:', selectedDriver.driverNumber);
      console.log('📅 Date Range:', formattedStartDate, 'to', formattedEndDate);

      // ✅ Fetch ALL revenue and expense types in PARALLEL
      const [leaseRevenueRes, creditCardRes, chargesRes, otherRevenueRes, fixedExpensesRes, leaseExpenseRes, oneTimeExpensesRes] = 
        await Promise.allSettled([
          axios.get(`${API_BASE_URL}/reports/lease-revenue`, {
            params: { 
              ownerDriverNumber: selectedDriver.driverNumber,
              startDate: formattedStartDate, 
              endDate: formattedEndDate 
            },
            headers: { Authorization: `Bearer ${token}`, "X-Tenant-ID": localStorage.getItem("tenantSchema") },
          }),
          axios.get(`${API_BASE_URL}/reports/credit-card-revenue`, {
            params: { 
              driverNumber: selectedDriver.driverNumber,
              startDate: formattedStartDate, 
              endDate: formattedEndDate 
            },
            headers: { Authorization: `Bearer ${token}`, "X-Tenant-ID": localStorage.getItem("tenantSchema") },
          }),
          axios.get(`${API_BASE_URL}/reports/charges-revenue`, {
            params: { 
              driverNumber: selectedDriver.driverNumber,
              startDate: formattedStartDate, 
              endDate: formattedEndDate 
            },
            headers: { Authorization: `Bearer ${token}`, "X-Tenant-ID": localStorage.getItem("tenantSchema") },
          }),
          axios.get(`${API_BASE_URL}/other-revenues`, {
            params: {
               driverNumber: selectedDriver.driverNumber,
              startDate: formattedStartDate,
              endDate: formattedEndDate,
            },
            headers: { Authorization: `Bearer ${token}`, "X-Tenant-ID": localStorage.getItem("tenantSchema") },
          }),
          axios.get(`${API_BASE_URL}/reports/fixed-expenses`, {
            params: { 
              driverNumber: selectedDriver.driverNumber,
              startDate: formattedStartDate, 
              endDate: formattedEndDate 
            },
            headers: { Authorization: `Bearer ${token}`, "X-Tenant-ID": localStorage.getItem("tenantSchema") },
          }),
          axios.get(`${API_BASE_URL}/reports/lease-expense`, {
            params: {
              driverNumber: selectedDriver.driverNumber,
              startDate: formattedStartDate,
              endDate: formattedEndDate,
            },
            headers: { Authorization: `Bearer ${token}`, "X-Tenant-ID": localStorage.getItem("tenantSchema") },
          }),
          axios.get(`${API_BASE_URL}/one-time-expenses/between`, {
            params: {
              startDate: formattedStartDate,
              endDate: formattedEndDate,
            },
            headers: { Authorization: `Bearer ${token}`, "X-Tenant-ID": localStorage.getItem("tenantSchema") },
          }),
        ]);

      // ✅ Extract data (handle failures gracefully)
      const leaseRevenue = leaseRevenueRes.status === 'fulfilled' ? leaseRevenueRes.value.data : null;
      const creditCardRevenue = creditCardRes.status === 'fulfilled' ? creditCardRes.value.data : null;
      const chargesRevenue = chargesRes.status === 'fulfilled' ? chargesRes.value.data : null;
      const otherRevenueAll = otherRevenueRes.status === 'fulfilled' ? otherRevenueRes.value.data : [];
      const fixedExpenses = fixedExpensesRes.status === 'fulfilled' ? fixedExpensesRes.value.data : null;
      const leaseExpense = leaseExpenseRes.status === 'fulfilled' ? leaseExpenseRes.value.data : null;
      const oneTimeExpensesAll = oneTimeExpensesRes.status === 'fulfilled' ? oneTimeExpensesRes.value.data : [];

      if (otherRevenueRes.status !== 'fulfilled') {
        console.error('❌ Other revenue request failed:', otherRevenueRes.reason);
      } else {
        console.log('✅ Other revenue fetched (raw count):', Array.isArray(otherRevenueAll) ? otherRevenueAll.length : 0);
        // Debug: log the actual data structure
        if (Array.isArray(otherRevenueAll) && otherRevenueAll.length > 0) {
          console.log('✅ Other revenue first item structure:', JSON.stringify(otherRevenueAll[0], null, 2));
        }
      }

      // ✅ DEBUG: Log what we're filtering with
      console.log('🔍 Selected driver for filtering:', {
        id: selectedDriver?.id,
        driverNumber: selectedDriver?.driverNumber
      });

      const fixedOneTimeExpenses = Array.isArray(fixedExpenses?.expenseItems)
        ? fixedExpenses.expenseItems.filter((item) => item?.expenseType === "ONE_TIME")
        : [];

      const selectedDriverNumberStr = selectedDriver?.driverNumber != null ? String(selectedDriver.driverNumber) : "";

      const oneTimeExpenses = Array.isArray(oneTimeExpensesAll)
        ? oneTimeExpensesAll.filter((expense) => {
          const expenseDriverNumberStr = expense?.driver?.driverNumber != null ? String(expense.driver.driverNumber) : null;
          const expenseOwnerNumberStr = expense?.owner?.driverNumber != null ? String(expense.owner.driverNumber) : null;
          const directDriverNumberStr = expense?.driverNumber != null ? String(expense.driverNumber) : null;
          const directOwnerNumberStr = expense?.ownerDriverNumber != null ? String(expense.ownerDriverNumber) : null;

          if (expense?.entityType === "DRIVER") {
            return (
              expenseDriverNumberStr === selectedDriverNumberStr ||
              directDriverNumberStr === selectedDriverNumberStr
            );
          }

          if (expense?.entityType === "OWNER") {
            return (
              expenseOwnerNumberStr === selectedDriverNumberStr ||
              directOwnerNumberStr === selectedDriverNumberStr
            );
          }

          return false;
        })
        : [];

      const reportOneTimeExpenses = fixedOneTimeExpenses.length > 0 ? fixedOneTimeExpenses : oneTimeExpenses;

      // ✅ FIXED: Updated filtering logic to work with new DTO flat structure
      // The DTO now has flat properties: driverId, driverNumber, ownerId, ownerNumber
      // Also check entityId against both driver.id AND driverNumber (since entityId might store either)
      const otherRevenue = Array.isArray(otherRevenueAll)
        ? otherRevenueAll.filter((rev) => {
          const selectedDriverIdStr = selectedDriver?.id != null ? String(selectedDriver.id) : "";
          const selectedDriverNumberStr = selectedDriver?.driverNumber != null ? String(selectedDriver.driverNumber) : "";

          // ✅ NEW DTO flat structure
          const revDriverIdStr = rev?.driverId != null ? String(rev.driverId) : null;
          const revOwnerIdStr = rev?.ownerId != null ? String(rev.ownerId) : null;
          const revDriverNumberStr = rev?.driverNumber != null ? String(rev.driverNumber) : null;
          const revOwnerNumberStr = rev?.ownerNumber != null ? String(rev.ownerNumber) : null;
          const revEntityIdStr = rev?.entityId != null ? String(rev.entityId) : null;

          // Also support legacy nested structure for backwards compatibility
          const legacyDriverIdStr = rev?.driver?.id != null ? String(rev.driver.id) : null;
          const legacyOwnerIdStr = rev?.owner?.id != null ? String(rev.owner.id) : null;
          const legacyDriverNumberStr = rev?.driver?.driverNumber != null ? String(rev.driver.driverNumber) : null;
          const legacyOwnerNumberStr = rev?.owner?.driverNumber != null ? String(rev.owner.driverNumber) : null;

          // Debug logging
          console.log('🔍 Filtering revenue item:', {
            id: rev?.id,
            entityType: rev?.entityType,
            entityId: revEntityIdStr,
            driverId: revDriverIdStr,
            driverNumber: revDriverNumberStr,
            ownerId: revOwnerIdStr,
            ownerNumber: revOwnerNumberStr,
            selectedDriverId: selectedDriverIdStr,
            selectedDriverNumber: selectedDriverNumberStr
          });

          if (rev?.entityType === "DRIVER") {
            const match = (
              // Match entityId to driver.id
              (revEntityIdStr != null && revEntityIdStr === selectedDriverIdStr) ||
              // Match entityId to driverNumber (in case entityId stores the driver number)
              (revEntityIdStr != null && revEntityIdStr === selectedDriverNumberStr) ||
              // Match driverId from DTO
              (revDriverIdStr != null && revDriverIdStr === selectedDriverIdStr) ||
              // Match driverNumber from DTO
              (revDriverNumberStr != null && revDriverNumberStr === selectedDriverNumberStr) ||
              // Legacy support
              (legacyDriverIdStr != null && legacyDriverIdStr === selectedDriverIdStr) ||
              (legacyDriverNumberStr != null && legacyDriverNumberStr === selectedDriverNumberStr)
            );
            console.log('🔍 DRIVER match result:', match);
            return match;
          }

          if (rev?.entityType === "OWNER") {
            const match = (
              // Match entityId to driver.id (owner is also a driver)
              (revEntityIdStr != null && revEntityIdStr === selectedDriverIdStr) ||
              // Match entityId to driverNumber
              (revEntityIdStr != null && revEntityIdStr === selectedDriverNumberStr) ||
              // Match ownerId from DTO
              (revOwnerIdStr != null && revOwnerIdStr === selectedDriverIdStr) ||
              // Match ownerNumber from DTO
              (revOwnerNumberStr != null && revOwnerNumberStr === selectedDriverNumberStr) ||
              // Legacy support
              (legacyOwnerIdStr != null && legacyOwnerIdStr === selectedDriverIdStr) ||
              (legacyOwnerNumberStr != null && legacyOwnerNumberStr === selectedDriverNumberStr)
            );
            console.log('🔍 OWNER match result:', match);
            return match;
          }

          // For other entity types (CAB/SHIFT/COMPANY/etc.), include if there's an explicit
          // association to the selected driver (by id or driverNumber).
          if (revDriverIdStr != null && revDriverIdStr === selectedDriverIdStr) return true;
          if (revOwnerIdStr != null && revOwnerIdStr === selectedDriverIdStr) return true;
          if (revDriverNumberStr != null && revDriverNumberStr === selectedDriverNumberStr) return true;
          if (revOwnerNumberStr != null && revOwnerNumberStr === selectedDriverNumberStr) return true;
          // Legacy support
          if (legacyDriverIdStr != null && legacyDriverIdStr === selectedDriverIdStr) return true;
          if (legacyOwnerIdStr != null && legacyOwnerIdStr === selectedDriverIdStr) return true;
          if (legacyDriverNumberStr != null && legacyDriverNumberStr === selectedDriverNumberStr) return true;
          if (legacyOwnerNumberStr != null && legacyOwnerNumberStr === selectedDriverNumberStr) return true;

          return false;
        })
        : [];
      
      console.log('✅ Other revenue after filtering:', otherRevenue.length, 'of', otherRevenueAll?.length || 0);

      console.log('✅ Lease Revenue Total:', leaseRevenue?.totalRevenue || leaseRevenue?.grandTotalLease || 0);
      console.log('✅ Credit Card Total:', creditCardRevenue?.grandTotal || 0);
      console.log('✅ Charges Total:', chargesRevenue?.grandTotal || chargesRevenue?.totalAmount || 0);
      console.log('✅ Other Revenue Total:', otherRevenue.reduce((sum, r) => sum + parseFloat(r?.amount || 0), 0));
      console.log('✅ Fixed Expenses Total:', fixedExpenses?.totalAmount || fixedExpenses?.totalExpenses || 0);
      console.log('✅ Lease Expense Total:', leaseExpense?.grandTotalLease || leaseExpense?.totalLeaseExpense || 0);
      console.log('✅ One-Time Expenses Total:', reportOneTimeExpenses.reduce((sum, exp) => sum + parseFloat(exp?.amount ?? exp?.chargedAmount ?? 0), 0));

      // ✅ Calculate totals
      const totalRevenue = 
        parseFloat(leaseRevenue?.totalRevenue || leaseRevenue?.grandTotalLease || 0) +
        parseFloat(creditCardRevenue?.grandTotal || 0) +
        parseFloat(chargesRevenue?.grandTotal || chargesRevenue?.totalAmount || 0) +
        otherRevenue.reduce((sum, r) => sum + parseFloat(r?.amount || 0), 0);

      const fixedExpensesTotal = parseFloat(fixedExpenses?.totalAmount || fixedExpenses?.totalExpenses || 0);
      const leaseExpenseTotal = parseFloat(leaseExpense?.grandTotalLease || leaseExpense?.totalLeaseExpense || 0);
      const oneTimeExpensesTotal = reportOneTimeExpenses.reduce((sum, exp) => sum + parseFloat(exp?.amount ?? exp?.chargedAmount ?? 0), 0);
      const totalExpenses = fixedExpensesTotal + leaseExpenseTotal + oneTimeExpensesTotal;
      const netAmount = totalRevenue - totalExpenses;
      const amountDue = netAmount;

      console.log('📊 CALCULATED TOTALS:');
      console.log('Total Revenue:', totalRevenue);
      console.log('Total Expenses:', totalExpenses);
      console.log('Amount Due/Owing:', amountDue);

      // ✅ Store EVERYTHING in cache
      const data = {
        leaseRevenue,
        creditCardRevenue,
        chargesRevenue,
        otherRevenue,
        fixedExpenses,
        leaseExpense,
        oneTimeExpenses: reportOneTimeExpenses,
        totalRevenue,
        totalExpenses,
        amountPaid: 0,
        amountDue,
      };

      setReportData(data);
      console.log('✅ All data cached successfully');

    } catch (error) {
      console.error("Error fetching report data:", error);
      setError(`Failed to fetch report data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = () => {
    if (!selectedDriver || !startDate || !endDate) {
      setError("Please select a driver and date range");
      return;
    }
    setError("");
    setReportData(null); // Clear old data
    fetchAllReportData(); // ✅ Fetch everything ONCE
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleOpenDetails = () => setDetailsDialogOpen(true);
  const handleCloseDetails = () => setDetailsDialogOpen(false);

  const handleDownloadPdf = () => {
    window.print();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEmail = () => {
    if (!selectedDriver || !reportData) return;

    const leaseRevenueTotal = parseFloat(
      reportData?.leaseRevenue?.totalRevenue || reportData?.leaseRevenue?.grandTotalLease || 0
    );
    const creditCardTotal = parseFloat(reportData?.creditCardRevenue?.grandTotal || 0);
    const chargesTotal = parseFloat(reportData?.chargesRevenue?.grandTotal || reportData?.chargesRevenue?.totalAmount || 0);
    const fixedExpensesTotal = parseFloat(reportData?.fixedExpenses?.totalAmount || reportData?.fixedExpenses?.totalExpenses || 0);

    const subject = `Financial Report - ${selectedDriver.firstName} ${selectedDriver.lastName}`;
    const amountDueValue = parseFloat(reportData.amountDue || 0);
    const amountDueDisplay = amountDueValue < 0
      ? `($${Math.abs(amountDueValue).toFixed(2)})`
      : `$${Math.abs(amountDueValue).toFixed(2)}`;
    const body = [
      `Driver: ${selectedDriver.firstName} ${selectedDriver.lastName} (${selectedDriver.driverNumber})`,
      `Period: ${startDate?.toLocaleDateString()} - ${endDate?.toLocaleDateString()}`,
      "",
      `Lease Revenue: $${leaseRevenueTotal.toFixed(2)}`,
      `Credit Card Revenue: $${creditCardTotal.toFixed(2)}`,
      `Charges Revenue: $${chargesTotal.toFixed(2)}`,
      "",
      `Total Revenue: $${(reportData.totalRevenue || 0).toFixed(2)}`,
      `Total Expenses: $${(reportData.totalExpenses || 0).toFixed(2)}`,
      `Amount Paid: $${(reportData.amountPaid || 0).toFixed(2)}`,
      `Amount Due/Owing: ${amountDueDisplay}`,
      "",
      `Fixed Expenses (details total): $${fixedExpensesTotal.toFixed(2)}`,
    ].join("\n");

    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const isReportReady = reportData !== null;

  if (!currentUser) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f6f9fc" }}>
      <GlobalNav currentUser={currentUser} />
      
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: "#3e5244", mb: 1 }}>
            <Assessment sx={{ mr: 1, verticalAlign: "middle", fontSize: 32 }} />
            Financial Reports
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {isDriverRole ? "View your financial reports and earnings" : "Generate detailed revenue and expense reports for drivers"}
          </Typography>
        </Box>

        {/* Filter Controls */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Report Parameters
          </Typography>

          {error && (
            <Box sx={{ mb: 2 }}>
              <Typography color="error">{error}</Typography>
            </Box>
          )}

          <Grid container spacing={2}>
            {/* ✅ DRIVER DROPDOWN - Hidden for drivers */}
            {!isDriverRole && (
              <Grid item xs={12} md={3}>
                <Autocomplete
                  options={drivers}
                  getOptionLabel={(option) => 
                    `${option.firstName} ${option.lastName} (${option.driverNumber})`
                  }
                  value={selectedDriver}
                  onChange={(event, newValue) => {
                    setSelectedDriver(newValue);
                    setReportData(null);
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Search Driver" placeholder="Type to search..." />
                  )}
                  isOptionEqualToValue={(option, value) => 
                    option.driverNumber === value.driverNumber
                  }
                  noOptionsText="No drivers found"
                />
              </Grid>
            )}

            {/* ✅ DRIVER INFO CARD - Shown for drivers */}
            {isDriverRole && (
              <Grid item xs={12} md={3}>
                <Card sx={{ p: 2, backgroundColor: '#e8f4f8', height: '100%' }}>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                    Driver
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                    {selectedDriver ? `${selectedDriver.firstName} ${selectedDriver.lastName}` : 'Loading...'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {currentDriverNumber || 'Loading...'}
                  </Typography>
                </Card>
              </Grid>
            )}

            <Grid item xs={12} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} md={3}>
              <Button
                variant="contained"
                fullWidth
                onClick={handleGenerateReport}
                disabled={!selectedDriver || !startDate || !endDate || loading}
                startIcon={loading ? <CircularProgress size={20} /> : <Assessment />}
                sx={{ 
                  height: 56,
                  backgroundColor: "#3e5244",
                  "&:hover": { backgroundColor: "#2d3d32" }
                }}
              >
                {loading ? "Loading..." : "Generate Report"}
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Summary Cards */}
        {isReportReady && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ height: '100%', bgcolor: '#e8f5e9' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TrendingUp sx={{ color: '#2e7d32', mr: 1 }} />
                    <Typography variant="caption" color="textSecondary">
                      Total Revenue
                    </Typography>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#2e7d32' }}>
                    ${(reportData?.totalRevenue ?? 0).toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ height: '100%', bgcolor: '#ffebee' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TrendingDown sx={{ color: '#c62828', mr: 1 }} />
                    <Typography variant="caption" color="textSecondary">
                      Total Expenses
                    </Typography>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#c62828' }}>
                    ${(reportData?.totalExpenses ?? 0).toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ height: '100%', bgcolor: '#e3f2fd' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CheckCircle sx={{ color: '#1565c0', mr: 1 }} />
                    <Typography variant="caption" color="textSecondary">
                      Amount Paid
                    </Typography>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#1565c0' }}>
                    ${(reportData?.amountPaid ?? 0).toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ height: '100%', bgcolor: (reportData?.amountDue ?? 0) < 0 ? '#ffebee' : '#e8f5e9' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AccountBalance sx={{ color: (reportData?.amountDue ?? 0) < 0 ? '#c62828' : '#2e7d32', mr: 1 }} />
                    <Typography variant="caption" color="textSecondary">
                      Amount Due/Owing
                    </Typography>
                  </Box>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 700, color: (reportData?.amountDue ?? 0) < 0 ? '#c62828' : '#2e7d32' }}
                  >
                    {(reportData?.amountDue ?? 0) < 0
                            ? `($${Math.abs(reportData?.amountDue ?? 0).toFixed(2)})`
                            : `$${Math.abs(reportData?.amountDue ?? 0).toFixed(2)}`}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    onClick={handleOpenDetails}
                    startIcon={<Visibility />}
                    sx={{ backgroundColor: "#3e5244", "&:hover": { backgroundColor: "#2d3d32" } }}
                  >
                    See Details
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Report Tabs - Pass cached data */}
        {isReportReady && (
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              sx={{ borderBottom: 1, borderColor: "divider" }}
            >
              <Tab icon={<TrendingUp />} iconPosition="start" label="Revenue" sx={{ minHeight: 64 }} />
              <Tab icon={<TrendingDown />} iconPosition="start" label="Expenses" sx={{ minHeight: 64 }} />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {activeTab === 0 && (
                <RevenueTab
                  driverNumber={selectedDriver?.driverNumber}
                  startDate={startDate}
                  endDate={endDate}
                  reportData={reportData}
                />
              )}
              {activeTab === 1 && (
                <ExpenseTab
                  driverNumber={selectedDriver?.driverNumber}
                  startDate={startDate}
                  endDate={endDate}
                  reportData={reportData}
                />
              )}
            </Box>
          </Paper>
        )}

        {/* Empty/Loading States */}
        {!isReportReady && !loading && (
          <Paper sx={{ p: 6, textAlign: "center" }}>
            <Assessment sx={{ fontSize: 80, color: "#3e5244", opacity: 0.3, mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
              {isDriverRole ? "Select Date Range to View Your Reports" : "Select Parameters to Generate Reports"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isDriverRole ? "Choose a date range to view your financial reports" : "Choose a driver and date range to view financial reports"}
            </Typography>
          </Paper>
        )}

        {loading && (
          <Paper sx={{ p: 6, textAlign: "center" }}>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Loading financial data...
            </Typography>
          </Paper>
        )}
      </Container>

      {/* Details Dialog - Same as before */}
      <Dialog open={detailsDialogOpen} onClose={handleCloseDetails} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Report Details
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedDriver?.firstName} {selectedDriver?.lastName} ({selectedDriver?.driverNumber})
              {startDate && endDate ? ` • ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}` : ""}
            </Typography>
          </Box>
          <Button variant="outlined" startIcon={<Download />} onClick={handleDownloadPdf}>
            Download PDF
          </Button>
        </DialogTitle>

        <DialogContent dividers>
          {!reportData ? (
            <Typography color="text.secondary">No report data available.</Typography>
          ) : (
            <div style={{ padding: '16px' }}>
              {/* DEBUG: Always visible */}
              {console.log('📊 DIALOG reportData:', reportData)}
              {console.log('📊 leaseRevenue:', reportData?.leaseRevenue)}
              {console.log('📊 leaseRevenue.leaseItems:', reportData?.leaseRevenue?.leaseItems)}
              {console.log('📊 creditCardRevenue:', reportData?.creditCardRevenue)}
              {console.log('📊 creditCardRevenue.transactionItems:', reportData?.creditCardRevenue?.transactionItems)}
              <div style={{ marginBottom: '16px', backgroundColor: '#fff3cd', padding: '12px', borderRadius: '4px' }}>
                <strong>DEBUG INFO:</strong><br/>
                leaseRevenue items: {reportData?.leaseRevenue?.leaseItems?.length ?? 'undefined'}<br/>
                creditCard items: {reportData?.creditCardRevenue?.transactionItems?.length ?? 'undefined'}<br/>
                charges items: {reportData?.chargesRevenue?.chargeItems?.length ?? 'undefined'}<br/>
                fixedExpenses items: {reportData?.fixedExpenses?.expenseItems?.length ?? 'undefined'}<br/>
                leaseExpense items: {reportData?.leaseExpense?.leaseExpenseItems?.length ?? 'undefined'}<br/>
                otherRevenue: {reportData?.otherRevenue?.length ?? 'undefined'}<br/>
                oneTimeExpenses: {reportData?.oneTimeExpenses?.length ?? 'undefined'}
              </div>
              {/* SUMMARY */}
              <h2 style={{ marginBottom: '16px', borderBottom: '2px solid #333' }}>Summary</h2>
              <table style={{ width: '100%', marginBottom: '24px', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr><td style={{ padding: '8px', border: '1px solid #ddd' }}>Total Revenue</td><td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right', color: 'green', fontWeight: 'bold' }}>${(reportData?.totalRevenue ?? 0).toFixed(2)}</td></tr>
                  <tr><td style={{ padding: '8px', border: '1px solid #ddd' }}>Total Expenses</td><td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right', color: 'red', fontWeight: 'bold' }}>-${(reportData?.totalExpenses ?? 0).toFixed(2)}</td></tr>
                  <tr><td style={{ padding: '8px', border: '1px solid #ddd' }}>Amount Paid</td><td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right', color: 'blue', fontWeight: 'bold' }}>${(reportData?.amountPaid ?? 0).toFixed(2)}</td></tr>
                  <tr style={{ backgroundColor: (reportData?.amountDue ?? 0) < 0 ? '#ffebee' : '#e8f5e9' }}><td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold' }}>Amount Due/Owing</td><td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right', fontWeight: 'bold', fontSize: '1.2em' }}>{(reportData?.amountDue ?? 0) < 0 ? `($${Math.abs(reportData?.amountDue ?? 0).toFixed(2)})` : `$${(reportData?.amountDue ?? 0).toFixed(2)}`}</td></tr>
                </tbody>
              </table>

              {/* REVENUE DETAILS */}
              <h2 style={{ marginBottom: '16px', borderBottom: '2px solid green', color: 'green' }}>Revenue Details</h2>
              
              {/* Lease Revenue */}
              <h3 style={{ color: 'green' }}>Lease Revenue (${parseFloat(reportData?.leaseRevenue?.totalRevenue || reportData?.leaseRevenue?.grandTotalLease || 0).toFixed(2)})</h3>
              {(() => {
                const items = reportData?.leaseRevenue?.leaseItems || [];
                if (items.length === 0) return <p style={{ fontStyle: 'italic', color: '#666' }}>No lease revenue items</p>;
                return (
                  <table style={{ width: '100%', marginBottom: '16px', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ backgroundColor: '#f5f5f5' }}><th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Date</th><th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Cab</th><th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Shift</th><th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Driver</th><th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>Amount</th></tr></thead>
                    <tbody>{items.map((item, i) => <tr key={i}><td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.shiftDate || '-'}</td><td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.cabNumber || '-'}</td><td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.shiftType || '-'}</td><td style={{ padding: '8px', border: '1px solid #ddd' }}>{item.driverName || '-'}</td><td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right', color: 'green' }}>${parseFloat(item.totalLease || 0).toFixed(2)}</td></tr>)}</tbody>
                  </table>
                );
              })()}

              {/* Credit Card Revenue */}
              <h3 style={{ color: 'green' }}>Credit Card Revenue (${parseFloat(reportData?.creditCardRevenue?.grandTotal || 0).toFixed(2)})</h3>
              {(() => {
                const items = reportData?.creditCardRevenue?.transactionItems || [];
                if (items.length === 0) return <p style={{ fontStyle: 'italic', color: '#666' }}>No credit card transactions</p>;
                return (
                  <table style={{ width: '100%', marginBottom: '16px', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ backgroundColor: '#f5f5f5' }}><th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Date</th><th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Cab</th><th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Card</th><th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>Amount</th><th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>Tip</th><th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>Total</th></tr></thead>
                    <tbody>{items.map((txn, i) => <tr key={i}><td style={{ padding: '8px', border: '1px solid #ddd' }}>{txn.transactionDate || '-'}</td><td style={{ padding: '8px', border: '1px solid #ddd' }}>{txn.cabNumber || '-'}</td><td style={{ padding: '8px', border: '1px solid #ddd' }}>{txn.cardLastFour ? `****${txn.cardLastFour}` : '-'}</td><td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>${parseFloat(txn.amount || 0).toFixed(2)}</td><td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>${parseFloat(txn.tipAmount || 0).toFixed(2)}</td><td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right', color: 'green' }}>${parseFloat(txn.totalAmount || 0).toFixed(2)}</td></tr>)}</tbody>
                  </table>
                );
              })()}

              {/* Charges Revenue */}
              <h3 style={{ color: 'green' }}>Charges Revenue (${parseFloat(reportData?.chargesRevenue?.grandTotal || 0).toFixed(2)})</h3>
              {(() => {
                const items = reportData?.chargesRevenue?.chargeItems || [];
                if (items.length === 0) return <p style={{ fontStyle: 'italic', color: '#666' }}>No charges</p>;
                return (
                  <table style={{ width: '100%', marginBottom: '16px', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ backgroundColor: '#f5f5f5' }}>
                      <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Date</th>
                      <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Account</th>
                      <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Pickup</th>
                      <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Dropoff</th>
                      <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>Fare</th>
                      <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>Tip</th>
                      <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>Total</th>
                    </tr></thead>
                    <tbody>{items.map((c, i) => <tr key={i}>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{c.tripDate || '-'}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{c.accountId || '-'}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.pickupAddress || '-'}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.dropoffAddress || '-'}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>${parseFloat(c.fareAmount || 0).toFixed(2)}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>${parseFloat(c.tipAmount || 0).toFixed(2)}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right', color: 'green', fontWeight: 'bold' }}>${parseFloat(c.totalAmount || 0).toFixed(2)}</td>
                    </tr>)}</tbody>
                  </table>
                );
              })()}

              {/* Other Revenue */}
              {Array.isArray(reportData?.otherRevenue) && reportData.otherRevenue.length > 0 && (
                <>
                  <h3 style={{ color: 'green' }}>Other Revenue (${reportData.otherRevenue.reduce((sum, r) => sum + parseFloat(r?.amount || 0), 0).toFixed(2)})</h3>
                  <table style={{ width: '100%', marginBottom: '16px', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ backgroundColor: '#f5f5f5' }}><th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Date</th><th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Category</th><th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Type</th><th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>Amount</th></tr></thead>
                    <tbody>{reportData.otherRevenue.map((r, i) => <tr key={i}><td style={{ padding: '8px', border: '1px solid #ddd' }}>{r?.revenueDate || '-'}</td><td style={{ padding: '8px', border: '1px solid #ddd' }}>{r?.categoryName || '-'}</td><td style={{ padding: '8px', border: '1px solid #ddd' }}>{r?.revenueType || '-'}</td><td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right', color: 'green' }}>${parseFloat(r?.amount || 0).toFixed(2)}</td></tr>)}</tbody>
                  </table>
                </>
              )}

              {/* EXPENSE DETAILS */}
              <h2 style={{ marginTop: '24px', marginBottom: '16px', borderBottom: '2px solid red', color: 'red' }}>Expense Details</h2>
              
              {/* Fixed Expenses */}
              <h3 style={{ color: 'red' }}>Fixed Expenses (${parseFloat(reportData?.fixedExpenses?.totalAmount || reportData?.fixedExpenses?.totalExpenses || 0).toFixed(2)})</h3>
              {(() => {
                const items = reportData?.fixedExpenses?.expenseItems || [];
                if (items.length === 0) return <p style={{ fontStyle: 'italic', color: '#666' }}>No fixed expenses</p>;
                return (
                  <table style={{ width: '100%', marginBottom: '16px', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ backgroundColor: '#f5f5f5' }}><th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Date</th><th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Category</th><th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Description</th><th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>Amount</th></tr></thead>
                    <tbody>{items.map((e, i) => <tr key={i}><td style={{ padding: '8px', border: '1px solid #ddd' }}>{e.expenseDate || e.date || '-'}</td><td style={{ padding: '8px', border: '1px solid #ddd' }}>{e.categoryName || '-'}</td><td style={{ padding: '8px', border: '1px solid #ddd' }}>{e.description || '-'}</td><td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right', color: 'red' }}>${parseFloat(e.amount || e.chargedAmount || 0).toFixed(2)}</td></tr>)}</tbody>
                  </table>
                );
              })()}

              {/* Lease Expenses */}
              <h3 style={{ color: 'red' }}>Lease Expenses (${parseFloat(reportData?.leaseExpense?.grandTotalLease || reportData?.leaseExpense?.totalLeaseExpense || 0).toFixed(2)})</h3>
              {(() => {
                const items = reportData?.leaseExpense?.leaseExpenseItems || [];
                if (items.length === 0) return <p style={{ fontStyle: 'italic', color: '#666' }}>No lease expenses</p>;
                return (
                  <table style={{ width: '100%', marginBottom: '16px', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ backgroundColor: '#f5f5f5' }}>
                      <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Date</th>
                      <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Cab</th>
                      <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Shift</th>
                      <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>Base Rate</th>
                      <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>Mileage Rate</th>
                      <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>Mileage</th>
                      <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>Mileage Lease</th>
                      <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>Total Lease</th>
                    </tr></thead>
                    <tbody>{items.map((e, i) => <tr key={i}>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{e.shiftDate || '-'}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{e.cabNumber || '-'}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{e.shiftType || '-'}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>${parseFloat(e.baseRate || 0).toFixed(2)}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>${parseFloat(e.mileageRate || 0).toFixed(2)}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>{parseFloat(e.miles || 0).toFixed(0)}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>${parseFloat(e.mileageLease || 0).toFixed(2)}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right', color: 'red', fontWeight: 'bold' }}>${parseFloat(e.totalLease || 0).toFixed(2)}</td>
                    </tr>)}</tbody>
                  </table>
                );
              })()}

              {/* One-Time Expenses */}
              {Array.isArray(reportData?.oneTimeExpenses) && reportData.oneTimeExpenses.length > 0 && (
                <>
                  <h3 style={{ color: 'red' }}>One-Time Expenses (${reportData.oneTimeExpenses.reduce((sum, e) => sum + parseFloat(e?.amount ?? e?.chargedAmount ?? 0), 0).toFixed(2)})</h3>
                  <table style={{ width: '100%', marginBottom: '16px', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ backgroundColor: '#f5f5f5' }}><th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Date</th><th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Category</th><th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Description</th><th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>Amount</th></tr></thead>
                    <tbody>{reportData.oneTimeExpenses.map((e, i) => <tr key={i}><td style={{ padding: '8px', border: '1px solid #ddd' }}>{e?.expenseDate || e?.date || '-'}</td><td style={{ padding: '8px', border: '1px solid #ddd' }}>{e?.categoryName || '-'}</td><td style={{ padding: '8px', border: '1px solid #ddd' }}>{e?.description || '-'}</td><td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right', color: 'red' }}>${parseFloat(e?.amount ?? e?.chargedAmount ?? 0).toFixed(2)}</td></tr>)}</tbody>
                  </table>
                </>
              )}
            </div>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button startIcon={<Email />} variant="outlined" onClick={handleEmail}>
            Email
          </Button>
          <Button startIcon={<Print />} variant="outlined" onClick={handlePrint}>
            Print
          </Button>
          <Button
            variant="contained"
            onClick={handleCloseDetails}
            sx={{ backgroundColor: "#3e5244", "&:hover": { backgroundColor: "#2d3d32" } }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}