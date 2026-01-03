"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import {
  TableChart as TableIcon,
  CheckCircle as CheckIcon,
} from "@mui/icons-material";
import { API_BASE_URL } from "../../lib/api";
import FileUploadStep from "./FileUploadStep";
import DataPreviewStep from "./DataPreviewStep";
import ImportResultsStep from "./ImportResultsStep";

const steps = ["Upload CSV File", "Review & Edit Data", "Import Results"];

export default function CreditCardUploadTab() {
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [editedData, setEditedData] = useState([]);
  const [importResults, setImportResults] = useState(null);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setError("");
  };

  const handleUploadAndPreview = async () => {
    if (!selectedFile) {
      setError("Please select a file to upload");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(`${API_BASE_URL}/uploads/credit-card-transactions/preview`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = "Failed to upload and parse CSV file";
        try {
          const errorData = await response.text();
          errorMessage = errorData || `HTTP ${response.status}: ${response.statusText}`;
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setPreviewData(data);
      setEditedData(data.previewData || []);
      setActiveStep(1);
      setSuccess(`File uploaded successfully! Found ${data.totalRows} transactions.`);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload file: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleImport = async () => {
    if (!editedData || editedData.length === 0) {
      setError("No data to import");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/uploads/credit-card-transactions/import?filename=${encodeURIComponent(selectedFile.name)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editedData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to import transactions");
      }

      const result = await response.json();
      setImportResults(result);
      setActiveStep(2);

      if (result.errorCount === 0) {
        setSuccess(`Successfully imported ${result.successCount} transactions!`);
      } else {
        setError(`Import completed with ${result.errorCount} errors.`);
      }
    } catch (err) {
      console.error("Import error:", err);
      setError("Failed to import transactions: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    setSelectedFile(null);
    setPreviewData(null);
    setEditedData([]);
    setImportResults(null);
    setError("");
    setSuccess("");
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    setError("");
    setSuccess("");
  };

  return (
    <Box>
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
      {previewData && activeStep === 1 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <TableIcon color="primary" />
                  <Box>
                    <Typography color="textSecondary" variant="body2">Total Rows</Typography>
                    <Typography variant="h5">{previewData.totalRows}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CheckIcon color="success" />
                  <Box>
                    <Typography color="textSecondary" variant="body2">Valid Rows</Typography>
                    <Typography variant="h5">{previewData.statistics?.validRows || 0}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CheckIcon color="info" />
                  <Box>
                    <Typography color="textSecondary" variant="body2">Cab Matches</Typography>
                    <Typography variant="h5">{previewData.statistics?.cabMatches || 0}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CheckIcon color="secondary" />
                  <Box>
                    <Typography color="textSecondary" variant="body2">Driver Matches</Typography>
                    <Typography variant="h5">{previewData.statistics?.driverMatches || 0}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Stepper */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Step Content */}
      <Paper sx={{ p: 3 }}>
        {activeStep === 0 && (
          <FileUploadStep
            selectedFile={selectedFile}
            uploading={uploading}
            onFileSelect={handleFileSelect}
            onUpload={handleUploadAndPreview}
          />
        )}

        {activeStep === 1 && (
          <DataPreviewStep
            previewData={previewData}
            editedData={editedData}
            onDataChange={setEditedData}
            onBack={handleBack}
            onImport={handleImport}
            importing={uploading}
          />
        )}

        {activeStep === 2 && (
          <ImportResultsStep results={importResults} onReset={handleReset} />
        )}
      </Paper>
    </Box>
  );
}
