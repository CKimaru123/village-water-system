import React from "react";
import { Box, Typography, Card, CardContent, Grid, Chip, List, ListItem, ListItemText } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../../theme";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

const roles = [
  {
    role: "Super Admin",
    color: "#e53935",
    permissions: ["Full system access", "Manage admins", "System configuration", "Data export", "Audit log access"],
  },
  {
    role: "Admin",
    color: "#f0a040",
    permissions: ["Client management", "Billing & invoicing", "Ticket management", "Asset management", "Reports"],
  },
  {
    role: "Client",
    color: "#4caf50",
    permissions: ["View own bill", "Make payments", "Submit tickets", "View announcements", "Update profile"],
  },
];

const RoleBasedAccessControl = () => {
  const colors = tokens(useTheme().palette.mode);

  return (
    <Box m="20px">
      <Typography variant="h2" color={colors.grey[100]} fontWeight="bold" mb="5px">Role-Based Access Control</Typography>
      <Typography variant="h6" color={colors.grey[400]} mb="20px">System permission matrix by role</Typography>

      <Card sx={{ backgroundColor: colors.blueAccent[700], mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Chip label="MANAGED BY SYSTEM" size="small" sx={{ backgroundColor: colors.primary[300], color: colors.grey[100] }} />
          </Box>
          <Typography color={colors.grey[100]}>
            Role assignments are managed at the system level. Contact a Super Admin to change user roles.
            Fine-grained permission editing is planned for a future release.
          </Typography>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {roles.map((r, i) => (
          <Grid item xs={12} md={4} key={i}>
            <Card sx={{ backgroundColor: colors.primary[400], borderTop: `4px solid ${r.color}` }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <AdminPanelSettingsIcon sx={{ color: r.color }} />
                  <Typography variant="h5" color={colors.grey[100]} fontWeight="bold">{r.role}</Typography>
                </Box>
                <List dense disablePadding>
                  {r.permissions.map((p, j) => (
                    <ListItem key={j} disablePadding sx={{ py: 0.25 }}>
                      <ListItemText primary={`✓ ${p}`}
                        primaryTypographyProps={{ color: colors.grey[300], variant: "body2" }} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default RoleBasedAccessControl;
