"use client";

import {
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
} from "@mui/icons-material";

export default function FileUploadStep({ selectedFile, uploading, onFileSelect, onUpload }) {
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.name.endsWith(".csv")) {
        alert("Please select a CSV file");
        return;
      }
      onFileSelect(file);
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Step 1: Upload CSV File
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Upload a CSV file containing credit card transactions. The system supports the following formats:
        </Typography>

        <Paper sx={{ p: 2, backgroundColor: "#f5f5f5", mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Expected CSV Columns:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <CheckIcon fontSize="small" color="success" />
              </ListItemIcon>
              <ListItemText
                primary="Merchant Number, Site Number, Device Number"
                secondary="Required for merchant-to-cab mapping"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <CheckIcon fontSize="small" color="success" />
              </ListItemIcon>
              <ListItemText
                primary="Transaction Date, Transaction Time"
                secondary="Required for driver shift lookup"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <CheckIcon fontSize="small" color="success" />
              </ListItemIcon>
              <ListItemText
                primary="Authorization Code, Transaction Amount"
                secondary="Required transaction details"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <InfoIcon fontSize="small" color="info" />
              </ListItemIcon>
              <ListItemText
                primary="Card Type, Cardholder Number, Settlement Date, etc."
                secondary="Optional fields for additional information"
              />
            </ListItem>
          </List>
        </Paper>

        <Paper sx={{ p: 2, backgroundColor: "#e3f2fd", mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Automatic Processing:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <InfoIcon fontSize="small" color="info" />
              </ListItemIcon>
              <ListItemText primary="Cab numbers will be automatically assigned based on merchant-to-cab mappings" />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <InfoIcon fontSize="small" color="info" />
              </ListItemIcon>
              <ListItemText primary="Driver information will be looked up from shift data based on cab, date, and time" />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <InfoIcon fontSize="small" color="info" />
              </ListItemIcon>
              <ListItemText primary="Duplicate transactions will be automatically detected and skipped" />
            </ListItem>
          </List>
        </Paper>
      </Box>

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
          id="csv-file-upload"
          type="file"
          onChange={handleFileChange}
        />
        <label htmlFor="csv-file-upload">
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
              Selected: {selectedFile.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Size: {(selectedFile.size / 1024).toFixed(2)} KB
            </Typography>
          </Box>
        )}

        {!selectedFile && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Click the button above or drag and drop a CSV file
          </Typography>
        )}
      </Box>

      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
        <Button
          variant="contained"
          onClick={onUpload}
          disabled={!selectedFile || uploading}
          size="large"
        >
          {uploading ? "Processing..." : "Upload and Preview"}
        </Button>
      </Box>
    </Box>
  );
}
