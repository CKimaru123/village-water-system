import React, { useState, useEffect } from "react";
import {
  Box, Typography, Card, CardContent, CircularProgress, Alert,
  Table, TableBody, TableCell, TableHead, TableRow, TextField,
  InputAdornment, Chip, Select, MenuItem, FormControl, InputLabel,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../../theme";
import SearchIcon from "@mui/icons-material/Search";
import adminApi from "../../../utils/api";

const AuditLogs = () => {
  const colors = tokens(useTheme().palette.mode);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (actionFilter) params.append("action", actionFilter);
    adminApi.get(`/admin/audit_logs?${params}`)
      .then(res => setLogs(res.data?.data?.audit_logs || res.data?.data?.logs || res.data?.logs || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [actionFilter]);

  const filtered = logs.filter(l =>
    l.action?.toLowerCase().includes(search.toLowerCase()) ||
    l.user_name?.toLowerCase().includes(search.toLowerCase()) ||
    l.resource_type?.toLowerCase().includes(search.toLowerCase())
  );

  const actionColor = (action) => {
    if (action?.includes("delete") || action?.includes("reject")) return colors.redAccent[400];
    if (action?.includes("create") || action?.includes("approve")) return colors.greenAccent[400];
    if (action?.includes("update") || action?.includes("edit")) return colors.blueAccent[400];
    return colors.grey[400];
  };

  return (
    <Box m="20px">
      <Typography variant="h2" color={colors.grey[100]} fontWeight="bold" mb="20px">Audit Logs</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <TextField
          placeholder="Search logs..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          size="small"
          sx={{ width: 280,
            "& .MuiOutlinedInput-root": { color: colors.grey[100], "& fieldset": { borderColor: colors.grey[600] } } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: colors.grey[400] }} /></InputAdornment> }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel sx={{ color: colors.grey[400] }}>Filter by Action</InputLabel>
          <Select value={actionFilter} onChange={e => setActionFilter(e.target.value)} label="Filter by Action"
            sx={{ color: colors.grey[100], "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.grey[600] } }}>
            <MenuItem value="">All Actions</MenuItem>
            {["create", "update", "delete", "approve", "reject", "login", "sla_breach", "document_generated"].map(a => (
              <MenuItem key={a} value={a}>{a}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {loading ? <CircularProgress sx={{ color: colors.blueAccent[500] }} /> : (
        <Card sx={{ backgroundColor: colors.primary[400] }}>
          <CardContent sx={{ p: 0 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {["Time", "User", "Action", "Resource", "Details"].map(h => (
                    <TableCell key={h} sx={{ color: colors.grey[300], backgroundColor: colors.blueAccent[700] }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((log, i) => (
                  <TableRow key={i} sx={{ "&:hover": { backgroundColor: colors.primary[300] } }}>
                    <TableCell sx={{ color: colors.grey[400], whiteSpace: "nowrap" }}>
                      {log.created_at ? new Date(log.created_at).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell sx={{ color: colors.grey[100] }}>{log.user_name || log.user_id || "System"}</TableCell>
                    <TableCell>
                      <Chip label={log.action} size="small"
                        sx={{ backgroundColor: actionColor(log.action), color: "#fff", fontSize: 11 }} />
                    </TableCell>
                    <TableCell sx={{ color: colors.grey[300] }}>
                      {log.resource_type}{log.resource_id ? ` #${log.resource_id}` : ""}
                    </TableCell>
                    <TableCell sx={{ color: colors.grey[400], maxWidth: 300,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {typeof log.details === "string" ? log.details : JSON.stringify(log.details)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filtered.length === 0 && (
              <Typography color={colors.grey[400]} textAlign="center" py={3}>No audit logs found.</Typography>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default AuditLogs;
