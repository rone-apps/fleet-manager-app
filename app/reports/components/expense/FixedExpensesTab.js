"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableFooter,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  TableSortLabel,
  Chip,
} from "@mui/material";
import {
  Download,
  Autorenew,
  CalendarMonth,
  Search,
  Clear,
  AttachMoney,
} from "@mui/icons-material";
import { format } from "date-fns";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export default function FixedExpensesTab({ driverNumber, startDate, endDate }) {
  const [reportData, setReportData] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Search filters
  const [searchCategory, setSearchCategory] = useState("");
  const [searchDescription, setSearchDescription] = useState("");

  // Sorting
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("asc");

  useEffect(() => {
    if (driverNumber && startDate && endDate) {
      fetchFixedExpenseReport();
    }
  }, [driverNumber, startDate, endDate]);

  useEffect(() => {
    if (reportData && reportData.expenseItems) {
      applyFiltersAndSort();
    }
  }, [reportData, searchCategory, searchDescription, sortBy, sortOrder]);

  const fetchFixedExpenseReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const formattedStartDate = format(startDate, "yyyy-MM-dd");
      const formattedEndDate = format(endDate, "yyyy-MM-dd");

      const response = await axios.get(`${API_BASE_URL}/reports/fixed-expenses`, {
        params: {
          driverNumber: driverNumber,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      setReportData(response.data);
    } catch (err) {
      console.error("Error fetching fixed expense report:", err);
      setError(err.response?.data?.message || "Failed to fetch fixed expense report");
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...reportData.expenseItems].filter((item) => item.expenseType === "RECURRING");

    // Apply search filters
    if (searchCategory) {
      filtered = filtered.filter(item =>
        item.category?.toLowerCase().includes(searchCategory.toLowerCase())
      );
    }

    if (searchDescription) {
      filtered = filtered.filter(item =>
        item.description?.toLowerCase().includes(searchDescription.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let compareValue = 0;

      if (sortBy === "date") {
        const dateA = a.startDate ? new Date(a.startDate) : new Date(0);
        const dateB = b.startDate ? new Date(b.startDate) : new Date(0);
        compareValue = dateA - dateB;
      } else if (sortBy === "category") {
        compareValue = (a.category || "").localeCompare(b.category || "");
      } else if (sortBy === "amount") {
        compareValue = (a.chargedAmount || 0) - (b.chargedAmount || 0);
      }

      return sortOrder === "asc" ? compareValue : -compareValue;
    });

    setFilteredData(filtered);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const clearFilters = () => {
    setSearchCategory("");
    setSearchDescription("");
  };

  const handleDownloadCSV = () => {
    if (!filteredData || filteredData.length === 0) return;

    const headers = [
      "Date",
      "Description",
      "Category",
      "Type",
      "Assigned To",
      "Original Amount",
      "Charged Amount",
      "Split Note",
    ];

    const rows = filteredData.map((item) => [
      item.startDate || "",
      item.description || "",
      item.category || "",
      item.expenseType || "",
      item.assignedTo || "",
      item.originalAmount?.toFixed(2) || "0.00",
      item.chargedAmount?.toFixed(2) || "0.00",
      item.splitNote || "",
    ]);

    rows.push([]);
    rows.push(["GRAND TOTAL", "", "", "", "", "",
      filteredData.reduce((sum, item) => sum + (item.chargedAmount || 0), 0).toFixed(2), ""]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fixed-expenses-${driverNumber}-${format(startDate, "yyyy-MM-dd")}-to-${format(endDate, "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading fixed expense report...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!reportData || !reportData.expenseItems || reportData.expenseItems.length === 0) {
    return (
      <Paper sx={{ p: 6, textAlign: "center" }}>
        <Autorenew sx={{ fontSize: 80, color: "success.main", mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Fixed Expenses Found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No recurring or one-time expenses for this period.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Total Expenses
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                ${(reportData.totalAmount ?? reportData.totalExpenses ?? 0).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: "primary.light", color: "primary.dark" }}>
            <CardContent>
              <Typography sx={{ opacity: 0.9 }} variant="body2" gutterBottom>
                Recurring
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {reportData.recurringExpenses || 0}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                ${reportData.recurringAmount?.toFixed(2) || "0.00"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: "warning.light", color: "warning.dark" }}>
            <CardContent>
              <Typography sx={{ opacity: 0.9 }} variant="body2" gutterBottom>
                One-Time
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {reportData.oneTimeExpenses || 0}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                ${reportData.oneTimeAmount?.toFixed(2) || "0.00"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: "error.light", color: "error.dark" }}>
            <CardContent>
              <Typography sx={{ opacity: 0.9 }} variant="body2" gutterBottom>
                Total Amount
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                ${reportData.totalAmount?.toFixed(2) || "0.00"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Search Category"
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Search Description"
              value={searchDescription}
              onChange={(e) => setSearchDescription(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Clear />}
              onClick={clearFilters}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          Showing {filteredData.length} recurring expenses
        </Typography>
      </Paper>

      {/* Table */}
      <Paper>
        <Box
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Fixed Expense Details
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleDownloadCSV}
          >
            Export CSV
          </Button>
        </Box>

        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === "date"}
                    direction={sortBy === "date" ? sortOrder : "asc"}
                    onClick={() => handleSort("date")}
                  >
                    Date
                  </TableSortLabel>
                </TableCell>
                <TableCell>Description</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === "category"}
                    direction={sortBy === "category" ? sortOrder : "asc"}
                    onClick={() => handleSort("category")}
                  >
                    Category
                  </TableSortLabel>
                </TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Assigned To</TableCell>
                <TableCell align="right">Original</TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={sortBy === "amount"}
                    direction={sortBy === "amount" ? sortOrder : "asc"}
                    onClick={() => handleSort("amount")}
                  >
                    Charged
                  </TableSortLabel>
                </TableCell>
                <TableCell>Split</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map((item, index) => (
                <TableRow key={index} hover>
                  <TableCell>
                    {item.startDate ? format(new Date(item.startDate), 'yyyy-MM-dd') : 'N/A'}
                  </TableCell>
                  <TableCell>{item.description || "N/A"}</TableCell>
                  <TableCell>
                    <Chip 
                      label={item.category || "N/A"} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={item.expenseType}
                      size="small"
                      color={item.expenseType === "RECURRING" ? "primary" : "warning"}
                      icon={item.expenseType === "RECURRING" ? <Autorenew /> : <CalendarMonth />}
                    />
                  </TableCell>
                  <TableCell>{item.assignedTo || "N/A"}</TableCell>
                  <TableCell align="right">
                    ${item.originalAmount?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: "error.main" }}>
                    ${item.chargedAmount?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {item.splitNote || "N/A"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={6} align="right" sx={{ fontWeight: 600 }}>
                  TOTAL
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 700, color: "error.main", fontSize: 18 }}
                >
                  ${filteredData.reduce((sum, item) => sum + (item.chargedAmount || 0), 0).toFixed(2)}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}