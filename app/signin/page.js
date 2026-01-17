"use client";

import React, { useState } from "react";
import { 
  TextField, 
  Button, 
  Box, 
  Typography, 
  Container, 
  Alert,
  Paper,
  InputAdornment,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { 
  Visibility, 
  VisibilityOff, 
  Person, 
  Lock, 
  Home,
  Business,
  LocalTaxi
} from "@mui/icons-material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import { loginRequest, healthCheck } from '../lib/api';

const theme = createTheme({
  palette: {
    primary: { main: "#667eea" },
    secondary: { main: "#764ba2" },
    background: { default: "#f6f9fc" },
  },
  typography: {
    fontFamily: "Roboto, Arial, sans-serif",
    button: { textTransform: "none" },
  },
});

export default function SignInPage() {
  const [companyId, setCompanyId] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    // Basic validation
    if (!companyId) {
      setError("Please enter your company ID");
      setLoading(false);
      return;
    }

    if (!username || !password) {
      setError("Please enter both username and password");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      // Optional: Check if backend is reachable
      // Comment this out if you don't want the health check delay
      const isHealthy = await healthCheck(companyId);
      if (!isHealthy) {
        setError("Invalid company ID, username, or password");
        setLoading(false);
        return;
      }

      // Attempt login with the specific company's backend
      const response = await loginRequest(companyId, username, password);

      if (response.ok) {
        const data = await response.json();
        
        // Store authentication data in localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("companyId", companyId.toLowerCase().trim());
        localStorage.setItem("tenantName", data.tenantName || companyId);
        localStorage.setItem("user", JSON.stringify({
          userId: data.userId,
          username: data.username,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
          driverId: data.driverId,
          companyId: companyId.toLowerCase().trim(),
        }));

        // Also set token and company in cookie for middleware (expires in 24 hours)
        document.cookie = `token=${data.token}; path=/; max-age=86400; SameSite=Strict`;
        document.cookie = `companyId=${companyId.toLowerCase().trim()}; path=/; max-age=86400; SameSite=Strict`;

        // Use replace to prevent back button from returning to signin
        window.location.replace("/");
      } else {
        // Use a generic error message to not expose which companies exist
        setError("Invalid company ID, username, or password");
      }
    } catch (err) {
      console.error("Login error:", err);
      // Generic error message
      if (err.message.includes('service unavailable') || err.message.includes('Unable to connect')) {
        setError("Invalid company ID, username, or password");
      } else {
        setError("Unable to connect to server. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: 2,
        }}
      >
        <Container component="main" maxWidth="xs">
          <Paper
            elevation={8}
            sx={{
              padding: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              borderRadius: 3,
              backdropFilter: 'blur(10px)',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
          >
            {/* Logo/Title */}
            <Box
              sx={{
                width: 70,
                height: 70,
                borderRadius: "50%",
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
                boxShadow: '0 8px 16px rgba(102, 126, 234, 0.4)'
              }}
            >
              <LocalTaxi sx={{ fontSize: 36, color: "white" }} />
            </Box>

            <Typography
              component="h1"
              variant="h4"
              sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: "900", 
                mb: 0.5,
                letterSpacing: '-1px'
              }}
            >
              FareFlow
            </Typography>

            <Typography
              variant="caption"
              sx={{ 
                color: "#999", 
                mb: 2, 
                textAlign: "center",
                fontWeight: 500,
                letterSpacing: '1px'
              }}
            >
              FLEET MANAGEMENT SYSTEM
            </Typography>

            <Typography
              component="h2"
              variant="h6"
              sx={{ color: "#666", mb: 3, textAlign: "center", fontWeight: 500 }}
            >
              Sign in to your account
            </Typography>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ width: "100%", mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* Sign In Form */}
            <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
              {/* Company ID Field */}
              <TextField
                margin="normal"
                required
                fullWidth
                id="companyId"
                label="Company ID"
                name="companyId"
                autoComplete="organization"
                placeholder="Enter your company ID"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                disabled={loading}
                helperText="Enter your company identifier"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Business sx={{ color: "#667eea" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: "#667eea" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: "#667eea" }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        disabled={loading}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  mt: 3,
                  mb: 2,
                  padding: "12px",
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  fontWeight: "bold",
                  fontSize: "16px",
                  borderRadius: 2,
                  boxShadow: '0 4px 14px rgba(102, 126, 234, 0.4)',
                  "&:hover": { 
                    background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                    boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)'
                  },
                  "&:disabled": { backgroundColor: "#ccc" },
                }}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} color="inherit" />
                    <span>Signing in...</span>
                  </Box>
                ) : (
                  "Sign In"
                )}
              </Button>

              {/* Back to Home Button */}
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Home />}
                onClick={() => router.push('/')}
                disabled={loading}
                sx={{
                  mb: 2,
                  padding: "10px",
                  borderColor: "#667eea",
                  color: "#667eea",
                  fontWeight: "600",
                  borderRadius: 2,
                  "&:hover": { 
                    borderColor: "#5568d3",
                    backgroundColor: "rgba(102, 126, 234, 0.05)"
                  },
                }}
              >
                Back to Home
              </Button>
            </Box>
          </Paper>

          {/* Footer */}
          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              © 2025 FareFlow. All rights reserved.
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              Secure fleet management system
            </Typography>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
