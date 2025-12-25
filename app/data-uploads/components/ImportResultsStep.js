"use client";

import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Assessment as ReportIcon,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";

export default function ImportResultsStep({ results, onReset }) {
  const router = useRouter();

  if (!results) {
    return <Typography>No results available</Typography>;
  }

  const hasErrors = results.errorCount > 0;
  const hasSuccess = results.successCount > 0;

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Step 3: Import Results
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ backgroundColor: "#e8f5e9" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <SuccessIcon sx={{ fontSize: 48, color: "success.main" }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {results.successCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Successfully Imported
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card sx={{ backgroundColor: "#fff3e0" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <WarningIcon sx={{ fontSize: 48, color: "warning.main" }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {results.skipCount || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Skipped (Duplicates)
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card sx={{ backgroundColor: "#ffebee" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <ErrorIcon sx={{ fontSize: 48, color: "error.main" }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {results.errorCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Failed
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Status Alert */}
      {hasSuccess && !hasErrors && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Import Completed Successfully!
          </Typography>
          <Typography variant="body2">
            All {results.successCount} valid transactions have been imported into the system.
            {results.skipCount > 0 && ` ${results.skipCount} duplicate transactions were automatically skipped.`}
          </Typography>
        </Alert>
      )}

      {hasErrors && hasSuccess && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Import Completed with Errors
          </Typography>
          <Typography variant="body2">
            {results.successCount} transactions were imported successfully, but {results.errorCount} failed.
            Please review the errors below.
          </Typography>
        </Alert>
      )}

      {hasErrors && !hasSuccess && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Import Failed
          </Typography>
          <Typography variant="body2">
            No transactions were imported. Please review the errors below and try again.
          </Typography>
        </Alert>
      )}

      {/* Import Details */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
          Import Details
        </Typography>
        
        <List dense>
          <ListItem>
            <ListItemIcon>
              <ReportIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Upload Batch ID"
              secondary={results.uploadBatchId || "N/A"}
            />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemIcon>
              <SuccessIcon color="success" />
            </ListItemIcon>
            <ListItemText
              primary="Total Processed"
              secondary={`${results.totalProcessed || results.successCount + results.errorCount} transactions`}
            />
          </ListItem>
          <Divider />
          {results.skipCount > 0 && (
            <>
              <ListItem>
                <ListItemIcon>
                  <WarningIcon color="warning" />
                </ListItemIcon>
                <ListItemText
                  primary="Duplicates Skipped"
                  secondary={`${results.skipCount} transactions were already in the system`}
                />
              </ListItem>
              <Divider />
            </>
          )}
        </List>
      </Paper>

      {/* Error Details */}
      {hasErrors && results.errors && results.errors.length > 0 && (
        <Paper sx={{ p: 3, mb: 3, backgroundColor: "#ffebee" }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: "error.main" }}>
            Error Details ({results.errors.length})
          </Typography>
          
          <List dense sx={{ maxHeight: 300, overflow: "auto" }}>
            {results.errors.map((error, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <ErrorIcon color="error" fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={error}
                  primaryTypographyProps={{ variant: "body2" }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Actions */}
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, mt: 4 }}>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={onReset}
          size="large"
        >
          Upload Another File
        </Button>
        
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => router.push("/reports")}
            size="large"
          >
            View Reports
          </Button>
          <Button
            variant="contained"
            onClick={() => router.push("/")}
            size="large"
          >
            Go to Dashboard
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
