"use client";

import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import {
  Business as BusinessIcon,
  CheckCircle as ActiveIcon,
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
  Description as InvoiceIcon,
} from "@mui/icons-material";
import { formatCurrency } from "../utils/helpers";

export default function StatisticsCards({
  customers = [],
  filteredCustomers = [],
  charges = [],
  filteredCharges = [],
  invoices = [],
  filteredInvoices = [],
  currentTab,
}) {
  // Ensure all props are always arrays
  const safeCustomers = Array.isArray(customers) ? customers : [];
  const safeFilteredCustomers = Array.isArray(filteredCustomers) ? filteredCustomers : [];
  const safeCharges = Array.isArray(charges) ? charges : [];
  const safeFilteredCharges = Array.isArray(filteredCharges) ? filteredCharges : [];
  const safeInvoices = Array.isArray(invoices) ? invoices : [];
  const safeFilteredInvoices = Array.isArray(filteredInvoices) ? filteredInvoices : [];

  // Calculate displayed data based on current tab
  // Tab 0: Customers, Tab 1: Trip Charges, Tab 2: All Charges, Tab 3: Invoices
  const displayedCharges = currentTab === 1 ? safeCharges : safeFilteredCharges;
  const displayedCustomers = currentTab === 0 ? safeFilteredCustomers : safeCustomers;
  const displayedInvoices = currentTab === 3 ? safeFilteredInvoices : safeInvoices;

  const totalCharges = displayedCharges.length;
  const unpaidCharges = displayedCharges.filter(c => !c.paid).length;
  const outstandingBalance = displayedCharges
    .filter(c => !c.paid)
    .reduce((sum, c) => sum + (c.amount || 0), 0);

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={2.4}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <BusinessIcon color="primary" />
              <Box>
                <Typography color="textSecondary" variant="body2">
                  Total Customers
                </Typography>
                <Typography variant="h5">{displayedCustomers.length}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={2.4}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ActiveIcon color="success" />
              <Box>
                <Typography color="textSecondary" variant="body2">
                  Active Customers
                </Typography>
                <Typography variant="h5">
                  {displayedCustomers.filter(c => c.active).length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={2.4}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ReceiptIcon color="primary" />
              <Box>
                <Typography color="textSecondary" variant="body2">
                  Total Charges
                </Typography>
                <Typography variant="h5">{totalCharges}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={2.4}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <MoneyIcon color="primary" />
              <Box>
                <Typography color="textSecondary" variant="body2">
                  Unpaid Charges
                </Typography>
                <Typography variant="h5">{unpaidCharges}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={2.4}>
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <InvoiceIcon color="warning" />
              <Box>
                <Typography color="textSecondary" variant="body2">
                  Outstanding Balance
                </Typography>
                <Typography variant="h5">
                  {formatCurrency(outstandingBalance)}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
