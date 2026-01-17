"use client";

import React from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import { TrendingUp } from "@mui/icons-material";

export default function OtherRevenueTab({ driverNumber, startDate, endDate, data }) {
  const items = Array.isArray(data) ? data : [];
  const total = items.reduce((sum, r) => sum + parseFloat(r?.amount || 0), 0);

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TrendingUp sx={{ color: "success.main" }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Other Revenue
            </Typography>
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "success.main" }}>
            ${total.toFixed(2)}
          </Typography>
        </Box>
      </Paper>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length > 0 ? (
              items.map((r, idx) => (
                <TableRow key={r?.id ?? `${r?.revenueDate || r?.date || ""}-${idx}`} hover>
                  <TableCell>{r?.revenueDate || r?.date || r?.createdAt || "-"}</TableCell>
                  <TableCell>
                    <Chip
                      label={r?.category?.categoryName || r?.categoryName || "N/A"}
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={r?.revenueType || r?.type || "-"}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{r?.description || r?.notes || "-"}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: "success.main" }}>
                    ${parseFloat(r?.amount || 0).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No other revenue items found for this period.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
