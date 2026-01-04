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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TablePagination,
  FormControlLabel,
  Checkbox,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Backdrop,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  TableChart as TableIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { API_BASE_URL } from "../../lib/api";
import { useRouter } from "next/navigation";

const steps = ["Upload CSV File", "Review Data", "Import Results"];

export default function AirportTripsUploadTab() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [previewData, setPreviewData] = useState(null);
  const [editedData, setEditedData] = useState([]);
  const [importResults, setImportResults] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.name.endsWith(".csv")) {
        setError("Please select a CSV file");
        return;
      }
      setSelectedFile(file);
      setError("");
    }
  };

  const handleUploadAndPreview = async () => {
    if (!selectedFile) {
      setError("Please select a file to upload");
      return;
    }

    setUploading(true);
    setLoadingMessage("Processing CSV file and splitting by shift... This may take a few minutes for large files.");
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(`${API_BASE_URL}/uploads/airport-trips/preview`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setPreviewData(data);
      setEditedData(data.airportTripPreviewData || []);
      setSessionId(data.sessionId); // Store sessionId for import
      setActiveStep(1);
      
      const originalRows = data.statistics?.originalRows || data.totalRows;
      const splitRows = data.statistics?.splitRows || data.airportTripPreviewData?.length || 0;
      if (splitRows > originalRows) {
        setSuccess(`File uploaded! ${originalRows} CSV rows split into ${splitRows} records (by shift).`);
      } else {
        setSuccess(`File uploaded! Found ${data.totalRows} records.`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload file: " + err.message);
    } finally {
      setUploading(false);
      setLoadingMessage("");
    }
  };

  const handleImport = async () => {
    if (!sessionId) {
      setError("Session expired. Please re-upload the file.");
      return;
    }

    setUploading(true);
    setLoadingMessage(`Importing ${previewData?.statistics?.splitRows || previewData?.totalRows || 0} records... This may take a few minutes.`);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/uploads/airport-trips/import?sessionId=${sessionId}&filename=${encodeURIComponent(selectedFile.name)}&overwriteExisting=${overwriteExisting}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to import records");
      }

      const result = await response.json();
      setImportResults(result);
      setActiveStep(2);

      if (result.errorCount === 0) {
        setSuccess(`Successfully imported ${result.successCount} records!`);
      } else {
        setError(`Import completed with ${result.errorCount} errors.`);
      }
    } catch (err) {
      console.error("Import error:", err);
      setError("Failed to import: " + err.message);
    } finally {
      setUploading(false);
      setLoadingMessage("");
    }
  };

  const handleReset = () => {
    // Cancel the session if exists
    if (sessionId) {
      fetch(`${API_BASE_URL}/uploads/airport-trips/cancel/${sessionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }).catch(() => {});
    }
    setActiveStep(0);
    setSelectedFile(null);
    setPreviewData(null);
    setEditedData([]);
    setImportResults(null);
    setSessionId(null);
    setError("");
    setSuccess("");
    setLoadingMessage("");
    setPage(0);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    setError("");
    setSuccess("");
  };

  return (
    <Box>
      {/* Loading Backdrop */}
      <Backdrop
        sx={{ 
          color: '#fff', 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          flexDirection: 'column',
          gap: 2
        }}
        open={uploading}
      >
        <CircularProgress color="inherit" size={60} />
        <Typography variant="h6">{loadingMessage || "Processing..."}</Typography>
        <Typography variant="body2">Please do not close this page</Typography>
      </Backdrop>

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
          <Grid item xs={6} sm={3}>
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
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CheckIcon color="success" />
                  <Box>
                    <Typography color="textSecondary" variant="body2">Valid</Typography>
                    <Typography variant="h5">{previewData.statistics?.validRows || 0}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CheckIcon color="warning" />
                  <Box>
                    <Typography color="textSecondary" variant="body2">Day Shifts</Typography>
                    <Typography variant="h5">{previewData.statistics?.dayShiftRows || 0}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CheckIcon color="primary" />
                  <Box>
                    <Typography color="textSecondary" variant="body2">Night Shifts</Typography>
                    <Typography variant="h5">{previewData.statistics?.nightShiftRows || 0}</Typography>
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
        {/* Step 1: File Upload */}
        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Upload Airport Trips CSV
            </Typography>

            <Paper sx={{ p: 2, backgroundColor: "#f5f5f5", mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Expected CSV Format:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckIcon fontSize="small" color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Vehicle, year, month, Day"
                    secondary="Cab identifier and date components"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckIcon fontSize="small" color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Columns 0-23"
                    secondary="Hourly trip counts"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <InfoIcon fontSize="small" color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Grand Total"
                    secondary="Optional - calculated if not provided"
                  />
                </ListItem>
              </List>
            </Paper>

            <Box
              sx={{
                border: "2px dashed #ccc",
                borderRadius: 2,
                p: 4,
                textAlign: "center",
                backgroundColor: selectedFile ? "#e8f5e9" : "#fafafa",
                mb: 3,
              }}
            >
              <input
                accept=".csv"
                style={{ display: "none" }}
                id="airport-csv-upload"
                type="file"
                onChange={handleFileSelect}
              />
              <label htmlFor="airport-csv-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<UploadIcon />}
                  size="large"
                  sx={{ mb: 2 }}
                >
                  Choose CSV File
                </Button>
              </label>

              {selectedFile && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: "success.main" }}>
                    <CheckIcon sx={{ verticalAlign: "middle", mr: 1 }} />
                    {selectedFile.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </Typography>
                </Box>
              )}
            </Box>

            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                onClick={handleUploadAndPreview}
                disabled={!selectedFile || uploading}
                size="large"
              >
                {uploading ? "Processing..." : "Upload and Preview"}
              </Button>
            </Box>
          </Box>
        )}

        {/* Step 2: Data Preview */}
        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Review Airport Trip Data
            </Typography>

            <FormControlLabel
              control={
                <Checkbox
                  checked={overwriteExisting}
                  onChange={(e) => setOverwriteExisting(e.target.checked)}
                />
              }
              label="Overwrite existing records for same cab/shift/date"
              sx={{ mb: 2 }}
            />

            <Alert severity="info" sx={{ mb: 2 }}>
              Trips are split by shift: DAY (4am-4pm) and NIGHT (4pm-4am). Night hours 0-3 belong to the previous day's night shift.
            </Alert>

            <TableContainer component={Paper} sx={{ maxHeight: 500, mb: 3 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Status</TableCell>
                    <TableCell>Cab #</TableCell>
                    <TableCell>Shift</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="center">Total</TableCell>
                    <TableCell>Hours</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {editedData
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row, index) => {
                      const peakHours = [];
                      for (let h = 0; h <= 23; h++) {
                        const trips = row.hourlyTrips?.[h] || 0;
                        if (trips > 0) peakHours.push(`${h}:00(${trips})`);
                      }

                      return (
                        <TableRow
                          key={index}
                          sx={{ backgroundColor: !row.valid ? "#ffebee" : "inherit" }}
                        >
                          <TableCell>
                            {row.valid ? (
                              <CheckIcon color="success" fontSize="small" />
                            ) : (
                              <Tooltip title={row.validationMessage || "Invalid"}>
                                <ErrorIcon color="error" fontSize="small" />
                              </Tooltip>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={row.cabNumber || "N/A"}
                              size="small"
                              color={row.cabLookupSuccess ? "success" : "default"}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={row.shift || "N/A"}
                              size="small"
                              color={row.shift === "DAY" ? "warning" : "primary"}
                              variant="filled"
                            />
                          </TableCell>
                          <TableCell>{row.tripDate || "-"}</TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {row.grandTotal || 0}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {peakHours.slice(0, 4).join(", ")}
                              {peakHours.length > 4 && "..."}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={editedData.length}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50, 100]}
            />

            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
              <Button variant="outlined" onClick={handleBack} disabled={uploading}>
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleImport}
                disabled={uploading || editedData.filter(r => r.valid).length === 0}
                size="large"
              >
                {uploading ? "Importing..." : `Import ${editedData.filter(r => r.valid).length} Records`}
              </Button>
            </Box>
          </Box>
        )}

        {/* Step 3: Import Results */}
        {activeStep === 2 && importResults && (
          <Box>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Import Results
            </Typography>

            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={3}>
                <Card sx={{ backgroundColor: "#e8f5e9" }}>
                  <CardContent>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: "success.main" }}>
                      {importResults.successCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Imported</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card sx={{ backgroundColor: "#e3f2fd" }}>
                  <CardContent>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: "info.main" }}>
                      {importResults.updateCount || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Updated</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card sx={{ backgroundColor: "#fff3e0" }}>
                  <CardContent>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: "warning.main" }}>
                      {importResults.skipCount || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Skipped</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card sx={{ backgroundColor: "#ffebee" }}>
                  <CardContent>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: "error.main" }}>
                      {importResults.errorCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Errors</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {importResults.errors && importResults.errors.length > 0 && (
              <Paper sx={{ p: 2, mb: 3, backgroundColor: "#ffebee", maxHeight: 200, overflow: "auto" }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: "error.main" }}>
                  Errors:
                </Typography>
                {importResults.errors.map((err, i) => (
                  <Typography key={i} variant="body2">{err}</Typography>
                ))}
              </Paper>
            )}

            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleReset}>
                Upload Another File
              </Button>
              <Button variant="contained" onClick={() => router.push("/reports")}>
                View Reports
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
