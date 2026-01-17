"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import GlobalNav from "../components/GlobalNav";
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  Chip,
} from "@mui/material";
import { Block, CheckCircle, Star } from "@mui/icons-material";
import { getCurrentUser, isAuthenticated, API_BASE_URL } from "../lib/api";

export default function DriversPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/signin");
      return;
    }

    const user = getCurrentUser();
    setCurrentUser(user);

    if (!["ADMIN", "MANAGER", "DISPATCHER"].includes(user?.role)) {
      router.push("/");
      return;
    }

    loadDrivers();
  }, [router]);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/drivers`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load drivers");
      }

      const data = await response.json();

      const sorted = data.sort((a, b) => {
        const nameA = `${a.firstName ?? ""} ${a.lastName ?? ""}`.toLowerCase();
        const nameB = `${b.firstName ?? ""} ${b.lastName ?? ""}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });

      setDrivers(sorted);
    } catch (err) {
      console.error(err);
      setError("Failed to load drivers");
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (driver) => {
    try {
      const endpoint =
        driver.status === "ACTIVE"
          ? `${API_BASE_URL}/drivers/${driver.id}/suspend`
          : `${API_BASE_URL}/drivers/${driver.id}/activate`;

      await fetch(endpoint, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setDrivers((prev) =>
        prev.map((d) =>
          d.id === driver.id
            ? { ...d, status: d.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" }
            : d
        )
      );
    } catch {
      setError("Failed to update driver status");
    }
  };

  if (!currentUser) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  const canEdit = ["ADMIN", "MANAGER"].includes(currentUser.role);

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f6f9fc" }}>
      <GlobalNav currentUser={currentUser} title="FareFlow - Driver Management" />

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {loading ? (
          <CircularProgress />
        ) : (
          <>
            {error && <Alert severity="error">{error}</Alert>}

            <Typography variant="h4" sx={{ mb: 2 }}>
              Driver Management
            </Typography>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Driver #</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {drivers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No drivers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    drivers.map((driver) => (
                      <TableRow key={driver.id}>
                        <TableCell>{driver.driverNumber}</TableCell>
                        <TableCell>
                          {driver.firstName} {driver.lastName}
                          {driver.isOwner && <Star sx={{ ml: 1, color: "#FFD700" }} />}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={driver.isOwner ? "Owner" : "Driver"}
                            color={driver.isOwner ? "warning" : "default"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={driver.status}
                            color={driver.status === "ACTIVE" ? "success" : "default"}
                            size="small"
                            icon={driver.status === "ACTIVE" ? <CheckCircle /> : <Block />}
                          />
                        </TableCell>
                        <TableCell align="right">
                          {canEdit && (
                            <IconButton onClick={() => handleToggleStatus(driver)}>
                              {driver.status === "ACTIVE" ? <Block /> : <CheckCircle />}
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Container>
    </Box>
  );
}
