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
  Autocomplete,
  Divider,
  Chip
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
import { API_BASE_URL } from '../lib/api';

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

// Known companies - maps company ID to display name and database schema
// The schema is the actual MySQL database name that will be used
const KNOWN_COMPANIES = [
  { id: 'MAC-Cabs', name: 'Maclures Cabs', schema: 'fareflow' },
  { id: 'BONNY-Taxi', name: "Bonny's Taxi", schema: 'fareflow_bonny' },
  { id: 'demo', name: 'Demo Company', schema: 'demo' },
  { id: 'yellowcab', name: 'Yellow Cab Co.', schema: 'yellowcab' },
  { id: 'citytaxi', name: 'City Taxi Services', schema: 'citytaxi' },
  { id: 'metrocab', name: 'Metro Cab LLC', schema: 'metrocab' },
];

export default function SignInPage() {
  const [companyId, setCompanyId] = useState("");
  const [companyInput, setCompanyInput] = useState("");
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
      // Find the matching company to get the schema name
      const matchedCompany = KNOWN_COMPANIES.find(
        c => c.id.toLowerCase() === companyId.toLowerCase() ||
             c.name.toLowerCase() === companyId.toLowerCase()
      );
      
      // Use schema name if company is known, otherwise use companyId as schema
      const schemaName = matchedCompany ? matchedCompany.schema : companyId.toLowerCase().replace(/[^a-z0-9_]/g, '');
      const displayName = matchedCompany ? matchedCompany.name : companyId;
      const tenantId = matchedCompany ? matchedCompany.id : companyId;

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": schemaName, // Send schema name in header for DB switching
        },
        body: JSON.stringify({ 
          username, 
          password,
          tenantId: schemaName // Schema name for DB
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store authentication data in localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("tenantId", tenantId); // Store original company ID
        localStorage.setItem("tenantSchema", schemaName); // Store schema name
        localStorage.setItem("tenantName", data.tenantName || displayName);
        localStorage.setItem("user", JSON.stringify({
          userId: data.userId,
          username: data.username,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
          driverId: data.driverId,
          tenantId: tenantId,
          tenantSchema: schemaName
        }));

        // Also set token and tenant in cookie for middleware (expires in 24 hours)
        document.cookie = `token=${data.token}; path=/; max-age=86400; SameSite=Strict`;
        document.cookie = `tenantId=${schemaName}; path=/; max-age=86400; SameSite=Strict`;

        // Use replace to prevent back button from returning to signin
        window.location.replace("/");
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || "Invalid company, username or password");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Find matching company for autocomplete
  const selectedCompany = KNOWN_COMPANIES.find(c => c.id === companyId);

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
              TAXI FLEET MANAGEMENT
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
              <Autocomplete
                freeSolo
                options={KNOWN_COMPANIES}
                getOptionLabel={(option) => 
                  typeof option === 'string' ? option : option.name
                }
                value={selectedCompany || null}
                inputValue={companyInput}
                onInputChange={(event, newInputValue) => {
                  setCompanyInput(newInputValue);
                  // If it matches a known company, use its ID
                  const match = KNOWN_COMPANIES.find(
                    c => c.name.toLowerCase() === newInputValue.toLowerCase() ||
                         c.id.toLowerCase() === newInputValue.toLowerCase()
                  );
                  setCompanyId(match ? match.id : newInputValue);
                }}
                onChange={(event, newValue) => {
                  if (typeof newValue === 'string') {
                    setCompanyId(newValue);
                    setCompanyInput(newValue);
                  } else if (newValue) {
                    setCompanyId(newValue.id);
                    setCompanyInput(newValue.name);
                  } else {
                    setCompanyId('');
                    setCompanyInput('');
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    margin="normal"
                    required
                    fullWidth
                    label="Company ID"
                    placeholder="Enter your company ID"
                    disabled={loading}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <Business sx={{ color: "#667eea" }} />
                          </InputAdornment>
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props;
                  return (
                    <li key={key} {...otherProps}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Business sx={{ color: '#667eea', fontSize: 20 }} />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {option.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#999' }}>
                            ID: {option.id}
                          </Typography>
                        </Box>
                      </Box>
                    </li>
                  );
                }}
                sx={{ mb: 1 }}
              />

              <Divider sx={{ my: 2 }}>
                <Chip label="Credentials" size="small" sx={{ fontSize: '0.7rem' }} />
              </Divider>

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
                {loading ? "Signing in..." : "Sign In"}
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

              {/* Account Info */}
              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  backgroundColor: "#e8f5e9",
                  borderRadius: 1,
                  textAlign: "center",
                  border: '1px solid #c8e6c9'
                }}
              >
                <Typography variant="caption" color="textSecondary" sx={{ display: "block", mb: 1, fontWeight: 600 }}>
                  🚕 Maclures Cabs
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: "monospace", mb: 0.5 }}>
                  Company: <strong>MAC-Cabs</strong>
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                  User: <strong>admin2</strong> / <strong>admin123</strong>
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Footer */}
          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              © 2025 FareFlow. All rights reserved.
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              Secure multi-tenant taxi fleet management
            </Typography>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}