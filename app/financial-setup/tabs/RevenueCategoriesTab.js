import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Block as BlockIcon,
} from "@mui/icons-material";
import { Alert, AlertTitle } from "@mui/material";
import { API_BASE_URL } from "../../lib/api";

export default function RevenueCategoriesTab({
  canEdit,
  canDelete,
  setError,
  setSuccess,
  updateStats,
}) {
  const [categories, setCategories] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    categoryCode: "",
    categoryName: "",
    description: "",
    categoryType: "VARIABLE",
    appliesTo: "DRIVER",
  });

  // Delete Warning Dialog
  const [openDeleteWarning, setOpenDeleteWarning] = useState(false);
  const [deleteWarningData, setDeleteWarningData] = useState({ name: "" });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/revenue-categories`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
        updateStats({ revenueCategories: data.length });
      }
    } catch (err) {
      console.error("Error loading revenue categories:", err);
    }
  };

  const handleOpen = (category = null) => {
    if (category) {
      setEditing(category);
      setFormData({
        categoryCode: category.categoryCode,
        categoryName: category.categoryName,
        description: category.description || "",
        categoryType: category.categoryType,
        appliesTo: category.appliesTo,
      });
    } else {
      setEditing(null);
      setFormData({
        categoryCode: "",
        categoryName: "",
        description: "",
        categoryType: "VARIABLE",
        appliesTo: "DRIVER",
      });
    }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!formData.categoryCode || !formData.categoryName) {
      setError("Category code and name are required");
      return;
    }

    try {
      const url = editing
        ? `${API_BASE_URL}/revenue-categories/${editing.id}`
        : `${API_BASE_URL}/revenue-categories`;

      const payload = {
        ...formData,
        isActive: editing ? editing.active : true,
      };

      const response = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        setError(`Failed to save revenue category: ${errorText}`);
        return;
      }

      setSuccess(editing ? "Revenue category updated" : "Revenue category created");
      setOpenDialog(false);
      loadCategories();
    } catch (err) {
      setError("Failed to save revenue category: " + err.message);
    }
  };

  const handleToggleActive = async (category) => {
    try {
      const action = category.active ? "deactivate" : "activate";
      const response = await fetch(
        `${API_BASE_URL}/revenue-categories/${category.id}/${action}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        setSuccess(`Revenue category ${action}d successfully`);
        loadCategories();
      } else {
        setError(`Failed to ${action} revenue category`);
      }
    } catch (err) {
      setError("Failed to update revenue category status");
    }
  };

  const handleDelete = (category) => {
    setDeleteWarningData({
      name: category.categoryName,
    });
    setOpenDeleteWarning(true);
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
        <Typography variant="h6">Revenue Categories</Typography>
        {canEdit && (
          <Button
            variant="contained"
            color="success"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
          >
            Add Revenue Category
          </Button>
        )}
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Applies To</TableCell>
              <TableCell>Status</TableCell>
              {canEdit && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>
                  <Chip label={category.categoryCode} size="small" color="success" />
                </TableCell>
                <TableCell>{category.categoryName}</TableCell>
                <TableCell>
                  <Chip
                    label={category.categoryType}
                    color={
                      category.categoryType === "FIXED" ? "primary" : "default"
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={category.appliesTo}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    icon={category.active ? <ActiveIcon /> : <InactiveIcon />}
                    label={category.active ? "Active" : "Inactive"}
                    color={category.active ? "success" : "default"}
                    size="small"
                  />
                </TableCell>
                {canEdit && (
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpen(category)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleToggleActive(category)}
                      color={category.active ? "default" : "success"}
                      title={category.active ? "Deactivate" : "Activate"}
                    >
                      {category.active ? <InactiveIcon /> : <ActiveIcon />}
                    </IconButton>
                    {canDelete && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(category)}
                        title="Delete"
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "success.light" }}>
          {editing ? "Edit Revenue Category" : "Add Revenue Category"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <TextField
              label="Category Code"
              value={formData.categoryCode}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  categoryCode: e.target.value.toUpperCase(),
                })
              }
              required
              placeholder="E.g., LEASE_DAY"
            />
            <TextField
              label="Category Name"
              value={formData.categoryName}
              onChange={(e) =>
                setFormData({ ...formData, categoryName: e.target.value })
              }
              required
              placeholder="E.g., Lease Revenue - Day Shift"
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              multiline
              rows={3}
            />
            <FormControl fullWidth>
              <InputLabel>Category Type</InputLabel>
              <Select
                value={formData.categoryType}
                label="Category Type"
                onChange={(e) =>
                  setFormData({ ...formData, categoryType: e.target.value })
                }
              >
                <MenuItem value="FIXED">Fixed</MenuItem>
                <MenuItem value="VARIABLE">Variable</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Applies To</InputLabel>
              <Select
                value={formData.appliesTo}
                label="Applies To"
                onChange={(e) =>
                  setFormData({ ...formData, appliesTo: e.target.value })
                }
              >
                <MenuItem value="CAB">Cab</MenuItem>
                <MenuItem value="COMPANY">Company</MenuItem>
                <MenuItem value="DRIVER">Driver</MenuItem>
                <MenuItem value="OWNER">Owner</MenuItem>
                <MenuItem value="SHIFT">Shift</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="success">
            {editing ? "Update" : "Create"}
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
          Cannot Delete Revenue Category
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              <AlertTitle>Deletion Blocked</AlertTitle>
              The revenue category "{deleteWarningData.name}" cannot be deleted.
            </Alert>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Reason:
              </Typography>
              <Typography variant="body2">
                Revenue categories are part of the core financial configuration.
                Deleting them could affect historical revenue records and
                reporting accuracy.
              </Typography>
            </Box>

            <Box sx={{ p: 2, bgcolor: "info.lighter", borderRadius: 1 }}>
              <Typography variant="subtitle2" color="info.main" gutterBottom>
                What you can do:
              </Typography>
              <Typography variant="body2">
                If you no longer need this category, deactivate it instead. This
                will hide it from new revenue entries while preserving all
                historical data and reports.
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
