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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

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
  
  // ✅ ALL report data cached here - fetched ONCE
  const [reportData, setReportData] = useState(null);

  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const getCurrentUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;
      const response = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
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
      fetchDrivers();
    };
    checkAuth();
  }, [router]);

  const fetchDrivers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/drivers`, {
        headers: { Authorization: `Bearer ${token}` },
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
      
      const formatDate = (date) => {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      };
      
      const formattedStartDate = formatDate(startDate);
      const formattedEndDate = formatDate(endDate);

      console.log('🚀 Fetching ALL report data ONCE for driver:', selectedDriver.driverNumber);

      // ✅ Fetch ALL revenue and expense types in PARALLEL
      const [leaseRevenueRes, creditCardRes, chargesRes, fixedExpensesRes, leaseExpenseRes, oneTimeExpensesRes] = 
        await Promise.allSettled([
          axios.get(`${API_BASE_URL}/reports/lease-revenue`, {
            params: { 
              ownerDriverNumber: selectedDriver.driverNumber,
              startDate: formattedStartDate, 
              endDate: formattedEndDate 
            },
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE_URL}/reports/credit-card-revenue`, {
            params: { 
              driverNumber: selectedDriver.driverNumber,
              startDate: formattedStartDate, 
              endDate: formattedEndDate 
            },
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE_URL}/reports/charges-revenue`, {
            params: { 
              driverNumber: selectedDriver.driverNumber,
              startDate: formattedStartDate, 
              endDate: formattedEndDate 
            },
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE_URL}/reports/fixed-expenses`, {
            params: { 
              driverNumber: selectedDriver.driverNumber,
              startDate: formattedStartDate, 
              endDate: formattedEndDate 
            },
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE_URL}/reports/lease-expense`, {
            params: {
              driverNumber: selectedDriver.driverNumber,
              startDate: formattedStartDate,
              endDate: formattedEndDate,
            },
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE_URL}/one-time-expenses/between`, {
            params: {
              startDate: formattedStartDate,
              endDate: formattedEndDate,
            },
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

      // ✅ Extract data (handle failures gracefully)
      const leaseRevenue = leaseRevenueRes.status === 'fulfilled' ? leaseRevenueRes.value.data : null;
      const creditCardRevenue = creditCardRes.status === 'fulfilled' ? creditCardRes.value.data : null;
      const chargesRevenue = chargesRes.status === 'fulfilled' ? chargesRes.value.data : null;
      const fixedExpenses = fixedExpensesRes.status === 'fulfilled' ? fixedExpensesRes.value.data : null;
      const leaseExpense = leaseExpenseRes.status === 'fulfilled' ? leaseExpenseRes.value.data : null;
      const oneTimeExpensesAll = oneTimeExpensesRes.status === 'fulfilled' ? oneTimeExpensesRes.value.data : [];

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

      console.log('✅ Lease Revenue Total:', leaseRevenue?.totalRevenue || leaseRevenue?.grandTotalLease || 0);
      console.log('✅ Credit Card Total:', creditCardRevenue?.totalAmount || 0);
      console.log('✅ Charges Total:', chargesRevenue?.grandTotal || chargesRevenue?.totalAmount || 0);
      console.log('✅ Fixed Expenses Total:', fixedExpenses?.totalAmount || fixedExpenses?.totalExpenses || 0);
      console.log('✅ Lease Expense Total:', leaseExpense?.grandTotalLease || leaseExpense?.totalLeaseExpense || 0);
      console.log('✅ One-Time Expenses Total:', reportOneTimeExpenses.reduce((sum, exp) => sum + parseFloat(exp?.amount ?? exp?.chargedAmount ?? 0), 0));

      // ✅ Calculate totals
      const totalRevenue = 
        parseFloat(leaseRevenue?.totalRevenue || leaseRevenue?.grandTotalLease || 0) +
        parseFloat(creditCardRevenue?.totalAmount || 0) +
        parseFloat(chargesRevenue?.grandTotal || chargesRevenue?.totalAmount || 0);

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
    const creditCardTotal = parseFloat(reportData?.creditCardRevenue?.totalAmount || 0);
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
            Generate detailed revenue and expense reports for drivers
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
            <Grid item xs={12} md={3}>
              <Autocomplete
                options={drivers}
                getOptionLabel={(option) => 
                  `${option.firstName} ${option.lastName} (${option.driverNumber})`
                }
                value={selectedDriver}
                onChange={(event, newValue) => setSelectedDriver(newValue)}
                renderInput={(params) => (
                  <TextField {...params} label="Search Driver" placeholder="Type to search..." />
                )}
                isOptionEqualToValue={(option, value) => 
                  option.driverNumber === value.driverNumber
                }
                noOptionsText="No drivers found"
              />
            </Grid>

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
                    ${reportData.totalRevenue.toFixed(2)}
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
                    ${reportData.totalExpenses.toFixed(2)}
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
                    ${reportData.amountPaid.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2.4}>
              <Card sx={{ height: '100%', bgcolor: reportData.amountDue < 0 ? '#ffebee' : '#e8f5e9' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AccountBalance sx={{ color: reportData.amountDue < 0 ? '#c62828' : '#2e7d32', mr: 1 }} />
                    <Typography variant="caption" color="textSecondary">
                      Amount Due/Owing
                    </Typography>
                  </Box>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 700, color: reportData.amountDue < 0 ? '#c62828' : '#2e7d32' }}
                  >
                    {reportData.amountDue < 0
                      ? `($${Math.abs(reportData.amountDue).toFixed(2)})`
                      : `$${Math.abs(reportData.amountDue).toFixed(2)}`}
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
              Select Parameters to Generate Reports
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Choose a driver and date range to view financial reports
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
            (() => {
              const leaseRevenueTotal = parseFloat(
                reportData?.leaseRevenue?.totalRevenue || reportData?.leaseRevenue?.grandTotalLease || 0
              );
              const creditCardTotal = parseFloat(reportData?.creditCardRevenue?.totalAmount || 0);
              const chargesTotal = parseFloat(
                reportData?.chargesRevenue?.grandTotal || reportData?.chargesRevenue?.totalAmount || 0
              );
              const fixedExpensesTotal = parseFloat(
                reportData?.fixedExpenses?.totalAmount || reportData?.fixedExpenses?.totalExpenses || 0
              );
              const leaseExpenseTotal = parseFloat(
                reportData?.leaseExpense?.grandTotalLease || reportData?.leaseExpense?.totalLeaseExpense || 0
              );
              const oneTimeExpensesTotal = (reportData?.oneTimeExpenses || []).reduce(
                (sum, exp) => sum + parseFloat(exp?.amount || 0),
                0
              );

              const leaseRevenueShifts = reportData?.leaseRevenue?.leaseItems || reportData?.leaseRevenue?.shifts || reportData?.leaseRevenue?.shiftItems || [];
              const creditCardTransactions = reportData?.creditCardRevenue?.transactionItems || reportData?.creditCardRevenue?.transactions || reportData?.creditCardRevenue?.items || [];
              const chargeItems = reportData?.chargesRevenue?.chargeItems || reportData?.chargesRevenue?.charges || [];

              const fixedExpenseItems = reportData?.fixedExpenses?.expenseItems || reportData?.fixedExpenses?.expenses || [];
              const leaseExpenseItems = reportData?.leaseExpense?.leaseExpenseItems || [];
              const oneTimeExpenseItems = reportData?.oneTimeExpenses || [];

              return (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                    Summary
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell>Total Revenue</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>
                            ${(reportData.totalRevenue || 0).toFixed(2)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Total Expenses</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: 'error.main' }}>
                            ${(reportData.totalExpenses || 0).toFixed(2)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Amount Paid</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main' }}>
                            ${(reportData.amountPaid || 0).toFixed(2)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Amount Due/Owing</TableCell>
                          <TableCell
                            align="right"
                            sx={{ fontWeight: 700, color: (reportData.amountDue || 0) < 0 ? '#c62828' : '#2e7d32' }}
                          >
                            {(reportData.amountDue || 0) < 0
                              ? `($${Math.abs(reportData.amountDue || 0).toFixed(2)})`
                              : `$${Math.abs(reportData.amountDue || 0).toFixed(2)}`}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                    Revenue Breakdown
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Source</TableCell>
                          <TableCell align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>Lease Revenue</TableCell>
                          <TableCell align="right">${leaseRevenueTotal.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Credit Card Revenue</TableCell>
                          <TableCell align="right">${creditCardTotal.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Charges Revenue</TableCell>
                          <TableCell align="right">${chargesTotal.toFixed(2)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Lease Revenue Shifts
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 260 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Cab</TableCell>
                          <TableCell>Driver</TableCell>
                          <TableCell align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(Array.isArray(leaseRevenueShifts) && leaseRevenueShifts.length > 0) ? (
                          leaseRevenueShifts.map((s, idx) => (
                            <TableRow key={idx} hover>
                              <TableCell>{s?.shiftDate || s?.date || s?.tripDate || "-"}</TableCell>
                              <TableCell>{s?.cabNumber || s?.cab || "-"}</TableCell>
                              <TableCell>{s?.driverName || s?.workingDriverName || s?.driverNumber || "-"}</TableCell>
                              <TableCell align="right">
                                ${parseFloat(s?.totalLease || s?.totalRevenue || s?.total || s?.amount || s?.leaseAmount || 0).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} align="center">
                              <Typography variant="body2" color="text.secondary">
                                No lease revenue items found for this period.
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Credit Card Transactions
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 260 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(Array.isArray(creditCardTransactions) && creditCardTransactions.length > 0) ? (
                          creditCardTransactions.map((t, idx) => (
                            <TableRow key={idx} hover>
                              <TableCell>{t?.transactionDate || t?.date || t?.createdAt || "-"}</TableCell>
                              <TableCell>
                                {t?.description || t?.memo || t?.cardType || t?.authorizationCode || "-"}
                              </TableCell>
                              <TableCell align="right">
                                ${parseFloat(t?.totalAmount || t?.amount || 0).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} align="center">
                              <Typography variant="body2" color="text.secondary">
                                No credit card transactions found for this period.
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Charges
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 260 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Account</TableCell>
                          <TableCell>Customer</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(Array.isArray(chargeItems) ? chargeItems : []).map((c, idx) => (
                          <TableRow key={idx} hover>
                            <TableCell>{c?.tripDate || c?.date || "-"}</TableCell>
                            <TableCell>{c?.accountId || c?.subAccount || "-"}</TableCell>
                            <TableCell>{c?.customerName || "-"}</TableCell>
                            <TableCell align="right">
                              ${parseFloat(c?.totalAmount || c?.amount || 0).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                    Expense Breakdown
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Category</TableCell>
                          <TableCell align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>Fixed Expenses</TableCell>
                          <TableCell align="right">${fixedExpensesTotal.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Lease Expense</TableCell>
                          <TableCell align="right">${leaseExpenseTotal.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>One-Time Expenses</TableCell>
                          <TableCell align="right">${oneTimeExpensesTotal.toFixed(2)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Fixed Expense Items
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 260 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell align="right">Charged</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(Array.isArray(fixedExpenseItems) ? fixedExpenseItems : []).map((e, idx) => (
                          <TableRow key={idx} hover>
                            <TableCell>{e?.startDate || e?.expenseDate || "-"}</TableCell>
                            <TableCell>{e?.description || "-"}</TableCell>
                            <TableCell>{e?.category || e?.expenseCategory?.categoryName || "-"}</TableCell>
                            <TableCell>{e?.expenseType || "-"}</TableCell>
                            <TableCell align="right">
                              ${parseFloat(e?.chargedAmount || e?.amount || 0).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Lease Expense Items
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 260 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Cab</TableCell>
                          <TableCell>Shift Owner</TableCell>
                          <TableCell align="right">Total Lease</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(Array.isArray(leaseExpenseItems) ? leaseExpenseItems : []).map((e, idx) => (
                          <TableRow key={idx} hover>
                            <TableCell>{e?.shiftDate || "-"}</TableCell>
                            <TableCell>{e?.cabNumber || "-"}</TableCell>
                            <TableCell>{e?.ownerDriverName || e?.ownerDriverNumber || "-"}</TableCell>
                            <TableCell align="right">${parseFloat(e?.totalLease || 0).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    One-Time Expense Items
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 260 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell>Vendor</TableCell>
                          <TableCell>Paid By</TableCell>
                          <TableCell align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(Array.isArray(oneTimeExpenseItems) ? oneTimeExpenseItems : []).map((e, idx) => (
                          <TableRow key={idx} hover>
                            <TableCell>{e?.expenseDate || "-"}</TableCell>
                            <TableCell>{e?.description || "-"}</TableCell>
                            <TableCell>{e?.vendor || "-"}</TableCell>
                            <TableCell>{e?.paidBy || "-"}</TableCell>
                            <TableCell align="right">${parseFloat(e?.amount || 0).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              );
            })()
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