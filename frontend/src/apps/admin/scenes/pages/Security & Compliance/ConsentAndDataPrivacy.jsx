import React from "react";
import { Box, Typography, Card, CardContent, Grid, Chip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../../theme";
import GppGoodIcon from "@mui/icons-material/GppGood";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import VisibilityIcon from "@mui/icons-material/Visibility";
import LockPersonIcon from "@mui/icons-material/LockPerson";

const items = [
  { icon: <GppGoodIcon />, title: "Consent Management", desc: "Clients explicitly consent to data collection during signup. Consent records are stored with timestamps." },
  { icon: <VisibilityIcon />, title: "Data Access Requests", desc: "Clients can request a copy of all their personal data held by the system." },
  { icon: <DeleteForeverIcon />, title: "Right to Erasure", desc: "Clients can request deletion of their personal data, subject to legal retention requirements." },
  { icon: <LockPersonIcon />, title: "Data Minimisation", desc: "Only data necessary for service delivery is collected. No third-party data sharing without consent." },
];

const ConsentAndDataPrivacy = () => {
  const colors = tokens(useTheme().palette.mode);

  return (
    <Box m="20px">
      <Typography variant="h2" color={colors.grey[100]} fontWeight="bold" mb="5px">Consent & Data Privacy</Typography>
      <Typography variant="h6" color={colors.grey[400]} mb="20px">GDPR-aligned data handling policies</Typography>

      <Card sx={{ backgroundColor: colors.blueAccent[700], mb: 3 }}>
        <CardContent>
          <Chip label="POLICY REFERENCE" size="small" sx={{ backgroundColor: colors.primary[300], color: colors.grey[100], mb: 1 }} />
          <Typography color={colors.grey[100]}>
            Self-service data access and erasure request workflows are planned for a future release.
            Current requests are handled manually by Super Admins.
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

export default ConsentAndDataPrivacy;
