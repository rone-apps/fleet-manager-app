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
  Chip,
  TextField,
  InputAdornment,
  TableSortLabel,
} from "@mui/material";
import {
  Download,
  Receipt,
  AttachMoney,
  CheckCircle,
  Cancel,
  Schedule,
  Search,
  Clear,
} from "@mui/icons-material";
import { format } from "date-fns";
import axios from "axios";
import { API_BASE_URL } from "../../../lib/api";

export default function ChargesTab({ driverNumber, startDate, endDate }) {
  const [reportData, setReportData] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Search filters
  const [searchCustomer, setSearchCustomer] = useState("");
  const [searchDate, setSearchDate] = useState("");
  
  // Sorting
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("asc");

  useEffect(() => {
    if (driverNumber && startDate && endDate) {
      fetchChargesRevenueReport();
    }
  }, [driverNumber, startDate, endDate]);

  useEffect(() => {
    if (reportData && reportData.chargeItems) {
      applyFiltersAndSort();
    }
  }, [reportData, searchCustomer, searchDate, sortBy, sortOrder]);

  const fetchChargesRevenueReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const formattedStartDate = format(startDate, "yyyy-MM-dd");
      const formattedEndDate = format(endDate, "yyyy-MM-dd");

      const response = await axios.get(`${API_BASE_URL}/reports/charges-revenue`, {
        params: {
          driverNumber: driverNumber,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      setReportData(response.data);
    } catch (err) {
      console.error("Error fetching charges revenue report:", err);
      setError(err.response?.data?.message || "Failed to fetch charges revenue report");
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...reportData.chargeItems];

    // Apply filters
    if (searchCustomer) {
      filtered = filtered.filter(item =>
        item.customerName?.toLowerCase().includes(searchCustomer.toLowerCase()) ||
        item.accountId?.toLowerCase().includes(searchCustomer.toLowerCase()) ||
        item.subAccount?.toLowerCase().includes(searchCustomer.toLowerCase())
      );
    }

    if (searchDate) {
      filtered = filtered.filter(item =>
        item.tripDate?.includes(searchDate)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let compareValue = 0;

      if (sortBy === "date") {
        compareValue = new Date(a.tripDate) - new Date(b.tripDate);
      } else if (sortBy === "customer") {
        compareValue = (a.customerName || "").localeCompare(b.customerName || "");
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
    setSearchCustomer("");
    setSearchDate("");
  };

  const handleDownloadCSV = () => {
    if (!filteredData || filteredData.length === 0) return;

    const headers = [
      "Date",
      "Time",
      "Account ID",
      "Customer",
      "Sub-Account",
      "Job Code",
      "Pickup",
      "Dropoff",
      "Passenger",
      "Cab",
      "Fare",
      "Tip",
      "Total",
      "Paid",
      "Invoice #",
    ];

    const rows = filteredData.map((item) => [
      item.tripDate,
      item.startTime || "",
      item.accountId,
      item.customerName || "",
      item.subAccount || "",
      item.jobCode || "",
      item.pickupAddress || "",
      item.dropoffAddress || "",
      item.passengerName || "",
      item.cabNumber || "",
      item.fareAmount?.toFixed(2) || "0.00",
      item.tipAmount?.toFixed(2) || "0.00",
      item.totalAmount?.toFixed(2) || "0.00",
      item.isPaid ? "Yes" : "No",
      item.invoiceNumber || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `charges-revenue-${driverNumber}-${format(startDate, "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading charges revenue report...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>;
  }

  if (!reportData || !reportData.chargeItems || reportData.chargeItems.length === 0) {
    return (
      <Paper sx={{ p: 6, textAlign: "center" }}>
        <Receipt sx={{ fontSize: 80, color: "text.disabled", mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Account Charges Found
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
                Total Charges
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {reportData.totalCharges || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Total Fares
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600, color: "primary.main" }}>
                ${reportData.totalFareAmount?.toFixed(2) || "0.00"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Total Tips
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600, color: "success.main" }}>
                ${reportData.totalTipAmount?.toFixed(2) || "0.00"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: "primary.main", color: "white" }}>
            <CardContent>
              <Typography sx={{ opacity: 0.9 }} variant="body2" gutterBottom>
                Grand Total
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                ${reportData.grandTotal?.toFixed(2) || "0.00"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Payment Status Cards */}
        <Grid item xs={12} sm={6}>
          <Card sx={{ bgcolor: "success.light", color: "success.dark" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CheckCircle />
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Paid Charges
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {reportData.paidCharges} charges - ${reportData.paidAmount?.toFixed(2) || "0.00"}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Card sx={{ bgcolor: "warning.light", color: "warning.dark" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Schedule />
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Unpaid Charges
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {reportData.unpaidCharges} charges - ${reportData.unpaidAmount?.toFixed(2) || "0.00"}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Search Customer"
              placeholder="Customer name, account ID, or sub-account"
              value={searchCustomer}
              onChange={(e) => setSearchCustomer(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
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
          <Grid item xs={12} md={4}>
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
          Showing {filteredData.length} of {reportData.chargeItems.length} charges
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
              Account Charges Details
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
                <TableCell>Time</TableCell>
                <TableCell>Account</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === "customer"}
                    direction={sortBy === "customer" ? sortOrder : "asc"}
                    onClick={() => handleSort("customer")}
                  >
                    Customer
                  </TableSortLabel>
                </TableCell>
                <TableCell>Job Code</TableCell>
                <TableCell>Pickup</TableCell>
                <TableCell>Dropoff</TableCell>
                <TableCell>Passenger</TableCell>
                <TableCell>Cab</TableCell>
                <TableCell align="right">Fare</TableCell>
                <TableCell align="right">Tip</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map((item, index) => (
                <TableRow key={index} hover>
                  <TableCell>{item.tripDate}</TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {item.startTime || "N/A"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {item.accountId}
                      </Typography>
                      {item.subAccount && (
                        <Typography variant="caption" color="text.secondary">
                          {item.subAccount}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{item.customerName || "N/A"}</TableCell>
                  <TableCell>{item.jobCode || "N/A"}</TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ maxWidth: 150, display: "block" }}>
                      {item.pickupAddress || "N/A"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ maxWidth: 150, display: "block" }}>
                      {item.dropoffAddress || "N/A"}
                    </Typography>
                  </TableCell>
                  <TableCell>{item.passengerName || "N/A"}</TableCell>
                  <TableCell>{item.cabNumber || "N/A"}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 500 }}>
                    ${item.fareAmount?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell align="right" sx={{ color: "success.main" }}>
                    ${item.tipAmount?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: "primary.main" }}>
                    ${item.totalAmount?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={item.isPaid ? <CheckCircle /> : <Cancel />}
                      label={item.isPaid ? "Paid" : "Unpaid"}
                      size="small"
                      color={item.isPaid ? "success" : "warning"}
                    />
                    {item.isPaid && item.invoiceNumber && (
                      <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>
                        Inv: {item.invoiceNumber}
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={9} align="right" sx={{ fontWeight: 600 }}>
                  GRAND TOTAL
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  ${filteredData.reduce((sum, item) => sum + (item.fareAmount || 0), 0).toFixed(2)}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  ${filteredData.reduce((sum, item) => sum + (item.tipAmount || 0), 0).toFixed(2)}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 700, color: "primary.main", fontSize: 18 }}
                >
                  ${filteredData.reduce((sum, item) => sum + (item.totalAmount || 0), 0).toFixed(2)}
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