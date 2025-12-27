"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  IconButton,
  Chip,
  Tooltip,
  Alert,
  Autocomplete,
  TablePagination,
  Collapse,
  Paper,
  Checkbox,
  TableSortLabel,
} from "@mui/material";
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowUp as ExpandLessIcon,
} from "@mui/icons-material";
import { API_BASE_URL } from "../../lib/api";

export default function DataPreviewStep({
  previewData,
  editedData,
  onDataChange,
  onBack,
  onImport,
  importing,
}) {
  const [editingRow, setEditingRow] = useState(null);
  const [editFormData, setEditFormData] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [allCabs, setAllCabs] = useState([]);
  const [allDrivers, setAllDrivers] = useState([]);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [bulkEditDriver, setBulkEditDriver] = useState(null);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [orderBy, setOrderBy] = useState("transactionDate");
  const [order, setOrder] = useState("asc");

  // Load cabs and drivers for autocomplete
  useEffect(() => {
    loadCabsAndDrivers();
  }, []);

  const loadCabsAndDrivers = async () => {
    try {
      const [cabsResponse, driversResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/cabs`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
        fetch(`${API_BASE_URL}/drivers`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }),
      ]);

      if (cabsResponse.ok) {
        const cabs = await cabsResponse.json();
        setAllCabs(cabs);
      }
      if (driversResponse.ok) {
        const drivers = await driversResponse.json();
        setAllDrivers(drivers);
      }
    } catch (err) {
      console.error("Failed to load cabs/drivers:", err);
    }
  };

  // Sorting logic
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const getComparator = (order, orderBy) => {
    return order === "desc"
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  };

  const descendingComparator = (a, b, orderBy) => {
    let aVal, bVal;

    switch (orderBy) {
      case "status":
        aVal = getStatusValue(a);
        bVal = getStatusValue(b);
        break;
      case "transactionDate":
        aVal = a.transactionDate || "";
        bVal = b.transactionDate || "";
        break;
      case "cabNumber":
        aVal = a.cabNumber || "";
        bVal = b.cabNumber || "";
        break;
      case "driverName":
        aVal = a.driverName || "";
        bVal = b.driverName || "";
        break;
      default:
        aVal = a[orderBy] || "";
        bVal = b[orderBy] || "";
    }

    if (bVal < aVal) return -1;
    if (bVal > aVal) return 1;
    return 0;
  };

  const getStatusValue = (row) => {
    if (!row.valid) return 0;
    if (!row.cabLookupSuccess) return 1;
    if (!row.driverLookupSuccess) return 2;
    return 3;
  };

  const sortedData = useMemo(() => {
    return [...editedData].sort(getComparator(order, orderBy));
  }, [editedData, order, orderBy]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEditRow = (row, index) => {
    setEditingRow(index);
    setEditFormData({ ...row });
  };

  const handleCancelEdit = () => {
    setEditingRow(null);
    setEditFormData(null);
  };

  const handleSaveEdit = () => {
    const newData = [...editedData];
    const originalIndex = editedData.findIndex(
      (item) => item === sortedData[editingRow]
    );
    newData[originalIndex] = editFormData;
    onDataChange(newData);
    setEditingRow(null);
    setEditFormData(null);
  };

  const handleFieldChange = (field, value) => {
    setEditFormData((prev) => {
      const updates = { ...prev, [field]: value };
      
      // If driver is being changed, update the lookup success flag
      if (field === "driverNumber") {
        updates.driverLookupSuccess = !!value;
      }
      
      // If cab is being changed, update the lookup success flag
      if (field === "cabNumber") {
        updates.cabLookupSuccess = !!value;
      }
      
      return updates;
    });
  };

  const toggleRowExpanded = (index) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  // Bulk selection
  const handleSelectRow = (index) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
    setShowBulkEdit(newSelected.size > 0);
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const missingDriverRows = sortedData
        .map((row, idx) => ({ row, idx }))
        .filter(({ row }) => !row.driverNumber)
        .map(({ idx }) => idx);
      setSelectedRows(new Set(missingDriverRows));
      setShowBulkEdit(missingDriverRows.length > 0);
    } else {
      setSelectedRows(new Set());
      setShowBulkEdit(false);
    }
  };

  const handleBulkApplyDriver = () => {
    if (!bulkEditDriver) return;

    const newData = [...editedData];
    selectedRows.forEach((index) => {
      const row = sortedData[index];
      const originalIndex = editedData.findIndex((item) => item === row);
      if (originalIndex !== -1) {
        newData[originalIndex] = {
          ...newData[originalIndex],
          driverNumber: bulkEditDriver.driverNumber,
          driverName: `${bulkEditDriver.firstName} ${bulkEditDriver.lastName}`,
          driverLookupSuccess: true,
        };
      }
    });

    onDataChange(newData);
    setSelectedRows(new Set());
    setBulkEditDriver(null);
    setShowBulkEdit(false);
  };

  const handleCancelBulkEdit = () => {
    setSelectedRows(new Set());
    setBulkEditDriver(null);
    setShowBulkEdit(false);
  };

  const getStatusChip = (row) => {
    if (!row.valid) {
      return <Chip icon={<ErrorIcon />} label="Invalid" color="error" size="small" />;
    }
    if (!row.cabLookupSuccess) {
      return <Chip icon={<WarningIcon />} label="No Cab" color="warning" size="small" />;
    }
    if (!row.driverLookupSuccess) {
      return <Chip icon={<WarningIcon />} label="No Driver" color="warning" size="small" />;
    }
    return <Chip icon={<CheckIcon />} label="Ready" color="success" size="small" />;
  };

  const formatCurrency = (amount) => {
    return amount ? `$${parseFloat(amount).toFixed(2)}` : "-";
  };

  const formatDate = (date) => {
    return date || "-";
  };

  const formatTime = (time) => {
    return time || "-";
  };

  if (!previewData || !editedData) {
    return <Typography>No data to preview</Typography>;
  }

  const paginatedData = sortedData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const missingDriverCount = editedData.filter((r) => !r.driverNumber).length;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6">
          Step 2: Review & Edit Data ({editedData.length} rows)
        </Typography>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Valid: {editedData.filter((r) => r.valid).length} | 
            Invalid: {editedData.filter((r) => !r.valid).length} | 
            Missing Driver: {missingDriverCount}
          </Typography>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2">
          Review the data below. The system has automatically matched merchants to cabs and 
          identified drivers from shift data. You can edit any fields before importing.
          {missingDriverCount > 0 && (
            <strong> Select rows with missing drivers and use bulk edit to assign a driver.</strong>
          )}
        </Typography>
      </Alert>

      {/* Bulk Edit Panel */}
      {showBulkEdit && (
        <Paper sx={{ p: 2, mb: 2, backgroundColor: "#e3f2fd" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Bulk Edit ({selectedRows.size} rows selected)
            </Typography>
            <Autocomplete
              options={allDrivers}
              getOptionLabel={(option) =>
                `${option.driverNumber} - ${option.firstName} ${option.lastName}`
              }
              value={bulkEditDriver}
              onChange={(e, newValue) => setBulkEditDriver(newValue)}
              size="small"
              renderInput={(params) => (
                <TextField {...params} label="Select Driver" placeholder="Choose a driver" />
              )}
              sx={{ minWidth: 300 }}
            />
            <Button
              variant="contained"
              size="small"
              onClick={handleBulkApplyDriver}
              disabled={!bulkEditDriver}
            >
              Apply to Selected
            </Button>
            <Button variant="outlined" size="small" onClick={handleCancelBulkEdit}>
              Cancel
            </Button>
          </Box>
        </Paper>
      )}

      {/* Column Mapping Summary */}
      <Paper sx={{ p: 2, mb: 2, backgroundColor: "#f5f5f5" }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Detected Column Mappings:
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {Object.entries(previewData.detectedMappings || {}).map(([field, column]) => (
            <Chip
              key={field}
              label={`${column} → ${field}`}
              size="small"
              variant="outlined"
            />
          ))}
        </Box>
      </Paper>

      <TableContainer sx={{ mb: 2, maxHeight: 600 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={
                    selectedRows.size > 0 && selectedRows.size < missingDriverCount
                  }
                  checked={missingDriverCount > 0 && selectedRows.size === missingDriverCount}
                  onChange={handleSelectAll}
                  disabled={missingDriverCount === 0}
                />
              </TableCell>
              <TableCell padding="checkbox" />
              <TableCell>
                <TableSortLabel
                  active={orderBy === "status"}
                  direction={orderBy === "status" ? order : "asc"}
                  onClick={() => handleRequestSort("status")}
                >
                  Status
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === "transactionDate"}
                  direction={orderBy === "transactionDate" ? order : "asc"}
                  onClick={() => handleRequestSort("transactionDate")}
                >
                  Date
                </TableSortLabel>
              </TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Merchant</TableCell>
              <TableCell>Terminal</TableCell>
              <TableCell>Auth Code</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === "cabNumber"}
                  direction={orderBy === "cabNumber" ? order : "asc"}
                  onClick={() => handleRequestSort("cabNumber")}
                >
                  Cab Number
                </TableSortLabel>
              </TableCell>
              <TableCell>Driver Number</TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === "driverName"}
                  direction={orderBy === "driverName" ? order : "asc"}
                  onClick={() => handleRequestSort("driverName")}
                >
                  Driver Name
                </TableSortLabel>
              </TableCell>
              <TableCell>Card Type</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((row, index) => {
              const actualIndex = page * rowsPerPage + index;
              const isEditing = editingRow === actualIndex;
              const isExpanded = expandedRows.has(actualIndex);
              const isSelected = selectedRows.has(actualIndex);
              const displayRow = isEditing ? editFormData : row;
              const canSelect = !row.driverNumber;

              return (
                <>
                  <TableRow
                    key={actualIndex}
                    sx={{
                      backgroundColor: !row.valid
                        ? "#ffebee"
                        : row.cabLookupSuccess && row.driverLookupSuccess
                        ? "#e8f5e9"
                        : "#fff3e0",
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleSelectRow(actualIndex)}
                        disabled={!canSelect}
                      />
                    </TableCell>
                    <TableCell padding="checkbox">
                      <IconButton size="small" onClick={() => toggleRowExpanded(actualIndex)}>
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </TableCell>
                    <TableCell>{getStatusChip(displayRow)}</TableCell>
                    <TableCell>{formatDate(displayRow.transactionDate)}</TableCell>
                    <TableCell>{formatTime(displayRow.transactionTime)}</TableCell>
                    <TableCell>{displayRow.merchantId || "-"}</TableCell>
                    <TableCell>{displayRow.terminalId || "-"}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                        {displayRow.authorizationCode || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatCurrency(displayRow.amount)}</TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Autocomplete
                          options={allCabs}
                          getOptionLabel={(option) => option.cabNumber || ""}
                          value={allCabs.find((c) => c.cabNumber === editFormData.cabNumber) || null}
                          onChange={(e, newValue) =>
                            handleFieldChange("cabNumber", newValue?.cabNumber || "")
                          }
                          size="small"
                          renderInput={(params) => <TextField {...params} />}
                          sx={{ minWidth: 120 }}
                        />
                      ) : (
                        <Chip
                          label={displayRow.cabNumber || "Not Set"}
                          size="small"
                          color={displayRow.cabNumber ? "primary" : "default"}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Autocomplete
                          options={allDrivers}
                          getOptionLabel={(option) => option.driverNumber || ""}
                          value={
                            allDrivers.find((d) => d.driverNumber === editFormData.driverNumber) ||
                            null
                          }
                          onChange={(e, newValue) => {
                            if (newValue) {
                              setEditFormData((prev) => ({
                                ...prev,
                                driverNumber: newValue.driverNumber,
                                driverName: `${newValue.firstName} ${newValue.lastName}`,
                                driverLookupSuccess: true,
                              }));
                            } else {
                              setEditFormData((prev) => ({
                                ...prev,
                                driverNumber: "",
                                driverName: "",
                                driverLookupSuccess: false,
                              }));
                            }
                          }}
                          size="small"
                          renderInput={(params) => <TextField {...params} />}
                          sx={{ minWidth: 120 }}
                        />
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{
                            color: displayRow.driverNumber ? "inherit" : "error.main",
                            fontWeight: displayRow.driverNumber ? "normal" : "bold",
                          }}
                        >
                          {displayRow.driverNumber || "Missing"}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <TextField
                          value={editFormData.driverName || ""}
                          onChange={(e) => handleFieldChange("driverName", e.target.value)}
                          size="small"
                          sx={{ minWidth: 150 }}
                        />
                      ) : (
                        <Typography variant="body2">{displayRow.driverName || "-"}</Typography>
                      )}
                    </TableCell>
                    <TableCell>{displayRow.cardType || "-"}</TableCell>
                    <TableCell align="right">
                      {isEditing ? (
                        <>
                          <IconButton size="small" onClick={handleSaveEdit} color="success">
                            <SaveIcon />
                          </IconButton>
                          <IconButton size="small" onClick={handleCancelEdit} color="error">
                            <CancelIcon />
                          </IconButton>
                        </>
                      ) : (
                        <IconButton
                          size="small"
                          onClick={() => handleEditRow(row, actualIndex)}
                          disabled={editingRow !== null}
                        >
                          <EditIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>

                  {/* Expanded Row Details */}
                  <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={14}>
                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Box sx={{ p: 2, backgroundColor: "#f5f5f5" }}>
                          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                            Additional Details
                          </Typography>
                          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Settlement Date
                              </Typography>
                              <Typography variant="body2">
                                {formatDate(row.settlementDate)}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Batch Number
                              </Typography>
                              <Typography variant="body2">{row.batchNumber || "-"}</Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Card Last 4
                              </Typography>
                              <Typography variant="body2">{row.cardLastFour || "-"}</Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Tip Amount
                              </Typography>
                              <Typography variant="body2">
                                {formatCurrency(row.tipAmount)}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Total Amount
                              </Typography>
                              <Typography variant="body2">
                                {formatCurrency(row.totalAmount)}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Status
                              </Typography>
                              <Typography variant="body2">
                                {row.transactionStatus || "-"}
                              </Typography>
                            </Box>
                            {row.lookupMessage && (
                              <Box sx={{ gridColumn: "span 3" }}>
                                <Typography variant="caption" color="text.secondary">
                                  Lookup Info
                                </Typography>
                                <Typography variant="body2">{row.lookupMessage}</Typography>
                              </Box>
                            )}
                            {row.validationMessage && (
                              <Box sx={{ gridColumn: "span 3" }}>
                                <Alert severity="error" sx={{ py: 0 }}>
                                  {row.validationMessage}
                                </Alert>
                              </Box>
                            )}
                            {row.notes && (
                              <Box sx={{ gridColumn: "span 3" }}>
                                <Typography variant="caption" color="text.secondary">
                                  Notes
                                </Typography>
                                <Typography variant="body2">{row.notes}</Typography>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={editedData.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[10, 25, 50, 100]}
      />

      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, mt: 3 }}>
        <Button variant="outlined" onClick={onBack} disabled={importing}>
          Back
        </Button>
        <Button
          variant="contained"
          onClick={onImport}
          disabled={importing || editedData.filter((r) => r.valid).length === 0}
          size="large"
        >
          {importing ? "Importing..." : `Import ${editedData.filter((r) => r.valid).length} Valid Transactions`}
        </Button>
      </Box>
    </Box>
  );
}