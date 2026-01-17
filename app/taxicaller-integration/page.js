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
  Alert,
  Card,
  CardContent,
  Grid,
  TextField,
  Tab,
  Tabs,
  CircularProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
} from "@mui/material";
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  LocalTaxi as TaxiIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  DirectionsCar as CarIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from "@mui/icons-material";
import GlobalNav from "../components/GlobalNav";
import { getCurrentUser, isAuthenticated, API_BASE_URL } from "../lib/api";
import { useRouter } from "next/navigation";

export default function TaxiCallerIntegrationPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  // Tab state
  const [currentTab, setCurrentTab] = useState(0);

  // Date range state
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 7))
      .toISOString()
      .split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dataType, setDataType] = useState("account_jobs");

  // Data state
  const [accountJobs, setAccountJobs] = useState([]);
  const [filteredAccountJobs, setFilteredAccountJobs] = useState([]);
  const [driverLogons, setDriverLogons] = useState([]);
  const [filteredDriverLogons, setFilteredDriverLogons] = useState([]);
  const [driverJobs, setDriverJobs] = useState([]);
  const [filteredDriverJobs, setFilteredDriverJobs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null);

  // Filter states for Account Jobs
  const [accountJobsDriverIdFilter, setAccountJobsDriverIdFilter] = useState("");
  const [accountJobsDriverNameFilter, setAccountJobsDriverNameFilter] = useState("");

  // Filter states for Driver Logons
  const [logonsDriverIdFilter, setLogonsDriverIdFilter] = useState("");
  const [logonsDriverNameFilter, setLogonsDriverNameFilter] = useState("");
  const [logonsVehicleFilter, setLogonsVehicleFilter] = useState("");
  
  // Sort states for Driver Logons
  const [logonsSortField, setLogonsSortField] = useState(null);
  const [logonsSortDirection, setLogonsSortDirection] = useState("asc");

  // Filter states for Driver Jobs
  const [driverJobsDriverIdFilter, setDriverJobsDriverIdFilter] = useState("");
  const [driverJobsDriverNameFilter, setDriverJobsDriverNameFilter] = useState("");
  
  // Sort states for Driver Jobs
  const [driverJobsSortField, setDriverJobsSortField] = useState(null);
  const [driverJobsSortDirection, setDriverJobsSortDirection] = useState("asc");

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/signin");
      return;
    }

    const user = getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      router.push("/");
      return;
    }
    setCurrentUser(user);
  }, [router]);

  // Apply filters for Account Jobs
  useEffect(() => {
    let filtered = [...accountJobs];

    if (accountJobsDriverIdFilter) {
      filtered = filtered.filter(job => 
        job.driver_id?.toString().toLowerCase().includes(accountJobsDriverIdFilter.toLowerCase()) ||
        job.driver_username?.toString().toLowerCase().includes(accountJobsDriverIdFilter.toLowerCase())
      );
    }

    if (accountJobsDriverNameFilter) {
      filtered = filtered.filter(job =>
        job.driver?.toLowerCase().includes(accountJobsDriverNameFilter.toLowerCase())
      );
    }

    setFilteredAccountJobs(filtered);
  }, [accountJobs, accountJobsDriverIdFilter, accountJobsDriverNameFilter]);

  // Apply filters for Driver Logons
  useEffect(() => {
    let filtered = [...driverLogons];

    if (logonsDriverIdFilter) {
      filtered = filtered.filter(log =>
        log.driver_username?.toString().toLowerCase().includes(logonsDriverIdFilter.toLowerCase())
      );
    }

    if (logonsDriverNameFilter) {
      filtered = filtered.filter(log => {
        const fullName = log["driver.name_name"] || 
                        `${log["driver.first_name"] || ""} ${log["driver.last_name"] || ""}`.trim();
        return fullName.toLowerCase().includes(logonsDriverNameFilter.toLowerCase());
      });
    }

    if (logonsVehicleFilter) {
      filtered = filtered.filter(log => {
        const vehicle = log["vehicle.callsign"] || log["vehicle.num"] || "";
        return vehicle.toString().toLowerCase().includes(logonsVehicleFilter.toLowerCase());
      });
    }

    // Apply sorting
    if (logonsSortField) {
      filtered.sort((a, b) => {
        let aValue, bValue;
        
        if (logonsSortField === 'vehicle') {
          const aVehicle = a["vehicle.callsign"] || a["vehicle.num"] || "";
          const bVehicle = b["vehicle.callsign"] || b["vehicle.num"] || "";
          // Extract numeric part for natural sorting (e.g., m1, m2, m11)
          const aNum = parseInt(aVehicle.toString().replace(/\D/g, '')) || 0;
          const bNum = parseInt(bVehicle.toString().replace(/\D/g, '')) || 0;
          aValue = aNum;
          bValue = bNum;
        } else if (logonsSortField === 'logonTime') {
          aValue = a["track.start"] || "";
          bValue = b["track.start"] || "";
        }
        
        if (aValue < bValue) return logonsSortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return logonsSortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredDriverLogons(filtered);
  }, [driverLogons, logonsDriverIdFilter, logonsDriverNameFilter, logonsVehicleFilter, logonsSortField, logonsSortDirection]);

  // Apply filters for Driver Jobs
  useEffect(() => {
    let filtered = [...driverJobs];

    if (driverJobsDriverIdFilter) {
      filtered = filtered.filter(job =>
        job.driver_id?.toString().toLowerCase().includes(driverJobsDriverIdFilter.toLowerCase()) ||
        job.driverId?.toString().toLowerCase().includes(driverJobsDriverIdFilter.toLowerCase())
      );
    }

    if (driverJobsDriverNameFilter) {
      filtered = filtered.filter(job =>
        (job.driver || job.driverName || "").toLowerCase().includes(driverJobsDriverNameFilter.toLowerCase())
      );
    }

    // Apply sorting
    if (driverJobsSortField) {
      filtered.sort((a, b) => {
        let aValue, bValue;
        
        if (driverJobsSortField === 'vehicle') {
          const aVehicle = a.vehicle_num || a.vehicle || "";
          const bVehicle = b.vehicle_num || b.vehicle || "";
          // Extract numeric part for natural sorting (e.g., m1, m2, m11)
          const aNum = parseInt(aVehicle.toString().replace(/\D/g, '')) || 0;
          const bNum = parseInt(bVehicle.toString().replace(/\D/g, '')) || 0;
          aValue = aNum;
          bValue = bNum;
        } else if (driverJobsSortField === 'date') {
          aValue = a.date || "";
          bValue = b.date || "";
        } else if (driverJobsSortField === 'tariff') {
          aValue = parseFloat(a.tariff || a.fare || 0);
          bValue = parseFloat(b.tariff || b.fare || 0);
        }
        
        if (aValue < bValue) return driverJobsSortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return driverJobsSortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredDriverJobs(filtered);
  }, [driverJobs, driverJobsDriverIdFilter, driverJobsDriverNameFilter, driverJobsSortField, driverJobsSortDirection]);

  const testConnection = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`${API_BASE_URL}/taxicaller/test`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            "X-Tenant-ID": localStorage.getItem("tenantSchema"), },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setConnectionStatus("connected");
        setSuccess("Successfully connected to TaxiCaller API");
      } else {
        setConnectionStatus("failed");
        setError(data.message || "Failed to connect");
      }
    } catch (err) {
      console.error("Error testing connection:", err);
      setConnectionStatus("failed");
      setError(`Failed to connect to TaxiCaller API: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadAccountJobs = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/taxicaller/reports/load-account-jobs?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            "X-Tenant-ID": localStorage.getItem("tenantSchema"), },
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(`Loaded ${data.count} account jobs`);
      } else {
        setError(data.message || "Failed to fetch account jobs");
      }
    } catch (err) {
      console.error("Error fetching account jobs:", err);
      setError(`Failed to fetch account jobs: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };


  const importDriverLogons = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/taxicaller/reports/import-driver-shifts?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            "X-Tenant-ID": localStorage.getItem("tenantSchema"), },
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(`Loaded ${data.count} account jobs`);
      } else {
        setError(data.message || "Failed to fetch account jobs");
      }
    } catch (err) {
      console.error("Error fetching account jobs:", err);
      setError(`Failed to fetch account jobs: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccountJobs = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/taxicaller/reports/account-jobs?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            "X-Tenant-ID": localStorage.getItem("tenantSchema"), },
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setAccountJobs(data.data || []);
        setSuccess(`Loaded ${data.count || (data.data || []).length} account jobs`);
      } else {
        setError(data.message || "Failed to fetch account jobs");
      }
    } catch (err) {
      console.error("Error fetching account jobs:", err);
      setError(`Failed to fetch account jobs: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchDriverLogons = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/taxicaller/reports/driver-logons?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            "X-Tenant-ID": localStorage.getItem("tenantSchema"), },
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setDriverLogons(data.data || []);
        setSuccess(`Loaded ${data.count || (data.data || []).length} driver log entries`);
      } else {
        setError(data.message || "Failed to fetch driver logons");
      }
    } catch (err) {
      console.error("Error fetching driver logons:", err);
      setError(`Failed to fetch driver logons: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchDriverJobs = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/taxicaller/reports/driver-jobs?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            "X-Tenant-ID": localStorage.getItem("tenantSchema"), },
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setDriverJobs(data.data || []);
        setSuccess(`Loaded ${data.count || (data.data || []).length} driver jobs`);
      } else {
        setError(data.message || "Failed to fetch driver jobs");
      }
    } catch (err) {
      console.error("Error fetching driver jobs:", err);
      setError(`Failed to fetch driver jobs: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/taxicaller/summary?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            "X-Tenant-ID": localStorage.getItem("tenantSchema"), },
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSummary(data.data);
        setSuccess("Summary loaded successfully");
      } else {
        setError(data.message || "Failed to fetch summary");
      }
    } catch (err) {
      console.error("Error fetching summary:", err);
      setError(`Failed to fetch summary: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      setError("No data to export");
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map(row => headers.map(header => JSON.stringify(row[header] || "")).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}_${startDate}_to_${endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearAccountJobsFilters = () => {
    setAccountJobsDriverIdFilter("");
    setAccountJobsDriverNameFilter("");
  };

  const clearLogonsFilters = () => {
    setLogonsDriverIdFilter("");
    setLogonsDriverNameFilter("");
    setLogonsVehicleFilter("");
  };

  const handleLogonsSort = (field) => {
    if (logonsSortField === field) {
      // Toggle direction if same field
      setLogonsSortDirection(logonsSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to ascending
      setLogonsSortField(field);
      setLogonsSortDirection('asc');
    }
  };

  const clearDriverJobsFilters = () => {
    setDriverJobsDriverIdFilter("");
    setDriverJobsDriverNameFilter("");
  };

  const handleDriverJobsSort = (field) => {
    if (driverJobsSortField === field) {
      // Toggle direction if same field
      setDriverJobsSortDirection(driverJobsSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to ascending
      setDriverJobsSortField(field);
      setDriverJobsSortDirection('asc');
    }
  };

  if (!currentUser) {
    return (
      <Box>
        <GlobalNav currentUser={currentUser} title="TaxiCaller Integration" />
        <Box sx={{ p: 3, textAlign: "center" }}>
          <Typography>Loading...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f6f9fc" }}>
      <GlobalNav currentUser={currentUser} title="TaxiCaller Integration" />
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: 2,
              backgroundColor: "#F9D13E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TaxiIcon sx={{ fontSize: 40, color: "#000" }} />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ color: "#3e5244" }}>
              TaxiCaller Integration
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Import trip data, driver logs, and reports from TaxiCaller API
            </Typography>
          </Box>
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

        {/* Connection Status Card */}
        <Card sx={{ mb: 3, backgroundColor: "#F9D13E", border: "2px solid #E5C02E" }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Typography variant="h6" sx={{ color: "#000" }}>
                    Connection Status:
                  </Typography>
                  {connectionStatus === "connected" && (
                    <Chip label="Connected" color="success" />
                  )}
                  {connectionStatus === "failed" && (
                    <Chip label="Disconnected" color="error" />
                  )}
                  {!connectionStatus && (
                    <Chip label="Not Tested" color="default" />
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} md={6} sx={{ textAlign: "right" }}>
                <Button
                  variant="contained"
                  onClick={testConnection}
                  disabled={loading}
                  sx={{ backgroundColor: "#000", "&:hover": { backgroundColor: "#333" } }}
                >
                  {loading ? <CircularProgress size={24} /> : "Test Connection"}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Date Range Selector */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Select Date Range
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Data Type</InputLabel>
                <Select
                  value={dataType}
                  label="Data Type"
                  onChange={(e) => setDataType(e.target.value)}
                >
                  <MenuItem value="account_jobs">Account Jobs</MenuItem>
                  <MenuItem value="driver_logons">Driver Login Data</MenuItem>
                  <MenuItem value="driver_jobs">Driver Jobs</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="contained"
                fullWidth
                onClick={() => {
                  if (dataType === "account_jobs") {
                    loadAccountJobs();
                    setCurrentTab(0);
                  } else if (dataType === "driver_logons") {
                    importDriverLogons();
                    setCurrentTab(1);
                  } else if (dataType === "driver_jobs") {
                    fetchDriverJobs();
                    setCurrentTab(2);
                  }
                }}
                disabled={loading}
                startIcon={<RefreshIcon />}
                sx={{ height: "56px" }}
              >
                Import TaxiCaller Data
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Summary Cards */}
        {summary && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <AssessmentIcon color="primary" />
                    <Box>
                      <Typography color="textSecondary" variant="body2">
                        Account Jobs
                      </Typography>
                      <Typography variant="h5">{summary.totalAccountJobs}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <PeopleIcon color="success" />
                    <Box>
                      <Typography color="textSecondary" variant="body2">
                        Driver Logons
                      </Typography>
                      <Typography variant="h5">{summary.totalDriverLogons}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tabs */}
        <Paper>
          <Tabs value={currentTab} onChange={(e, val) => setCurrentTab(val)}>
            <Tab label="Account Jobs" />
            <Tab label="Driver Logons" />
            <Tab label="Driver Jobs" />
          </Tabs>

          {/* Tab 0: Account Jobs */}
          {currentTab === 0 && (
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="h6">Account Job Reports</Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => exportToCSV(filteredAccountJobs, "account_jobs")}
                    disabled={filteredAccountJobs.length === 0}
                  >
                    Export CSV
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<RefreshIcon />}
                    onClick={fetchAccountJobs}
                    disabled={loading}
                  >
                    Load Data
                  </Button>
                </Box>
              </Box>

              {/* Filters */}
              <Paper variant="outlined" sx={{ p: 2, mb: 2, backgroundColor: "#f5f5f5" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <FilterIcon color="action" />
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={5}>
                      <TextField
                        label="Driver ID / Username"
                        size="small"
                        fullWidth
                        value={accountJobsDriverIdFilter}
                        onChange={(e) => setAccountJobsDriverIdFilter(e.target.value)}
                        placeholder="Search by driver ID..."
                      />
                    </Grid>
                    <Grid item xs={12} sm={5}>
                      <TextField
                        label="Driver Name"
                        size="small"
                        fullWidth
                        value={accountJobsDriverNameFilter}
                        onChange={(e) => setAccountJobsDriverNameFilter(e.target.value)}
                        placeholder="Search by driver name..."
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<ClearIcon />}
                        onClick={clearAccountJobsFilters}
                      >
                        Clear
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
                {(accountJobsDriverIdFilter || accountJobsDriverNameFilter) && (
                  <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: "block" }}>
                    Showing {filteredAccountJobs.length} of {accountJobs.length} records
                  </Typography>
                )}
              </Paper>

              {loading ? (
                <Box sx={{ textAlign: "center", py: 5 }}>
                  <CircularProgress />
                </Box>
              ) : filteredAccountJobs.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 5 }}>
                  <TaxiIcon sx={{ fontSize: 60, color: "#ccc", mb: 2 }} />
                  <Typography variant="h6" color="textSecondary">
                    {accountJobs.length === 0 ? "No account jobs found" : "No matching records"}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {accountJobs.length === 0 
                      ? "Click 'Load Data' to fetch account jobs from TaxiCaller"
                      : "Try adjusting your filters"}
                  </Typography>
                </Box>
              ) : (
                <TableContainer sx={{ maxHeight: 600 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Driver ID</TableCell>
                        <TableCell>Driver Name</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Start</TableCell>
                        <TableCell>End</TableCell>
                        <TableCell>Vehicle</TableCell>
                        <TableCell>Passenger</TableCell>
                        <TableCell>Account</TableCell>
                        <TableCell>Pickup</TableCell>
                        <TableCell>Dropoff</TableCell>
                        <TableCell>Tariff</TableCell>
                        <TableCell>Discount</TableCell>
                        <TableCell>Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredAccountJobs.map((job, index) => (
                        <TableRow key={index} hover>
                          <TableCell><Chip label={job.driver_id || job.driver_username || "-"} size="small" color="primary" /></TableCell>
                          <TableCell><strong>{job.driver || "-"}</strong></TableCell>
                          <TableCell>{job.date || "-"}</TableCell>
                          <TableCell>{job.start || "-"}</TableCell>
                          <TableCell>{job.end || "-"}</TableCell>
                          <TableCell>{job.vehicle_num || "-"}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {job.passenger || "-"}
                            </Typography>
                          </TableCell>
                          <TableCell>{job.account_num || "-"}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {job["pick-up"] || "-"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {job.drop_off || "-"}
                            </Typography>
                          </TableCell>
                          <TableCell>${job.tariff || "0.00"}</TableCell>
                          <TableCell>${job.discount || "0.00"}</TableCell>
                          <TableCell><strong>${job.payable || "0.00"}</strong></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* Tab 1: Driver Logons */}
          {currentTab === 1 && (
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="h6">Driver Log On/Off Reports</Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => exportToCSV(filteredDriverLogons, "driver_logons")}
                    disabled={filteredDriverLogons.length === 0}
                  >
                    Export CSV
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<RefreshIcon />}
                    onClick={fetchDriverLogons}
                    disabled={loading}
                  >
                    Load Data
                  </Button>
                </Box>
              </Box>

              {/* Filters */}
              <Paper variant="outlined" sx={{ p: 2, mb: 2, backgroundColor: "#f5f5f5" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <FilterIcon color="action" />
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Driver Username"
                        size="small"
                        fullWidth
                        value={logonsDriverIdFilter}
                        onChange={(e) => setLogonsDriverIdFilter(e.target.value)}
                        placeholder="Search by driver username..."
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        label="Driver Name"
                        size="small"
                        fullWidth
                        value={logonsDriverNameFilter}
                        onChange={(e) => setLogonsDriverNameFilter(e.target.value)}
                        placeholder="Search by driver name..."
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        label="Vehicle"
                        size="small"
                        fullWidth
                        value={logonsVehicleFilter}
                        onChange={(e) => setLogonsVehicleFilter(e.target.value)}
                        placeholder="Search by vehicle..."
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<ClearIcon />}
                        onClick={clearLogonsFilters}
                      >
                        Clear
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
                {(logonsDriverIdFilter || logonsDriverNameFilter || logonsVehicleFilter) && (
                  <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: "block" }}>
                    Showing {filteredDriverLogons.length} of {driverLogons.length} records
                  </Typography>
                )}
              </Paper>

              {loading ? (
                <Box sx={{ textAlign: "center", py: 5 }}>
                  <CircularProgress />
                </Box>
              ) : filteredDriverLogons.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 5 }}>
                  <PeopleIcon sx={{ fontSize: 60, color: "#ccc", mb: 2 }} />
                  <Typography variant="h6" color="textSecondary">
                    {driverLogons.length === 0 ? "No driver logons found" : "No matching records"}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {driverLogons.length === 0
                      ? "Click 'Load Data' to fetch driver logons from TaxiCaller"
                      : "Try adjusting your filters"}
                  </Typography>
                </Box>
              ) : (
                <TableContainer sx={{ maxHeight: 600 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Driver Username</TableCell>
                        <TableCell>Driver Name</TableCell>
                        <TableCell 
                          sx={{ cursor: 'pointer', userSelect: 'none', '&:hover': { backgroundColor: '#f5f5f5' } }}
                          onClick={() => handleLogonsSort('vehicle')}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            Vehicle
                            {logonsSortField === 'vehicle' && (
                              logonsSortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell 
                          sx={{ cursor: 'pointer', userSelect: 'none', '&:hover': { backgroundColor: '#f5f5f5' } }}
                          onClick={() => handleLogonsSort('logonTime')}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            Log On Time
                            {logonsSortField === 'logonTime' && (
                              logonsSortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>Log Off Time</TableCell>
                        <TableCell>Total Hours</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredDriverLogons.map((log, index) => (
                        <TableRow key={index} hover>
                          <TableCell><Chip label={log.driver_username || "-"} size="small" color="primary" /></TableCell>
                          <TableCell>
                            <strong>
                              {log["driver.name_name"] || 
                               `${log["driver.first_name"] || ""} ${log["driver.last_name"] || ""}`.trim() || 
                               "-"}
                            </strong>
                          </TableCell>
                          <TableCell>{log["vehicle.callsign"] || log["vehicle.num"] || "-"}</TableCell>
                          <TableCell>{log["track.start"] || "-"}</TableCell>
                          <TableCell>{log["track.end"] || "-"}</TableCell>
                          <TableCell><Chip label={log["hos.duration"] || "0"} size="small" variant="outlined" /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* Tab 2: Driver Jobs */}
          {currentTab === 2 && (
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="h6">Driver Job Reports</Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => exportToCSV(filteredDriverJobs, "driver_jobs")}
                    disabled={filteredDriverJobs.length === 0}
                  >
                    Export CSV
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<RefreshIcon />}
                    onClick={fetchDriverJobs}
                    disabled={loading}
                  >
                    Load Data
                  </Button>
                </Box>
              </Box>

              {/* Filters */}
              <Paper variant="outlined" sx={{ p: 2, mb: 2, backgroundColor: "#f5f5f5" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <FilterIcon color="action" />
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={5}>
                      <TextField
                        label="Driver ID"
                        size="small"
                        fullWidth
                        value={driverJobsDriverIdFilter}
                        onChange={(e) => setDriverJobsDriverIdFilter(e.target.value)}
                        placeholder="Search by driver ID..."
                      />
                    </Grid>
                    <Grid item xs={12} sm={5}>
                      <TextField
                        label="Driver Name"
                        size="small"
                        fullWidth
                        value={driverJobsDriverNameFilter}
                        onChange={(e) => setDriverJobsDriverNameFilter(e.target.value)}
                        placeholder="Search by driver name..."
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<ClearIcon />}
                        onClick={clearDriverJobsFilters}
                      >
                        Clear
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
                {(driverJobsDriverIdFilter || driverJobsDriverNameFilter) && (
                  <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: "block" }}>
                    Showing {filteredDriverJobs.length} of {driverJobs.length} records
                  </Typography>
                )}
              </Paper>

              {loading ? (
                <Box sx={{ textAlign: "center", py: 5 }}>
                  <CircularProgress />
                </Box>
              ) : filteredDriverJobs.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 5 }}>
                  <CarIcon sx={{ fontSize: 60, color: "#ccc", mb: 2 }} />
                  <Typography variant="h6" color="textSecondary">
                    {driverJobs.length === 0 ? "No driver jobs found" : "No matching records"}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {driverJobs.length === 0
                      ? "Click 'Load Data' to fetch driver jobs from TaxiCaller"
                      : "Try adjusting your filters"}
                  </Typography>
                </Box>
              ) : (
                <TableContainer sx={{ maxHeight: 600 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Driver ID</TableCell>
                        <TableCell>Driver Name</TableCell>
                        <TableCell 
                          sx={{ cursor: 'pointer', userSelect: 'none', '&:hover': { backgroundColor: '#f5f5f5' } }}
                          onClick={() => handleDriverJobsSort('date')}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            Date
                            {driverJobsSortField === 'date' && (
                              driverJobsSortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell 
                          sx={{ cursor: 'pointer', userSelect: 'none', '&:hover': { backgroundColor: '#f5f5f5' } }}
                          onClick={() => handleDriverJobsSort('vehicle')}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            Vehicle
                            {driverJobsSortField === 'vehicle' && (
                              driverJobsSortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>Pickup</TableCell>
                        <TableCell>Dropoff</TableCell>
                        <TableCell 
                          sx={{ cursor: 'pointer', userSelect: 'none', '&:hover': { backgroundColor: '#f5f5f5' } }}
                          onClick={() => handleDriverJobsSort('tariff')}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            Tariff
                            {driverJobsSortField === 'tariff' && (
                              driverJobsSortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredDriverJobs.map((job, index) => (
                        <TableRow key={index} hover>
                          <TableCell><Chip label={job.driver_id || job.driverId || "-"} size="small" color="primary" /></TableCell>
                          <TableCell><strong>{job.driver || job.driverName || "-"}</strong></TableCell>
                          <TableCell>{job.date || "-"}</TableCell>
                          <TableCell>{job.vehicle_num || job.vehicle || "-"}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {job["pick-up"] || job.pickup || "-"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {job.drop_off || job.dropoff || "-"}
                            </Typography>
                          </TableCell>
                          <TableCell>${job.tariff || job.fare || "0.00"}</TableCell>
                          <TableCell><strong>${job.payable || job.total || "0.00"}</strong></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
}