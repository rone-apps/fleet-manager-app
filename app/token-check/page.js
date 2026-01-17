"use client";

import { useEffect, useState } from "react";
import { Box, Typography, Paper, Button, Alert } from "@mui/material";
import { useRouter } from "next/navigation";

export default function TokenCheck() {
  const [tokenInfo, setTokenInfo] = useState(null);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("No token found");
      return;
    }

    try {
      // Decode JWT (simple base64 decode, not verification)
      const parts = token.split(".");
      if (parts.length !== 3) {
        setError("Invalid token format");
        return;
      }

      const payload = JSON.parse(atob(parts[1]));
      setTokenInfo(payload);
    } catch (err) {
      setError("Failed to decode token: " + err.message);
    }
  };

  const handleClearAndLogin = () => {
    localStorage.clear();
    router.push("/signin");
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
      <Typography variant="h4" gutterBottom>
        Token Checker
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {tokenInfo && (
        <Paper sx={{ p: 3, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Token Payload:
          </Typography>
          <pre style={{ background: "#f5f5f5", padding: "1rem", borderRadius: "4px", overflow: "auto" }}>
            {JSON.stringify(tokenInfo, null, 2)}
          </pre>

          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              <strong>Username:</strong> {tokenInfo.sub}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>User ID:</strong> {tokenInfo.userId || "Not found"}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Role:</strong>{" "}
              {tokenInfo.role ? (
                <span style={{ color: "green" }}>{tokenInfo.role} ✅</span>
              ) : (
                <span style={{ color: "red" }}>
                  NOT FOUND ❌ (You need to logout and login again!)
                </span>
              )}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Issued:</strong> {new Date(tokenInfo.iat * 1000).toLocaleString()}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Expires:</strong> {new Date(tokenInfo.exp * 1000).toLocaleString()}
            </Typography>
          </Box>
        </Paper>
      )}

      {tokenInfo && !tokenInfo.role && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="body1" gutterBottom>
            <strong>Your token does NOT include the role!</strong>
          </Typography>
          <Typography variant="body2">
            The backend was updated to include roles in JWT tokens, but your current token was
            issued before this change. You must logout and login again to get a new token.
          </Typography>
        </Alert>
      )}

      <Box sx={{ display: "flex", gap: 2 }}>
        <Button variant="contained" onClick={checkToken}>
          Recheck Token
        </Button>
        <Button variant="contained" color="warning" onClick={handleClearAndLogin}>
          Clear Storage & Login Again
        </Button>
        <Button variant="outlined" onClick={() => router.push("/")}>
          Go to Dashboard
        </Button>
      </Box>
    </Box>
  );
}
