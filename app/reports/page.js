"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import GlobalNav from "../components/GlobalNav";
import {
  Box, Container, Typography, Button, Paper, Grid, TextField,
  Tabs, Tab, Autocomplete, Card, CardContent, CircularProgress,
} from "@mui/material";
import {
  Assessment, TrendingUp, TrendingDown, AccountBalance, CheckCircle,
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
      const [leaseRevenueRes, creditCardRes, chargesRes, fixedExpensesRes] = 
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
        ]);

      // ✅ Extract data (handle failures gracefully)
      const leaseRevenue = leaseRevenueRes.status === 'fulfilled' ? leaseRevenueRes.value.data : null;
      const creditCardRevenue = creditCardRes.status === 'fulfilled' ? creditCardRes.value.data : null;
      const chargesRevenue = chargesRes.status === 'fulfilled' ? chargesRes.value.data : null;
      const fixedExpenses = fixedExpensesRes.status === 'fulfilled' ? fixedExpensesRes.value.data : null;

      console.log('✅ Lease Revenue Total:', leaseRevenue?.totalRevenue || leaseRevenue?.grandTotalLease || 0);
      console.log('✅ Credit Card Total:', creditCardRevenue?.totalAmount || 0);
      console.log('✅ Charges Total:', chargesRevenue?.grandTotal || chargesRevenue?.totalAmount || 0);
      console.log('✅ Fixed Expenses Total:', fixedExpenses?.totalAmount || fixedExpenses?.totalExpenses || 0);

      // ✅ Calculate totals
      const totalRevenue = 
        parseFloat(leaseRevenue?.totalRevenue || leaseRevenue?.grandTotalLease || 0) +
        parseFloat(creditCardRevenue?.totalAmount || 0) +
        parseFloat(chargesRevenue?.grandTotal || chargesRevenue?.totalAmount || 0);

      const totalExpenses = parseFloat(fixedExpenses?.totalAmount || fixedExpenses?.totalExpenses || 0);
      const netAmount = totalRevenue - totalExpenses;
      const amountDue = netAmount > 0 ? netAmount : 0;

      console.log('📊 CALCULATED TOTALS:');
      console.log('Total Revenue:', totalRevenue);
      console.log('Total Expenses:', totalExpenses);
      console.log('Amount Due:', amountDue);

      // ✅ Store EVERYTHING in cache
      const data = {
        leaseRevenue,
        creditCardRevenue,
        chargesRevenue,
        fixedExpenses,
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
              <Card sx={{ height: '100%', bgcolor: '#fff3e0' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AccountBalance sx={{ color: '#e65100', mr: 1 }} />
                    <Typography variant="caption" color="textSecondary">
                      Amount Due
                    </Typography>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#e65100' }}>
                    ${reportData.amountDue.toFixed(2)}
                  </Typography>
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
    </Box>
  );
}