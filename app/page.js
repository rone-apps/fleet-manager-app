"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Box, 
  Typography, 
  Container, 
  Card, 
  CardContent,
  Button,
  Grid,
  AppBar,
  Toolbar,
  IconButton
} from "@mui/material";
import { 
  People, 
  DirectionsCar, 
  Assessment,
  Logout,
  Person,
  AccountBalance,
  LocalTaxi
} from "@mui/icons-material";
import { getCurrentUser, logout, isAuthenticated } from './lib/api';

export default function HomePage() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/signin');
      return;
    }

    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, [router]);

  const handleLogout = () => {
    logout();
  };

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f6f9fc' }}>
      {/* Header */}
      <AppBar position="static" sx={{ backgroundColor: '#3e5244' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            FareFlow
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person />
              <Box>
                <Typography variant="body2">
                  {user.firstName} {user.lastName}
                </Typography>
                <Typography variant="caption" sx={{ color: '#ccc' }}>
                  {user.role}
                </Typography>
              </Box>
            </Box>
            
            <IconButton color="inherit" onClick={handleLogout} title="Logout">
              <Logout />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: '#3e5244' }}>
          Welcome, {user.firstName}!
        </Typography>

        <Typography variant="body1" sx={{ mb: 4, color: '#666' }}>
          Role: <strong>{user.role}</strong> | Username: <strong>{user.username}</strong>
        </Typography>

        {/* Dashboard Cards */}
        <Grid container spacing={3}>
          {/* Users Card - Admin only */}
          {user.role === 'ADMIN' && (
            <Grid item xs={12} sm={6} md={4}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 }
                }}
                onClick={() => router.push('/users')}
              >
                <CardContent>
                  <People sx={{ fontSize: 40, color: '#3e5244', mb: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    User Management
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Create and manage system users
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Account Management Card - Admin, Manager, Accountant */}
          {['ADMIN', 'MANAGER', 'ACCOUNTANT'].includes(user.role) && (
            <Grid item xs={12} sm={6} md={4}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 },
                  border: '2px solid #1976d2'
                }}
                onClick={() => router.push('/account-management')}
              >
                <CardContent>
                  <AccountBalance sx={{ fontSize: 40, color: '#1976d2', mb: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Account Management
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Manage customers, charges & invoices
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* TaxiCaller Integration Card - Admin only */}
          {user.role === 'ADMIN' && (
            <Grid item xs={12} sm={6} md={4}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 },
                  border: '2px solid #E5C02E',
                  backgroundColor: '#F9D13E'
                }}
                onClick={() => router.push('/taxicaller-integration')}
              >
                <CardContent>
                  <LocalTaxi sx={{ fontSize: 40, color: '#000', mb: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    TaxiCaller Integration
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Import trip data & driver reports
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Drivers Card - Admin, Manager, Dispatcher */}
          {['ADMIN', 'MANAGER', 'DISPATCHER'].includes(user.role) && (
            <Grid item xs={12} sm={6} md={4}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 }
                }}
                onClick={() => router.push('/drivers')}
              >
                <CardContent>
                  <DirectionsCar sx={{ fontSize: 40, color: '#3e5244', mb: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Drivers
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Manage driver information
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Cabs Card - Admin, Manager, Dispatcher */}
          {['ADMIN', 'MANAGER', 'DISPATCHER'].includes(user.role) && (
            <Grid item xs={12} sm={6} md={4}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 }
                }}
                onClick={() => router.push('/cabs')}
              >
                <CardContent>
                  <DirectionsCar sx={{ fontSize: 40, color: '#3e5244', mb: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Cabs
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Manage fleet vehicles
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Shifts Card - Admin, Manager, Dispatcher */}
          {['ADMIN', 'MANAGER', 'DISPATCHER'].includes(user.role) && (
            <Grid item xs={12} sm={6} md={4}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 }
                }}
                onClick={() => router.push('/shifts')}
              >
                <CardContent>
                  <Assessment sx={{ fontSize: 40, color: '#3e5244', mb: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Shift Ownership
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Manage shift ownership & history
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Financial Setup Card - Admin, Manager, Accountant */}
          {['ADMIN', 'MANAGER', 'ACCOUNTANT'].includes(user.role) && (
            <Grid item xs={12} sm={6} md={4}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 }
                }}
                onClick={() => router.push('/financial-setup')}
              >
                <CardContent>
                  <Assessment sx={{ fontSize: 40, color: '#1976d2', mb: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Financial Setup
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Configure expense categories & lease rates
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Expenses Card - Admin, Manager, Accountant, Driver */}
          {['ADMIN', 'MANAGER', 'ACCOUNTANT', 'DRIVER'].includes(user.role) && (
            <Grid item xs={12} sm={6} md={4}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 }
                }}
                onClick={() => router.push('/expenses')}
              >
                <CardContent>
                  <Assessment sx={{ fontSize: 40, color: '#f57c00', mb: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Expenses
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Track one-time & recurring expenses
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Reports Card */}
          <Grid item xs={12} sm={6} md={4}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 }
              }}
              onClick={() => alert('Reports coming soon!')}
            >
              <CardContent>
                <Assessment sx={{ fontSize: 40, color: '#3e5244', mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Reports
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  View financial reports
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* API Status */}
        <Box sx={{ mt: 4, p: 3, backgroundColor: '#fff', borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            🎉 Authentication Successful!
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            ✅ JWT Token: Active
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            ✅ User ID: {user.userId}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            ✅ Role: {user.role}
          </Typography>
          {user.driverId && (
            <Typography variant="body2">
              ✅ Driver ID: {user.driverId}
            </Typography>
          )}
        </Box>
      </Container>
    </Box>
  );
}