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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

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

export default function OneTimeExpensesTab({ driverNumber, startDate, endDate }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [expandedCategory, setExpandedCategory] = useState(null);

  useEffect(() => {
    if (driverNumber && startDate && endDate) {
      loadOneTimeExpenses();
    }
  }, [driverNumber, startDate, endDate]);

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
            Authorization: `Bearer ${localStorage.getItem("token")}`,
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
      
      const driverExpenses = allExpenses.filter(expense => {
        // For now, we'll show all expenses where entityType is DRIVER or OWNER
        // and matches this driver number
        // You may need to adjust this logic based on your business rules
        
        if (expense.entityType === "DRIVER" && expense.driver?.driverNumber === driverNumber) {
          return true;
        }
        
        if (expense.entityType === "OWNER" && expense.owner?.driverNumber === driverNumber) {
          return true;
        }
        
        // Also include if responsible party matches
        // This requires checking if the driver is the one responsible
        // For simplicity, we're checking entity association
        
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

  // Calculate totals
  const calculateTotals = () => {
    const total = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
    const reimbursable = expenses
      .filter(exp => exp.isReimbursable && !exp.isReimbursed)
      .reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
    const reimbursed = expenses
      .filter(exp => exp.isReimbursed)
      .reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
    
    return { total, reimbursable, reimbursed };
  };

  // Group expenses by category
  const groupByCategory = () => {
    const grouped = {};
    
    expenses.forEach(expense => {
      const categoryName = expense.expenseCategory?.categoryName || "Uncategorized";
      
      if (!grouped[categoryName]) {
        grouped[categoryName] = {
          categoryId: expense.expenseCategory?.id,
          categoryName,
          expenses: [],
          total: 0,
        };
      }
      
      grouped[categoryName].expenses.push(expense);
      grouped[categoryName].total += parseFloat(expense.amount || 0);
    });
    
    return Object.values(grouped).sort((a, b) => b.total - a.total);
  };

  const getEntityDisplay = (expense) => {
    if (expense.entityType === "CAB" && expense.cab) {
      return `Cab ${expense.cab.cabNumber}`;
    } else if (expense.entityType === "SHIFT") {
      return expense.shiftType === "DAY" ? "Day Shift" : "Night Shift";
    } else if (expense.entityType === "DRIVER" && expense.driver) {
      return `${expense.driver.firstName} ${expense.driver.lastName}`;
    } else if (expense.entityType === "OWNER" && expense.owner) {
      return `${expense.owner.firstName} ${expense.owner.lastName}`;
    } else if (expense.entityType === "COMPANY") {
      return "Company";
    }
    return expense.entityType;
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
                      {group.expenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell>{expense.expenseDate}</TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {expense.description || "-"}
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
                              label={expense.paidBy} 
                              size="small" 
                              color={expense.paidBy === "DRIVER" ? "warning" : "default"}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold" color="error">
                              ${parseFloat(expense.amount).toFixed(2)}
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
              {expenses.map((expense) => (
                <TableRow key={expense.id} hover>
                  <TableCell>{expense.expenseDate}</TableCell>
                  <TableCell>
                    <Chip 
                      label={expense.expenseCategory?.categoryName || "N/A"} 
                      size="small"
                      color="secondary"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {expense.description || "-"}
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
                      label={expense.paidBy} 
                      size="small" 
                      color={expense.paidBy === "DRIVER" ? "warning" : "default"}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={expense.responsibleParty} 
                      size="small" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold" color="error">
                      ${parseFloat(expense.amount).toFixed(2)}
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