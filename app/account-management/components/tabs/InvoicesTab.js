"use client";

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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Chip,
  Grid,
} from "@mui/material";
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Description as InvoiceIcon,
  Send as SendIcon,
  Visibility as ViewIcon,
  Block as CancelInvoiceIcon,
  Payment as PaymentIcon,
} from "@mui/icons-material";
import { formatCurrency, formatDate, getStatusColor } from "../../utils/helpers";

export default function InvoicesTab({
  customers,
  filteredInvoices,
  invoiceFilterCustomerId,
  setInvoiceFilterCustomerId,
  invoiceFilterStatus,
  setInvoiceFilterStatus,
  applyInvoiceFilters,
  clearInvoiceFilters,
  canEdit,
  canMarkPaid,
  handleOpenGenerateInvoiceDialog,
  handleViewInvoice,
  handleSendInvoice,
  handleCancelInvoice,
  handleOpenRecordPaymentDialog,
}) {
  console.log('🧾 InvoicesTab rendered with filteredInvoices:', filteredInvoices);
  console.log('🧾 filteredInvoices length:', filteredInvoices?.length);
  console.log('🧾 filteredInvoices type:', Array.isArray(filteredInvoices) ? 'array' : typeof filteredInvoices);
  
  return (
    <Box sx={{ p: 3 }}>
      {/* Filter Panel */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FilterIcon /> Filters
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ClearIcon />}
            onClick={clearInvoiceFilters}
          >
            Clear All
          </Button>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Customer</InputLabel>
              <Select
                value={invoiceFilterCustomerId}
                label="Customer"
                onChange={(e) => setInvoiceFilterCustomerId(e.target.value)}
              >
                <MenuItem value="">All Customers</MenuItem>
                {customers.map((customer) => (
                  <MenuItem key={customer.id} value={customer.id}>
                    {customer.companyName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={invoiceFilterStatus}
                label="Status"
                onChange={(e) => setInvoiceFilterStatus(e.target.value)}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="DRAFT">Draft</MenuItem>
                <MenuItem value="SENT">Sent</MenuItem>
                <MenuItem value="PARTIAL">Partially Paid</MenuItem>
                <MenuItem value="PAID">Paid</MenuItem>
                <MenuItem value="OVERDUE">Overdue</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<SearchIcon />}
              onClick={applyInvoiceFilters}
              sx={{ height: "40px" }}
            >
              Filter
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Action Buttons */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6">
          Invoices ({filteredInvoices.length})
        </Typography>
        {canEdit && (
          <Button
            variant="contained"
            startIcon={<InvoiceIcon />}
            onClick={() => handleOpenGenerateInvoiceDialog()}
          >
            Generate Invoice
          </Button>
        )}
      </Box>

      {/* Invoices Table */}
      <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 600 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Invoice #</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell align="right">Paid</TableCell>
              <TableCell align="right">Balance</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                  <InvoiceIcon sx={{ fontSize: 60, color: "#ccc", mb: 2 }} />
                  <Typography variant="h6" color="textSecondary">
                    No invoices found
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Generate your first invoice to get started
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {invoice.invoiceNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>{invoice.customer?.companyName || 'N/A'}</TableCell>
                  <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                  <TableCell>
                    <Box>
                      {formatDate(invoice.dueDate)}
                      {invoice.status !== "PAID" && new Date(invoice.dueDate) < new Date() && (
                        <Chip
                          label="Overdue"
                          size="small"
                          color="error"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="bold">
                      {formatCurrency(invoice.totalAmount)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(invoice.amountPaid)}
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      fontWeight="bold"
                      color={invoice.balanceDue > 0 ? "error" : "success"}
                    >
                      {formatCurrency(invoice.balanceDue)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={invoice.status}
                      size="small"
                      color={getStatusColor(invoice.status)}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleViewInvoice(invoice)}
                      title="View Details"
                    >
                      <ViewIcon fontSize="small" />
                    </IconButton>
                    {invoice.status === "DRAFT" && canEdit && (
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleSendInvoice(invoice.id)}
                        title="Send Invoice"
                      >
                        <SendIcon fontSize="small" />
                      </IconButton>
                    )}
                    {(invoice.status === "SENT" || invoice.status === "PARTIAL" || invoice.status === "OVERDUE") && canMarkPaid && (
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => handleOpenRecordPaymentDialog(invoice)}
                        title="Record Payment"
                      >
                        <PaymentIcon fontSize="small" />
                      </IconButton>
                    )}
                    {(invoice.status === "DRAFT" || invoice.status === "SENT") && canEdit && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleCancelInvoice(invoice.id)}
                        title="Cancel Invoice"
                      >
                        <CancelInvoiceIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
