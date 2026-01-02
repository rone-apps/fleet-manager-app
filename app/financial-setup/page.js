"use client";

import { useState, useEffect } from "react";
import { Box, Typography, Paper, Tabs, Tab, Alert, Grid } from "@mui/material";
import GlobalNav from "../components/GlobalNav";
import { getCurrentUser } from "../lib/api";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

// Tab Components
import ExpenseCategoriesTab from "./tabs/ExpenseCategoriesTab";
import RevenueCategoriesTab from "./tabs/RevenueCategoriesTab";
import LeasePlansRatesTab from "./tabs/LeasePlansRatesTab";
import LeaseRateOverridesTab from "./tabs/LeaseRateOverridesTab";
import MerchantMappingsTab from "./tabs/MerchantMappingsTab";

// Statistics Component
import FinancialStats from "./components/FinancialStats";

// Icons
import {
  Category as CategoryIcon,
  TrendingUp as RevenueIcon,
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
  CreditCard as MerchantIcon,
} from "@mui/icons-material";

export default function FinancialSetupPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Statistics data
  const [stats, setStats] = useState({
    expenseCategories: 0,
    revenueCategories: 0,
    leasePlans: 0,
    leaseRates: 0,
    leaseRateOverrides: 0,
    merchantMappings: 0,
  });

  const canEdit = currentUser?.role === "ADMIN" || currentUser?.role === "MANAGER";
  const canDelete = currentUser?.role === "ADMIN";

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || !["ADMIN", "MANAGER", "ACCOUNTANT", "DISPATCHER"].includes(user.role)) {
      window.location.href = "/";
      return;
    }
    setCurrentUser(user);
    setLoading(false);
  }, []);

  const updateStats = (newStats) => {
    setStats((prev) => ({ ...prev, ...newStats }));
  };

  if (!currentUser) return null;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ minHeight: "100vh", backgroundColor: "#f6f9fc" }}>
        <GlobalNav currentUser={currentUser} />

        <Box sx={{ p: 3 }}>
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: "#3e5244" }}>
            Financial Configuration
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Manage expense categories, revenue categories, lease plans, rates, overrides, and merchant mappings
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
              {success}
            </Alert>
          )}

          {/* Statistics Cards */}
          <FinancialStats stats={stats} />

          {/* Tabs */}
          <Paper>
            <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
              <Tab label="Expense Categories" icon={<CategoryIcon />} iconPosition="start" />
              <Tab label="Revenue Categories" icon={<RevenueIcon />} iconPosition="start" />
              <Tab label="Lease Plans & Rates" icon={<ReceiptIcon />} iconPosition="start" />
              <Tab label="Lease Rate Overrides" icon={<MoneyIcon />} iconPosition="start" />
              <Tab label="Merchant Mappings" icon={<MerchantIcon />} iconPosition="start" />
            </Tabs>

            {/* Tab Content */}
            {currentTab === 0 && (
              <ExpenseCategoriesTab
                canEdit={canEdit}
                canDelete={canDelete}
                setError={setError}
                setSuccess={setSuccess}
                updateStats={updateStats}
              />
            )}

            {currentTab === 1 && (
              <RevenueCategoriesTab
                canEdit={canEdit}
                canDelete={canDelete}
                setError={setError}
                setSuccess={setSuccess}
                updateStats={updateStats}
              />
            )}

            {currentTab === 2 && (
              <LeasePlansRatesTab
                canEdit={canEdit}
                canDelete={canDelete}
                setError={setError}
                setSuccess={setSuccess}
                updateStats={updateStats}
              />
            )}

            {currentTab === 3 && (
              <LeaseRateOverridesTab
                canEdit={canEdit}
                canDelete={canDelete}
                setError={setError}
                setSuccess={setSuccess}
                updateStats={updateStats}
              />
            )}

            {currentTab === 4 && (
              <MerchantMappingsTab
                canEdit={canEdit}
                canDelete={canDelete}
                setError={setError}
                setSuccess={setSuccess}
                updateStats={updateStats}
              />
            )}
          </Paper>
        </Box>
      </Box>
    </LocalizationProvider>
  );
}
