"use client";

import React, { useState } from "react";
import { 
  TextField, 
  Button, 
  Box, 
  Typography, 
  Container, 
  Alert,
  Link,
  Paper,
  InputAdornment,
  IconButton
} from "@mui/material";
import { Visibility, VisibilityOff, Person, Lock } from "@mui/icons-material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from '../lib/api';

const theme = createTheme({
  palette: {
    primary: { main: "#3e5244" },
    secondary: { main: "#525f7f" },
    background: { default: "#f6f9fc" },
  },
  typography: {
    fontFamily: "Roboto, Arial, sans-serif",
    button: { textTransform: "none" },
  },
});

export default function SignInPage() {
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
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store authentication data
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify({
          userId: data.userId,
          username: data.username,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
          driverId: data.driverId
        }));

        // Redirect to dashboard
        router.push("/");
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || "Invalid username or password");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Unable to connect to server. Please try again.");
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
          backgroundColor: "#f6f9fc",
          padding: 2,
        }}
      >
        <Container component="main" maxWidth="xs">
          <Paper
            elevation={3}
            sx={{
              padding: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              borderRadius: 2,
            }}
          >
            {/* Logo/Title */}
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                backgroundColor: "#3e5244",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
              }}
            >
              <Typography variant="h4" sx={{ color: "white", fontWeight: "bold" }}>
                F
              </Typography>
            </Box>

            <Typography
              component="h1"
              variant="h4"
              sx={{ color: "#3e5244", fontWeight: "bold", mb: 1 }}
            >
              FareFlow
            </Typography>

            <Typography
              component="h2"
              variant="h6"
              sx={{ color: "#525f7f", mb: 3, textAlign: "center" }}
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
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: "#3e5244" }} />
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
                      <Lock sx={{ color: "#3e5244" }} />
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
                  backgroundColor: "#3e5244",
                  fontWeight: "bold",
                  fontSize: "16px",
                  "&:hover": { backgroundColor: "#2d3d32" },
                  "&:disabled": { backgroundColor: "#ccc" },
                }}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>

              {/* Test Account Info */}
              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  backgroundColor: "#f0f0f0",
                  borderRadius: 1,
                  textAlign: "center",
                }}
              >
                <Typography variant="caption" color="textSecondary" sx={{ display: "block", mb: 0.5 }}>
                  Test Account
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                  admin2 / admin123
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Footer */}
          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Typography variant="body2" color="textSecondary">
              © 2025 FareFlow. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
