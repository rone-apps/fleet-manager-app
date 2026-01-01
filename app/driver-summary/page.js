"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import GlobalNav from "../components/GlobalNav";
import {
  Box, Container, Typography, Paper, TextField, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TableSortLabel, CircularProgress, Alert, Grid, Pagination,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { Assessment, Download } from "@mui/icons-material";
import axios from "axios";
import { API_BASE_URL } from "../lib/api";

// ✅ FIXED: Proper date formatting function that handles timezones correctly
const formatDateForAPI = (date) => {
  if (!date || !(date instanceof Date)) return null;
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

export default function DriverSummaryPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState("");
  
  // Date filters
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1); // First day of current month
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  // Search/filter state
  const [searchDriverNumber, setSearchDriverNumber] = useState("");
  const [searchDriverName, setSearchDriverName] = useState("");
  
  // Sort state
  const [orderBy, setOrderBy] = useState("driverName");
  const [order, setOrder] = useState("asc");
  
  // Report data
  const [reportData, setReportData] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  
  // ✅ NEW: Track which pages we've loaded to calculate cumulative correctly
  const [loadedPages, setLoadedPages] = useState(new Map());
  
  // ✅ NEW: Store grand totals from backend (available on last page)
  const [grandTotals, setGrandTotals] = useState(null);

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
    };
    checkAuth();
  }, [router]);

  // Fetch report data with pagination (uses current orderBy and order from state)
  const fetchReport = async (pageNum = 0) => {
    await fetchReportWithSort(pageNum, orderBy, order);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchReport(newPage);
  };

  // Handle sort change - refetch with new sort
  const handleSortChange = (property) => {
    const isAsc = orderBy === property && order === "asc";
    const newOrder = isAsc ? "desc" : "asc";
    setOrder(newOrder);
    setOrderBy(property);
    
    // Reset loaded pages when sorting changes
    setLoadedPages(new Map());
    setGrandTotals(null);
    
    // Fetch from page 0 with new sort
    fetchReportWithSort(0, property, newOrder);
  };

  // ✅ NEW: Calculate cumulative totals from all loaded pages
  const calculateCumulativeTotals = (currentPageData, pageNumber) => {
    // Update loaded pages map with current page data
    const newLoadedPages = new Map(loadedPages);
    newLoadedPages.set(pageNumber, {
      revenue: currentPageData.pageTotalRevenue || 0,
      expense: currentPageData.pageTotalExpense || 0,
      netOwed: currentPageData.pageNetOwed || 0,
      driverCount: currentPageData.driverSummaries.length,
      leaseRevenue: currentPageData.pageLeaseRevenue || 0,
      creditCardRevenue: currentPageData.pageCreditCardRevenue || 0,
      chargesRevenue: currentPageData.pageChargesRevenue || 0,
      otherRevenue: currentPageData.pageOtherRevenue || 0,
      fixedExpense: currentPageData.pageFixedExpense || 0,
      leaseExpense: currentPageData.pageLeaseExpense || 0,
      variableExpense: currentPageData.pageVariableExpense || 0,
      otherExpense: currentPageData.pageOtherExpense || 0
    });
    
    setLoadedPages(newLoadedPages);
    
    // Sum up all loaded pages (no duplicates because Map keys are unique)
    let cumulative = {
      revenue: 0,
      expense: 0,
      netOwed: 0,
      driverCount: 0,
      leaseRevenue: 0,
      creditCardRevenue: 0,
      chargesRevenue: 0,
      otherRevenue: 0,
      fixedExpense: 0,
      leaseExpense: 0,
      variableExpense: 0,
      otherExpense: 0
    };
    
    // Get array of page numbers and sort them
    const pageNumbers = Array.from(newLoadedPages.keys()).sort((a, b) => a - b);
    
    // Sum only consecutive pages from 0 to current
    for (let i = 0; i <= pageNumber; i++) {
      if (newLoadedPages.has(i)) {
        const pageData = newLoadedPages.get(i);
        cumulative.revenue += pageData.revenue;
        cumulative.expense += pageData.expense;
        cumulative.netOwed += pageData.netOwed;
        cumulative.driverCount += pageData.driverCount;
        cumulative.leaseRevenue += pageData.leaseRevenue;
        cumulative.creditCardRevenue += pageData.creditCardRevenue;
        cumulative.chargesRevenue += pageData.chargesRevenue;
        cumulative.otherRevenue += pageData.otherRevenue;
        cumulative.fixedExpense += pageData.fixedExpense;
        cumulative.leaseExpense += pageData.leaseExpense;
        cumulative.variableExpense += pageData.variableExpense;
        cumulative.otherExpense += pageData.otherExpense;
      }
    }
    
    return cumulative;
  };

  // Modified fetch that accepts sort parameters directly
  const fetchReportWithSort = async (pageNum, sortField, sortDirection) => {
    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
      return;
    }

    // Validate dates are valid Date objects
    if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
      setError("Invalid start date");
      return;
    }
    
    if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
      setError("Invalid end date");
      return;
    }

    setLoading(true);
    setLoadingMessage("Generating driver summary report...");
    setError("");

    try {
      const token = localStorage.getItem("token");
      
      // ✅ FIXED: Use proper date formatting
      const formattedStart = formatDateForAPI(startDate);
      const formattedEnd = formatDateForAPI(endDate);
      
      console.log('📅 Fetching driver summary report');
      console.log('   Start Date (selected):', startDate);
      console.log('   End Date (selected):', endDate);
      console.log('   Start Date (formatted):', formattedStart);
      console.log('   End Date (formatted):', formattedEnd);
      console.log('   Page:', pageNum, 'Size:', pageSize);
      console.log('   Sort:', sortField, 'Direction:', sortDirection);

      // Update loading message after 5 seconds
      const messageTimer1 = setTimeout(() => {
        setLoadingMessage("Calculating financial metrics for active drivers...");
      }, 5000);

      // Update loading message after 15 seconds
      const messageTimer2 = setTimeout(() => {
        setLoadingMessage("Processing lease revenue and expenses...");
      }, 15000);

      // Update loading message after 30 seconds
      const messageTimer3 = setTimeout(() => {
        setLoadingMessage("Almost done, finalizing calculations...");
      }, 30000);

      const response = await axios.get(
        `${API_BASE_URL}/reports/driver-summary`,
        {
          params: {
            startDate: formattedStart,
            endDate: formattedEnd,
            page: pageNum,
            size: pageSize,
            sort: sortField,
            direction: sortDirection,
          },
          headers: { Authorization: `Bearer ${token}` },
          timeout: 120000, // 120 seconds timeout (2 minutes)
        }
      );

      // Clear all timers
      clearTimeout(messageTimer1);
      clearTimeout(messageTimer2);
      clearTimeout(messageTimer3);

      console.log('✅ Driver summary report received');
      console.log('   Start Date from backend:', response.data.startDate);
      console.log('   End Date from backend:', response.data.endDate);
      console.log('   Drivers on this page:', response.data.driverSummaries.length);
      console.log('   Page:', response.data.currentPage, 'of', response.data.totalPages);

      setReportData(response.data);
      setFilteredData(response.data.driverSummaries);
      setPage(response.data.currentPage);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
      
      // ✅ Store grand totals if on last page
      if (response.data.currentPage + 1 === response.data.totalPages && response.data.grandTotalRevenue !== undefined) {
        setGrandTotals({
          revenue: response.data.grandTotalRevenue || 0,
          expense: response.data.grandTotalExpense || 0,
          netOwed: response.data.grandNetOwed || 0,
          driverCount: response.data.totalElements,
          leaseRevenue: response.data.grandTotalLeaseRevenue || 0,
          creditCardRevenue: response.data.grandTotalCreditCardRevenue || 0,
          chargesRevenue: response.data.grandTotalChargesRevenue || 0,
          otherRevenue: response.data.grandTotalOtherRevenue || 0,
          fixedExpense: response.data.grandTotalFixedExpense || 0,
          leaseExpense: response.data.grandTotalLeaseExpense || 0,
          variableExpense: response.data.grandTotalVariableExpense || 0,
          otherExpense: response.data.grandTotalOtherExpense || 0
        });
      }
      
      // ✅ Calculate cumulative totals from loaded pages (no double counting)
      calculateCumulativeTotals(response.data, pageNum);
      
      setLoadingMessage("");
    } catch (err) {
      console.error("Error fetching driver summary:", err);
      console.error("Error details:", {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        headers: err.response?.headers
      });
      
      if (err.code === 'ECONNABORTED') {
        setError("Request timed out. The report is taking longer than expected. Please try a shorter date range or contact support.");
      } else if (err.response?.status === 403) {
        setError("Access denied. You don't have permission to view this report. Please check with your administrator or try signing in again.");
      } else if (err.response?.status === 401) {
        setError("Session expired. Please sign in again.");
        setTimeout(() => {
          router.push("/signin");
        }, 2000);
      } else {
        setError(err.response?.data?.message || `Failed to fetch driver summary report (Error ${err.response?.status || 'Unknown'})`);
      }
      setLoadingMessage("");
    } finally {
      setLoading(false);
    }
  };

  // Filter data based on search terms (client-side filtering on current page)
  useEffect(() => {
    if (!reportData) return;

    let filtered = [...reportData.driverSummaries];

    if (searchDriverNumber) {
      filtered = filtered.filter((driver) =>
        driver.driverNumber.toLowerCase().includes(searchDriverNumber.toLowerCase())
      );
    }

    if (searchDriverName) {
      filtered = filtered.filter((driver) =>
        driver.driverName.toLowerCase().includes(searchDriverName.toLowerCase())
      );
    }

    setFilteredData(filtered);
  }, [searchDriverNumber, searchDriverName, reportData]);

  // ✅ Get display totals (use grand totals if available, otherwise cumulative)
  const getDisplayTotals = () => {
    if (grandTotals) {
      return grandTotals;
    }
    
    // Calculate from loaded pages
    let totals = {
      revenue: 0,
      expense: 0,
      netOwed: 0,
      driverCount: 0,
      leaseRevenue: 0,
      creditCardRevenue: 0,
      chargesRevenue: 0,
      otherRevenue: 0,
      fixedExpense: 0,
      leaseExpense: 0,
      variableExpense: 0,
      otherExpense: 0
    };
    
    // Sum only consecutive pages from 0 to current page
    for (let i = 0; i <= page; i++) {
      if (loadedPages.has(i)) {
        const pageData = loadedPages.get(i);
        totals.revenue += pageData.revenue;
        totals.expense += pageData.expense;
        totals.netOwed += pageData.netOwed;
        totals.driverCount += pageData.driverCount;
        totals.leaseRevenue += pageData.leaseRevenue;
        totals.creditCardRevenue += pageData.creditCardRevenue;
        totals.chargesRevenue += pageData.chargesRevenue;
        totals.otherRevenue += pageData.otherRevenue;
        totals.fixedExpense += pageData.fixedExpense;
        totals.leaseExpense += pageData.leaseExpense;
        totals.variableExpense += pageData.variableExpense;
        totals.otherExpense += pageData.otherExpense;
      }
    }
    
    return totals;
  };
  
  const displayTotals = getDisplayTotals();

  // Format currency
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!filteredData || filteredData.length === 0) return;

    const headers = [
      "Driver Number",
      "Driver Name",
      "Is Owner",
      "Lease Revenue",
      "Credit Card Revenue",
      "Charges Revenue",
      "Total Revenue",
      "Fixed Expense",
      "Lease Expense",
      "Variable Expense",
      "Total Expense",
      "Net Owed",
      "Paid",
      "Outstanding",
    ];

    const rows = filteredData.map((driver) => [
      driver.driverNumber,
      driver.driverName,
      driver.isOwner ? "Yes" : "No",
      driver.leaseRevenue || 0,
      driver.creditCardRevenue || 0,
      driver.chargesRevenue || 0,
      driver.totalRevenue || 0,
      driver.fixedExpense || 0,
      driver.leaseExpense || 0,
      driver.variableExpense || 0,
      driver.totalExpense || 0,
      driver.netOwed || 0,
      driver.paid || 0,
      driver.outstanding || 0,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `driver-summary-${formatDateForAPI(startDate)}-to-${formatDateForAPI(endDate)}.csv`;
    a.click();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5" }}>
        <GlobalNav currentUser={currentUser} />
        
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Assessment sx={{ fontSize: 40, mr: 2, color: "primary.main" }} />
              <Typography variant="h4" component="h1" fontWeight="bold">
                Driver Financial Summary
              </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary">
              Comprehensive financial summary for all active drivers including revenue and expenses
            </Typography>
          </Box>

            {/* Date Range Selection */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Report Period
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={setStartDate}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={setEndDate}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="contained"
                    onClick={() => {
                      // Reset tracking when generating new report
                      setLoadedPages(new Map());
                      setGrandTotals(null);
                      fetchReport(0);
                    }}
                    disabled={loading}
                    fullWidth
                    size="large"
                  >
                    {loading ? <CircularProgress size={24} /> : "Generate Report"}
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {/* Filters */}
            {reportData && (
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Filters
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Search Driver Number"
                      value={searchDriverNumber}
                      onChange={(e) => setSearchDriverNumber(e.target.value)}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Search Driver Name"
                      value={searchDriverName}
                      onChange={(e) => setSearchDriverName(e.target.value)}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Button
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={exportToCSV}
                      fullWidth
                      disabled={!filteredData || filteredData.length === 0}
                    >
                      Export to CSV
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            )}

            {/* Error Display */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Report Table */}
            {reportData && (
              <>
                {/* Summary Cards - Overview */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: "center" }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {grandTotals 
                          ? "Total Drivers with Activity"
                          : "Drivers Loaded So Far"}
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {displayTotals.driverCount} {totalElements > 0 ? `/ ${totalElements}` : ''}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Page {page + 1} of {totalPages} ({reportData.driverSummaries.length} on this page)
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: "center" }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {grandTotals 
                          ? "Grand Total Revenue"
                          : "Revenue (Pages 1-" + (page + 1) + ")"}
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" color="success.main">
                        {formatCurrency(displayTotals.revenue)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {grandTotals 
                          ? "✓ All drivers"
                          : `Loaded ${loadedPages.size} page(s)`}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: "center" }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {grandTotals 
                          ? "Grand Total Expense"
                          : "Expense (Pages 1-" + (page + 1) + ")"}
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" color="error.main">
                        {formatCurrency(displayTotals.expense)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {grandTotals 
                          ? "✓ All drivers"
                          : `Loaded ${loadedPages.size} page(s)`}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: "center" }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {grandTotals 
                          ? "Grand Net Owed"
                          : "Net Owed (Pages 1-" + (page + 1) + ")"}
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" color="primary.main">
                        {formatCurrency(displayTotals.netOwed)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {grandTotals 
                          ? "✓ Final totals"
                          : `Running total`}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Detailed Revenue Breakdown */}
                <Paper sx={{ p: 2, mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                    Revenue Breakdown {grandTotals ? "(Grand Total)" : "(Loaded Pages)"}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: "center", p: 1, bgcolor: "success.lighter", borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Lease Revenue
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="success.main">
                          {formatCurrency(displayTotals.leaseRevenue)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: "center", p: 1, bgcolor: "success.lighter", borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Credit Card
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="success.main">
                          {formatCurrency(displayTotals.creditCardRevenue)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: "center", p: 1, bgcolor: "success.lighter", borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Charges
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="success.main">
                          {formatCurrency(displayTotals.chargesRevenue)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: "center", p: 1, bgcolor: "success.lighter", borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Other Revenue
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="success.main">
                          {formatCurrency(displayTotals.otherRevenue)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Detailed Expense Breakdown */}
                <Paper sx={{ p: 2, mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                    Expense Breakdown {grandTotals ? "(Grand Total)" : "(Loaded Pages)"}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: "center", p: 1, bgcolor: "error.lighter", borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Fixed Expense
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="error.main">
                          {formatCurrency(displayTotals.fixedExpense)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: "center", p: 1, bgcolor: "error.lighter", borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Lease Expense
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="error.main">
                          {formatCurrency(displayTotals.leaseExpense)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: "center", p: 1, bgcolor: "error.lighter", borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Variable Expense
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="error.main">
                          {formatCurrency(displayTotals.variableExpense)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: "center", p: 1, bgcolor: "error.lighter", borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Other Expense
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" color="error.main">
                          {formatCurrency(displayTotals.otherExpense)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Driver Summary Table - same as before, keeping existing table implementation */}
                <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                  <Table size="small" sx={{ minWidth: 1400 }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "grey.100" }}>
                        <TableCell sx={{ minWidth: 70 }}>
                          <TableSortLabel
                            active={orderBy === "driverNumber"}
                            direction={orderBy === "driverNumber" ? order : "asc"}
                            onClick={() => handleSortChange("driverNumber")}
                          >
                            <Typography variant="caption">Driver #</Typography>
                          </TableSortLabel>
                        </TableCell>
                        <TableCell sx={{ minWidth: 120 }}>
                          <TableSortLabel
                            active={orderBy === "driverName"}
                            direction={orderBy === "driverName" ? order : "asc"}
                            onClick={() => handleSortChange("driverName")}
                          >
                            <Typography variant="caption">Name</Typography>
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="right" sx={{ minWidth: 70 }}>
                          <Typography variant="caption" display="block">Lease</Typography>
                          <Typography variant="caption" display="block">Rev</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ minWidth: 70 }}>
                          <Typography variant="caption" display="block">CC</Typography>
                          <Typography variant="caption" display="block">Rev</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ minWidth: 70 }}>
                          <Typography variant="caption" display="block">Chrg</Typography>
                          <Typography variant="caption" display="block">Rev</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ minWidth: 70 }}>
                          <Typography variant="caption" display="block">Other</Typography>
                          <Typography variant="caption" display="block">Rev</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ minWidth: 70 }}>
                          <Typography variant="caption" display="block">Fixed</Typography>
                          <Typography variant="caption" display="block">Exp</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ minWidth: 70 }}>
                          <Typography variant="caption" display="block">Lease</Typography>
                          <Typography variant="caption" display="block">Exp</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ minWidth: 70 }}>
                          <Typography variant="caption" display="block">Var</Typography>
                          <Typography variant="caption" display="block">Exp</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ minWidth: 70 }}>
                          <Typography variant="caption" display="block">Other</Typography>
                          <Typography variant="caption" display="block">Exp</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ minWidth: 80 }}>
                          <TableSortLabel
                            active={orderBy === "netOwed"}
                            direction={orderBy === "netOwed" ? order : "asc"}
                            onClick={() => handleSortChange("netOwed")}
                          >
                            <Typography variant="caption">Net Owed</Typography>
                          </TableSortLabel>
                        </TableCell>
                        <TableCell align="right" sx={{ minWidth: 70 }}>
                          <Typography variant="caption">Paid</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ minWidth: 80 }}>
                          <TableSortLabel
                            active={orderBy === "outstanding"}
                            direction={orderBy === "outstanding" ? order : "asc"}
                            onClick={() => handleSortChange("outstanding")}
                          >
                            <Typography variant="caption">Outstanding</Typography>
                          </TableSortLabel>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredData.map((driver) => (
                        <TableRow
                          key={driver.driverNumber}
                          hover
                          sx={{
                            "&:hover": { bgcolor: "action.hover" },
                            bgcolor: driver.isOwner ? "info.light" : "inherit",
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {driver.driverNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {driver.driverName}
                              {driver.isOwner && (
                                <Typography
                                  component="span"
                                  variant="caption"
                                  sx={{ ml: 1, color: "primary.main" }}
                                >
                                  (Owner)
                                </Typography>
                              )}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(driver.leaseRevenue)}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(driver.creditCardRevenue)}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(driver.chargesRevenue)}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(driver.otherRevenue || 0)}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(driver.fixedExpense)}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(driver.leaseExpense)}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(driver.variableExpense)}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(driver.otherExpense || 0)}
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              fontWeight="bold"
                              color={
                                driver.netOwed > 0
                                  ? "success.main"
                                  : driver.netOwed < 0
                                  ? "error.main"
                                  : "text.primary"
                              }
                            >
                              {formatCurrency(driver.netOwed)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(driver.paid)}
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              fontWeight="bold"
                              color={
                                driver.outstanding > 0
                                  ? "warning.main"
                                  : "text.primary"
                              }
                            >
                              {formatCurrency(driver.outstanding)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Totals Row */}
                      <TableRow sx={{ bgcolor: grandTotals ? "success.light" : "info.light" }}>
                        <TableCell colSpan={2}>
                          <Typography variant="body2" fontWeight="bold">
                            {grandTotals 
                              ? "GRAND TOTALS (ALL DRIVERS)" 
                              : `TOTALS (${displayTotals.driverCount} drivers loaded)`}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" colSpan={8}>
                          <Typography variant="body2" color="text.secondary">
                            Detailed breakdown shown in cards above
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold" color="primary.main">
                            {formatCurrency(displayTotals.netOwed)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" colSpan={2}>
                          <Typography variant="caption" color="text.secondary">
                            {grandTotals ? "✓ Final" : `Pages 1-${page + 1}`}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                    <Pagination
                      count={totalPages}
                      page={page + 1}
                      onChange={(e, value) => handlePageChange(value - 1)}
                      color="primary"
                      size="large"
                      showFirstButton
                      showLastButton
                    />
                  </Box>
                )}
              </>
            )}

            {/* No Data Message */}
            {!loading && !reportData && (
              <Paper sx={{ p: 4, textAlign: "center" }}>
                <Assessment sx={{ fontSize: 80, color: "grey.400", mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Select a date range and click "Generate Report" to view driver summaries
                </Typography>
              </Paper>
            )}

            {/* Loading Indicator */}
            {loading && (
              <Paper sx={{ p: 4, textAlign: "center" }}>
                <CircularProgress size={60} sx={{ mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {loadingMessage || "Generating report..."}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This may take up to 2 minutes for large date ranges
                </Typography>
              </Paper>
            )}
        </Container>
      </Box>
    </LocalizationProvider>
  );
}