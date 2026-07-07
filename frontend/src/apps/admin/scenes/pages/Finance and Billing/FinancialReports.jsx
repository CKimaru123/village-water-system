import React, { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, CircularProgress, Alert,
  Grid, Table, TableBody, TableCell, TableHead, TableRow, Button,
} from "@mui/material";
import { tokens } from "../../../theme";
import DownloadIcon from "@mui/icons-material/Download";
import { useNavigate } from "react-router-dom";
import adminApi from "../../../utils/api";

const FinancialReports = () => {
  const colors = tokens("dark");
  const navigate = useNavigate();
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminApi.get("/admin/financial_reports")
      .then(res => setReports(res.data?.data || res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) => `KES ${Number(n || 0).toLocaleString()}`;

  if (loading) return (
    <Box m="20px" display="flex" justifyContent="center" alignItems="center" minHeight="400px">
      <CircularProgress sx={{ color: colors.blueAccent[500] }} />
    </Box>
  );

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="20px">
        <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Financial Reports</Typography>
        <Button variant="outlined" startIcon={<DownloadIcon />}
          sx={{ color: colors.blueAccent[400], borderColor: colors.blueAccent[400] }}
          onClick={() => navigate("../export-tools")}>Export</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {reports && (
        <>
          <Grid container spacing={2} mb={3}>
            {[
              { label: "Total Revenue (Month)", value: fmt(reports.monthly_revenue) },
              { label: "Total Collected", value: fmt(reports.total_collected) },
              { label: "Outstanding", value: fmt(reports.total_outstanding) },
              { label: "Collection Rate", value: `${reports.collection_rate || 0}%` },
            ].map(s => (
              <Grid item xs={6} md={3} key={s.label}>
                <Card sx={{ backgroundColor: colors.primary[400] }}>
                  <CardContent>
                    <Typography variant="caption" color={colors.grey[400]}>{s.label}</Typography>
                    <Typography variant="h5" color={colors.grey[100]} fontWeight="bold">{s.value}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {reports.monthly_breakdown?.length > 0 && (
            <Card sx={{ backgroundColor: colors.primary[400] }}>
              <CardContent>
                <Typography variant="h5" color={colors.grey[100]} mb={2}>Monthly Breakdown</Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {["Month", "Invoiced", "Collected", "Outstanding", "Rate"].map(h => (
                        <TableCell key={h} sx={{ color: colors.grey[300] }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reports.monthly_breakdown.map((m, i) => (
                      <TableRow key={i}>
                        <TableCell sx={{ color: colors.grey[100] }}>{m.month}</TableCell>
                        <TableCell sx={{ color: colors.grey[100] }}>{fmt(m.invoiced)}</TableCell>
                        <TableCell sx={{ color: colors.greenAccent[400] }}>{fmt(m.collected)}</TableCell>
                        <TableCell sx={{ color: colors.redAccent[400] }}>{fmt(m.outstanding)}</TableCell>
                        <TableCell sx={{ color: colors.grey[300] }}>{m.rate}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </Box>
  );
};

export default FinancialReports;
