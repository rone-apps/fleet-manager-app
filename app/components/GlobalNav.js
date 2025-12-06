"use client";

import { Box, Typography, Button, Chip } from "@mui/material";
import { DirectionsCar } from "@mui/icons-material";
import { useRouter } from "next/navigation";

export default function GlobalNav({ currentUser, title = "FareFlow" }) {
  const router = useRouter();

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
        p: 2,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <DirectionsCar sx={{ fontSize: 32 }} />
        <Typography variant="h5" fontWeight="bold">
          {title}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Chip
          label={currentUser.username}
          color="primary"
          variant="outlined"
          sx={{ color: "white", borderColor: "white" }}
        />
        <Chip
          label={currentUser.role}
          color="secondary"
          variant="outlined"
          sx={{ color: "white", borderColor: "white" }}
        />
        <Button variant="outlined" color="inherit" onClick={() => router.push("/")}>
          Dashboard
        </Button>
        <Button variant="outlined" color="inherit" onClick={handleLogout}>
          Logout
        </Button>
      </Box>
    </Box>
  );
}
