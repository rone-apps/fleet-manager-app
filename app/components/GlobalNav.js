"use client";

import { Box, Typography, Button, IconButton, useMediaQuery, useTheme } from "@mui/material";
import { DirectionsCar, Home, Logout } from "@mui/icons-material";
import { useRouter } from "next/navigation";

export default function GlobalNav({ currentUser, title = "FareFlow" }) {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/signin");
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
        <Typography 
          variant={isMobile ? "h6" : "h5"} 
          fontWeight="bold"
          sx={{ display: { xs: 'none', sm: 'block' } }}
        >
          {title}
        </Typography>
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