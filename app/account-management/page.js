"use client";

import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Alert,
} from "@mui/material";
import {
  Business as BusinessIcon,
  Receipt as ReceiptIcon,
  Assignment as AllChargesIcon,
  Description as InvoiceIcon,
} from "@mui/icons-material";
import GlobalNav from "../components/GlobalNav";
import { useAccountManagement } from "./hooks/useAccountManagement";
import {
  StatisticsCards,
  CustomersTab,
  TripChargesTab,
  AllChargesTab,
  InvoicesTab,
  CustomerDialog,
  ChargeDialog,
  BulkEditConfirmDialog,
  GenerateInvoiceDialog,
  InvoiceDetailsDialog,
  RecordPaymentDialog,
  CancelInvoiceDialog,
} from "./components";

export default function AccountManagementPage() {
  const {
    // Core state
    currentUser,
    currentTab,
    setCurrentTab,
    loading,
    error,
    setError,
    success,
    setSuccess,

    // Permissions
    canEdit,
    canBulkEdit,
    canMarkPaid,

    // Customers
    customers,
    filteredCustomers,
    filterAccountId,
    setFilterAccountId,
    filterCompanyName,
    setFilterCompanyName,
    openCustomerDialog,
    setOpenCustomerDialog,
    editingCustomer,
    customerFormData,
    setCustomerFormData,
    handleOpenCustomerDialog,
    handleSaveCustomer,
    handleToggleCustomerActive,
    handleSelectCustomer,
    applyCustomerFilters,
    clearCustomerFilters,

    // Trip Charges (Tab 2)
    selectedCustomer,
    charges,
    openChargeDialog,
    setOpenChargeDialog,
    editingCharge,
    chargeFormData,
    setChargeFormData,
    handleOpenChargeDialog,
    handleSaveCharge,
    handleMarkChargePaid,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    handleFilterCharges,

    // Bulk Edit (Tab 2)
    bulkEditMode,
    bulkEditCharges,
    confirmBulkEditDialog,
    setConfirmBulkEditDialog,
    handleEnterBulkEdit,
    handleCancelBulkEdit,
    handleBulkEditChange,
    handleSaveBulkEdit,
    handleConfirmBulkEdit,

    // All Charges (Tab 3)
    filteredCharges,
    filterCustomerName,
    setFilterCustomerName,
    filterCabId,
    setFilterCabId,
    filterDriverId,
    setFilterDriverId,
    filterStartDate,
    setFilterStartDate,
    filterEndDate,
    setFilterEndDate,
    filterPaidStatus,
    setFilterPaidStatus,
    applyFilters,
    clearFilters,
    allChargesBulkEdit,
    bulkEditAllCharges,
    confirmAllChargesBulkEditDialog,
    setConfirmAllChargesBulkEditDialog,
    handleEnterAllChargesBulkEdit,
    handleCancelAllChargesBulkEdit,
    handleAllChargesBulkEditChange,
    handleSaveAllChargesBulkEdit,
    handleConfirmAllChargesBulkEdit,

    // Lookup data
    cabs,
    drivers,

    // Invoices (Tab 4)
    invoices,
    filteredInvoices,
    selectedInvoice,
    openGenerateInvoiceDialog,
    setOpenGenerateInvoiceDialog,
    openInvoiceDetailsDialog,
    setOpenInvoiceDetailsDialog,
    openRecordPaymentDialog,
    setOpenRecordPaymentDialog,
    openCancelInvoiceDialog,
    setOpenCancelInvoiceDialog,
    cancelReason,
    setCancelReason,
    generateInvoiceFormData,
    setGenerateInvoiceFormData,
    paymentFormData,
    setPaymentFormData,
    invoiceFilterCustomerId,
    setInvoiceFilterCustomerId,
    invoiceFilterStatus,
    setInvoiceFilterStatus,
    handleOpenGenerateInvoiceDialog,
    handleGenerateInvoice,
    handleViewInvoice,
    handleSendInvoice,
    handleOpenCancelInvoiceDialog,
    handleCancelInvoice,
    handleOpenRecordPaymentDialog,
    handleRecordPayment,
    applyInvoiceFilters,
    clearInvoiceFilters,
  } = useAccountManagement();

  if (loading) {
    return (
      <Box>
        <GlobalNav currentUser={currentUser} title="Account Management" />
        <Box sx={{ p: 3, textAlign: "center" }}>
          <Typography>Loading...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f6f9fc' }}>
      <GlobalNav currentUser={currentUser} title="Account Management" />
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: '#3e5244' }}>
            Account Management
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Manage corporate customers and their charges
          </Typography>
        </Box>

        {/* Success/Error Messages */}
        {success && (
          <Alert severity="success" onClose={() => setSuccess("")} sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        {error && (
          <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Statistics Cards */}
        <StatisticsCards
          customers={customers}
          filteredCustomers={filteredCustomers}
          charges={charges}
          filteredCharges={filteredCharges}
          invoices={invoices}
          filteredInvoices={filteredInvoices}
          currentTab={currentTab}
        />

        {/* Main Content */}
        <Paper>
          <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
            <Tab label="Account Customers" icon={<BusinessIcon />} iconPosition="start" />
            <Tab label="Trip Charges" icon={<ReceiptIcon />} iconPosition="start" />
            <Tab label="All Charges" icon={<AllChargesIcon />} iconPosition="start" />
            <Tab label="Invoices" icon={<InvoiceIcon />} iconPosition="start" />
          </Tabs>

          {/* Tab 1: Account Customers */}
          {currentTab === 0 && (
            <CustomersTab
              filteredCustomers={filteredCustomers}
              filterAccountId={filterAccountId}
              setFilterAccountId={setFilterAccountId}
              filterCompanyName={filterCompanyName}
              setFilterCompanyName={setFilterCompanyName}
              applyCustomerFilters={applyCustomerFilters}
              clearCustomerFilters={clearCustomerFilters}
              canEdit={canEdit}
              handleOpenCustomerDialog={handleOpenCustomerDialog}
              handleToggleCustomerActive={handleToggleCustomerActive}
              handleSelectCustomer={handleSelectCustomer}
              handleOpenGenerateInvoiceDialog={handleOpenGenerateInvoiceDialog}
              setCurrentTab={setCurrentTab}
            />
          )}

          {/* Tab 2: Trip Charges */}
          {currentTab === 1 && (
            <TripChargesTab
              customers={customers}
              selectedCustomer={selectedCustomer}
              charges={charges}
              bulkEditMode={bulkEditMode}
              bulkEditCharges={bulkEditCharges}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              canEdit={canEdit}
              canBulkEdit={canBulkEdit}
              canMarkPaid={canMarkPaid}
              handleSelectCustomer={handleSelectCustomer}
              handleOpenChargeDialog={handleOpenChargeDialog}
              handleMarkChargePaid={handleMarkChargePaid}
              handleEnterBulkEdit={handleEnterBulkEdit}
              handleCancelBulkEdit={handleCancelBulkEdit}
              handleBulkEditChange={handleBulkEditChange}
              handleSaveBulkEdit={handleSaveBulkEdit}
              handleFilterCharges={handleFilterCharges}
            />
          )}

          {/* Tab 3: All Charges */}
          {currentTab === 2 && (
            <AllChargesTab
              filteredCharges={filteredCharges}
              cabs={cabs}
              drivers={drivers}
              filterCustomerName={filterCustomerName}
              setFilterCustomerName={setFilterCustomerName}
              filterCabId={filterCabId}
              setFilterCabId={setFilterCabId}
              filterDriverId={filterDriverId}
              setFilterDriverId={setFilterDriverId}
              filterStartDate={filterStartDate}
              setFilterStartDate={setFilterStartDate}
              filterEndDate={filterEndDate}
              setFilterEndDate={setFilterEndDate}
              filterPaidStatus={filterPaidStatus}
              setFilterPaidStatus={setFilterPaidStatus}
              applyFilters={applyFilters}
              clearFilters={clearFilters}
              allChargesBulkEdit={allChargesBulkEdit}
              bulkEditAllCharges={bulkEditAllCharges}
              canEdit={canEdit}
              canBulkEdit={canBulkEdit}
              canMarkPaid={canMarkPaid}
              handleEnterAllChargesBulkEdit={handleEnterAllChargesBulkEdit}
              handleCancelAllChargesBulkEdit={handleCancelAllChargesBulkEdit}
              handleAllChargesBulkEditChange={handleAllChargesBulkEditChange}
              handleSaveAllChargesBulkEdit={handleSaveAllChargesBulkEdit}
              handleMarkChargePaid={handleMarkChargePaid}
            />
          )}

          {/* Tab 4: Invoices */}
          {currentTab === 3 && (
            <InvoicesTab
              customers={customers}
              filteredInvoices={filteredInvoices}
              invoiceFilterCustomerId={invoiceFilterCustomerId}
              setInvoiceFilterCustomerId={setInvoiceFilterCustomerId}
              invoiceFilterStatus={invoiceFilterStatus}
              setInvoiceFilterStatus={setInvoiceFilterStatus}
              applyInvoiceFilters={applyInvoiceFilters}
              clearInvoiceFilters={clearInvoiceFilters}
              canEdit={canEdit}
              canMarkPaid={canMarkPaid}
              handleOpenGenerateInvoiceDialog={handleOpenGenerateInvoiceDialog}
              handleViewInvoice={handleViewInvoice}
              handleSendInvoice={handleSendInvoice}
              handleOpenCancelInvoiceDialog={handleOpenCancelInvoiceDialog}
              handleOpenRecordPaymentDialog={handleOpenRecordPaymentDialog}
            />
          )}
        </Paper>

        {/* Dialogs */}
        <CustomerDialog
          open={openCustomerDialog}
          onClose={() => setOpenCustomerDialog(false)}
          editingCustomer={editingCustomer}
          customerFormData={customerFormData}
          setCustomerFormData={setCustomerFormData}
          handleSaveCustomer={handleSaveCustomer}
          error={error}
        />

        <ChargeDialog
          open={openChargeDialog}
          onClose={() => setOpenChargeDialog(false)}
          editingCharge={editingCharge}
          chargeFormData={chargeFormData}
          setChargeFormData={setChargeFormData}
          handleSaveCharge={handleSaveCharge}
          cabs={cabs}
          drivers={drivers}
          error={error}
        />

        {/* Bulk Edit Confirmation Dialog - Tab 2 */}
        <BulkEditConfirmDialog
          open={confirmBulkEditDialog}
          onClose={() => setConfirmBulkEditDialog(false)}
          onConfirm={handleConfirmBulkEdit}
          chargesCount={bulkEditCharges.length}
          customerName={selectedCustomer?.companyName}
          isAllCharges={false}
        />

        {/* Bulk Edit Confirmation Dialog - Tab 3 (All Charges) */}
        <BulkEditConfirmDialog
          open={confirmAllChargesBulkEditDialog}
          onClose={() => setConfirmAllChargesBulkEditDialog(false)}
          onConfirm={handleConfirmAllChargesBulkEdit}
          chargesCount={bulkEditAllCharges.length}
          isAllCharges={true}
          affectedCustomers={[...new Set(bulkEditAllCharges.map(c => c.customerName))]}
        />

        <GenerateInvoiceDialog
          open={openGenerateInvoiceDialog}
          onClose={() => setOpenGenerateInvoiceDialog(false)}
          customers={customers}
          generateInvoiceFormData={generateInvoiceFormData}
          setGenerateInvoiceFormData={setGenerateInvoiceFormData}
          handleGenerateInvoice={handleGenerateInvoice}
          error={error}
        />

        <InvoiceDetailsDialog
          open={openInvoiceDetailsDialog}
          onClose={() => setOpenInvoiceDetailsDialog(false)}
          selectedInvoice={selectedInvoice}
          canMarkPaid={canMarkPaid}
          handleOpenRecordPaymentDialog={handleOpenRecordPaymentDialog}
        />

        <RecordPaymentDialog
          open={openRecordPaymentDialog}
          onClose={() => setOpenRecordPaymentDialog(false)}
          selectedInvoice={selectedInvoice}
          paymentFormData={paymentFormData}
          setPaymentFormData={setPaymentFormData}
          handleRecordPayment={handleRecordPayment}
          error={error}
        />

        <CancelInvoiceDialog
          open={openCancelInvoiceDialog}
          onClose={() => setOpenCancelInvoiceDialog(false)}
          selectedInvoice={selectedInvoice}
          cancelReason={cancelReason}
          setCancelReason={setCancelReason}
          handleCancelInvoice={handleCancelInvoice}
          error={error}
        />
      </Box>
    </Box>
  );
}
