"use client";

import { useState } from "react";
import {
  Box,
  Paper,
  Tabs,
  Tab,
} from "@mui/material";
import {
  CreditCard as CreditCardIcon,
  FlightTakeoff as AirportIcon,
  Speed as MileageIcon,
} from "@mui/icons-material";
import CreditCardUploadTab from "./CreditCardUploadTab";
import AirportTripsUploadTab from "./AirportTripsUploadTab";
import MileageUploadTab from "./MileageUploadTab";

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

export default function UploadDataSection() {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box>
      {/* Sub-tabs for upload types */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="secondary"
          textColor="inherit"
          variant="fullWidth"
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            "& .MuiTab-root": {
              minHeight: 56,
              fontSize: "0.9rem",
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
  );
}
