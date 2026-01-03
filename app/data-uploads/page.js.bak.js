"use client";

import { useState, useEffect } from "react";
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
  CloudUpload as UploadIcon,
  TableChart as TableIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import GlobalNav from "../components/GlobalNav";
import { getCurrentUser, API_BASE_URL } from "../lib/api";
import FileUploadStep from "./components/FileUploadStep";
import DataPreviewStep from "./components/DataPreviewStep";
import ImportResultsStep from "./components/ImportResultsStep";

const steps = ["Upload CSV File", "Review & Edit Data", "Import Results"];

export default function DataUploadsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  // Preview state
  const [previewData, setPreviewData] = useState(null);
  const [editedData, setEditedData] = useState([]);
  
  // Import results state
  const [importResults, setImportResults] = useState(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || !["ADMIN", "MANAGER", "ACCOUNTANT"].includes(user.role)) {
      window.location.href = "/";
      return;
    }
    setCurrentUser(user);
  }, []);

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
        // Try to get error message from response
        let errorMessage = "Failed to upload and parse CSV file";
        try {
          const errorData = await response.text();
          console.error("Backend error response:", errorData);
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
        setError(`Import completed with ${result.errorCount} errors. ${result.successCount} transactions imported successfully.`);
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

  if (!currentUser) return null;

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f6f9fc" }}>
      <GlobalNav currentUser={currentUser} title="FareFlow - Data Uploads" />

      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: "#3e5244" }}>
          Credit Card Transaction Uploads
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Upload CSV files containing credit card transactions. The system will automatically map merchants to cabs and identify drivers from shift data.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              Upload Error
            </Typography>
            <Typography variant="body2" component="pre" sx={{ whiteSpace: "pre-wrap", fontSize: "0.85rem" }}>
              {error}
            </Typography>
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
                      <Typography color="textSecondary" variant="body2">
                        Total Rows
                      </Typography>
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
                      <Typography color="textSecondary" variant="body2">
                        Valid Rows
                      </Typography>
                      <Typography variant="h5">
                        {previewData.statistics?.validRows || 0}
                      </Typography>
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
                      <Typography color="textSecondary" variant="body2">
                        Cab Matches
                      </Typography>
                      <Typography variant="h5">
                        {previewData.statistics?.cabMatches || 0}
                      </Typography>
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
                      <Typography color="textSecondary" variant="body2">
                        Driver Matches
                      </Typography>
                      <Typography variant="h5">
                        {previewData.statistics?.driverMatches || 0}
                      </Typography>
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
            <ImportResultsStep
              results={importResults}
              onReset={handleReset}
            />
          )}
        </Paper>
      </Box>
    </Box>
  );
}
