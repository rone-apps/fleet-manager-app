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
  CloudUpload as UploadIcon,
  TableChart as ViewIcon,
} from "@mui/icons-material";
import GlobalNav from "../components/GlobalNav";
import { getCurrentUser } from "../lib/api";
import UploadDataSection from "./components/UploadDataSection";
import ViewDataSection from "./components/ViewDataSection";

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`main-tabpanel-${index}`}
      aria-labelledby={`main-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function DataUploadsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [mainTab, setMainTab] = useState(0);
  const [globalError, setGlobalError] = useState("");

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || !["ADMIN", "MANAGER", "ACCOUNTANT"].includes(user.role)) {
      window.location.href = "/";
      return;
    }
    setCurrentUser(user);
  }, []);

  const handleMainTabChange = (event, newValue) => {
    setMainTab(newValue);
    setGlobalError("");
  };

  if (!currentUser) return null;

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f6f9fc" }}>
      <GlobalNav currentUser={currentUser} title="FareFlow - Data Management" />

      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: "#3e5244" }}>
          Data Management
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Upload and manage credit card transactions, mileage records, and airport trip data.
        </Typography>

        {globalError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setGlobalError("")}>
            {globalError}
          </Alert>
        )}

        {/* Main Tabs: Upload Data / View Data */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={mainTab}
            onChange={handleMainTabChange}
            indicatorColor="primary"
            textColor="primary"
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              "& .MuiTab-root": {
                minHeight: 64,
                fontSize: "1rem",
                fontWeight: 600,
              },
            }}
          >
            <Tab
              icon={<UploadIcon />}
              iconPosition="start"
              label="Upload Data"
              id="main-tab-0"
              aria-controls="main-tabpanel-0"
            />
            <Tab
              icon={<ViewIcon />}
              iconPosition="start"
              label="View Data"
              id="main-tab-1"
              aria-controls="main-tabpanel-1"
            />
          </Tabs>
        </Paper>

        {/* Main Tab Panels */}
        <TabPanel value={mainTab} index={0}>
          <UploadDataSection />
        </TabPanel>
        <TabPanel value={mainTab} index={1}>
          <ViewDataSection currentUser={currentUser} />
        </TabPanel>
      </Box>
    </Box>
  );
}
