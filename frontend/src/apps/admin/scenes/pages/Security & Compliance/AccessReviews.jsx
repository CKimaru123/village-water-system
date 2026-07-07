import React from "react";
import { Box, Typography, Card, CardContent, Grid, Chip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../../theme";
import SecurityIcon from "@mui/icons-material/Security";
import ScheduleIcon from "@mui/icons-material/Schedule";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import GroupIcon from "@mui/icons-material/Group";

const items = [
  { icon: <ScheduleIcon />, title: "Quarterly Reviews", desc: "Access rights are reviewed every quarter to ensure least-privilege compliance." },
  { icon: <AssignmentTurnedInIcon />, title: "Approval Workflow", desc: "Any access change requires approval from a Super Admin before taking effect." },
  { icon: <GroupIcon />, title: "Dormant Accounts", desc: "Accounts inactive for 90+ days are automatically flagged for review and suspension." },
  { icon: <SecurityIcon />, title: "Audit Integration", desc: "All access changes are logged in the Audit Log with timestamps and approver details." },
];

const AccessReviews = () => {
  const colors = tokens(useTheme().palette.mode);

  return (
    <Box m="20px">
      <Typography variant="h2" color={colors.grey[100]} fontWeight="bold" mb="5px">Access Reviews</Typography>
      <Typography variant="h6" color={colors.grey[400]} mb="20px">Periodic review of user access rights</Typography>

      <Card sx={{ backgroundColor: colors.blueAccent[700], mb: 3 }}>
        <CardContent>
          <Chip label="FUTURE FEATURE" size="small" sx={{ backgroundColor: colors.primary[300], color: colors.grey[100], mb: 1 }} />
          <Typography color={colors.grey[100]}>
            Automated access review workflows are planned for a future release. 
            Currently, access reviews are conducted manually by Super Admins via the Admin Management panel.
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

export default AccessReviews;
