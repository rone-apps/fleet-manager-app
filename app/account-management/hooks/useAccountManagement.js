"use client";

import { useState, useEffect, useCallback } from "react";
import { getCurrentUser, isAuthenticated, API_BASE_URL } from "../../lib/api";
import { useRouter } from "next/navigation";

// Initial form data states
const initialCustomerFormData = {
  accountId: "",
  companyName: "",
  contactPerson: "",
  streetAddress: "",
  city: "",
  province: "BC",
  postalCode: "",
  country: "Canada",
  phoneNumber: "",
  email: "",
  billingPeriod: "MONTHLY",
  creditLimit: "",
  notes: "",
};

const initialChargeFormData = {
  jobCode: "",
  tripDate: "",
  startTime: "",
  endTime: "",
  pickupAddress: "",
  dropoffAddress: "",
  passengerName: "",
  cabId: "",
  driverId: "",
  fareAmount: "",
  tipAmount: "",
  notes: "",
};

const initialGenerateInvoiceFormData = {
  customerId: null,
  periodStart: "",
  periodEnd: "",
  taxRate: "5.0",
  terms: "Payment is due within 30 days of invoice date.",
};

const initialPaymentFormData = {
  amount: "",
  paymentDate: "",
  paymentMethod: "CREDIT_CARD",
  referenceNumber: "",
  notes: "",
};

export function useAccountManagement() {
  const router = useRouter();
  
  // Core state
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Account Customers
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [filterAccountId, setFilterAccountId] = useState("");
  const [filterCompanyName, setFilterCompanyName] = useState("");
  const [openCustomerDialog, setOpenCustomerDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customerFormData, setCustomerFormData] = useState(initialCustomerFormData);

  // Trip Charges (Tab 2)
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [charges, setCharges] = useState([]);
  const [openChargeDialog, setOpenChargeDialog] = useState(false);
  const [editingCharge, setEditingCharge] = useState(null);
  const [chargeFormData, setChargeFormData] = useState(initialChargeFormData);

  // Bulk Edit (Tab 2)
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [bulkEditCharges, setBulkEditCharges] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [confirmBulkEditDialog, setConfirmBulkEditDialog] = useState(false);

  // All Charges Tab (Tab 3)
  const [allCharges, setAllCharges] = useState([]);
  const [filteredCharges, setFilteredCharges] = useState([]);
  const [filterCustomerName, setFilterCustomerName] = useState("");
  const [filterCabId, setFilterCabId] = useState("");
  const [filterDriverId, setFilterDriverId] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterPaidStatus, setFilterPaidStatus] = useState("all");
  const [allChargesBulkEdit, setAllChargesBulkEdit] = useState(false);
  const [bulkEditAllCharges, setBulkEditAllCharges] = useState([]);
  const [confirmAllChargesBulkEditDialog, setConfirmAllChargesBulkEditDialog] = useState(false);

  // Lookup data
  const [cabs, setCabs] = useState([]);
  const [drivers, setDrivers] = useState([]);

  // Invoices Tab (Tab 4)
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [openGenerateInvoiceDialog, setOpenGenerateInvoiceDialog] = useState(false);
  const [openInvoiceDetailsDialog, setOpenInvoiceDetailsDialog] = useState(false);
  const [openRecordPaymentDialog, setOpenRecordPaymentDialog] = useState(false);
  const [generateInvoiceFormData, setGenerateInvoiceFormData] = useState(initialGenerateInvoiceFormData);
  const [paymentFormData, setPaymentFormData] = useState(initialPaymentFormData);
  const [invoiceFilterCustomerId, setInvoiceFilterCustomerId] = useState("");
  const [invoiceFilterStatus, setInvoiceFilterStatus] = useState("all");
  const [filteredInvoices, setFilteredInvoices] = useState([]);

  // Permissions
  const canEdit = currentUser?.role === "ADMIN" || currentUser?.role === "MANAGER";
  const canBulkEdit = ["ADMIN", "MANAGER", "ACCOUNTANT"].includes(currentUser?.role);
  const canMarkPaid = ["ADMIN", "MANAGER", "ACCOUNTANT"].includes(currentUser?.role);

  // ==================== Data Loading ====================

  const loadCustomers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/account-customers`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.ok) {
        const data = await response.json();
        
        // Handle both array response and paginated response
        const customersArray = Array.isArray(data) ? data : (data.content || data.data || []);
        
        setCustomers(customersArray);
        setFilteredCustomers(customersArray);
      }
    } catch (err) {
      console.error("Error loading customers:", err);
    }
  }, []);

  const loadCabs = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cabs`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.ok) {
        const data = await response.json();
        
        // Handle both array response and paginated response
        const cabsArray = Array.isArray(data) ? data : (data.content || data.data || []);
        
        setCabs(cabsArray);
      }
    } catch (err) {
      console.error("Error loading cabs:", err);
    }
  }, []);

  const loadDrivers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/drivers`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.ok) {
        const data = await response.json();
        
        // Handle both array response and paginated response
        const driversArray = Array.isArray(data) ? data : (data.content || data.data || []);
        
        setDrivers(driversArray);
      }
    } catch (err) {
      console.error("Error loading drivers:", err);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadCustomers(), loadCabs(), loadDrivers()]);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [loadCustomers, loadCabs, loadDrivers]);

  const loadChargesForCustomer = useCallback(async (customerId) => {
    try {
      let url = `${API_BASE_URL}/account-charges/customer/${customerId}`;
      
      console.log('📅 Trip Charges Date Filter:', { startDate, endDate, hasDateFilter: !!(startDate && endDate) });
      
      if (startDate && endDate) {
        url = `${API_BASE_URL}/account-charges/customer/${customerId}/between?startDate=${startDate}&endDate=${endDate}`;
        console.log('📅 Using date-filtered URL:', url);
      } else {
        console.log('📅 Using unfiltered URL:', url);
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Handle both array response and paginated response
        const chargesArray = Array.isArray(data) ? data : (data.content || data.data || []);
        
        setCharges(chargesArray);
        setBulkEditCharges(chargesArray.map(c => ({ ...c })));
      }
    } catch (err) {
      console.error("Error loading charges:", err);
    }
  }, [startDate, endDate]);

  const loadAllCharges = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/account-charges`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Handle both array response and paginated response
        const chargesArray = Array.isArray(data) ? data : (data.content || data.data || []);
        
        setAllCharges(chargesArray);
        setFilteredCharges(chargesArray);
      }
    } catch (err) {
      console.error("Error loading all charges:", err);
      setError("Failed to load charges");
    }
  }, []);

  const loadInvoices = useCallback(async () => {
    try {
      console.log('📄 Loading invoices from:', `${API_BASE_URL}/invoices`);
       console.log(localStorage.getItem("token"))
      const response = await fetch(`${API_BASE_URL}/invoices`, {
       
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      console.log('📄 Invoices response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📄 Invoices raw data:', data);
        
        // Handle both array response and paginated response
        const invoicesArray = Array.isArray(data) ? data : (data.content || data.data || []);
        console.log('📄 Invoices array:', invoicesArray, 'Length:', invoicesArray.length);
        
        setInvoices(invoicesArray);
        setFilteredInvoices(invoicesArray);
        setError(""); // Clear any previous errors
      } else if (response.status === 403) {
        console.error('📄 Access forbidden to invoices endpoint');
        setError("You don't have permission to view invoices. Please contact your administrator.");
        setInvoices([]);
        setFilteredInvoices([]);
      } else {
        const errorText = await response.text();
        console.error('📄 Failed to load invoices:', response.status, errorText);
        if (errorText.includes('HttpMessageNotWritableException') || errorText.includes('could not initialize proxy')) {
          setError("Backend error: Invoice data cannot be serialized. Please contact the backend team to fix the Hibernate lazy loading issue.");
        } else {
          setError(`Failed to load invoices (${response.status})`);
        }
        setInvoices([]);
        setFilteredInvoices([]);
      }
    } catch (err) {
      console.error("Error loading invoices:", err);
      if (err.message?.includes('JSON')) {
        setError("Backend returned invalid JSON. The backend needs to fix the Hibernate session issue.");
      } else {
        setError("Failed to connect to server");
      }
    }
  }, []);

  // ==================== Customer Operations ====================

  const handleOpenCustomerDialog = useCallback((customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setCustomerFormData({
        accountId: customer.accountId || "",
        companyName: customer.companyName,
        contactPerson: customer.contactPerson || "",
        streetAddress: customer.streetAddress || "",
        city: customer.city || "",
        province: customer.province || "BC",
        postalCode: customer.postalCode || "",
        country: customer.country || "Canada",
        phoneNumber: customer.phoneNumber || "",
        email: customer.email || "",
        billingPeriod: customer.billingPeriod || "MONTHLY",
        creditLimit: customer.creditLimit || "",
        notes: customer.notes || "",
      });
    } else {
      setEditingCustomer(null);
      setCustomerFormData(initialCustomerFormData);
    }
    setError("");
    setSuccess("");
    setOpenCustomerDialog(true);
  }, []);

  const handleSaveCustomer = useCallback(async () => {
    if (!customerFormData.accountId) {
      setError("Account ID is required");
      return;
    }
    if (!customerFormData.companyName) {
      setError("Company name is required");
      return;
    }

    try {
      const url = editingCustomer
        ? `${API_BASE_URL}/account-customers/${editingCustomer.id}`
        : `${API_BASE_URL}/account-customers`;

      const response = await fetch(url, {
        method: editingCustomer ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(customerFormData),
      });

      if (response.ok) {
        setSuccess(editingCustomer ? "Customer updated successfully" : "Customer created successfully");
        setOpenCustomerDialog(false);
        loadCustomers();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to save customer");
      }
    } catch (err) {
      console.error("Error saving customer:", err);
      setError("Failed to save customer");
    }
  }, [customerFormData, editingCustomer, loadCustomers]);

  const handleToggleCustomerActive = useCallback(async (customer) => {
    try {
      const action = customer.active ? "deactivate" : "activate";
      const response = await fetch(
        `${API_BASE_URL}/account-customers/${customer.id}/${action}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (response.ok) {
        setSuccess(`Customer ${action}d successfully`);
        loadCustomers();
      } else {
        const errorData = await response.json();
        setError(errorData.error || `Failed to ${action} customer`);
      }
    } catch (err) {
      console.error("Error toggling customer:", err);
      setError("Failed to update customer status");
    }
  }, [loadCustomers]);

  const handleSelectCustomer = useCallback(async (customer) => {
    setSelectedCustomer(customer);
    loadChargesForCustomer(customer.id);
  }, [loadChargesForCustomer]);

  const applyCustomerFilters = useCallback(() => {
    let filtered = [...customers];

    if (filterAccountId) {
      filtered = filtered.filter(customer =>
        customer.accountId?.toLowerCase().includes(filterAccountId.toLowerCase())
      );
    }

    if (filterCompanyName) {
      filtered = filtered.filter(customer =>
        customer.companyName?.toLowerCase().includes(filterCompanyName.toLowerCase())
      );
    }

    setFilteredCustomers(filtered);
  }, [customers, filterAccountId, filterCompanyName]);

  const clearCustomerFilters = useCallback(() => {
    setFilterAccountId("");
    setFilterCompanyName("");
    setFilteredCustomers(customers);
  }, [customers]);

  // ==================== Charge Operations ====================

  const handleOpenChargeDialog = useCallback((charge = null) => {
    if (!selectedCustomer) {
      setError("Please select a customer first");
      return;
    }

    if (charge) {
      setEditingCharge(charge);
      setChargeFormData({
        jobCode: charge.jobCode || "",
        tripDate: charge.tripDate || "",
        startTime: charge.startTime || "",
        endTime: charge.endTime || "",
        pickupAddress: charge.pickupAddress || "",
        dropoffAddress: charge.dropoffAddress || "",
        passengerName: charge.passengerName || "",
        cabId: charge.cab?.id || "",
        driverId: charge.driver?.id || "",
        fareAmount: charge.fareAmount || "",
        tipAmount: charge.tipAmount || "",
        notes: charge.notes || "",
      });
    } else {
      setEditingCharge(null);
      setChargeFormData(initialChargeFormData);
    }
    setError("");
    setSuccess("");
    setOpenChargeDialog(true);
  }, [selectedCustomer]);

  const handleSaveCharge = useCallback(async () => {
    if (!chargeFormData.tripDate || !chargeFormData.fareAmount) {
      setError("Trip date and fare amount are required");
      return;
    }

    try {
      const payload = {
        accountId: selectedCustomer.accountId,
        subAccount: null,
        accountCustomer: { id: selectedCustomer.id },
        jobCode: chargeFormData.jobCode || null,
        tripDate: chargeFormData.tripDate,
        startTime: chargeFormData.startTime || null,
        endTime: chargeFormData.endTime || null,
        pickupAddress: chargeFormData.pickupAddress || null,
        dropoffAddress: chargeFormData.dropoffAddress || null,
        passengerName: chargeFormData.passengerName || null,
        cab: chargeFormData.cabId ? { id: chargeFormData.cabId } : null,
        driver: chargeFormData.driverId ? { id: chargeFormData.driverId } : null,
        fareAmount: parseFloat(chargeFormData.fareAmount),
        tipAmount: chargeFormData.tipAmount ? parseFloat(chargeFormData.tipAmount) : 0,
        notes: chargeFormData.notes || null,
      };

      const url = editingCharge
        ? `${API_BASE_URL}/account-charges/${editingCharge.id}`
        : `${API_BASE_URL}/account-charges`;

      const response = await fetch(url, {
        method: editingCharge ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSuccess(editingCharge ? "Charge updated successfully" : "Charge created successfully");
        setOpenChargeDialog(false);
        loadChargesForCustomer(selectedCustomer.id);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to save charge");
      }
    } catch (err) {
      console.error("Error saving charge:", err);
      setError("Failed to save charge");
    }
  }, [chargeFormData, editingCharge, selectedCustomer, loadChargesForCustomer]);

  const handleMarkChargePaid = useCallback(async (id) => {
    const invoiceNumber = prompt("Enter invoice number:");
    if (!invoiceNumber) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/account-charges/${id}/mark-paid?invoiceNumber=${invoiceNumber}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (response.ok) {
        setSuccess("Charge marked as paid");
        if (selectedCustomer) {
          loadChargesForCustomer(selectedCustomer.id);
        }
        if (currentTab === 2) {
          loadAllCharges();
        }
      } else {
        setError("Failed to mark charge as paid");
      }
    } catch (err) {
      console.error("Error marking charge as paid:", err);
      setError("Failed to mark charge as paid");
    }
  }, [selectedCustomer, currentTab, loadChargesForCustomer, loadAllCharges]);

  // ==================== Bulk Edit Operations (Tab 2) ====================

  const handleEnterBulkEdit = useCallback(() => {
    setBulkEditMode(true);
    setBulkEditCharges(charges.map(c => ({ ...c })));
  }, [charges]);

  const handleCancelBulkEdit = useCallback(() => {
    setBulkEditMode(false);
    setBulkEditCharges([]);
  }, []);

  const handleBulkEditChange = useCallback((index, field, value) => {
    const updated = [...bulkEditCharges];
    updated[index][field] = value;
    setBulkEditCharges(updated);
  }, [bulkEditCharges]);

  const handleSaveBulkEdit = useCallback(() => {
    setConfirmBulkEditDialog(true);
  }, []);

  const handleConfirmBulkEdit = useCallback(async () => {
    setConfirmBulkEditDialog(false);
    
    try {
      const updatePromises = bulkEditCharges.map(charge => {
        const payload = {
          accountCustomer: { id: selectedCustomer.id },
          jobCode: charge.jobCode || null,
          tripDate: charge.tripDate,
          startTime: charge.startTime || null,
          endTime: charge.endTime || null,
          pickupAddress: charge.pickupAddress || null,
          dropoffAddress: charge.dropoffAddress || null,
          passengerName: charge.passengerName || null,
          cab: charge.cab?.id ? { id: charge.cab.id } : null,
          driver: charge.driver?.id ? { id: charge.driver.id } : null,
          fareAmount: parseFloat(charge.fareAmount),
          tipAmount: charge.tipAmount ? parseFloat(charge.tipAmount) : 0,
          notes: charge.notes || null,
        };

        return fetch(`${API_BASE_URL}/account-charges/${charge.id}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      });

      const results = await Promise.all(updatePromises);
      const successCount = results.filter(r => r.ok).length;

      setSuccess(`${successCount} charge(s) updated successfully`);
      setBulkEditMode(false);
      loadChargesForCustomer(selectedCustomer.id);
    } catch (err) {
      console.error("Error updating charges:", err);
      setError("Failed to update charges");
    }
  }, [bulkEditCharges, selectedCustomer, loadChargesForCustomer]);

  const handleFilterCharges = useCallback(() => {
    console.log('🔍 Filter button clicked for Trip Charges');
    console.log('📅 Current date values:', { startDate, endDate });
    if (selectedCustomer) {
      console.log('👤 Reloading charges for customer:', selectedCustomer.companyName);
      loadChargesForCustomer(selectedCustomer.id);
    } else {
      console.log('⚠️ No customer selected');
    }
  }, [selectedCustomer, startDate, endDate, loadChargesForCustomer]);

  // ==================== All Charges Operations (Tab 3) ====================

  const applyFilters = useCallback(() => {
    let filtered = [...allCharges];

    if (filterCustomerName) {
      filtered = filtered.filter(charge =>
        charge.customerName?.toLowerCase().includes(filterCustomerName.toLowerCase())
      );
    }

    if (filterCabId) {
      filtered = filtered.filter(charge => charge.cab?.id === parseInt(filterCabId));
    }

    if (filterDriverId) {
      filtered = filtered.filter(charge => charge.driver?.id === parseInt(filterDriverId));
    }

    if (filterStartDate && filterEndDate) {
      filtered = filtered.filter(charge => {
        const tripDate = new Date(charge.tripDate);
        const start = new Date(filterStartDate);
        const end = new Date(filterEndDate);
        return tripDate >= start && tripDate <= end;
      });
    }

    if (filterPaidStatus === "paid") {
      filtered = filtered.filter(charge => charge.paid);
    } else if (filterPaidStatus === "unpaid") {
      filtered = filtered.filter(charge => !charge.paid);
    }

    setFilteredCharges(filtered);
  }, [allCharges, filterCustomerName, filterCabId, filterDriverId, filterStartDate, filterEndDate, filterPaidStatus]);

  const clearFilters = useCallback(() => {
    setFilterCustomerName("");
    setFilterCabId("");
    setFilterDriverId("");
    setFilterStartDate("");
    setFilterEndDate("");
    setFilterPaidStatus("all");
    setFilteredCharges(allCharges);
  }, [allCharges]);

  const handleEnterAllChargesBulkEdit = useCallback(() => {
    setAllChargesBulkEdit(true);
    setBulkEditAllCharges(filteredCharges.map(c => ({ ...c })));
  }, [filteredCharges]);

  const handleCancelAllChargesBulkEdit = useCallback(() => {
    setAllChargesBulkEdit(false);
    setBulkEditAllCharges([]);
  }, []);

  const handleAllChargesBulkEditChange = useCallback((index, field, value) => {
    const updated = [...bulkEditAllCharges];
    updated[index][field] = value;
    setBulkEditAllCharges(updated);
  }, [bulkEditAllCharges]);

  const handleSaveAllChargesBulkEdit = useCallback(() => {
    setConfirmAllChargesBulkEditDialog(true);
  }, []);

  const handleConfirmAllChargesBulkEdit = useCallback(async () => {
    setConfirmAllChargesBulkEditDialog(false);

    try {
      const updatePromises = bulkEditAllCharges.map(charge => {
        const payload = {
          accountId: charge.accountId,
          subAccount: charge.subAccount || null,
          accountCustomer: { id: charge.customerId },
          jobCode: charge.jobCode || null,
          tripDate: charge.tripDate,
          startTime: charge.startTime || null,
          endTime: charge.endTime || null,
          pickupAddress: charge.pickupAddress || null,
          dropoffAddress: charge.dropoffAddress || null,
          passengerName: charge.passengerName || null,
          cab: charge.cab?.id ? { id: charge.cab.id } : null,
          driver: charge.driver?.id ? { id: charge.driver.id } : null,
          fareAmount: parseFloat(charge.fareAmount),
          tipAmount: charge.tipAmount ? parseFloat(charge.tipAmount) : 0,
          notes: charge.notes || null,
        };

        return fetch(`${API_BASE_URL}/account-charges/${charge.id}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      });

      const results = await Promise.all(updatePromises);
      const successCount = results.filter(r => r.ok).length;

      setSuccess(`${successCount} charge(s) updated successfully`);
      setAllChargesBulkEdit(false);
      loadAllCharges();
    } catch (err) {
      console.error("Error updating charges:", err);
      setError("Failed to update charges");
    }
  }, [bulkEditAllCharges, loadAllCharges]);

  // ==================== Invoice Operations ====================

  const handleOpenGenerateInvoiceDialog = useCallback((customer = null) => {
    if (customer) {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      setGenerateInvoiceFormData({
        customerId: customer.id,
        periodStart: firstDay.toISOString().split('T')[0],
        periodEnd: lastDay.toISOString().split('T')[0],
        taxRate: "5.0",
        terms: "Payment is due within 30 days of invoice date.",
      });
    } else {
      setGenerateInvoiceFormData(initialGenerateInvoiceFormData);
    }
    setError("");
    setSuccess("");
    setOpenGenerateInvoiceDialog(true);
  }, []);

  const handleGenerateInvoice = useCallback(async () => {
    if (!generateInvoiceFormData.customerId || !generateInvoiceFormData.periodStart || !generateInvoiceFormData.periodEnd) {
      setError("Customer, start date, and end date are required");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/invoices/generate?` +
        `customerId=${generateInvoiceFormData.customerId}&` +
        `periodStart=${generateInvoiceFormData.periodStart}&` +
        `periodEnd=${generateInvoiceFormData.periodEnd}&` +
        `taxRate=${generateInvoiceFormData.taxRate}&` +
        `terms=${encodeURIComponent(generateInvoiceFormData.terms)}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (response.ok) {
        const invoice = await response.json();
        setSuccess(`Invoice ${invoice.invoiceNumber} generated successfully!`);
        setOpenGenerateInvoiceDialog(false);
        loadInvoices();
      } else {
        const errorData = await response.json();
        setError(errorData.message || errorData.error || "Failed to generate invoice");
      }
    } catch (err) {
      console.error("Error generating invoice:", err);
      setError("Failed to generate invoice");
    }
  }, [generateInvoiceFormData, loadInvoices]);

  const handleViewInvoice = useCallback(async (invoice) => {
    try {
      const response = await fetch(`${API_BASE_URL}/invoices/${invoice.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.ok) {
        const fullInvoice = await response.json();
        setSelectedInvoice(fullInvoice);
        setOpenInvoiceDetailsDialog(true);
      }
    } catch (err) {
      console.error("Error loading invoice details:", err);
      setError("Failed to load invoice details");
    }
  }, []);

  const handleSendInvoice = useCallback(async (invoiceId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/invoices/${invoiceId}/send`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (response.ok) {
        setSuccess("Invoice marked as sent");
        loadInvoices();
      } else {
        setError("Failed to send invoice");
      }
    } catch (err) {
      console.error("Error sending invoice:", err);
      setError("Failed to send invoice");
    }
  }, [loadInvoices]);

  const handleCancelInvoice = useCallback(async (invoiceId) => {
    const reason = prompt("Enter reason for cancellation:");
    if (!reason) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/invoices/${invoiceId}/cancel?reason=${encodeURIComponent(reason)}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (response.ok) {
        setSuccess("Invoice cancelled");
        loadInvoices();
        if (openInvoiceDetailsDialog) {
          setOpenInvoiceDetailsDialog(false);
        }
      } else {
        setError("Failed to cancel invoice");
      }
    } catch (err) {
      console.error("Error cancelling invoice:", err);
      setError("Failed to cancel invoice");
    }
  }, [loadInvoices, openInvoiceDetailsDialog]);

  const handleOpenRecordPaymentDialog = useCallback((invoice) => {
    setSelectedInvoice(invoice);
    setPaymentFormData({
      amount: invoice.balanceDue.toString(),
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: "CREDIT_CARD",
      referenceNumber: "",
      notes: "",
    });
    setError("");
    setSuccess("");
    setOpenRecordPaymentDialog(true);
  }, []);

  const handleRecordPayment = useCallback(async () => {
    if (!paymentFormData.amount || !paymentFormData.paymentDate || !paymentFormData.paymentMethod) {
      setError("Amount, date, and payment method are required");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/payments/record?` +
        `invoiceId=${selectedInvoice.id}&` +
        `amount=${paymentFormData.amount}&` +
        `paymentDate=${paymentFormData.paymentDate}&` +
        `paymentMethod=${paymentFormData.paymentMethod}&` +
        `referenceNumber=${encodeURIComponent(paymentFormData.referenceNumber || '')}&` +
        `notes=${encodeURIComponent(paymentFormData.notes || '')}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (response.ok) {
        setSuccess("Payment recorded successfully!");
        setOpenRecordPaymentDialog(false);
        loadInvoices();
        if (openInvoiceDetailsDialog) {
          handleViewInvoice(selectedInvoice);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || errorData.error || "Failed to record payment");
      }
    } catch (err) {
      console.error("Error recording payment:", err);
      setError("Failed to record payment");
    }
  }, [paymentFormData, selectedInvoice, loadInvoices, openInvoiceDetailsDialog, handleViewInvoice]);

  const applyInvoiceFilters = useCallback(() => {
    let filtered = [...invoices];

    if (invoiceFilterCustomerId) {
      filtered = filtered.filter(inv => inv.customer.id === parseInt(invoiceFilterCustomerId));
    }

    if (invoiceFilterStatus !== "all") {
      filtered = filtered.filter(inv => inv.status === invoiceFilterStatus);
    }

    setFilteredInvoices(filtered);
  }, [invoices, invoiceFilterCustomerId, invoiceFilterStatus]);

  const clearInvoiceFilters = useCallback(() => {
    setInvoiceFilterCustomerId("");
    setInvoiceFilterStatus("all");
    setFilteredInvoices(invoices);
  }, [invoices]);

  // ==================== Effects ====================

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/signin");
      return;
    }

    const user = getCurrentUser();
    if (!user || !["ADMIN", "MANAGER", "ACCOUNTANT", "DISPATCHER"].includes(user.role)) {
      router.push("/");
      return;
    }
    setCurrentUser(user);
    loadData();
  }, [router, loadData]);

  useEffect(() => {
    if (currentTab === 2) {
      loadAllCharges();
    }
  }, [currentTab, loadAllCharges]);

  useEffect(() => {
    if (currentTab === 3) {
      loadInvoices();
    }
  }, [currentTab, loadInvoices]);

  return {
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
    allCharges,
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
    setSelectedInvoice,
    openGenerateInvoiceDialog,
    setOpenGenerateInvoiceDialog,
    openInvoiceDetailsDialog,
    setOpenInvoiceDetailsDialog,
    openRecordPaymentDialog,
    setOpenRecordPaymentDialog,
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
    handleCancelInvoice,
    handleOpenRecordPaymentDialog,
    handleRecordPayment,
    applyInvoiceFilters,
    clearInvoiceFilters,
  };
}