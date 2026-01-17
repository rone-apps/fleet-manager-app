"use client";

import { useState } from "react";
import { Box, Button, Typography, Alert, Paper } from "@mui/material";
import { API_BASE_URL } from "../../lib/api";

export default function ApiDiagnostic() {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const testHealthCheck = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/uploads/credit-card-transactions/health`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });

      const text = await response.text();
      setResult(`Health Check: ${response.status} - ${text}`);
    } catch (err) {
      setResult(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testColumnMappings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/uploads/credit-card-transactions/column-mappings`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, "X-Tenant-ID": localStorage.getItem("tenantSchema"),
            "X-Tenant-ID": localStorage.getItem("tenantSchema"),
        },
      });

      const data = await response.json();
      setResult(`Column Mappings: ${JSON.stringify(data, null, 2)}`);
    } catch (err) {
      setResult(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkApiUrl = () => {
    setResult(`API URL: ${API_BASE_URL}\nToken exists: ${!!localStorage.getItem("token")}`);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        API Diagnostic Tool
      </Typography>

      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <Button variant="contained" onClick={checkApiUrl} disabled={loading}>
          Check Config
        </Button>
        <Button variant="contained" onClick={testHealthCheck} disabled={loading}>
          Test Health Check
        </Button>
        <Button variant="contained" onClick={testColumnMappings} disabled={loading}>
          Test Column Mappings
        </Button>
      </Box>

      {result && (
        <Paper sx={{ p: 2, backgroundColor: "#f5f5f5" }}>
          <Typography variant="body2" component="pre" sx={{ whiteSpace: "pre-wrap" }}>
            {result}
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
