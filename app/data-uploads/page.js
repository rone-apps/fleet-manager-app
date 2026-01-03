"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Alert,
} from "@mui/material";
import {
  CreditCard as CreditCardIcon,
  FlightTakeoff as AirportIcon,
  Speed as MileageIcon,
} from "@mui/icons-material";
import GlobalNav from "../components/GlobalNav";
import { getCurrentUser } from "../lib/api";
import CreditCardUploadTab from "./components/CreditCardUploadTab";
import AirportTripsUploadTab from "./components/AirportTripsUploadTab";
import MileageUploadTab from "./components/MileageUploadTab";

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`upload-tabpanel-${index}`}
      aria-labelledby={`upload-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function DataUploadsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [globalError, setGlobalError] = useState("");

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || !["ADMIN", "MANAGER", "ACCOUNTANT"].includes(user.role)) {
      window.location.href = "/";
      return;
    }
    setCurrentUser(user);
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setGlobalError("");
  };

  if (!currentUser) return null;

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f6f9fc" }}>
      <GlobalNav currentUser={currentUser} title="FareFlow - Data Uploads" />

      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: "#3e5244" }}>
          Data Uploads
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Upload CSV files to import credit card transactions, mileage records, and airport trip data.
        </Typography>

        {globalError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setGlobalError("")}>
            {globalError}
          </Alert>
        )}

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              "& .MuiTab-root": {
                minHeight: 64,
                fontSize: "0.95rem",
              },
            }}
          >
            <Tab
              icon={<CreditCardIcon />}
              iconPosition="start"
              label="Credit Card Transactions"
              id="upload-tab-0"
              aria-controls="upload-tabpanel-0"
            />
            <Tab
              icon={<MileageIcon />}
              iconPosition="start"
              label="Cab Mileage"
              id="upload-tab-1"
              aria-controls="upload-tabpanel-1"
            />
            <Tab
              icon={<AirportIcon />}
              iconPosition="start"
              label="Airport Trips"
              id="upload-tab-2"
              aria-controls="upload-tabpanel-2"
            />
          </Tabs>
        </Paper>

        {/* Tab Panels */}
        <TabPanel value={activeTab} index={0}>
          <CreditCardUploadTab />
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <MileageUploadTab />
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          <AirportTripsUploadTab />
        </TabPanel>
      </Box>
    </Box>
  );
}
