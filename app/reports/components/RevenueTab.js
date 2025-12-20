"use client";

import React, { useState } from "react";
import { Box, Tabs, Tab, Typography } from "@mui/material";
import {
  AttachMoney,
  CreditCard,
  Receipt,
  TrendingUp,
} from "@mui/icons-material";

// Import revenue sub-components
import LeaseRevenueTab from "./revenue/LeaseRevenueTab";
import CreditCardsTab from "./revenue/CreditCardsTab";
import ChargesTab from "./revenue/ChargesTab";
import OtherRevenueTab from "./revenue/OtherRevenueTab";

export default function RevenueTab({ driverNumber, startDate, endDate, reportData }) {
  const [activeSubTab, setActiveSubTab] = useState(0);

  const leaseRevenueTotal =
    reportData?.leaseRevenue?.total ??
    parseFloat(reportData?.leaseRevenue?.totalRevenue || reportData?.leaseRevenue?.grandTotalLease || 0);
  const creditCardTotal =
    reportData?.creditCardRevenue?.total ??
    parseFloat(reportData?.creditCardRevenue?.totalAmount || 0);
  const chargesTotal =
    reportData?.chargesRevenue?.total ??
    parseFloat(reportData?.chargesRevenue?.grandTotal || reportData?.chargesRevenue?.totalAmount || 0);

  const otherRevenueTotal = Array.isArray(reportData?.otherRevenue)
    ? reportData.otherRevenue.reduce((sum, r) => sum + parseFloat(r?.amount || 0), 0)
    : 0;

  const handleSubTabChange = (event, newValue) => {  
    setActiveSubTab(newValue);
  };

  // If no reportData, show message
  if (!reportData) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="textSecondary">
          Generate a report to view revenue data
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Tabs
        value={activeSubTab}
        onChange={handleSubTabChange}
        sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}
      >
        <Tab 
          icon={<AttachMoney />} 
          iconPosition="start" 
          label={`Lease Revenue ($${leaseRevenueTotal.toFixed(2)})`}
        />
        <Tab 
          icon={<CreditCard />} 
          iconPosition="start" 
          label={`Credit Cards ($${creditCardTotal.toFixed(2)})`}
        />
        <Tab 
          icon={<Receipt />} 
          iconPosition="start" 
          label={`Charges ($${chargesTotal.toFixed(2)})`}
        />
        <Tab 
          icon={<TrendingUp />} 
          iconPosition="start" 
          label={`Other Revenue ($${otherRevenueTotal.toFixed(2)})`} 
        />
      </Tabs>

      {activeSubTab === 0 && (
        <LeaseRevenueTab
          driverNumber={driverNumber}
          startDate={startDate}
          endDate={endDate}
          data={reportData?.leaseRevenue?.data ?? reportData?.leaseRevenue ?? null}
        />
      )}
      {activeSubTab === 1 && (
        <CreditCardsTab
          driverNumber={driverNumber}
          startDate={startDate}
          endDate={endDate}
          data={reportData?.creditCardRevenue?.data ?? reportData?.creditCardRevenue ?? null}
        />
      )}
      {activeSubTab === 2 && (
        <ChargesTab
          driverNumber={driverNumber}
          startDate={startDate}
          endDate={endDate}
          data={reportData?.chargesRevenue?.data ?? reportData?.chargesRevenue ?? null}
        />
      )}
      {activeSubTab === 3 && (
        <OtherRevenueTab
          driverNumber={driverNumber}
          startDate={startDate}
          endDate={endDate}
          data={reportData?.otherRevenue || []}
        />
      )}
    </Box>
  );
}