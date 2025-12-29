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
        // Also try alternative parameter names the backend might expect
        console.log('🔍 Applying customer name filter:', filters.customerName);
      }
      if (filters.cabId) params.append('cabId', filters.cabId);
      if (filters.driverId) params.append('driverId', filters.driverId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.paidStatus !== 'all') params.append('paid', filters.paidStatus === 'paid');
      
      const url = `${API_BASE_URL}/account-charges?${params.toString()}`;
      console.log('🌐 Fetching charges with URL:', url);
      console.log('📋 Applied filters:', filters);
      console.log('🔗 Full query string:', params.toString());
      
      const response = await fetch(url,
        {
          headers: { 
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
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
      
      // Update each charge
      const updatePromises = bulkEditAllCharges.map(charge => {
        // Build update payload with only the fields that should be updated
        const payload = {
          id: charge.id,
          accountId: charge.accountId || charge.accountCustomer?.accountId,
          subAccount: charge.subAccount || null,
          jobCode: charge.jobCode,
          passengerName: charge.passengerName,
          pickupAddress: charge.pickupAddress,
          dropoffAddress: charge.dropoffAddress,
          fareAmount: parseFloat(charge.fareAmount),
          tipAmount: parseFloat(charge.tipAmount) || 0,
          tripDate: charge.tripDate,
          paid: charge.paid,
          invoiceNumber: charge.invoiceNumber,
          // Include customer ID separately (not the whole object)
          accountCustomer: charge.accountCustomer?.id ? { id: charge.accountCustomer.id } : null,
          // Include cab and driver IDs if they exist
          cab: charge.cab?.id ? { id: charge.cab.id } : null,
          driver: charge.driver?.id ? { id: charge.driver.id } : null,
        };

        return fetch(`${API_BASE_URL}/account-charges/${charge.id}`, {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      });

      const responses = await Promise.all(updatePromises);
      const failedCount = responses.filter(r => !r.ok).length;

      if (failedCount > 0) {
        setError(`Failed to update ${failedCount} charge(s)`);
      } else {
        setAllChargesBulkEdit(false);
        setBulkEditAllCharges([]);
        loadChargesWithPagination(); // Reload data
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
              value={sortedDrivers.find(driver => driver.id === filterDriverId) || null}
              onChange={(event, newValue) => {
                setFilterDriverId(newValue ? newValue.id : "");
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
                <TableSortLabel
                  active={orderBy === "fareAmount"}
                  direction={orderBy === "fareAmount" ? order : "asc"}
                  onClick={() => handleRequestSort("fareAmount")}
                >
                  Fare
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">Tip</TableCell>
              <TableCell align="right">Total</TableCell>
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
                <TableCell>
                  <TextField
                    size="small"
                    value={charge.jobCode || ""}
                    onChange={(e) => handleAllChargesBulkEditChange(index, "jobCode", e.target.value)}
                    fullWidth
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    value={charge.passengerName || ""}
                    onChange={(e) => handleAllChargesBulkEditChange(index, "passengerName", e.target.value)}
                    fullWidth
                  />
                </TableCell>
                <TableCell>
                  {charge.cab ? `${charge.cab.cabNumber}` : "-"}
                </TableCell>
                <TableCell>
                  {charge.driver ? `${charge.driver.firstName} ${charge.driver.lastName}` : "-"}
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    value={charge.pickupAddress || ""}
                    onChange={(e) => handleAllChargesBulkEditChange(index, "pickupAddress", e.target.value)}
                    fullWidth
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    value={charge.dropoffAddress || ""}
                    onChange={(e) => handleAllChargesBulkEditChange(index, "dropoffAddress", e.target.value)}
                    fullWidth
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    type="number"
                    value={charge.fareAmount}
                    onChange={(e) => handleAllChargesBulkEditChange(index, "fareAmount", e.target.value)}
                    InputProps={{ startAdornment: "$" }}
                    sx={{ width: 100 }}
                  />
                </TableCell>
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