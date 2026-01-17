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
  Chip,
  Alert,
  Card,
  CardContent,
  Grid,
  Divider,
  Tooltip,
  IconButton,
  Collapse,
} from "@mui/material";
import {
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  DirectionsCar as CabIcon,
  Category as CategoryIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  MoneyOff as ReimbursableIcon,
  AttachFile as AttachFileIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { API_BASE_URL } from "../../../lib/api";

// ✅ Utility function to format dates to YYYY-MM-DD
const formatDateForAPI = (date) => {
  if (!date) return '';
  
  // If already in YYYY-MM-DD format, return as is
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  
  // Otherwise, convert to Date and format
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    console.error('Invalid date:', date);
    return '';
  }
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function OneTimeExpensesTab({ driverNumber, startDate, endDate, data }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [expandedCategory, setExpandedCategory] = useState(null);

  useEffect(() => {
    if (Array.isArray(data) && data.length > 0) {
      setExpenses(data);
      setLoading(false);
      setError("");
      return;
    }
    if (driverNumber && startDate && endDate) {
      loadOneTimeExpenses();
    }
  }, [driverNumber, startDate, endDate, data]);

  const loadOneTimeExpenses = async () => {
    setLoading(true);
    setError("");
    
    try {
      // ✅ Format dates to YYYY-MM-DD
      const formattedStartDate = formatDateForAPI(startDate);
      const formattedEndDate = formatDateForAPI(endDate);
      
      if (!formattedStartDate || !formattedEndDate) {
        throw new Error('Invalid date range');
      }
      
      console.log('Fetching expenses:', { formattedStartDate, formattedEndDate });
      
      // Fetch all one-time expenses for the date range
      const response = await fetch(
        `${API_BASE_URL}/one-time-expenses/between?startDate=${formattedStartDate}&endDate=${formattedEndDate}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load one-time expenses");
      }

      const allExpenses = await response.json();
      console.log('Loaded expenses:', allExpenses.length);
      
      // Filter expenses where this driver is responsible
      // Driver is responsible if:
      // 1. entityType is DRIVER and entityId matches
      // 2. entityType is OWNER and entityId matches (owner = driver in many cases)
      // 3. responsibleParty is DRIVER or OWNER and they match this driver
      
      const driverNumberStr = driverNumber != null ? String(driverNumber) : "";

      const driverExpenses = allExpenses.filter((expense) => {
        const expenseDriverNumberStr = expense?.driver?.driverNumber != null ? String(expense.driver.driverNumber) : null;
        const expenseOwnerNumberStr = expense?.owner?.driverNumber != null ? String(expense.owner.driverNumber) : null;
        const directDriverNumberStr = expense?.driverNumber != null ? String(expense.driverNumber) : null;
        const directOwnerNumberStr = expense?.ownerDriverNumber != null ? String(expense.ownerDriverNumber) : null;

        if (expense?.entityType === "DRIVER") {
          return expenseDriverNumberStr === driverNumberStr || directDriverNumberStr === driverNumberStr;
        }

        if (expense?.entityType === "OWNER") {
          return expenseOwnerNumberStr === driverNumberStr || directOwnerNumberStr === driverNumberStr;
        }

        return false;
      });

      console.log('Filtered to driver expenses:', driverExpenses.length);
      setExpenses(driverExpenses);
    } catch (err) {
      console.error("Error loading one-time expenses:", err);
      setError(`Failed to load one-time expenses: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getExpenseDate = (expense) => {
    return expense?.expenseDate || expense?.startDate || expense?.date || "";
  };

  const getExpenseCategoryName = (expense) => {
    return expense?.expenseCategory?.categoryName || expense?.category || "Uncategorized";
  };

  const getExpenseAmount = (expense) => {
    return parseFloat(expense?.amount ?? expense?.chargedAmount ?? expense?.originalAmount ?? 0);
  };

  const getExpenseDescription = (expense) => {
    const assignedToType = expense?.assignedToType != null ? String(expense.assignedToType).trim() : "";
    const assignedTo = expense?.assignedTo != null ? String(expense.assignedTo).trim() : "";
    const splitNote = expense?.splitNote != null ? String(expense.splitNote).trim() : "";

    const assignedPart = (assignedToType || assignedTo)
      ? `${assignedToType}${assignedToType && assignedTo ? " " : ""}${assignedTo}`.trim()
      : "";

    const combined = [assignedPart, splitNote].filter(Boolean).join(" - ");

    return combined || expense?.description || "-";
  };

  // Calculate totals
  const calculateTotals = () => {
    const total = expenses.reduce((sum, exp) => sum + getExpenseAmount(exp), 0);
    const reimbursable = expenses
      .filter(exp => exp.isReimbursable && !exp.isReimbursed)
      .reduce((sum, exp) => sum + getExpenseAmount(exp), 0);
    const reimbursed = expenses
      .filter(exp => exp.isReimbursed)
      .reduce((sum, exp) => sum + getExpenseAmount(exp), 0);
    
    return { total, reimbursable, reimbursed };
  };

  // Group expenses by category
  const groupByCategory = () => {
    const grouped = {};
    
    expenses.forEach(expense => {
      const categoryName = getExpenseCategoryName(expense);
      
      if (!grouped[categoryName]) {
        grouped[categoryName] = {
          categoryId: expense.expenseCategory?.id,
          categoryName,
          expenses: [],
          total: 0,
        };
      }
      
      grouped[categoryName].expenses.push(expense);
      grouped[categoryName].total += getExpenseAmount(expense);
    });
    
    return Object.values(grouped).sort((a, b) => b.total - a.total);
  };

  const getEntityDisplay = (expense) => {
    const entityTypeRaw = (expense?.assignedToType != null && expense?.assignedTo != null)
      ? `${expense.assignedToType}:${expense.assignedTo}`
      : (expense?.entityType || expense?.entity?.entityType || expense?.type || "");

    const parsedEntity = typeof entityTypeRaw === "string" && entityTypeRaw.includes(":")
      ? entityTypeRaw.split(":")
      : null;

    const entityType = parsedEntity?.[0] ? String(parsedEntity[0]).toUpperCase() : (entityTypeRaw ? String(entityTypeRaw).toUpperCase() : "");
    const derivedEntityId = parsedEntity?.[1] != null && String(parsedEntity[1]).trim() !== "" ? String(parsedEntity[1]).trim() : null;

    const entityId = derivedEntityId ?? expense?.entityId ?? expense?.entity?.id ?? expense?.entity?.entityId ?? null;

    if (entityType === "CAB") {
      const cabNumber = expense?.cab?.cabNumber || expense?.cabNumber || expense?.cab?.number;
      if (cabNumber) return `Cab ${cabNumber}`;
      if (entityId != null) return `Cab ${entityId}`;
      return "Cab";
    }

    if (entityType === "SHIFT") {
      const shiftType = expense?.shift?.shiftType || expense?.shiftType || expense?.shift?.type;
      if (shiftType) {
        const shiftTypeStr = String(shiftType).toUpperCase();
        if (shiftTypeStr === "DAY") return "Day Shift";
        if (shiftTypeStr === "NIGHT") return "Night Shift";
        return `${shiftTypeStr} Shift`;
      }
      if (entityId != null) return `Shift ${entityId}`;
      return "Shift";
    }

    if (entityType === "DRIVER") {
      const name = expense?.driver
        ? `${expense.driver.firstName || ""} ${expense.driver.lastName || ""}`.trim()
        : (expense?.driverName || expense?.entityName || "").trim();
      if (name) return name;

      const driverNumber = expense?.driver?.driverNumber ?? expense?.driverNumber;
      if (driverNumber != null) return `Driver ${driverNumber}`;
      if (entityId != null) return `Driver ${entityId}`;
      return "Driver";
    }

    if (entityType === "OWNER") {
      const name = expense?.owner
        ? `${expense.owner.firstName || ""} ${expense.owner.lastName || ""}`.trim()
        : (expense?.ownerName || expense?.entityName || "").trim();
      if (name) return name;

      const ownerDriverNumber = expense?.owner?.driverNumber ?? expense?.ownerDriverNumber;
      if (ownerDriverNumber != null) return `Owner ${ownerDriverNumber}`;
      if (entityId != null) return `Owner ${entityId}`;
      return "Owner";
    }

    if (entityType === "COMPANY") return "Company";

    if (entityType) {
      if (entityId != null) return `${entityType} ${entityId}`;
      return entityType;
    }

    if (entityId != null) return `Entity ${entityId}`;
    return "-";
  };

  const totals = calculateTotals();
  const groupedExpenses = groupByCategory();

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography>Loading one-time expenses...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (expenses.length === 0) {
    return (
      <Paper sx={{ p: 6, textAlign: "center" }}>
        <ReceiptIcon sx={{ fontSize: 80, color: "text.disabled", mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No One-Time Expenses
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No one-time expenses found for this driver in the selected period.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ReceiptIcon color="primary" />
                <Box>
                  <Typography color="textSecondary" variant="caption">
                    Total Expenses
                  </Typography>
                  <Typography variant="h6">
                    ${totals.total.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CategoryIcon color="secondary" />
                <Box>
                  <Typography color="textSecondary" variant="caption">
                    Number of Items
                  </Typography>
                  <Typography variant="h6">
                    {expenses.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ReimbursableIcon color="warning" />
                <Box>
                  <Typography color="textSecondary" variant="caption">
                    Pending Reimbursement
                  </Typography>
                  <Typography variant="h6" color="warning.main">
                    ${totals.reimbursable.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CheckCircleIcon color="success" />
                <Box>
                  <Typography color="textSecondary" variant="caption">
                    Reimbursed
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    ${totals.reimbursed.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Grouped by Category */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2, bgcolor: "primary.main", color: "white" }}>
          <Typography variant="h6">Expenses by Category</Typography>
        </Box>
        
        {groupedExpenses.map((group) => (
          <Box key={group.categoryName}>
            <Box
              sx={{
                p: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                "&:hover": { bgcolor: "action.hover" },
              }}
              onClick={() => 
                setExpandedCategory(
                  expandedCategory === group.categoryName ? null : group.categoryName
                )
              }
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <CategoryIcon color="primary" />
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {group.categoryName}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {group.expenses.length} expense{group.expenses.length !== 1 ? 's' : ''}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography variant="h6" color="error">
                  ${group.total.toFixed(2)}
                </Typography>
                <IconButton size="small">
                  {expandedCategory === group.categoryName ? (
                    <ExpandLessIcon />
                  ) : (
                    <ExpandMoreIcon />
                  )}
                </IconButton>
              </Box>
            </Box>
            
            <Collapse in={expandedCategory === group.categoryName}>
              <Box sx={{ px: 2, pb: 2 }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Entity</TableCell>
                        <TableCell>Vendor</TableCell>
                        <TableCell>Paid By</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {group.expenses.map((expense, idx) => (
                        <TableRow key={expense.id ?? `${getExpenseDate(expense)}-${getExpenseCategoryName(expense)}-${idx}`}> 
                          <TableCell>{getExpenseDate(expense) || "-"}</TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {getExpenseDescription(expense)}
                            </Typography>
                            {expense.invoiceNumber && (
                              <Typography variant="caption" color="textSecondary">
                                Invoice: {expense.invoiceNumber}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={getEntityDisplay(expense)} 
                              size="small" 
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>{expense.vendor || "-"}</TableCell>
                          <TableCell>
                            <Chip 
                              label={expense.paidBy || "-"} 
                              size="small" 
                              color={expense.paidBy === "DRIVER" ? "warning" : "default"}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold" color="error">
                              ${getExpenseAmount(expense).toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", gap: 0.5 }}>
                              {expense.receiptUrl && (
                                <Tooltip title="Has Receipt">
                                  <AttachFileIcon fontSize="small" color="success" />
                                </Tooltip>
                              )}
                              {expense.isReimbursable && !expense.isReimbursed && (
                                <Tooltip title="Pending Reimbursement">
                                  <ReimbursableIcon fontSize="small" color="warning" />
                                </Tooltip>
                              )}
                              {expense.isReimbursed && (
                                <Tooltip title="Reimbursed">
                                  <CheckCircleIcon fontSize="small" color="success" />
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Collapse>
            
            <Divider />
          </Box>
        ))}
      </Paper>

      {/* All Expenses Table */}
      <Paper>
        <Box sx={{ p: 2, bgcolor: "secondary.main", color: "white" }}>
          <Typography variant="h6">All One-Time Expenses</Typography>
        </Box>
        
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Entity</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell>Paid By</TableCell>
                <TableCell>Responsible</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {expenses.map((expense, idx) => (
                <TableRow key={expense.id ?? `${getExpenseDate(expense)}-${getExpenseCategoryName(expense)}-${idx}`} hover>
                  <TableCell>{getExpenseDate(expense) || "-"}</TableCell>
                  <TableCell>
                    <Chip 
                      label={getExpenseCategoryName(expense) || "N/A"} 
                      size="small"
                      color="secondary"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {getExpenseDescription(expense)}
                    </Typography>
                    {expense.invoiceNumber && (
                      <Typography variant="caption" display="block" color="textSecondary">
                        Invoice: {expense.invoiceNumber}
                      </Typography>
                    )}
                    {expense.notes && (
                      <Tooltip title={expense.notes}>
                        <InfoIcon fontSize="small" color="action" sx={{ ml: 0.5 }} />
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getEntityDisplay(expense)} 
                      size="small" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{expense.vendor || "-"}</TableCell>
                  <TableCell>
                    <Chip 
                      label={expense.paidBy || "-"} 
                      size="small" 
                      color={expense.paidBy === "DRIVER" ? "warning" : "default"}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={expense.responsibleParty || "-"} 
                      size="small" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold" color="error">
                      ${getExpenseAmount(expense).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      {expense.receiptUrl && (
                        <Tooltip title="Has Receipt">
                          <IconButton 
                            size="small"
                            onClick={() => window.open(expense.receiptUrl, '_blank')}
                          >
                            <AttachFileIcon fontSize="small" color="success" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {expense.isReimbursable && !expense.isReimbursed && (
                        <Tooltip title="Pending Reimbursement">
                          <ReimbursableIcon fontSize="small" color="warning" />
                        </Tooltip>
                      )}
                      {expense.isReimbursed && (
                        <Tooltip title={`Reimbursed on ${expense.reimbursedDate || 'N/A'}`}>
                          <CheckCircleIcon fontSize="small" color="success" />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Info Alert */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Note:</strong> This tab shows one-time variable expenses directly associated with this driver
          (where entityType is DRIVER or OWNER and matches driver #{driverNumber}).
          Company-wide or cab-specific expenses may not appear here.
        </Typography>
      </Alert>
    </Box>
  );
}