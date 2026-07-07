import React from "react";
import { Box, Typography, Card, CardContent, Grid, Chip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../../theme";
import GavelIcon from "@mui/icons-material/Gavel";
import DescriptionIcon from "@mui/icons-material/Description";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import FactCheckIcon from "@mui/icons-material/FactCheck";

const items = [
  { icon: <DescriptionIcon />, title: "Regulatory Reports", desc: "Generate and submit water quality, financial, and operational reports to regulatory bodies." },
  { icon: <CalendarMonthIcon />, title: "Compliance Calendar", desc: "Track submission deadlines for WASREB, NEMA, and county government filings." },
  { icon: <FactCheckIcon />, title: "Audit Readiness", desc: "All records are maintained in audit-ready format with full traceability." },
  { icon: <GavelIcon />, title: "Legal Compliance", desc: "System operations comply with the Water Act 2016 and relevant county water regulations." },
];

const EFilingRegulatoryCompliance = () => {
  const colors = tokens(useTheme().palette.mode);

  return (
    <Box m="20px">
      <Typography variant="h2" color={colors.grey[100]} fontWeight="bold" mb="5px">E-Filing & Regulatory Compliance</Typography>
      <Typography variant="h6" color={colors.grey[400]} mb="20px">Regulatory submission tracking and compliance management</Typography>

      <Card sx={{ backgroundColor: colors.blueAccent[700], mb: 3 }}>
        <CardContent>
          <Chip label="FUTURE FEATURE" size="small" sx={{ backgroundColor: colors.primary[300], color: colors.grey[100], mb: 1 }} />
          <Typography color={colors.grey[100]}>
            Automated e-filing and compliance calendar integration is planned for a future release.
            Reports can currently be exported manually from the Financial Reports and Export Tools pages.
          </Typography>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {items.map((item, i) => (
          <Grid item xs={12} md={6} key={i}>
            <Card sx={{ backgroundColor: colors.primary[400] }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Box sx={{ color: colors.blueAccent[400] }}>{item.icon}</Box>
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

export default EFilingRegulatoryCompliance;
