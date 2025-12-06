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
  charges = [],
  filteredCharges = [],
  invoices = [],
  currentTab,
}) {
  // Ensure all props are always arrays
  const safeFilteredCharges = Array.isArray(filteredCharges) ? filteredCharges : [];
  const safeCharges = Array.isArray(charges) ? charges : [];
  const safeCustomers = Array.isArray(customers) ? customers : [];
  const safeInvoices = Array.isArray(invoices) ? invoices : [];
  
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
                <Typography variant="h5">{safeCustomers.length}</Typography>
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
                  {safeCustomers.filter(c => c.active).length}
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
                <Typography variant="h5">
                  {currentTab === 2 ? safeFilteredCharges.length : safeCharges.length}
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
              <MoneyIcon color="primary" />
              <Box>
                <Typography color="textSecondary" variant="body2">
                  Unpaid Charges
                </Typography>
                <Typography variant="h5">
                  {currentTab === 2 
                    ? safeFilteredCharges.filter(c => !c.paid).length 
                    : safeCharges.filter(c => !c.paid).length}
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
              <InvoiceIcon color="warning" />
              <Box>
                <Typography color="textSecondary" variant="body2">
                  Outstanding Balance
                </Typography>
                <Typography variant="h5">
                  {formatCurrency(
                    safeInvoices
                      .filter(i => ["SENT", "PARTIAL", "OVERDUE"].includes(i.status))
                      .reduce((sum, i) => sum + i.balanceDue, 0)
                  )}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
