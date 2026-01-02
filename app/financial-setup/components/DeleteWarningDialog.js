import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Alert,
  AlertTitle,
  Typography,
} from "@mui/material";
import { Block as BlockIcon } from "@mui/icons-material";

export default function DeleteWarningDialog({ open, onClose, data }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
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
        Cannot Delete {data.type}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <AlertTitle>Deletion Blocked</AlertTitle>
            {data.error}
          </Alert>

          {data.reason && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Reason:
              </Typography>
              <Typography variant="body2">{data.reason}</Typography>
            </Box>
          )}

          {data.solution && (
            <Box sx={{ p: 2, bgcolor: "info.lighter", borderRadius: 1 }}>
              <Typography variant="subtitle2" color="info.main" gutterBottom>
                What you can do:
              </Typography>
              <Typography variant="body2">{data.solution}</Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          I Understand
        </Button>
      </DialogActions>
    </Dialog>
  );
}
