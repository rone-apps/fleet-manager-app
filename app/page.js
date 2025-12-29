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
  IconButton,
  Chip,
  alpha,
  Paper,
  Avatar
} from "@mui/material";
import { 
  People, 
  DirectionsCar, 
  Assessment,
  Logout,
  Person,
  AccountBalance,
  LocalTaxi,
  CloudUpload,
  AutoAwesome,
  TrendingUp,
  Speed,
  CreditCard,
  Receipt,
  AttachMoney,
  Description,
  CheckCircle,
  Timeline,
  Insights,
  Schedule,
  Analytics,
  ArrowForward
} from "@mui/icons-material";
import { getCurrentUser, logout, isAuthenticated } from './lib/api';

export default function HomePage() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, [router]);

  const handleLogout = () => {
    logout();
  };

  const isUserAuthenticated = isAuthenticated() && user;

  // Show marketing landing page for non-authenticated users
  if (!isUserAuthenticated) {
    return <MarketingLandingPage router={router} />;
  }

  // Show enhanced dashboard for authenticated users
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f6f9fc' }}>
      {/* Header */}
      <AppBar position="static" sx={{ backgroundColor: '#3e5244' }}>
        <Toolbar>
          <LocalTaxi sx={{ fontSize: 28, color: '#fff', mr: 1 }} />
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
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Welcome Banner */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 4,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 3,
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              right: 0,
              width: '300px',
              height: '300px',
              background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
              borderRadius: '50%',
              transform: 'translate(30%, -30%)'
            }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.5px' }}>
                Welcome back, {user.firstName}! 👋
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.95, fontWeight: 500 }}>
                {user.role} • {user.username}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Chip 
                icon={<AutoAwesome />}
                label="AI Dashboard" 
                sx={{ 
                  backgroundColor: alpha('#fff', 0.25),
                  backdropFilter: 'blur(10px)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  px: 2,
                  py: 2.5,
                  border: '1px solid rgba(255,255,255,0.3)'
                }}
              />
            </Box>
          </Box>
        </Paper>

        {/* Quick Actions Section - Only 4 Key Features */}
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#3e5244', mb: 3 }}>
          Quick Access
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {/* Account Management */}
          {['ADMIN', 'MANAGER', 'ACCOUNTANT'].includes(user.role) && (
            <Grid item xs={12} sm={6} md={3}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  background: '#fff',
                  borderRadius: 3,
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: '2px solid transparent',
                  backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundOrigin: 'border-box',
                  backgroundClip: 'padding-box, border-box',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(102, 126, 234, 0.25)',
                  }
                }}
                onClick={() => router.push('/account-management')}
              >
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                      boxShadow: '0 8px 16px rgba(102, 126, 234, 0.3)'
                    }}
                  >
                    <AccountBalance sx={{ fontSize: 32, color: '#fff' }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#1a1a1a' }}>
                    Account Management
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
                    Customers & invoices
                  </Typography>
                  <Chip 
                    label="Featured" 
                    size="small"
                    sx={{ 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.7rem'
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Reports */}
          {user.role !== 'VIEWER' && (
            <Grid item xs={12} sm={6} md={3}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  background: '#fff',
                  borderRadius: 3,
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: '2px solid transparent',
                  backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  backgroundOrigin: 'border-box',
                  backgroundClip: 'padding-box, border-box',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(79, 172, 254, 0.25)',
                  }
                }}
                onClick={() => router.push('/reports')}
              >
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                      boxShadow: '0 8px 16px rgba(79, 172, 254, 0.3)'
                    }}
                  >
                    <Assessment sx={{ fontSize: 32, color: '#fff' }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#1a1a1a' }}>
                    Reports
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
                    Financial analytics
                  </Typography>
                  <Chip 
                    label="Featured" 
                    size="small"
                    sx={{ 
                      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.7rem'
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Third-party Integrations */}
          {user.role === 'ADMIN' && (
            <Grid item xs={12} sm={6} md={3}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  background: '#fff',
                  borderRadius: 3,
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: '2px solid transparent',
                  backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #F9D13E 0%, #E5C02E 100%)',
                  backgroundOrigin: 'border-box',
                  backgroundClip: 'padding-box, border-box',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(249, 209, 62, 0.25)',
                  }
                }}
                onClick={() => router.push('/taxicaller-integration')}
              >
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #F9D13E 0%, #E5C02E 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                      boxShadow: '0 8px 16px rgba(249, 209, 62, 0.3)'
                    }}
                  >
                    <LocalTaxi sx={{ fontSize: 32, color: '#fff' }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#1a1a1a' }}>
                    Third-party Integrations
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
                    TaxiCaller & more
                  </Typography>
                  <Chip 
                    label="Featured" 
                    size="small"
                    sx={{ 
                      background: 'linear-gradient(135deg, #F9D13E 0%, #E5C02E 100%)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.7rem'
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Data Uploads */}
          {['ADMIN', 'MANAGER', 'ACCOUNTANT'].includes(user.role) && (
            <Grid item xs={12} sm={6} md={3}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  background: '#fff',
                  borderRadius: 3,
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: '2px solid transparent',
                  backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  backgroundOrigin: 'border-box',
                  backgroundClip: 'padding-box, border-box',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(240, 147, 251, 0.25)',
                  }
                }}
                onClick={() => router.push('/data-uploads')}
              >
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                      boxShadow: '0 8px 16px rgba(240, 147, 251, 0.3)'
                    }}
                  >
                    <CloudUpload sx={{ fontSize: 32, color: '#fff' }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#1a1a1a' }}>
                    Data Uploads
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
                    Import CSV data
                  </Typography>
                  <Chip 
                    label="Featured" 
                    size="small"
                    sx={{ 
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.7rem'
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>

        {/* Classic Dashboard Section */}
        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#3e5244', mb: 3 }}>
            All Features
          </Typography>

          <Grid container spacing={3}>
            {/* All the original cards from your current homepage */}
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

            {['ADMIN', 'MANAGER', 'DISPATCHER'].includes(user.role) && (
              <>
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
              </>
            )}

            {['ADMIN', 'MANAGER', 'ACCOUNTANT'].includes(user.role) && (
              <>
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
                        Expenses & Revenues Setup
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Track one-time & recurring expenses & revenues
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 },
                      border: '2px solid rgba(25, 118, 210, 0.35)',
                      background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.10) 0%, rgba(156, 39, 176, 0.08) 100%)'
                    }}
                    onClick={() => router.push('/data-uploads')}
                  >
                    <CardContent>
                      <CloudUpload sx={{ fontSize: 40, color: '#1976d2', mb: 2 }} />
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        Data Uploads
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Upload and import CSV transaction data
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </>
            )}

            <Grid item xs={12} sm={6} md={4}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 }
                }}
                onClick={() => router.push('/reports')}
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
        </Box>

        {/* User Info Section */}
        <Box sx={{ mt: 6, p: 3, backgroundColor: '#fff', borderRadius: 2, boxShadow: 1 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#3e5244' }}>
            🎉 Session Active
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                <strong>Name:</strong> {user.firstName} {user.lastName}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                <strong>Username:</strong> {user.username}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                <strong>Email:</strong> {user.email || 'Not set'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                <strong>Role:</strong> {user.role}
              </Typography>
            </Grid>
            {user.driverId && (
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  ✅ <strong>Driver ID:</strong> {user.driverId}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}

// Marketing Landing Page Component for non-authenticated users
function MarketingLandingPage({ router }) {
  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Header with Sign In / Get Started */}
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          backgroundColor: 'transparent',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <Toolbar sx={{ py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
            <LocalTaxi sx={{ fontSize: 32, color: '#fff' }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
              FareFlow
            </Typography>
            <Chip 
              icon={<AutoAwesome sx={{ fontSize: 16 }} />}
              label="AI-Powered" 
              size="small"
              sx={{ 
                ml: 1,
                backgroundColor: alpha('#fff', 0.2),
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.7rem'
              }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => router.push('/signin')}
              sx={{
                color: '#fff',
                borderColor: alpha('#fff', 0.3),
                fontWeight: 600,
                px: 3,
                py: 1,
                borderRadius: 2,
                textTransform: 'none',
                '&:hover': {
                  borderColor: '#fff',
                  backgroundColor: alpha('#fff', 0.1)
                }
              }}
            >
              Sign In
            </Button>
            <Button
              variant="contained"
              onClick={() => router.push('/signin')}
              sx={{
                backgroundColor: '#fff',
                color: '#667eea',
                fontWeight: 700,
                px: 3,
                py: 1,
                borderRadius: 2,
                textTransform: 'none',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                '&:hover': {
                  backgroundColor: alpha('#fff', 0.9),
                  boxShadow: '0 6px 20px rgba(0,0,0,0.2)'
                }
              }}
            >
              Get Started
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ pt: 8, pb: 6 }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Chip 
            label="Transform Your Business" 
            sx={{ 
              mb: 3,
              backgroundColor: alpha('#fff', 0.2),
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.85rem',
              px: 1
            }}
          />
          <Typography 
            variant="h2" 
            sx={{ 
              fontWeight: 900, 
              color: '#fff', 
              mb: 3,
              letterSpacing: '-1px',
              textShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}
          >
            AI-Driven Taxi Financial Management
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              color: alpha('#fff', 0.9), 
              maxWidth: 800, 
              mx: 'auto',
              fontWeight: 400,
              lineHeight: 1.8,
              mb: 4
            }}
          >
            Revolutionize your taxi business with intelligent automation. Real-time reporting, 
            automated billing, and financial insights powered by artificial intelligence.
          </Typography>
          
          <Button
            variant="contained"
            size="large"
            onClick={() => router.push('/signin')}
            sx={{
              backgroundColor: '#fff',
              color: '#667eea',
              fontWeight: 700,
              px: 6,
              py: 2,
              borderRadius: 3,
              fontSize: '1.1rem',
              textTransform: 'none',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              '&:hover': {
                backgroundColor: alpha('#fff', 0.95),
                boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Get Started for Free
          </Button>
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block', 
              mt: 2, 
              color: alpha('#fff', 0.7),
              fontSize: '0.95rem'
            }}
          >
            Join hundreds of taxi operators saving time and money
          </Typography>
        </Box>

        {/* Features Grid */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {[
            {
              icon: AutoAwesome,
              title: "AI-Powered Analytics",
              description: "Machine learning algorithms analyze your data to provide predictive insights and optimize operations",
              gradient: 'linear-gradient(135deg, #FFD93D 0%, #F6A623 100%)'
            },
            {
              icon: Speed,
              title: "Real-Time Dashboard",
              description: "Live visibility into trips, credit card transactions, driver shifts, and revenue as it happens",
              gradient: 'linear-gradient(135deg, #6BCB77 0%, #4D96A9 100%)'
            },
            {
              icon: Receipt,
              title: "Automated Billing",
              description: "Smart invoice generation with automatic lease calculations, expense tracking, and payment reconciliation",
              gradient: 'linear-gradient(135deg, #FF6B9D 0%, #C06C84 100%)'
            },
            {
              icon: TrendingUp,
              title: "Financial Forecasting",
              description: "Predictive models forecast revenue trends, identify profit opportunities, and optimize pricing strategies",
              gradient: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)'
            },
            {
              icon: Timeline,
              title: "Year-End Reports",
              description: "Comprehensive tax-ready reports with automated categorization, expense summaries, and P&L statements",
              gradient: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)'
            },
            {
              icon: Insights,
              title: "Smart Recommendations",
              description: "AI suggests cost-saving opportunities, driver performance improvements, and operational efficiencies",
              gradient: 'linear-gradient(135deg, #F472B6 0%, #EC4899 100%)'
            }
          ].map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  background: '#fff',
                  borderRadius: 3,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: '1px solid rgba(0,0,0,0.05)',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 2,
                      background: feature.gradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2
                    }}
                  >
                    <feature.icon sx={{ fontSize: 28, color: '#fff' }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#1a1a1a' }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.7 }}>
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Stats Section */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 6,
            background: alpha('#fff', 0.15),
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            border: '1px solid rgba(255,255,255,0.2)'
          }}
        >
          <Grid container spacing={4}>
            {[
              { label: "Time Saved", value: "95%", icon: Schedule, description: "Automated processing" },
              { label: "Accuracy", value: "99.9%", icon: CheckCircle, description: "Error-free calculations" },
              { label: "Cost Reduction", value: "60%", icon: AttachMoney, description: "Lower admin costs" },
              { label: "Real-time Updates", value: "< 1s", icon: Speed, description: "Instant sync" }
            ].map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Box sx={{ textAlign: 'center' }}>
                  <stat.icon sx={{ fontSize: 40, color: '#fff', mb: 1, opacity: 0.9 }} />
                  <Typography variant="h3" sx={{ fontWeight: 900, color: '#fff', mb: 0.5 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#fff', mb: 0.5 }}>
                    {stat.label}
                  </Typography>
                  <Typography variant="caption" sx={{ color: alpha('#fff', 0.7) }}>
                    {stat.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Benefits Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#fff', mb: 3, textAlign: 'center' }}>
            Why Drivers Love FareFlow
          </Typography>
          <Grid container spacing={3}>
            {[
              {
                title: "Automated Lease Calculations",
                description: "Smart algorithms calculate lease fees based on shift type, vehicle ownership, and historical rates",
                icon: Analytics
              },
              {
                title: "Instant Credit Card Reconciliation", 
                description: "AI matches credit card transactions to drivers and shifts automatically with 99.9% accuracy",
                icon: CreditCard
              },
              {
                title: "Intelligent Expense Tracking",
                description: "Categorizes and tracks all expenses automatically, from fuel to maintenance, with smart predictions",
                icon: Description
              },
              {
                title: "Real-Time Financial Health",
                description: "Live dashboards show profitability, cash flow, and trends so you always know where you stand",
                icon: TrendingUp
              }
            ].map((benefit, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    background: alpha('#fff', 0.1),
                    backdropFilter: 'blur(10px)',
                    borderRadius: 2,
                    border: '1px solid rgba(255,255,255,0.2)',
                    height: '100%'
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <benefit.icon sx={{ fontSize: 32, color: '#fff', opacity: 0.9 }} />
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff', mb: 1 }}>
                        {benefit.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: alpha('#fff', 0.8), lineHeight: 1.7 }}>
                        {benefit.description}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Footer */}
        <Box sx={{ textAlign: 'center', py: 4, borderTop: `1px solid ${alpha('#fff', 0.2)}`, mt: 6 }}>
          <Typography variant="body2" sx={{ color: alpha('#fff', 0.7) }}>
            © 2025 FareFlow - AI-Powered Taxi Financial Management System
          </Typography>
          <Typography variant="caption" sx={{ color: alpha('#fff', 0.5), display: 'block', mt: 1 }}>
            Saving taxi operators time and money through intelligent automation
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}