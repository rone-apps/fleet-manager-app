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
  TextField,
  IconButton,
  Chip,
  Grid,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Description as InvoiceIcon,
} from "@mui/icons-material";

export default function CustomersTab({
  filteredCustomers,
  filterAccountId,
  setFilterAccountId,
  filterCompanyName,
  setFilterCompanyName,
  applyCustomerFilters,
  clearCustomerFilters,
  canEdit,
  handleOpenCustomerDialog,
  handleToggleCustomerActive,
  handleSelectCustomer,
  handleOpenGenerateInvoiceDialog,
  setCurrentTab,
}) {
  return (
    <Box sx={{ p: 3 }}>
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
            onClick={clearCustomerFilters}
          >
            Clear All
          </Button>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Account ID"
              size="small"
              fullWidth
              value={filterAccountId}
              onChange={(e) => setFilterAccountId(e.target.value)}
              placeholder="Search by account ID..."
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Company Name"
              size="small"
              fullWidth
              value={filterCompanyName}
              onChange={(e) => setFilterCompanyName(e.target.value)}
              placeholder="Search by company name..."
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<SearchIcon />}
              onClick={applyCustomerFilters}
              sx={{ height: "40px" }}
            >
              Filter
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6">Account Customers ({filteredCustomers.length})</Typography>
        {canEdit && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenCustomerDialog()}
          >
            Add Customer
          </Button>
        )}
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Account ID</TableCell>
              <TableCell>Company Name</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Credit Limit</TableCell>
              <TableCell>Status</TableCell>
              {canEdit && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCustomers.map((customer) => (
              <TableRow
                key={customer.id}
                hover
                sx={{ cursor: "pointer" }}
                onClick={() => {
                  setCurrentTab(1);
                  handleSelectCustomer(customer);
                }}
              >
                <TableCell>
                  <Chip 
                    label={customer.accountId} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {customer.companyName}
                  </Typography>
                </TableCell>
                <TableCell>{customer.contactPerson}</TableCell>
                <TableCell>{customer.phoneNumber}</TableCell>
                <TableCell>
                  {customer.creditLimit ? `$${customer.creditLimit}` : "N/A"}
                </TableCell>
                <TableCell>
                  <Chip
                    icon={customer.active ? <ActiveIcon /> : <InactiveIcon />}
                    label={customer.active ? "Active" : "Inactive"}
                    color={customer.active ? "success" : "default"}
                    size="small"
                  />
                </TableCell>
                {canEdit && (
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenCustomerDialog(customer)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleToggleCustomerActive(customer)}
                      color={customer.active ? "default" : "success"}
                    >
                      {customer.active ? <InactiveIcon fontSize="small" /> : <ActiveIcon fontSize="small" />}
                    </IconButton>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenGenerateInvoiceDialog(customer);
                      }}
                      title="Generate Invoice"
                    >
                      <InvoiceIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
