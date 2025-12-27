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
  Tooltip,
  TextField,
  InputAdornment,
  TableSortLabel,
} from "@mui/material";
import {
  Download,
  CreditCard,
  AttachMoney,
  CheckCircle,
  Schedule,
  Cancel,
  Search,
  Clear,
} from "@mui/icons-material";
import { format } from "date-fns";
import axios from "axios";
import { API_BASE_URL } from "../../../lib/api";

// Card type mapping with SVG brand logos and colors
const CARD_TYPES = {
  "1": { 
    code: "Visa",
    name: "Visa", 
    color: "#1A1F71",
    icon: (
      <svg width="40" height="24" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="24" rx="3" fill="#1A1F71"/>
        <path d="M16.5 16.5L18.5 7.5H21L19 16.5H16.5Z" fill="white"/>
        <path d="M26.5 7.7C25.9 7.4 25 7.2 24 7.2C21.5 7.2 19.8 8.4 19.8 10.2C19.8 11.5 21 12.3 22 12.8C23 13.2 23.5 13.6 23.5 14.1C23.5 14.9 22.6 15.3 21.7 15.3C20.6 15.3 20 15.1 19.1 14.7L18.7 14.5L18.3 16.7C19 17 20.1 17.2 21.2 17.2C23.9 17.2 25.6 16 25.6 14.1C25.6 13 24.9 12.1 23.2 11.4C22.4 11 21.9 10.7 21.9 10.2C21.9 9.8 22.3 9.3 23.3 9.3C24.1 9.3 24.7 9.5 25.2 9.7L25.5 9.8L26.5 7.7Z" fill="white"/>
        <path d="M30.1 7.5H28.1C27.5 7.5 27 7.7 26.7 8.3L23.1 16.5H25.9L26.4 15.2H29.7L30 16.5H32.5L30.1 7.5ZM27.1 13.2C27.2 12.9 28 10.9 28 10.9C28 10.9 28.2 10.2 28.4 9.8L28.6 10.9L29.2 13.2H27.1Z" fill="white"/>
        <path d="M14.4 7.5L11.9 14L11.7 12.8C11.2 11.2 9.5 9.5 7.7 8.6L10 16.5H12.8L17.1 7.5H14.4Z" fill="white"/>
        <path d="M9.1 7.5H5L4.9 7.8C8.3 8.6 10.5 10.7 11.4 12.8L10.4 8.3C10.2 7.8 9.7 7.5 9.1 7.5Z" fill="#F7B600"/>
      </svg>
    )
  },
  "2": { 
    code: "M/C",
    name: "MasterCard", 
    color: "#EB001B",
    icon: (
      <svg width="40" height="24" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="24" rx="3" fill="#000000"/>
        <circle cx="15" cy="12" r="6" fill="#EB001B"/>
        <circle cx="25" cy="12" r="6" fill="#F79E1B"/>
        <path d="M20 7C18.5 8.2 17.5 10 17.5 12C17.5 14 18.5 15.8 20 17C21.5 15.8 22.5 14 22.5 12C22.5 10 21.5 8.2 20 7Z" fill="#FF5F00"/>
      </svg>
    )
  },
  "3": { 
    code: "Amex",
    name: "American Express", 
    color: "#006FCF",
    icon: (
      <svg width="40" height="24" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="24" rx="3" fill="#006FCF"/>
        <path d="M8 10L10 15H11.5L13.5 10V15H15V8.5H13L11 13L9 8.5H7V15H8V10Z" fill="white"/>
        <path d="M17 8.5L14.5 15H16L16.4 13.8H18.2L18.6 15H20L17 8.5ZM16.8 12.5L17.3 10.8L17.8 12.5H16.8Z" fill="white"/>
        <path d="M22 8.5L19.5 15H21L21.4 13.8H23.2L23.6 15H25L22 8.5ZM21.8 12.5L22.3 10.8L22.8 12.5H21.8Z" fill="white"/>
        <path d="M27 13L28.5 11.5L27 10L28.5 8.5L30 10L31.5 8.5L33 10L31.5 11.5L33 13L31.5 14.5L30 13L28.5 14.5L27 13Z" fill="white"/>
      </svg>
    )
  },
  "6": { 
    code: "Discover",
    name: "Discover", 
    color: "#FF6000", 
    icon: (
      <svg width="40" height="24" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="24" rx="3" fill="#FF6000"/>
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">D</text>
      </svg>
    )
  },
  "7": { code: "Sears", name: "Sears", color: "#004B87", icon: "💳" },
  "8": { code: "HSBC", name: "HSBC card", color: "#DB0011", icon: "💳" },
  "9": { code: "PWB", name: "PWB card", color: "#003087", icon: "💳" },
  "10": { 
    code: "Interac",
    name: "Interac (debit)", 
    color: "#FFD200", 
    icon: (
      <svg width="40" height="24" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="24" rx="3" fill="#FFD200"/>
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="#000" fontSize="9" fontWeight="bold">INT</text>
      </svg>
    )
  },
  "11": { code: "Air Miles", name: "Air Miles", color: "#0066B2", icon: "✈️" },
  "12": { code: "CITICOMM", name: "CITICOMM", color: "#056DAE", icon: "💳" },
  "13": { code: "Cheque", name: "Cheque authorization", color: "#4CAF50", icon: "📝" },
  "14": { code: "Maestro", name: "Maestro", color: "#CC0000", icon: "💳" },
};

const getCardTypeInfo = (cardCode) => {
  return CARD_TYPES[cardCode] || { 
    code: cardCode || "Unknown", 
    name: cardCode || "Unknown", 
    color: "#757575", 
    icon: "💳" 
  };
};

export default function CreditCardsTab({ driverNumber, startDate, endDate }) {
  const [reportData, setReportData] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Search filters
  const [searchDate, setSearchDate] = useState("");
  const [searchCab, setSearchCab] = useState("");
  const [searchCard, setSearchCard] = useState("");
  
  // Sorting
  const [sortBy, setSortBy] = useState("date"); // 'date' | 'cab' | 'card'
  const [sortOrder, setSortOrder] = useState("asc");

  useEffect(() => {
    if (driverNumber && startDate && endDate) {
      fetchCreditCardRevenueReport();
    }
  }, [driverNumber, startDate, endDate]);

  useEffect(() => {
    if (reportData && reportData.transactionItems) {
      applyFiltersAndSort();
    }
  }, [reportData, searchDate, searchCab, searchCard, sortBy, sortOrder]);

  const fetchCreditCardRevenueReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const formattedStartDate = format(startDate, "yyyy-MM-dd");
      const formattedEndDate = format(endDate, "yyyy-MM-dd");

      const response = await axios.get(`${API_BASE_URL}/reports/credit-card-revenue`, {
        params: {
          driverNumber: driverNumber,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      setReportData(response.data);
    } catch (err) {
      console.error("Error fetching credit card revenue report:", err);
      setError(err.response?.data?.message || "Failed to fetch credit card revenue report");
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...reportData.transactionItems];

    // Apply filters
    if (searchDate) {
      filtered = filtered.filter(item =>
        item.transactionDate?.includes(searchDate)
      );
    }

    if (searchCab) {
      filtered = filtered.filter(item =>
        item.cabNumber?.toLowerCase().includes(searchCab.toLowerCase())
      );
    }

    if (searchCard) {
      filtered = filtered.filter(item => {
        const cardInfo = getCardTypeInfo(item.cardType);
        return cardInfo.code.toLowerCase().includes(searchCard.toLowerCase()) ||
               cardInfo.name.toLowerCase().includes(searchCard.toLowerCase()) ||
               item.cardLastFour?.includes(searchCard);
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let compareValue = 0;

      if (sortBy === "date") {
        compareValue = new Date(a.transactionDate) - new Date(b.transactionDate);
      } else if (sortBy === "cab") {
        compareValue = (a.cabNumber || "").localeCompare(b.cabNumber || "");
      } else if (sortBy === "card") {
        const cardA = getCardTypeInfo(a.cardType).code;
        const cardB = getCardTypeInfo(b.cardType).code;
        compareValue = cardA.localeCompare(cardB);
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
    setSearchDate("");
    setSearchCab("");
    setSearchCard("");
  };

  const handleDownloadCSV = () => {
    if (!filteredData || filteredData.length === 0) return;

    const headers = [
      "Date",
      "Time",
      "Auth Code",
      "Terminal ID",
      "Card Type",
      "Last 4",
      "Cab",
      "Amount",
      "Tip",
      "Total",
      "Fee",
      "Net",
      "Status",
      "Settled",
    ];

    const rows = filteredData.map((item) => {
      const cardInfo = getCardTypeInfo(item.cardType);
      return [
        item.transactionDate,
        item.transactionTime || "",
        item.authorizationCode,
        item.terminalId,
        cardInfo.name,
        item.cardLastFour || "",
        item.cabNumber || "",
        item.amount?.toFixed(2) || "0.00",
        item.tipAmount?.toFixed(2) || "0.00",
        item.totalAmount?.toFixed(2) || "0.00",
        item.processingFee?.toFixed(2) || "0.00",
        item.netAmount?.toFixed(2) || "0.00",
        item.transactionStatus,
        item.isSettled ? "Yes" : "No",
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `credit-card-revenue-${driverNumber}-${format(startDate, "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusChip = (status) => {
    const statusColors = {
      SETTLED: "success",
      PENDING: "warning",
      DECLINED: "error",
      REFUNDED: "default",
      DISPUTED: "error",
    };
    return (
      <Chip
        label={status}
        size="small"
        color={statusColors[status] || "default"}
      />
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading credit card revenue report...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>;
  }

  if (!reportData || !reportData.transactionItems || reportData.transactionItems.length === 0) {
    return (
      <Paper sx={{ p: 6, textAlign: "center" }}>
        <CreditCard sx={{ fontSize: 80, color: "text.disabled", mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Credit Card Transactions Found
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Total Transactions
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {reportData.totalTransactions || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Total Amount
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600, color: "primary.main" }}>
                ${reportData.totalAmount?.toFixed(2) || "0.00"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
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

        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Processing Fees
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600, color: "error.main" }}>
                ${reportData.totalProcessingFees?.toFixed(2) || "0.00"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: "primary.main", color: "white" }}>
            <CardContent>
              <Typography sx={{ opacity: 0.9 }} variant="body2" gutterBottom>
                Net Total
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                ${reportData.netTotal?.toFixed(2) || "0.00"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
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
            <TextField
              fullWidth
              size="small"
              label="Search Card"
              placeholder="Card type or last 4 digits"
              value={searchCard}
              onChange={(e) => setSearchCard(e.target.value)}
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
          Showing {filteredData.length} of {reportData.transactionItems.length} transactions
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
              Credit Card Transaction Details
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
                    Date/Time
                  </TableSortLabel>
                </TableCell>
                <TableCell>Auth Code</TableCell>
                <TableCell>Terminal</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === "card"}
                    direction={sortBy === "card" ? sortOrder : "asc"}
                    onClick={() => handleSort("card")}
                  >
                    Card
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
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right">Tip</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Fee</TableCell>
                <TableCell align="right">Net</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Settlement</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map((item, index) => {
                const cardInfo = getCardTypeInfo(item.cardType);
                return (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {item.transactionDate}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.transactionTime || "N/A"}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                        {item.authorizationCode}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{item.terminalId}</Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={cardInfo.name}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          {/* Card Icon - SVG or Emoji */}
                          <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 40 }}>
                            {typeof cardInfo.icon === 'string' ? (
                              <Typography sx={{ fontSize: 24 }}>{cardInfo.icon}</Typography>
                            ) : (
                              cardInfo.icon
                            )}
                          </Box>
                          {/* Card Name and Last 4 */}
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {cardInfo.code}
                            </Typography>
                            {item.cardLastFour && (
                              <Typography variant="caption" color="text.secondary">
                                ****{item.cardLastFour}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{item.cabNumber || "N/A"}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 500 }}>
                      ${item.amount?.toFixed(2) || "0.00"}
                    </TableCell>
                    <TableCell align="right" sx={{ color: "success.main" }}>
                      ${item.tipAmount?.toFixed(2) || "0.00"}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      ${item.totalAmount?.toFixed(2) || "0.00"}
                    </TableCell>
                    <TableCell align="right" sx={{ color: "error.main" }}>
                      ${item.processingFee?.toFixed(2) || "0.00"}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: "primary.main" }}>
                      ${item.netAmount?.toFixed(2) || "0.00"}
                    </TableCell>
                    <TableCell>{getStatusChip(item.transactionStatus)}</TableCell>
                    <TableCell>
                      <Chip
                        icon={item.isSettled ? <CheckCircle /> : <Schedule />}
                        label={item.isSettled ? "Settled" : "Pending"}
                        size="small"
                        color={item.isSettled ? "success" : "warning"}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={5} align="right" sx={{ fontWeight: 600 }}>
                  GRAND TOTAL
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  ${filteredData.reduce((sum, item) => sum + (item.amount || 0), 0).toFixed(2)}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  ${filteredData.reduce((sum, item) => sum + (item.tipAmount || 0), 0).toFixed(2)}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  ${filteredData.reduce((sum, item) => sum + (item.totalAmount || 0), 0).toFixed(2)}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  ${filteredData.reduce((sum, item) => sum + (item.processingFee || 0), 0).toFixed(2)}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 700, color: "primary.main", fontSize: 18 }}
                >
                  ${filteredData.reduce((sum, item) => sum + (item.netAmount || 0), 0).toFixed(2)}
                </TableCell>
                <TableCell colSpan={2}></TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}