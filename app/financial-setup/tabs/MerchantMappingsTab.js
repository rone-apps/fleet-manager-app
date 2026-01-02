import { useState, useEffect } from "react";
import {
  Box, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, FormControl,
  InputLabel, Select, MenuItem, IconButton, Chip,
  Autocomplete, Tooltip, Alert, AlertTitle,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Event as CalendarIcon,
  Block as BlockIcon,
} from "@mui/icons-material";
import { API_BASE_URL } from "../../lib/api";

export default function MerchantMappingsTab({
  canEdit,
  canDelete,
  setError,
  setSuccess,
  updateStats,
}) {
  const [merchant2CabMappings, setMerchant2CabMappings] = useState([]);
  const [allCabs, setAllCabs] = useState([]);
  const [showActiveMappingsOnly, setShowActiveMappingsOnly] = useState(true);

  // Create/Edit Dialog
  const [openMerchantMappingDialog, setOpenMerchantMappingDialog] = useState(false);
  const [editingMerchantMapping, setEditingMerchantMapping] = useState(null);
  const [merchantMappingFormData, setMerchantMappingFormData] = useState({
    cabNumber: "",
    merchantNumber: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    notes: "",
  });

  // End Mapping Dialog
  const [openEndMappingDialog, setOpenEndMappingDialog] = useState(false);
  const [endingMapping, setEndingMapping] = useState(null);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  // Delete Warning Dialog
  const [openDeleteWarning, setOpenDeleteWarning] = useState(false);
  const [deleteWarningData, setDeleteWarningData] = useState({ cabNumber: "" });

  useEffect(() => {
    loadAllCabs();
  }, []);

  useEffect(() => {
    loadMerchant2CabMappings();
  }, [showActiveMappingsOnly]);

  const loadAllCabs = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cabs`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAllCabs(data);
      }
    } catch (err) {
      console.error("Error loading cabs:", err);
    }
  };

  const loadMerchant2CabMappings = async () => {
    try {
      const endpoint = showActiveMappingsOnly
        ? `${API_BASE_URL}/financial/merchant2cab/active`
        : `${API_BASE_URL}/financial/merchant2cab`;

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setMerchant2CabMappings(data);
        updateStats({
          merchantMappings: data.filter((m) => m.active).length,
        });
      }
    } catch (err) {
      console.error("Error loading merchant2cab mappings:", err);
    }
  };

  const handleOpenMerchantMappingDialog = (mapping = null) => {
    if (mapping) {
      setEditingMerchantMapping(mapping);
      setMerchantMappingFormData({
        cabNumber: mapping.cabNumber,
        merchantNumber: mapping.merchantNumber,
        startDate: mapping.startDate,
        endDate: mapping.endDate || "",
        notes: mapping.notes || "",
      });
    } else {
      setEditingMerchantMapping(null);
      setMerchantMappingFormData({
        cabNumber: "",
        merchantNumber: "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        notes: "",
      });
    }
    setOpenMerchantMappingDialog(true);
  };

  const handleSaveMerchantMapping = async () => {
    if (!merchantMappingFormData.cabNumber || !merchantMappingFormData.merchantNumber) {
      setError("Cab number and merchant number are required");
      return;
    }

    try {
      const url = editingMerchantMapping
        ? `${API_BASE_URL}/financial/merchant2cab/${editingMerchantMapping.id}`
        : `${API_BASE_URL}/financial/merchant2cab`;

      const payload = {
        ...merchantMappingFormData,
        endDate: merchantMappingFormData.endDate || null,
      };

      const response = await fetch(url, {
        method: editingMerchantMapping ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to save merchant mapping");
        return;
      }

      setSuccess(
        editingMerchantMapping
          ? "Merchant mapping updated"
          : "Merchant mapping created"
      );
      setOpenMerchantMappingDialog(false);
      loadMerchant2CabMappings();
    } catch (err) {
      setError("Failed to save merchant mapping: " + err.message);
    }
  };

  const handleOpenEndMappingDialog = (mapping) => {
    setEndingMapping(mapping);
    setEndDate(new Date().toISOString().split("T")[0]);
    setOpenEndMappingDialog(true);
  };

  const handleEndMerchantMapping = async () => {
    if (!endDate) {
      setError("End date is required");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/financial/merchant2cab/${endingMapping.id}/end?endDate=${endDate}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to end merchant mapping");
        return;
      }

      setSuccess("Merchant mapping ended successfully");
      setOpenEndMappingDialog(false);
      loadMerchant2CabMappings();
    } catch (err) {
      setError("Failed to end merchant mapping: " + err.message);
    }
  };

  const handleDeleteMerchantMapping = (id) => {
    const mapping = merchant2CabMappings.find((m) => m.id === id);
    setDeleteWarningData({
      cabNumber: mapping?.cabNumber || "N/A",
    });
    setOpenDeleteWarning(true);
  };

  const getCabDescription = (mapping) => {
    const parts = [];
    if (mapping.year) parts.push(mapping.year);
    if (mapping.make) parts.push(mapping.make);
    if (mapping.model) parts.push(mapping.model);
    if (mapping.color) parts.push(mapping.color);
    return parts.length > 0 ? parts.join(" ") : "-";
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="h6">Merchant Number to Cab Mappings</Typography>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={showActiveMappingsOnly ? "active" : "all"}
              onChange={(e) =>
                setShowActiveMappingsOnly(e.target.value === "active")
              }
            >
              <MenuItem value="active">Active Only</MenuItem>
              <MenuItem value="all">All Mappings</MenuItem>
            </Select>
          </FormControl>
        </Box>
        {canEdit && (
          <Button
            variant="contained"
            color="info"
            startIcon={<AddIcon />}
            onClick={() => handleOpenMerchantMappingDialog()}
          >
            Add Merchant Mapping
          </Button>
        )}
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Cab Number</TableCell>
              <TableCell>Vehicle</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell>Merchant Number</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Notes</TableCell>
              {canEdit && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {merchant2CabMappings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No merchant mappings found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              merchant2CabMappings.map((mapping) => (
                <TableRow key={mapping.id}>
                  <TableCell>
                    <Chip
                      label={mapping.cabNumber}
                      size="small"
                      color="primary"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {getCabDescription(mapping)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {mapping.cabType && (
                      <Chip
                        label={mapping.cabType.replace("_", " ")}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {mapping.ownerDriverName || "-"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontFamily: "monospace" }}
                    >
                      {mapping.merchantNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>{mapping.startDate}</TableCell>
                  <TableCell>{mapping.endDate || "Current"}</TableCell>
                  <TableCell>
                    <Chip
                      icon={mapping.active ? <ActiveIcon /> : <InactiveIcon />}
                      label={mapping.active ? "Active" : "Ended"}
                      color={mapping.active ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title={mapping.notes || ""}>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 150,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {mapping.notes || "-"}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  {canEdit && (
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenMerchantMappingDialog(mapping)}
                        title="Edit"
                      >
                        <EditIcon />
                      </IconButton>
                      {mapping.active && (
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEndMappingDialog(mapping)}
                          title="End mapping"
                          color="warning"
                        >
                          <CalendarIcon />
                        </IconButton>
                      )}
                      {canDelete && (
                        <IconButton
                          size="small"
                          onClick={() =>
                            handleDeleteMerchantMapping(mapping.id)
                          }
                          title="Delete"
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Merchant Mapping Dialog */}
      <Dialog
        open={openMerchantMappingDialog}
        onClose={() => setOpenMerchantMappingDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "info.light" }}>
          {editingMerchantMapping
            ? "Edit Merchant Mapping"
            : "Add Merchant Mapping"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <Autocomplete
              options={allCabs}
              getOptionLabel={(option) =>
                `${option.cabNumber} - ${option.make || ""} ${
                  option.model || ""
                }`
              }
              value={
                allCabs.find(
                  (c) => c.cabNumber === merchantMappingFormData.cabNumber
                ) || null
              }
              onChange={(e, newValue) =>
                setMerchantMappingFormData({
                  ...merchantMappingFormData,
                  cabNumber: newValue?.cabNumber || "",
                })
              }
              disabled={!!editingMerchantMapping}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Cab Number"
                  required
                  helperText={
                    editingMerchantMapping
                      ? "Cannot change cab number on existing mapping"
                      : ""
                  }
                />
              )}
            />
            <TextField
              label="Merchant Number"
              value={merchantMappingFormData.merchantNumber}
              onChange={(e) =>
                setMerchantMappingFormData({
                  ...merchantMappingFormData,
                  merchantNumber: e.target.value,
                })
              }
              required
              placeholder="e.g., 123456789"
            />
            <TextField
              label="Start Date"
              type="date"
              value={merchantMappingFormData.startDate}
              onChange={(e) =>
                setMerchantMappingFormData({
                  ...merchantMappingFormData,
                  startDate: e.target.value,
                })
              }
              required
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End Date"
              type="date"
              value={merchantMappingFormData.endDate}
              onChange={(e) =>
                setMerchantMappingFormData({
                  ...merchantMappingFormData,
                  endDate: e.target.value,
                })
              }
              InputLabelProps={{ shrink: true }}
              helperText="Leave empty for current mapping"
              inputProps={{
                min: merchantMappingFormData.startDate,
              }}
            />
            <TextField
              label="Notes"
              value={merchantMappingFormData.notes}
              onChange={(e) =>
                setMerchantMappingFormData({
                  ...merchantMappingFormData,
                  notes: e.target.value,
                })
              }
              multiline
              rows={3}
              placeholder="Optional notes about this mapping..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMerchantMappingDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveMerchantMapping}
            variant="contained"
            color="info"
          >
            {editingMerchantMapping ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* End Mapping Dialog */}
      <Dialog
        open={openEndMappingDialog}
        onClose={() => setOpenEndMappingDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>End Merchant Mapping</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            {endingMapping && (
              <Alert severity="info">
                <AlertTitle>Ending Mapping</AlertTitle>
                <Typography variant="body2">
                  <strong>Cab:</strong> {endingMapping.cabNumber}
                </Typography>
                <Typography variant="body2">
                  <strong>Merchant:</strong> {endingMapping.merchantNumber}
                </Typography>
                <Typography variant="body2">
                  <strong>Start Date:</strong> {endingMapping.startDate}
                </Typography>
              </Alert>
            )}
            <TextField
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              InputLabelProps={{ shrink: true }}
              inputProps={{
                min: endingMapping?.startDate,
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEndMappingDialog(false)}>Cancel</Button>
          <Button
            onClick={handleEndMerchantMapping}
            variant="contained"
            color="warning"
          >
            End Mapping
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Warning Dialog */}
      <Dialog
        open={openDeleteWarning}
        onClose={() => setOpenDeleteWarning(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            bgcolor: "error.light",
            color: "error.contrastText",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <BlockIcon />
          Cannot Delete Merchant Mapping
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              <AlertTitle>Deletion Blocked</AlertTitle>
              The merchant mapping for cab "{deleteWarningData.cabNumber}" cannot be deleted.
            </Alert>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Reason:
              </Typography>
              <Typography variant="body2">
                Merchant mappings link credit card transactions to cabs. Deleting
                this mapping could affect historical transaction records and
                revenue reports.
              </Typography>
            </Box>

            <Box sx={{ p: 2, bgcolor: "info.lighter", borderRadius: 1 }}>
              <Typography variant="subtitle2" color="info.main" gutterBottom>
                What you can do:
              </Typography>
              <Typography variant="body2">
                If this mapping is no longer active, use the "End Mapping" button
                to set an end date instead. This preserves the historical link
                while preventing future use.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenDeleteWarning(false)}
            variant="contained"
          >
            I Understand
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
