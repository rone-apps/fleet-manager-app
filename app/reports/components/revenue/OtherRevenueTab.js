"use client";

import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import { TrendingUp } from "@mui/icons-material";

export default function OtherRevenueTab({ driverNumber, startDate, endDate }) {
  return (
    <Paper sx={{ p: 6, textAlign: "center" }}>
      <TrendingUp sx={{ fontSize: 80, color: "text.disabled", mb: 2 }} />
      <Typography variant="h6" color="text.secondary" gutterBottom>
        Other Revenue Sources
      </Typography>
      <Typography variant="body2" color="text.secondary">
        This feature will track tips, bonuses, and other miscellaneous revenue.
      </Typography>
      <Typography variant="caption" color="text.disabled" sx={{ mt: 2, display: "block" }}>
        Coming soon - ready for implementation
      </Typography>
    </Paper>
  );
}
