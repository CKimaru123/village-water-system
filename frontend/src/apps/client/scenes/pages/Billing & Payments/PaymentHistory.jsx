import React, { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, Chip, CircularProgress,
  Alert, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Button, TextField, MenuItem,
} from "@mui/material";
import { tokens } from "../../../theme";
import ReceiptIcon from "@mui/icons-material/Receipt";
import { useNavigate } from "react-router-dom";
import api from "../../../utils/api";

const STATUS_COLORS = { completed: "success", pending: "warning", failed: "error", refunded: "info" };

const PaymentHistory = () => {
  const colors = tokens("dark");
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");

  const load = (status = "") => {
    setLoading(true);
    const path = status ? `/client/payments?status=${status}` : "/client/payments";
    api.get(path)
      .then(res => {
        // api.js returns raw JSON: { success, message, data: { payments, total_paid } }
        const payload = res?.data || {};
        setPayments(payload?.payments || []);
        setTotalPaid(payload?.total_paid || 0);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const fmt = (n) => `KES ${Number(n || 0).toLocaleString()}`;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="20px">
        <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Payment History</Typography>
        <Button variant="contained"
          sx={{ backgroundColor: colors.greenAccent[600] }}
          onClick={() => navigate("../current-bill")}>
          View Current Bill
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Summary */}
      <Card sx={{ backgroundColor: colors.primary[400], mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6" color={colors.grey[300]}>Total Paid (All Time)</Typography>
              <Typography variant="h3" color={colors.greenAccent[400]} fontWeight="bold">{fmt(totalPaid)}</Typography>
            </Box>
            <Box>
              <Typography variant="h6" color={colors.grey[300]}>Total Transactions</Typography>
              <Typography variant="h3" color={colors.grey[100]} fontWeight="bold">{payments.length}</Typography>
            </Box>
            <TextField select label="Filter by Status" value={statusFilter} size="small"
              onChange={e => { setStatusFilter(e.target.value); load(e.target.value); }}
              sx={{ minWidth: 160, "& .MuiInputBase-input": { color: colors.grey[100] } }}
              InputLabelProps={{ sx: { color: colors.grey[300] } }}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
              <MenuItem value="refunded">Refunded</MenuItem>
            </TextField>
          </Box>
        </CardContent>
      </Card>

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}><CircularProgress sx={{ color: colors.blueAccent[500] }} /></Box>
      ) : payments.length === 0 ? (
        <Alert severity="info">No payment records found.</Alert>
      ) : (
        <TableContainer component={Paper} sx={{ backgroundColor: colors.primary[400] }}>
          <Table>
            <TableHead>
              <TableRow>
                {["Date", "Reference", "Method", "Invoice", "Amount", "Status"].map(h => (
                  <TableCell key={h} sx={{ color: colors.grey[300], fontWeight: "bold", borderColor: colors.grey[700] }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map(p => (
                <TableRow key={p.id} sx={{ "&:hover": { backgroundColor: colors.primary[500] } }}>
                  <TableCell sx={{ color: colors.grey[100], borderColor: colors.grey[700] }}>{fmtDate(p.payment_date)}</TableCell>
                  <TableCell sx={{ color: colors.blueAccent[400], borderColor: colors.grey[700] }}>{p.transaction_reference}</TableCell>
                  <TableCell sx={{ color: colors.grey[100], borderColor: colors.grey[700] }}>{p.payment_method?.replace("_", " ")}</TableCell>
                  <TableCell sx={{ color: colors.grey[300], borderColor: colors.grey[700] }}>
                    {p.invoice ? p.invoice.invoice_number : "—"}
                  </TableCell>
                  <TableCell sx={{ color: colors.greenAccent[400], fontWeight: "bold", borderColor: colors.grey[700] }}>{fmt(p.amount)}</TableCell>
                  <TableCell sx={{ borderColor: colors.grey[700] }}>
                    <Chip label={p.status} size="small" color={STATUS_COLORS[p.status] || "default"} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default PaymentHistory;
