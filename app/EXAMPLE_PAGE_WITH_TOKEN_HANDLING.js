"use client";

/**
 * EXAMPLE: Properly Updated Page with Token Expiration Handling
 * 
 * This demonstrates how to update existing pages to use the new
 * token expiration handling system.
 */

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import GlobalNav from "../components/GlobalNav";
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import { getCurrentUser, apiRequest } from "../lib/api";
import { useAuth } from "../lib/useAuth";

export default function ExamplePage() {
  // Step 1: Add useAuth hook for automatic token monitoring
  // This will check token on mount and every 60 seconds
  useAuth();
  
  // Alternative: For simpler pages, use useAuthCheck() for one-time check
  // import { useAuthCheck } from "../lib/useAuth";
  // useAuthCheck();

  const [currentUser, setCurrentUser] = useState(null);
  const [data, setData] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  
  const router = useRouter();

  useEffect(() => {
    // useAuth hook already handles authentication check
    // So we can directly get user and load data
    const user = getCurrentUser();
    setCurrentUser(user);

    // Optional: Check role-based access
    if (!["ADMIN", "MANAGER"].includes(user?.role)) {
      router.push("/");
      return;
    }

    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      setPageLoading(true);
      setError("");
      
      // Step 2: Use apiRequest instead of fetch
      // This automatically:
      // - Validates token before request
      // - Adds Authorization header
      // - Handles 401 errors with redirect
      // - Handles 403 errors with proper message
      const response = await apiRequest('/your-endpoint', {
        method: 'GET'
      });

      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        // Handle non-auth errors
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Failed to load data');
      }
    } catch (error) {
      // Step 3: Handle errors gracefully
      // Auth errors (401) will auto-redirect, so we only handle other errors
      if (error.message === 'Authentication required' || 
          error.message === 'Session expired. Please login again.') {
        // Already being redirected, no need to show error
        return;
      }
      
      // Show other errors to user
      console.error("Load error:", error);
      setError(error.message || 'An error occurred');
    } finally {
      setPageLoading(false);
    }
  };

  const handleCreateItem = async (formData) => {
    try {
      setError("");
      
      // Step 4: POST/PUT/DELETE requests also use apiRequest
      const response = await apiRequest('/your-endpoint', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const result = await response.json();
        // Handle success
        loadData(); // Reload data
        return result;
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Failed to create item');
        return null;
      }
    } catch (error) {
      // Auth errors auto-redirect
      if (error.message === 'Authentication required' || 
          error.message === 'Session expired. Please login again.') {
        return null;
      }
      
      console.error("Create error:", error);
      setError(error.message || 'An error occurred');
      return null;
    }
  };

  const handleUpdateItem = async (id, formData) => {
    try {
      setError("");
      
      const response = await apiRequest(`/your-endpoint/${id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        loadData();
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Failed to update item');
        return false;
      }
    } catch (error) {
      if (error.message === 'Authentication required' || 
          error.message === 'Session expired. Please login again.') {
        return false;
      }
      
      console.error("Update error:", error);
      setError(error.message || 'An error occurred');
      return false;
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      setError("");
      
      const response = await apiRequest(`/your-endpoint/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadData();
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Failed to delete item');
        return false;
      }
    } catch (error) {
      if (error.message === 'Authentication required' || 
          error.message === 'Session expired. Please login again.') {
        return false;
      }
      
      console.error("Delete error:", error);
      setError(error.message || 'An error occurred');
      return false;
    }
  };

  if (pageLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <GlobalNav currentUser={currentUser} />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        <Typography variant="h4" gutterBottom>
          Example Page
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Your page content */}
        <Box sx={{ mt: 3 }}>
          <Typography>Data count: {data.length}</Typography>
        </Box>
      </Container>
    </Box>
  );
}

/**
 * MIGRATION CHECKLIST:
 * 
 * ✅ 1. Import and add useAuth() hook at top of component
 * ✅ 2. Replace all fetch() calls with apiRequest()
 * ✅ 3. Remove manual Authorization header construction
 * ✅ 4. Handle errors gracefully (check for auth errors)
 * ✅ 5. Remove manual isAuthenticated() checks (useAuth handles it)
 * ✅ 6. Test token expiration scenario
 * 
 * COMMON PATTERNS TO REPLACE:
 * 
 * OLD:
 * ```javascript
 * const response = await fetch(`${API_BASE_URL}/endpoint`, {
 *   headers: {
 *     Authorization: `Bearer ${localStorage.getItem("token")}`
 *   }
 * });
 * ```
 * 
 * NEW:
 * ```javascript
 * const response = await apiRequest('/endpoint', {
 *   method: 'GET'
 * });
 * ```
 */
