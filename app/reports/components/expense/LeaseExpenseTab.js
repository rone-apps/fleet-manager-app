// CORRECTED VERSION - 2024-12-12 - AXIOS SYNTAX FIXED
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
} from "@mui/material";
import {
  Download,
  AttachMoney,
  DirectionsCar,
  Search,
  Clear,
  Warning,
} from "@mui/icons-material";
import { format } from "date-fns";
import axios from "axios";
import { API_BASE_URL } from "../../../lib/api";

export default function LeaseExpenseTab({ driverNumber, startDate, endDate }) {
  const [reportData, setReportData] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Search filters
  const [searchOwner, setSearchOwner] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [searchCab, setSearchCab] = useState("");
  
  // Sorting
  const [sortBy, setSortBy] = useState("date"); // 'date' | 'cab' | 'owner'
  const [sortOrder, setSortOrder] = useState("asc");

  useEffect(() => {
    if (driverNumber && startDate && endDate) {
      fetchLeaseExpenseReport();
    }
  }, [driverNumber, startDate, endDate]);

  useEffect(() => {
    if (reportData && reportData.leaseExpenseItems) {
      applyFiltersAndSort();
    }
  }, [reportData, searchOwner, searchDate, searchCab, sortBy, sortOrder]);

  const fetchLeaseExpenseReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const formattedStartDate = format(startDate, "yyyy-MM-dd");
      const formattedEndDate = format(endDate, "yyyy-MM-dd");

      const response = await axios.get(`${API_BASE_URL}/reports/lease-expense`, {
        params: {
          driverNumber: driverNumber,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      setReportData(response.data);
    } catch (err) {
      console.error("Error fetching lease expense report:", err);
      setError(err.response?.data?.message || "Failed to fetch lease expense report");
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...reportData.leaseExpenseItems];

    // Apply search filters
    if (searchOwner) {
      filtered = filtered.filter(item =>
        item.ownerDriverNumber?.toLowerCase().includes(searchOwner.toLowerCase()) ||
        item.ownerDriverName?.toLowerCase().includes(searchOwner.toLowerCase())
      );
    }

    if (searchDate) {
      filtered = filtered.filter(item => {
        const shiftDateStr = item.shiftDate ? 
          (typeof item.shiftDate === 'string' ? item.shiftDate : item.shiftDate.toString()) : '';
        return shiftDateStr.includes(searchDate);
      });
    }

    if (searchCab) {
      filtered = filtered.filter(item =>
        item.cabNumber?.toLowerCase().includes(searchCab.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let compareValue = 0;

      if (sortBy === "date") {
        const dateA = a.shiftDate ? new Date(a.shiftDate) : new Date(0);
        const dateB = b.shiftDate ? new Date(b.shiftDate) : new Date(0);
        compareValue = dateA - dateB;
      } else if (sortBy === "cab") {
        compareValue = (a.cabNumber || "").localeCompare(b.cabNumber || "");
      } else if (sortBy === "owner") {
        compareValue = (a.ownerDriverName || "").localeCompare(b.ownerDriverName || "");
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
    setSearchOwner("");
    setSearchDate("");
    setSearchCab("");
  };

  const handleDownloadCSV = () => {
    if (!filteredData || filteredData.length === 0) return;

    const headers = [
      "Date",
      "Cab",
      "Shift Type",
      "Shift Owner",
      "Owner Number",
      "Miles",
      "Base Rate",
      "Mileage Rate",
      "Mileage Lease",
      "Total Lease",
    ];

    const rows = filteredData.map((item) => [
      item.shiftDate || "",
      item.cabNumber || "",
      item.shiftType || "",
      item.ownerDriverName || "",
      item.ownerDriverNumber || "",
      item.miles?.toFixed(2) || "0.00",
      item.baseRate?.toFixed(2) || "0.00",
      item.mileageRate?.toFixed(2) || "0.00",
      item.mileageLease?.toFixed(2) || "0.00",
      item.totalLease?.toFixed(2) || "0.00",
    ]);

    rows.push([]);
    rows.push(["GRAND TOTAL", "", "", "", "", "", "", "", "", 
      filteredData.reduce((sum, item) => sum + (item.totalLease || 0), 0).toFixed(2)]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lease-expense-${driverNumber}-${format(startDate, "yyyy-MM-dd")}-to-${format(endDate, "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading lease expense report...</Typography>
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

  if (!reportData || !reportData.leaseExpenseItems || reportData.leaseExpenseItems.length === 0) {
    return (
      <Paper sx={{ p: 6, textAlign: "center" }}>
        <DirectionsCar sx={{ fontSize: 80, color: "success.main", mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Lease Expenses Found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Great! You only drove your own shifts during this period.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Total Shifts (Other's)
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {reportData.totalShifts || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Total Miles
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600, color: "primary.main" }}>
                {reportData.totalMiles?.toFixed(0) || "0"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ bgcolor: "error.light", color: "error.dark" }}>
            <CardContent>
              <Typography sx={{ opacity: 0.9 }} variant="body2" gutterBottom>
                Total Lease Expense
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                ${reportData.grandTotalLease?.toFixed(2) || "0.00"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Info Alert */}
      <Alert severity="info" sx={{ mb: 3 }} icon={<Warning />}>
        <Typography variant="body2">
          <strong>Lease Expenses:</strong> These are shifts you drove that were owned by other drivers. 
          You owe these amounts to the shift owners.
        </Typography>
      </Alert>

      {/* Search Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Search Owner"
              value={searchOwner}
              onChange={(e) => setSearchOwner(e.target.value)}
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
              label="Search Date"
              placeholder="YYYY-MM-DD"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
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
              label="Search Cab"
              value={searchCab}
              onChange={(e) => setSearchCab(e.target.value)}
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
          Showing {filteredData.length} of {reportData.leaseExpenseItems.length} shifts
        </Typography>
      </Paper>

      {/* Detailed Table */}
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
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Lease Expense Details
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Shifts driven by {reportData.workingDriverName} ({reportData.workingDriverNumber})
            </Typography>
          </Box>
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
                <TableCell>
                  <TableSortLabel
                    active={sortBy === "cab"}
                    direction={sortBy === "cab" ? sortOrder : "asc"}
                    onClick={() => handleSort("cab")}
                  >
                    Cab
                  </TableSortLabel>
                </TableCell>
                <TableCell>Shift Type</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === "owner"}
                    direction={sortBy === "owner" ? sortOrder : "asc"}
                    onClick={() => handleSort("owner")}
                  >
                    Shift Owner
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">Miles</TableCell>
                <TableCell align="right">Base Rate</TableCell>
                <TableCell align="right">Mileage Rate</TableCell>
                <TableCell align="right">Mileage Lease</TableCell>
                <TableCell align="right">Total Lease</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map((item, index) => (
                <TableRow key={index} hover>
                  <TableCell>
                    {item.shiftDate ? 
                      (typeof item.shiftDate === 'string' ? item.shiftDate : format(new Date(item.shiftDate), 'yyyy-MM-dd'))
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <DirectionsCar sx={{ fontSize: 18, color: "text.secondary" }} />
                      {item.cabNumber || "N/A"}
                    </Box>
                  </TableCell>
                  <TableCell>{item.shiftType || "N/A"}</TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {item.ownerDriverName || "N/A"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.ownerDriverNumber || ""}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 500 }}>
                    {item.miles?.toFixed(0) || "0"}
                  </TableCell>
                  <TableCell align="right">
                    ${item.baseRate?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell align="right">
                    ${item.mileageRate?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell align="right">
                    ${item.mileageLease?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: "error.main" }}>
                    ${item.totalLease?.toFixed(2) || "0.00"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={8} align="right" sx={{ fontWeight: 600 }}>
                  GRAND TOTAL (OWED)
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 700, color: "error.main", fontSize: 18 }}
                >
                  ${filteredData.reduce((sum, item) => sum + (item.totalLease || 0), 0).toFixed(2)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}