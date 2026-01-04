"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  TextField,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
} from "@mui/material";
import {
  CreditCard as CreditCardIcon,
  FlightTakeoff as AirportIcon,
  Speed as MileageIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { API_BASE_URL } from "../../lib/api";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format, subDays } from "date-fns";

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`view-tabpanel-${index}`}
      aria-labelledby={`view-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ViewDataSection({ currentUser }) {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        {/* Sub-tabs for data types */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            indicatorColor="secondary"
            textColor="inherit"
            variant="fullWidth"
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              "& .MuiTab-root": {
                minHeight: 56,
                fontSize: "0.9rem",
              },
            }}
          >
            <Tab
              icon={<CreditCardIcon />}
              iconPosition="start"
              label="Credit Card Transactions"
              id="view-tab-0"
              aria-controls="view-tabpanel-0"
            />
            <Tab
              icon={<MileageIcon />}
              iconPosition="start"
              label="Mileage Records"
              id="view-tab-1"
              aria-controls="view-tabpanel-1"
            />
            <Tab
              icon={<AirportIcon />}
              iconPosition="start"
              label="Airport Trips"
              id="view-tab-2"
              aria-controls="view-tabpanel-2"
            />
          </Tabs>
        </Paper>

        {/* Tab Panels */}
        <TabPanel value={activeTab} index={0}>
          <CreditCardDataView currentUser={currentUser} />
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <MileageDataView currentUser={currentUser} />
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          <AirportTripsDataView currentUser={currentUser} />
        </TabPanel>
      </Box>
    </LocalizationProvider>
  );
}

// ==================== Credit Card Data View ====================
function CreditCardDataView({ currentUser }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filters
  const [startDate, setStartDate] = useState(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState(new Date());
  const [cabNumber, setCabNumber] = useState("");
  const [driverNumber, setDriverNumber] = useState("");
  
  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editDriverNumber, setEditDriverNumber] = useState("");
  
  // Dropdowns
  const [cabs, setCabs] = useState([]);
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  const fetchDropdowns = async () => {
    try {
      const token = localStorage.getItem("token");
      const [cabsRes, driversRes] = await Promise.all([
        fetch(`${API_BASE_URL}/cabs`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/drivers`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (cabsRes.ok) setCabs(await cabsRes.json());
      if (driversRes.ok) setDrivers(await driversRes.json());
    } catch (e) {
      console.error("Error fetching dropdowns:", e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        page: page.toString(),
        size: rowsPerPage.toString(),
      });
      if (cabNumber) params.append("cabNumber", cabNumber);
      if (driverNumber) params.append("driverNumber", driverNumber);

      const response = await fetch(`${API_BASE_URL}/data-view/credit-card-transactions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch data");

      const result = await response.json();
      setData(result.content || []);
      setTotalCount(result.totalElements || 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(0);
    fetchData();
  };

  const handleEditSave = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/data-view/credit-card-transactions/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ driverNumber: editDriverNumber || null }),
      });

      if (!response.ok) throw new Error("Failed to update");

      setSuccess("Record updated successfully");
      setEditingId(null);
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <Box>
      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
          <FilterIcon /> Filters
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={setStartDate}
              slotProps={{ textField: { size: "small", fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={setEndDate}
              slotProps={{ textField: { size: "small", fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Autocomplete
              options={cabs}
              getOptionLabel={(option) => option.cabNumber || ""}
              value={cabs.find((c) => c.cabNumber === cabNumber) || null}
              onChange={(e, v) => setCabNumber(v?.cabNumber || "")}
              renderInput={(params) => <TextField {...params} label="Cab #" size="small" />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Autocomplete
              options={drivers}
              getOptionLabel={(option) => `${option.driverNumber} - ${option.firstName} ${option.lastName}`}
              value={drivers.find((d) => d.driverNumber === driverNumber) || null}
              onChange={(e, v) => setDriverNumber(v?.driverNumber || "")}
              renderInput={(params) => <TextField {...params} label="Driver" size="small" />}
            />
          </Grid>
          <Grid item xs={12} sm={12} md={4}>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              disabled={loading}
            >
              Search
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => { setCabNumber(""); setDriverNumber(""); }}
              sx={{ ml: 1 }}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* Data Table */}
      <Paper>
        <TableContainer sx={{ maxHeight: 500 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Cab #</TableCell>
                <TableCell>Driver #</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Card Type</TableCell>
                <TableCell>Auth Code</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    No data found. Use filters and click Search.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.transactionDate}</TableCell>
                    <TableCell>{row.transactionTime}</TableCell>
                    <TableCell>
                      <Chip label={row.cabNumber || "-"} size="small" />
                    </TableCell>
                    <TableCell>
                      {editingId === row.id ? (
                        <Autocomplete
                          options={drivers}
                          getOptionLabel={(option) => option.driverNumber || ""}
                          value={drivers.find((d) => d.driverNumber === editDriverNumber) || null}
                          onChange={(e, v) => setEditDriverNumber(v?.driverNumber || "")}
                          renderInput={(params) => <TextField {...params} size="small" sx={{ minWidth: 120 }} />}
                          size="small"
                        />
                      ) : (
                        <Chip 
                          label={row.driverNumber || "N/A"} 
                          size="small" 
                          color={row.driverNumber ? "primary" : "default"}
                          variant={row.driverNumber ? "filled" : "outlined"}
                        />
                      )}
                    </TableCell>
                    <TableCell>${row.amount?.toFixed(2)}</TableCell>
                    <TableCell>{row.cardType || "-"}</TableCell>
                    <TableCell>{row.authorizationCode || "-"}</TableCell>
                    <TableCell align="right">
                      {editingId === row.id ? (
                        <>
                          <IconButton size="small" color="success" onClick={() => handleEditSave(row.id)}>
                            <SaveIcon />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => setEditingId(null)}>
                            <CancelIcon />
                          </IconButton>
                        </>
                      ) : (
                        <IconButton 
                          size="small" 
                          onClick={() => { setEditingId(row.id); setEditDriverNumber(row.driverNumber || ""); }}
                        >
                          <EditIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(e, p) => { setPage(p); fetchData(); }}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Paper>
    </Box>
  );
}

// ==================== Mileage Data View ====================
function MileageDataView({ currentUser }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filters
  const [startDate, setStartDate] = useState(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState(new Date());
  const [cabNumber, setCabNumber] = useState("");
  const [driverNumber, setDriverNumber] = useState("");
  
  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editDriverNumber, setEditDriverNumber] = useState("");
  
  // Dropdowns
  const [cabs, setCabs] = useState([]);
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  const fetchDropdowns = async () => {
    try {
      const token = localStorage.getItem("token");
      const [cabsRes, driversRes] = await Promise.all([
        fetch(`${API_BASE_URL}/cabs`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/drivers`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (cabsRes.ok) setCabs(await cabsRes.json());
      if (driversRes.ok) setDrivers(await driversRes.json());
    } catch (e) {
      console.error("Error fetching dropdowns:", e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        page: page.toString(),
        size: rowsPerPage.toString(),
      });
      if (cabNumber) params.append("cabNumber", cabNumber);
      if (driverNumber) params.append("driverNumber", driverNumber);

      const response = await fetch(`${API_BASE_URL}/data-view/mileage-records?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch data");

      const result = await response.json();
      setData(result.content || []);
      setTotalCount(result.totalElements || 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(0);
    fetchData();
  };

  const handleEditSave = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/data-view/mileage-records/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ driverNumber: editDriverNumber || null }),
      });

      if (!response.ok) throw new Error("Failed to update");

      setSuccess("Record updated successfully");
      setEditingId(null);
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <Box>
      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
          <FilterIcon /> Filters
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={setStartDate}
              slotProps={{ textField: { size: "small", fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={setEndDate}
              slotProps={{ textField: { size: "small", fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Autocomplete
              options={cabs}
              getOptionLabel={(option) => option.cabNumber || ""}
              value={cabs.find((c) => c.cabNumber === cabNumber) || null}
              onChange={(e, v) => setCabNumber(v?.cabNumber || "")}
              renderInput={(params) => <TextField {...params} label="Cab #" size="small" />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Autocomplete
              options={drivers}
              getOptionLabel={(option) => `${option.driverNumber} - ${option.firstName} ${option.lastName}`}
              value={drivers.find((d) => d.driverNumber === driverNumber) || null}
              onChange={(e, v) => setDriverNumber(v?.driverNumber || "")}
              renderInput={(params) => <TextField {...params} label="Driver" size="small" />}
            />
          </Grid>
          <Grid item xs={12} sm={12} md={4}>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              disabled={loading}
            >
              Search
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => { setCabNumber(""); setDriverNumber(""); }}
              sx={{ ml: 1 }}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* Data Table */}
      <Paper>
        <TableContainer sx={{ maxHeight: 500 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Cab #</TableCell>
                <TableCell>Driver #</TableCell>
                <TableCell>Logon Time</TableCell>
                <TableCell>Logoff Time</TableCell>
                <TableCell align="right">Mileage A (Tariff 1)</TableCell>
                <TableCell align="right">Mileage B (Tariff 2)</TableCell>
                <TableCell align="right">Mileage C (Paid)</TableCell>
                <TableCell align="right">Total Mileage</TableCell>
                <TableCell align="right">Shift Hours</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                    No data found. Use filters and click Search.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Chip label={row.cabNumber || "-"} size="small" />
                    </TableCell>
                    <TableCell>
                      {editingId === row.id ? (
                        <Autocomplete
                          options={drivers}
                          getOptionLabel={(option) => option.driverNumber || ""}
                          value={drivers.find((d) => d.driverNumber === editDriverNumber) || null}
                          onChange={(e, v) => setEditDriverNumber(v?.driverNumber || "")}
                          renderInput={(params) => <TextField {...params} size="small" sx={{ minWidth: 120 }} />}
                          size="small"
                        />
                      ) : (
                        <Chip 
                          label={row.driverNumber || "N/A"} 
                          size="small" 
                          color={row.driverNumber ? "primary" : "default"}
                          variant={row.driverNumber ? "filled" : "outlined"}
                        />
                      )}
                    </TableCell>
                    <TableCell>{row.logonTime ? new Date(row.logonTime).toLocaleString() : "-"}</TableCell>
                    <TableCell>{row.logoffTime ? new Date(row.logoffTime).toLocaleString() : "-"}</TableCell>
                    <TableCell align="right">{row.mileageA?.toFixed(3) || "-"}</TableCell>
                    <TableCell align="right">{row.mileageB?.toFixed(3) || "-"}</TableCell>
                    <TableCell align="right">{row.mileageC?.toFixed(3) || "-"}</TableCell>
                    <TableCell align="right">{row.totalMileage?.toFixed(3) || "-"}</TableCell>
                    <TableCell align="right">{row.shiftHours?.toFixed(2) || "-"}</TableCell>
                    <TableCell align="right">
                      {editingId === row.id ? (
                        <>
                          <IconButton size="small" color="success" onClick={() => handleEditSave(row.id)}>
                            <SaveIcon />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => setEditingId(null)}>
                            <CancelIcon />
                          </IconButton>
                        </>
                      ) : (
                        <IconButton 
                          size="small" 
                          onClick={() => { setEditingId(row.id); setEditDriverNumber(row.driverNumber || ""); }}
                        >
                          <EditIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(e, p) => { setPage(p); fetchData(); }}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Paper>
    </Box>
  );
}

// ==================== Airport Trips Data View ====================
function AirportTripsDataView({ currentUser }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filters
  const [startDate, setStartDate] = useState(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState(new Date());
  const [cabNumber, setCabNumber] = useState("");
  const [driverNumber, setDriverNumber] = useState("");
  const [shift, setShift] = useState("");
  
  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editDriverNumber, setEditDriverNumber] = useState("");
  const [editShift, setEditShift] = useState("");
  
  // Dropdowns
  const [cabs, setCabs] = useState([]);
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  const fetchDropdowns = async () => {
    try {
      const token = localStorage.getItem("token");
      const [cabsRes, driversRes] = await Promise.all([
        fetch(`${API_BASE_URL}/cabs`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/drivers`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (cabsRes.ok) setCabs(await cabsRes.json());
      if (driversRes.ok) setDrivers(await driversRes.json());
    } catch (e) {
      console.error("Error fetching dropdowns:", e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        page: page.toString(),
        size: rowsPerPage.toString(),
      });
      if (cabNumber) params.append("cabNumber", cabNumber);
      if (driverNumber) params.append("driverNumber", driverNumber);
      if (shift) params.append("shift", shift);

      const response = await fetch(`${API_BASE_URL}/data-view/airport-trips?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch data");

      const result = await response.json();
      setData(result.content || []);
      setTotalCount(result.totalElements || 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(0);
    fetchData();
  };

  const handleEditSave = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/data-view/airport-trips/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          driverNumber: editDriverNumber || null,
          shift: editShift,
        }),
      });

      if (!response.ok) throw new Error("Failed to update");

      setSuccess("Record updated successfully");
      setEditingId(null);
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <Box>
      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
          <FilterIcon /> Filters
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={setStartDate}
              slotProps={{ textField: { size: "small", fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={setEndDate}
              slotProps={{ textField: { size: "small", fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Autocomplete
              options={cabs}
              getOptionLabel={(option) => option.cabNumber || ""}
              value={cabs.find((c) => c.cabNumber === cabNumber) || null}
              onChange={(e, v) => setCabNumber(v?.cabNumber || "")}
              renderInput={(params) => <TextField {...params} label="Cab #" size="small" />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Autocomplete
              options={drivers}
              getOptionLabel={(option) => `${option.driverNumber} - ${option.firstName} ${option.lastName}`}
              value={drivers.find((d) => d.driverNumber === driverNumber) || null}
              onChange={(e, v) => setDriverNumber(v?.driverNumber || "")}
              renderInput={(params) => <TextField {...params} label="Driver" size="small" />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Shift</InputLabel>
              <Select
                value={shift}
                label="Shift"
                onChange={(e) => setShift(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="DAY">Day</MenuItem>
                <MenuItem value="NIGHT">Night</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              disabled={loading}
            >
              Search
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => { setCabNumber(""); setDriverNumber(""); setShift(""); }}
              sx={{ ml: 1 }}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* Data Table */}
      <Paper>
        <TableContainer sx={{ maxHeight: 500 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Trip Date</TableCell>
                <TableCell>Cab #</TableCell>
                <TableCell>Shift</TableCell>
                <TableCell>Driver #</TableCell>
                <TableCell align="center">Total Trips</TableCell>
                <TableCell>Hours with Trips</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    No data found. Use filters and click Search.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => {
                  // Build hours string from hour_00 to hour_23
                  const hoursWithTrips = [];
                  for (let h = 0; h <= 23; h++) {
                    const key = `hour${h.toString().padStart(2, '0')}`;
                    if (row[key] > 0) {
                      hoursWithTrips.push(`${h}:00(${row[key]})`);
                    }
                  }
                  
                  return (
                    <TableRow key={row.id}>
                      <TableCell>{row.tripDate}</TableCell>
                      <TableCell>
                        <Chip label={row.cabNumber || "-"} size="small" />
                      </TableCell>
                      <TableCell>
                        {editingId === row.id ? (
                          <FormControl size="small" sx={{ minWidth: 100 }}>
                            <Select
                              value={editShift}
                              onChange={(e) => setEditShift(e.target.value)}
                            >
                              <MenuItem value="DAY">Day</MenuItem>
                              <MenuItem value="NIGHT">Night</MenuItem>
                            </Select>
                          </FormControl>
                        ) : (
                          <Chip 
                            label={row.shift || "N/A"} 
                            size="small" 
                            color={row.shift === "DAY" ? "warning" : "primary"}
                            variant="filled"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === row.id ? (
                          <Autocomplete
                            options={drivers}
                            getOptionLabel={(option) => option.driverNumber || ""}
                            value={drivers.find((d) => d.driverNumber === editDriverNumber) || null}
                            onChange={(e, v) => setEditDriverNumber(v?.driverNumber || "")}
                            renderInput={(params) => <TextField {...params} size="small" sx={{ minWidth: 120 }} />}
                            size="small"
                          />
                        ) : (
                          <Chip 
                            label={row.driverNumber || "N/A"} 
                            size="small" 
                            color={row.driverNumber ? "secondary" : "default"}
                            variant={row.driverNumber ? "filled" : "outlined"}
                          />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {row.grandTotal || 0}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {hoursWithTrips.slice(0, 5).join(", ")}
                          {hoursWithTrips.length > 5 && "..."}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {editingId === row.id ? (
                          <>
                            <IconButton size="small" color="success" onClick={() => handleEditSave(row.id)}>
                              <SaveIcon />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => setEditingId(null)}>
                              <CancelIcon />
                            </IconButton>
                          </>
                        ) : (
                          <IconButton 
                            size="small" 
                            onClick={() => { 
                              setEditingId(row.id); 
                              setEditDriverNumber(row.driverNumber || ""); 
                              setEditShift(row.shift || "DAY");
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(e, p) => { setPage(p); fetchData(); }}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Paper>
    </Box>
  );
}
