"use client";

import { useState, useEffect, useCallback } from "react";
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
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Chip,
  Grid,
  TablePagination,
  TableSortLabel,
  Alert,
  Autocomplete,
} from "@mui/material";
import {
  Edit as EditIcon,
  Search as SearchIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  AttachMoney as MoneyIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";
import { calculateTotal } from "../../utils/helpers";
import { API_BASE_URL } from "../../../lib/api";

export default function AllChargesTab({
  cabs,
  drivers,
  canEdit,
  canMarkPaid,
  canBulkEdit,
  handleMarkChargePaid,
}) {
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Grand totals state (for all filtered data across all pages)
  const [grandTotalFare, setGrandTotalFare] = useState(0);
  const [grandTotalTip, setGrandTotalTip] = useState(0);
  const [grandTotalAmount, setGrandTotalAmount] = useState(0);
  
  // Sorting state
  const [orderBy, setOrderBy] = useState("tripDate");
  const [order, setOrder] = useState("desc");
  
  // Data state
  const [charges, setCharges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customerNames, setCustomerNames] = useState([]);
  
  // Bulk edit state (managed internally)
  const [allChargesBulkEdit, setAllChargesBulkEdit] = useState(false);
  const [bulkEditAllCharges, setBulkEditAllCharges] = useState([]);
  
  // Filter state (input values)
  const [filterCustomerName, setFilterCustomerName] = useState("");
  const [filterCabId, setFilterCabId] = useState("");
  const [filterDriverId, setFilterDriverId] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterPaidStatus, setFilterPaidStatus] = useState("all");
  
  // Applied filters (used in API call)
  const [appliedCustomerName, setAppliedCustomerName] = useState("");
  const [appliedCabId, setAppliedCabId] = useState("");
  const [appliedDriverId, setAppliedDriverId] = useState("");
  const [appliedStartDate, setAppliedStartDate] = useState("");
  const [appliedEndDate, setAppliedEndDate] = useState("");
  const [appliedPaidStatus, setAppliedPaidStatus] = useState("all");

  // Natural sort function for cab numbers (e.g., M1, M2, M11, M123)
  const naturalSort = (a, b) => {
    const ax = [];
    const bx = [];
    a.replace(/(\d+)|(\D+)/g, (_, num, str) => {
      ax.push([num || Infinity, str || ""]);
    });
    b.replace(/(\d+)|(\D+)/g, (_, num, str) => {
      bx.push([num || Infinity, str || ""]);
    });
    while (ax.length && bx.length) {
      const an = ax.shift();
      const bn = bx.shift();
      const nn = (an[0] - bn[0]) || an[1].localeCompare(bn[1]);
      if (nn) return nn;
    }
    return ax.length - bx.length;
  };

  // Sort cabs by cab number (natural sort)
  const sortedCabs = cabs ? [...cabs].sort((a, b) => naturalSort(a.cabNumber, b.cabNumber)) : [];

  // Calculate totals for current page
  const pageTotalFare = charges.reduce((sum, c) => sum + (parseFloat(c.fareAmount) || 0), 0);
  const pageTotalTip = charges.reduce((sum, c) => sum + (parseFloat(c.tipAmount) || 0), 0);
  const pageTotalAmount = pageTotalFare + pageTotalTip;

  // Sort drivers by name (first name, then last name)
  const sortedDrivers = drivers ? [...drivers].sort((a, b) => {
    const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
    const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
    return nameA.localeCompare(nameB);
  }) : [];

  // Extract unique customer names from charges data
  useEffect(() => {
    if (charges && charges.length > 0) {
      const uniqueNames = [...new Set(
        charges
          .map(charge => charge.customerName)
          .filter(name => name && name.trim() !== '')
      )].sort((a, b) => a.localeCompare(b));
      
      setCustomerNames(prevNames => {
        // Merge with existing names to build up the list over time
        const merged = [...new Set([...prevNames, ...uniqueNames])];
        return merged.sort((a, b) => a.localeCompare(b));
      });
    }
  }, [charges]);

  const loadChargesWithPagination = useCallback(async (filterOverrides = {}) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      
      // Use overrides if provided, otherwise use applied filter state
      const filters = {
        customerName: filterOverrides.customerName !== undefined ? filterOverrides.customerName : appliedCustomerName,
        cabId: filterOverrides.cabId !== undefined ? filterOverrides.cabId : appliedCabId,
        driverId: filterOverrides.driverId !== undefined ? filterOverrides.driverId : appliedDriverId,
        startDate: filterOverrides.startDate !== undefined ? filterOverrides.startDate : appliedStartDate,
        endDate: filterOverrides.endDate !== undefined ? filterOverrides.endDate : appliedEndDate,
        paidStatus: filterOverrides.paidStatus !== undefined ? filterOverrides.paidStatus : appliedPaidStatus,
      };
      
      // Build query parameters with filters
      const params = new URLSearchParams({
        page: page.toString(),
        size: rowsPerPage.toString(),
        sortBy: orderBy,
        sortDir: order,
      });
      
      // Add filters if they exist
      // Enhanced: Try multiple parameter variations for customer name
      if (filters.customerName) {
        params.append('customerName', filters.customerName);
        console.log('🔍 Applying customer name filter:', filters.customerName);
      }
      if (filters.cabId) {
        params.append('cabId', filters.cabId);
        console.log('🚕 Applying cab filter:', filters.cabId);
      }
      if (filters.driverId) {
        params.append('driverId', filters.driverId);
        // Try alternative parameter names the backend might expect
        params.append('driver', filters.driverId);
        console.log('👤 Applying driver filter:', filters.driverId, 'Type:', typeof filters.driverId);
        console.log('👤 Trying both driverId and driver parameters');
      }
      if (filters.startDate) {
        params.append('startDate', filters.startDate);
        // Try alternative parameter names
        params.append('tripDateFrom', filters.startDate);
        params.append('fromDate', filters.startDate);
        console.log('📅 Applying start date filter:', filters.startDate);
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate);
        // Try alternative parameter names
        params.append('tripDateTo', filters.endDate);
        params.append('toDate', filters.endDate);
        console.log('📅 Applying end date filter:', filters.endDate);
      }
      if (filters.paidStatus !== 'all') {
        params.append('paid', filters.paidStatus === 'paid');
        console.log('💰 Applying paid status filter:', filters.paidStatus === 'paid');
      }
      
      const url = `${API_BASE_URL}/account-charges?${params.toString()}`;
      console.log('🌐 Fetching charges with URL:', url);
      console.log('📋 Applied filters:', filters);
      console.log('🔗 Full query string:', params.toString());
      
      const response = await fetch(url,
        {
          headers: { 
            "Authorization": `Bearer ${token}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            "Content-Type": "application/json",
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Charges loaded successfully:', {
          count: data.content?.length,
          totalItems: data.totalItems,
          totalPages: data.totalPages,
          appliedFilters: filters,
          customerNameFilter: filters.customerName || 'none'
        });
        setCharges(data.content || []);
        setTotalItems(data.totalItems || 0);
        setTotalPages(data.totalPages || 0);
        setBulkEditAllCharges(data.content?.map(c => ({ ...c })) || []);
        
        // Set grand totals from API response if available, otherwise fetch separately
        if (data.totalFareAmount !== undefined) {
          setGrandTotalFare(data.totalFareAmount || 0);
          setGrandTotalTip(data.totalTipAmount || 0);
          setGrandTotalAmount((data.totalFareAmount || 0) + (data.totalTipAmount || 0));
        } else {
          // Fetch grand totals separately if not in paginated response
          fetchGrandTotals(filters);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to load charges:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          url: url,
          filters: filters,
          customerNameUsed: filters.customerName
        });
        setError(`Failed to load charges (${response.status}). Please try again.`);
      }
    } catch (err) {
      console.error("Error loading charges:", err);
      setError("Failed to load charges. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, orderBy, order, appliedCustomerName, appliedCabId, appliedDriverId, appliedStartDate, appliedEndDate, appliedPaidStatus]);

  // Fetch grand totals for all filtered data (separate API call)
  const fetchGrandTotals = useCallback(async (filters) => {
    try {
      const token = localStorage.getItem("token");
      
      // Build query parameters with same filters but request totals
      const params = new URLSearchParams();
      if (filters.customerName) params.append('customerName', filters.customerName);
      if (filters.cabId) params.append('cabId', filters.cabId);
      if (filters.driverId) params.append('driverId', filters.driverId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.paidStatus !== 'all') params.append('paid', filters.paidStatus === 'paid');
      
      // Try to fetch totals from a dedicated endpoint first
      const totalsUrl = `${API_BASE_URL}/account-charges/totals?${params.toString()}`;
      const response = await fetch(totalsUrl, {
        headers: { 
          "Authorization": `Bearer ${token}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          "Content-Type": "application/json",
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });
      
      if (response.ok) {
        const totals = await response.json();
        setGrandTotalFare(totals.totalFareAmount || 0);
        setGrandTotalTip(totals.totalTipAmount || 0);
        setGrandTotalAmount((totals.totalFareAmount || 0) + (totals.totalTipAmount || 0));
      } else {
        // If no totals endpoint, set grand totals to 0 (page totals will still show)
        console.log('Totals endpoint not available, using page totals only');
        setGrandTotalFare(0);
        setGrandTotalTip(0);
        setGrandTotalAmount(0);
      }
    } catch (err) {
      console.error("Error fetching grand totals:", err);
    }
  }, []);

  // Load charges with pagination and filters
  useEffect(() => {
    loadChargesWithPagination();
  }, [loadChargesWithPagination]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to first page
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const applyFilters = async () => {
    console.log('🎯 Apply Filters clicked with values:', {
      customerName: filterCustomerName,
      cabId: filterCabId,
      driverId: filterDriverId,
      startDate: filterStartDate,
      endDate: filterEndDate,
      paidStatus: filterPaidStatus
    });
    console.log('📅 Date filter details:', {
      startDateEmpty: !filterStartDate,
      endDateEmpty: !filterEndDate,
      startDateValue: filterStartDate,
      endDateValue: filterEndDate,
      startDateType: typeof filterStartDate,
      endDateType: typeof filterEndDate
    });
    
    // Apply the current filter values
    setAppliedCustomerName(filterCustomerName);
    setAppliedCabId(filterCabId);
    setAppliedDriverId(filterDriverId);
    setAppliedStartDate(filterStartDate);
    setAppliedEndDate(filterEndDate);
    setAppliedPaidStatus(filterPaidStatus);
    // Reset to first page when applying filters
    setPage(0);
    
    // Immediately load with the new filter values
    await loadChargesWithPagination({
      customerName: filterCustomerName,
      cabId: filterCabId,
      driverId: filterDriverId,
      startDate: filterStartDate,
      endDate: filterEndDate,
      paidStatus: filterPaidStatus,
    });
  };

  const clearFilters = async () => {
    // Clear input values
    setFilterCustomerName("");
    setFilterCabId("");
    setFilterDriverId("");
    setFilterStartDate("");
    setFilterEndDate("");
    setFilterPaidStatus("all");
    // Clear applied filters
    setAppliedCustomerName("");
    setAppliedCabId("");
    setAppliedDriverId("");
    setAppliedStartDate("");
    setAppliedEndDate("");
    setAppliedPaidStatus("all");
    setPage(0);
    
    // Immediately load with cleared filters
    await loadChargesWithPagination({
      customerName: "",
      cabId: "",
      driverId: "",
      startDate: "",
      endDate: "",
      paidStatus: "all",
    });
  };

  const handleEnterAllChargesBulkEdit = () => {
    setAllChargesBulkEdit(true);
    setBulkEditAllCharges(charges.map(c => ({ ...c })));
  };

  const handleCancelAllChargesBulkEdit = () => {
    setAllChargesBulkEdit(false);
    setBulkEditAllCharges([]);
  };

  const handleAllChargesBulkEditChange = (index, field, value) => {
    const updated = [...bulkEditAllCharges];
    updated[index] = { ...updated[index], [field]: value };
    setBulkEditAllCharges(updated);
  };

  const handleSaveAllChargesBulkEdit = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("token");
      
      // Find only charges where tip amount has changed
      const changedCharges = bulkEditAllCharges.filter((editedCharge, index) => {
        const originalCharge = charges[index];
        const originalTip = parseFloat(originalCharge.tipAmount) || 0;
        const editedTip = parseFloat(editedCharge.tipAmount) || 0;
        return originalTip !== editedTip;
      });

      if (changedCharges.length === 0) {
        setError("No changes detected");
        setLoading(false);
        return;
      }

      console.log(`💾 Saving ${changedCharges.length} changed charges in bulk`);
      
      // Prepare batch update payload with only tip amounts
      const bulkUpdatePayload = changedCharges.map(charge => ({
        id: charge.id,
        tipAmount: parseFloat(charge.tipAmount) || 0
      }));

      // Send all changes in one request
      const response = await fetch(`${API_BASE_URL}/account-charges/bulk-update-tips`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          "Content-Type": "application/json",
          "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
        body: JSON.stringify(bulkUpdatePayload),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Successfully updated ${changedCharges.length} charges`);
        setAllChargesBulkEdit(false);
        setBulkEditAllCharges([]);
        loadChargesWithPagination(); // Reload data
      } else {
        const errorText = await response.text();
        console.error('❌ Bulk update failed:', errorText);
        setError(`Failed to update charges: ${response.status}`);
      }
    } catch (err) {
      console.error("Error saving bulk edits:", err);
      setError("Failed to save changes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters Section */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FilterIcon /> Filters
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ClearIcon />}
            onClick={clearFilters}
          >
            Clear All
          </Button>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={2}>
            <Autocomplete
              freeSolo
              size="small"
              options={customerNames}
              value={filterCustomerName}
              onInputChange={(event, newValue) => {
                setFilterCustomerName(newValue || "");
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Customer Name"
                  placeholder="Search customer..."
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Autocomplete
              size="small"
              options={sortedCabs}
              getOptionLabel={(option) => option ? `${option.cabNumber} - ${option.cabType}` : ""}
              value={sortedCabs.find(cab => cab.id === filterCabId) || null}
              onChange={(event, newValue) => {
                setFilterCabId(newValue ? newValue.id : "");
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Cab"
                  placeholder="Search cab..."
                />
              )}
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Autocomplete
              size="small"
              options={sortedDrivers}
              getOptionLabel={(option) => option ? `${option.firstName} ${option.lastName}` : ""}
              getOptionKey={(option) => `driver-${option.id}-${option.firstName}-${option.lastName}`}
              value={sortedDrivers.find(driver => driver.id === filterDriverId) || null}
              onChange={(event, newValue) => {
                const driverId = newValue ? newValue.id : "";
                console.log('👤 Driver selected:', newValue ? `${newValue.firstName} ${newValue.lastName}` : 'None', 'ID:', driverId);
                setFilterDriverId(driverId);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Driver"
                  placeholder="Search driver..."
                />
              )}
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <TextField
              label="Start Date"
              type="date"
              size="small"
              fullWidth
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <TextField
              label="End Date"
              type="date"
              size="small"
              fullWidth
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={1}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<SearchIcon />}
              onClick={applyFilters}
              sx={{ height: "40px" }}
            >
              Filter
            </Button>
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Payment Status</InputLabel>
              <Select
                value={filterPaidStatus}
                label="Payment Status"
                onChange={(e) => setFilterPaidStatus(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="paid">Paid Only</MenuItem>
                <MenuItem value="unpaid">Unpaid Only</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Action Buttons */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6">
          All Charges ({totalItems} total)
        </Typography>
        {canBulkEdit && (
          <Box sx={{ display: "flex", gap: 1 }}>
            {!allChargesBulkEdit && (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEnterAllChargesBulkEdit}
                disabled={charges.length === 0}
              >
                Bulk Edit
              </Button>
            )}
            {allChargesBulkEdit && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<CloseIcon />}
                  onClick={handleCancelAllChargesBulkEdit}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveAllChargesBulkEdit}
                >
                  Save All
                </Button>
              </>
            )}
          </Box>
        )}
      </Box>

      {/* All Charges Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === "customerName"}
                  direction={orderBy === "customerName" ? order : "asc"}
                  onClick={() => handleRequestSort("customerName")}
                >
                  Customer
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === "tripDate"}
                  direction={orderBy === "tripDate" ? order : "asc"}
                  onClick={() => handleRequestSort("tripDate")}
                >
                  Date
                </TableSortLabel>
              </TableCell>
              <TableCell>Job Code</TableCell>
              <TableCell>Passenger</TableCell>
              <TableCell>Cab</TableCell>
              <TableCell>Driver</TableCell>
              <TableCell>Pickup</TableCell>
              <TableCell>Dropoff</TableCell>
              <TableCell align="right">
                <Box>
                  <TableSortLabel
                    active={orderBy === "fareAmount"}
                    direction={orderBy === "fareAmount" ? order : "asc"}
                    onClick={() => handleRequestSort("fareAmount")}
                  >
                    Fare
                  </TableSortLabel>
                  <Typography variant="h6" display="block" color="primary" fontWeight="bold" sx={{ fontSize: '1.1rem' }}>
                    ${grandTotalFare > 0 ? grandTotalFare.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : pageTotalFare.toFixed(2)}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell align="right">
                <Box>
                  <Typography variant="body2">Tip</Typography>
                  <Typography variant="h6" display="block" color="primary" fontWeight="bold" sx={{ fontSize: '1.1rem' }}>
                    ${grandTotalTip > 0 ? grandTotalTip.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : pageTotalTip.toFixed(2)}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell align="right">
                <Box>
                  <Typography variant="body2">Total</Typography>
                  <Typography variant="h6" display="block" color="success.main" fontWeight="bold" sx={{ fontSize: '1.2rem' }}>
                    ${grandTotalAmount > 0 ? grandTotalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : pageTotalAmount.toFixed(2)}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>Status</TableCell>
              {!allChargesBulkEdit && canEdit && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={13} align="center" sx={{ py: 5 }}>
                  <Typography>Loading...</Typography>
                </TableCell>
              </TableRow>
            ) : charges.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} align="center" sx={{ py: 5 }}>
                  <Typography color="text.secondary">No charges found</Typography>
                </TableCell>
              </TableRow>
            ) : !allChargesBulkEdit ? charges.map((charge) => (
              <TableRow key={charge.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {charge.customerName}
                  </Typography>
                </TableCell>
                <TableCell>{charge.tripDate}</TableCell>
                <TableCell>{charge.jobCode}</TableCell>
                <TableCell>{charge.passengerName}</TableCell>
                <TableCell>
                  {charge.cab ? `${charge.cab.cabNumber}` : "-"}
                </TableCell>
                <TableCell>
                  {charge.driver ? `${charge.driver.firstName} ${charge.driver.lastName}` : "-"}
                </TableCell>
                <TableCell>{charge.pickupAddress}</TableCell>
                <TableCell>{charge.dropoffAddress}</TableCell>
                <TableCell align="right">${charge.fareAmount}</TableCell>
                <TableCell align="right">${charge.tipAmount || 0}</TableCell>
                <TableCell align="right">
                  <Typography fontWeight="bold">
                    ${calculateTotal(charge.fareAmount, charge.tipAmount)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={charge.paid ? "Paid" : "Unpaid"}
                    color={charge.paid ? "success" : "warning"}
                    size="small"
                  />
                </TableCell>
                {canEdit && (
                  <TableCell align="right">
                    {!charge.paid && canMarkPaid && (
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => handleMarkChargePaid(charge.id)}
                        title="Mark as Paid"
                      >
                        <MoneyIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                )}
              </TableRow>
            )) : bulkEditAllCharges?.map((charge, index) => (
              <TableRow key={charge.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {charge.customerName}
                  </Typography>
                </TableCell>
                <TableCell>{charge.tripDate}</TableCell>
                <TableCell>{charge.jobCode || "-"}</TableCell>
                <TableCell>{charge.passengerName || "-"}</TableCell>
                <TableCell>
                  {charge.cab ? `${charge.cab.cabNumber}` : "-"}
                </TableCell>
                <TableCell>
                  {charge.driver ? `${charge.driver.firstName} ${charge.driver.lastName}` : "-"}
                </TableCell>
                <TableCell>{charge.pickupAddress || "-"}</TableCell>
                <TableCell>{charge.dropoffAddress || "-"}</TableCell>
                <TableCell align="right">${charge.fareAmount}</TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    type="number"
                    value={charge.tipAmount || 0}
                    onChange={(e) => handleAllChargesBulkEditChange(index, "tipAmount", e.target.value)}
                    InputProps={{ startAdornment: "$" }}
                    sx={{ width: 80 }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight="bold">
                    ${calculateTotal(charge.fareAmount, charge.tipAmount)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={charge.paid ? "Paid" : "Unpaid"}
                    color={charge.paid ? "success" : "warning"}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {/* Pagination Controls */}
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={totalItems}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
          }
        />
      </TableContainer>
    </Box>
  );
}