import React from "react";
import { Box, Typography, Card, CardContent, Grid, Chip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../../theme";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import OfflineBoltIcon from "@mui/icons-material/OfflineBolt";
import NotificationsIcon from "@mui/icons-material/Notifications";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";

const items = [
  { icon: <PhoneAndroidIcon />, title: "Mobile Client App", desc: "Clients can access their dashboard, pay bills, and submit tickets from a native mobile app." },
  { icon: <OfflineBoltIcon />, title: "Offline Mode", desc: "Field staff can record meter readings and incidents offline, syncing when connectivity is restored." },
  { icon: <NotificationsIcon />, title: "Push Notifications", desc: "Real-time push alerts for bill reminders, outage notices, and ticket updates." },
  { icon: <QrCodeScannerIcon />, title: "QR Code Payments", desc: "Clients can scan a QR code on their bill to initiate M-Pesa payment instantly." },
];

const MobileAppExtensions = () => {
  const colors = tokens(useTheme().palette.mode);

  return (
    <Box m="20px">
      <Typography variant="h2" color={colors.grey[100]} fontWeight="bold" mb="5px">Mobile App Extensions</Typography>
      <Typography variant="h6" color={colors.grey[400]} mb="20px">Mobile capabilities and field staff tools</Typography>

      <Card sx={{ backgroundColor: colors.blueAccent[700], mb: 3 }}>
        <CardContent>
          <Chip label="PLANNED FEATURE" size="small" sx={{ backgroundColor: colors.orangeAccent?.[600] || "#f0a040", color: "#fff", mb: 1 }} />
          <Typography color={colors.grey[100]}>
            Native mobile apps for clients and field staff are planned for a future release.
            The current web dashboard is mobile-responsive and accessible on all devices.
          </Typography>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {items.map((item, i) => (
          <Grid item xs={12} md={6} key={i}>
            <Card sx={{ backgroundColor: colors.primary[400] }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Box sx={{ color: colors.greenAccent[400] }}>{item.icon}</Box>
                  <Typography variant="h5" color={colors.grey[100]}>{item.title}</Typography>
                </Box>
                <Typography variant="body2" color={colors.grey[300]}>{item.desc}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default MobileAppExtensions;
