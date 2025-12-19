"use client";

import React, { useState } from "react";
import { Box, Tabs, Tab, Typography } from "@mui/material";
import {
  AttachMoney,
  Autorenew,
  MoneyOff,
} from "@mui/icons-material";

// Import expense sub-components
import LeaseExpenseTab from "./expense/LeaseExpenseTab";
import FixedExpensesTab from "./expense/FixedExpensesTab";
import OtherExpensesTab from "./expense/OtherExpensesTab";

export default function ExpenseTab({ driverNumber, startDate, endDate, reportData }) {
  const [activeSubTab, setActiveSubTab] = useState(0);

  const fixedExpensesTotal =
    reportData?.fixedExpenses?.total ??
    parseFloat(reportData?.fixedExpenses?.totalAmount || reportData?.fixedExpenses?.totalExpenses || 0);

  const handleSubTabChange = (event, newValue) => {
    setActiveSubTab(newValue);
  };

  // If no reportData, show message
  if (!reportData) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="textSecondary">
          Generate a report to view expense data
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
          label="Lease Expense" 
        />
        <Tab 
          icon={<Autorenew />} 
          iconPosition="start" 
          label={`Fixed Expenses ($${fixedExpensesTotal.toFixed(2)})`}
        />
        <Tab 
          icon={<MoneyOff />} 
          iconPosition="start" 
          label="Other Expenses" 
        />
      </Tabs>

      {activeSubTab === 0 && (
        <LeaseExpenseTab
          driverNumber={driverNumber}
          startDate={startDate}
          endDate={endDate}
          data={null}
        />
      )}
      {activeSubTab === 1 && (
        <FixedExpensesTab
          driverNumber={driverNumber}
          startDate={startDate}
          endDate={endDate}
          data={reportData.fixedExpenses.data}
        />
      )}
      {activeSubTab === 2 && (
        <OtherExpensesTab
          driverNumber={driverNumber}
          startDate={startDate}
          endDate={endDate}
          data={null}
        />
      )}
    </Box>
  );
}