"use client";

import { Box, Typography, Button, IconButton, useMediaQuery, useTheme } from "@mui/material";
import { DirectionsCar, Home, Logout, Business } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getTenantName, logout as apiLogout } from "../lib/api";

export default function GlobalNav({ currentUser, title = "FareFlow" }) {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [tenantName, setTenantName] = useState(null);

  useEffect(() => {
    setTenantName(getTenantName());
  }, []);

  const handleLogout = () => {
    apiLogout(); // Use the proper logout function that clears all storage
  };

  if (!currentUser) return null;

  return (
    <Box
      sx={{
        backgroundColor: "#1e3a8a",
        color: "white",
        p: { xs: 1.5, sm: 2 },
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      {/* Logo and Title */}
      <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 2 } }}>
        <DirectionsCar sx={{ fontSize: { xs: 28, sm: 32 } }} />
        <Box>
          <Typography 
            variant={isMobile ? "h6" : "h5"} 
            fontWeight="bold"
            sx={{ display: { xs: 'none', sm: 'block' }, lineHeight: 1.2 }}
          >
            {title}
          </Typography>
          {tenantName && !isMobile && (
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5
              }}
            >
              <Business sx={{ fontSize: 14 }} />
              {tenantName}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Navigation Buttons */}
      <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 2 } }}>
        {isMobile ? (
          <>
            {/* Mobile: Icon buttons only */}
            <IconButton 
              color="inherit" 
              onClick={() => router.push("/")}
              sx={{ 
                border: '1px solid rgba(255, 255, 255, 0.5)',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
              }}
            >
              <Home />
            </IconButton>
            <IconButton 
              color="inherit" 
              onClick={handleLogout}
              sx={{ 
                border: '1px solid rgba(255, 255, 255, 0.5)',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
              }}
            >
              <Logout />
            </IconButton>
          </>
        ) : (
          <>
            {/* Desktop: Text buttons with icons */}
            <Button 
              variant="outlined" 
              color="inherit" 
              startIcon={<Home />}
              onClick={() => router.push("/")}
              sx={{ 
                borderColor: 'rgba(255, 255, 255, 0.5)',
                '&:hover': { 
                  borderColor: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)' 
                }
              }}
            >
              Home
            </Button>
            <Button 
              variant="outlined" 
              color="inherit" 
              startIcon={<Logout />}
              onClick={handleLogout}
              sx={{ 
                borderColor: 'rgba(255, 255, 255, 0.5)',
                '&:hover': { 
                  borderColor: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)' 
                }
              }}
            >
              Logout
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
}