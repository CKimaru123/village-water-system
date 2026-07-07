import React, { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, Button, CircularProgress, Alert,
  Table, TableBody, TableCell, TableHead, TableRow, Chip,
} from "@mui/material";
import { tokens } from "../../../theme";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import adminApi from "../../../utils/api";

const statusColor = (s, colors) => {
  if (s === "approved") return colors.greenAccent[400];
  if (s === "rejected") return colors.redAccent[400];
  return "#f0c040";
};

const RefundApproval = () => {
  const colors = tokens("dark");
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState({});

  const load = () => {
    adminApi.get("/admin/refunds")
      .then(res => setRefunds(res.data?.data?.refunds || res.data?.refunds || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const act = async (id, action) => {
    setProcessing(p => ({ ...p, [id]: true }));
    try {
      await adminApi.patch(`/admin/refunds/${id}/${action}`);
      load();
    } catch (err) { setError(err.message); }
    finally { setProcessing(p => ({ ...p, [id]: false })); }
  };

  return (
    <Box m="20px">
      <Typography variant="h2" color={colors.grey[100]} fontWeight="bold" mb="20px">Refund Approval</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {loading ? <CircularProgress sx={{ color: colors.blueAccent[500] }} /> : (
        <Card sx={{ backgroundColor: colors.primary[400] }}>
          <CardContent>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {["Client", "Amount (KES)", "Reason", "Requested", "Status", "Actions"].map(h => (
                    <TableCell key={h} sx={{ color: colors.grey[300] }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {refunds.map(r => (
                  <TableRow key={r.id}>
                    <TableCell sx={{ color: colors.grey[100] }}>{r.user_name || r.user_id}</TableCell>
                    <TableCell sx={{ color: colors.grey[100] }}>KES {Number(r.amount || 0).toLocaleString()}</TableCell>
                    <TableCell sx={{ color: colors.grey[300] }}>{r.reason}</TableCell>
                    <TableCell sx={{ color: colors.grey[400] }}>
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell>
                      <Chip label={r.status?.toUpperCase()} size="small"
                        sx={{ backgroundColor: statusColor(r.status, colors), color: "#fff" }} />
                    </TableCell>
                    <TableCell>
                      {r.status === "pending" && (
                        <Box display="flex" gap={0.5}>
                          <Button size="small" startIcon={<CheckCircleIcon />}
                            disabled={processing[r.id]}
                            onClick={() => act(r.id, "approve")}
                            sx={{ color: colors.greenAccent[400] }}>Approve</Button>
                          <Button size="small" startIcon={<CancelIcon />}
                            disabled={processing[r.id]}
                            onClick={() => act(r.id, "reject")}
                            sx={{ color: colors.redAccent[400] }}>Reject</Button>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {refunds.length === 0 && (
              <Typography color={colors.grey[400]} mt={2} textAlign="center">No refund requests.</Typography>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default RefundApproval;
