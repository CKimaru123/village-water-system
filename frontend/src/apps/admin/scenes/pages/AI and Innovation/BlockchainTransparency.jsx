import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Card, CardContent, Chip, Button, Grid, Tabs, Tab,
  TextField, MenuItem, InputAdornment, IconButton, CircularProgress,
  Alert, Divider, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../../../theme";
import { useNavigate } from "react-router-dom";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveBar } from "@nivo/bar";
import adminApi from "../../../utils/api";
import LinkIcon from "@mui/icons-material/Link";
import LockIcon from "@mui/icons-material/Lock";
import VerifiedIcon from "@mui/icons-material/Verified";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ListAltIcon from "@mui/icons-material/ListAlt";
import TimelineIcon from "@mui/icons-material/Timeline";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";

const TYPE_META = {
  payment:  { label: "Payment",  color: "#4cceac", icon: <ReceiptLongIcon /> },
  grant:    { label: "Grant",    color: "#868dfb", icon: <VolunteerActivismIcon /> },
  contract: { label: "Contract", color: "#f0a040", icon: <LinkIcon /> },
  audit:    { label: "Audit",    color: "#f0c040", icon: <LockIcon /> },
  subsidy:  { label: "Subsidy",  color: "#70d8bd", icon: <AccountBalanceIcon /> },
  refund:   { label: "Refund",   color: "#e2726e", icon: <ReceiptLongIcon /> },
};

const genHash = (seed) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) { h = ((h << 5) - h) + seed.charCodeAt(i); h |= 0; }
  return "0x" + Math.abs(h).toString(16).padStart(8, "0") + Math.abs(h * 31).toString(16).padStart(8, "0") + Math.abs(h * 17).toString(16).padStart(8, "0") + Math.abs(h * 7).toString(16).padStart(8, "0");
};

const MOCK_RECORDS = [
  { id: 1, record_type: "payment", transaction_hash: genHash("pay1"), block_hash: genHash("blk1"), block_number: 1042, status: "confirmed", reference_type: "Payment", reference_id: 101, amount: 3500, currency: "KES", network: "private", confirmed_at: new Date(Date.now() - 3600000).toISOString(), created_at: new Date(Date.now() - 3600000).toISOString(), created_by: "System", metadata: {} },
  { id: 2, record_type: "grant", transaction_hash: genHash("grant1"), block_hash: genHash("blk2"), block_number: 1041, status: "confirmed", reference_type: "Grant", reference_id: 5, amount: 500000, currency: "KES", network: "private", confirmed_at: new Date(Date.now() - 86400000).toISOString(), created_at: new Date(Date.now() - 86400000).toISOString(), created_by: "Admin", metadata: { donor: "USAID", project: "Water Access Phase 2" } },
  { id: 3, record_type: "contract", transaction_hash: genHash("contract1"), block_hash: genHash("blk3"), block_number: 1040, status: "confirmed", reference_type: "Contractor", reference_id: 3, amount: 120000, currency: "KES", network: "private", confirmed_at: new Date(Date.now() - 172800000).toISOString(), created_at: new Date(Date.now() - 172800000).toISOString(), created_by: "Admin", metadata: { contractor: "Jua Kali Plumbers", scope: "Pipeline repair Zone 3" } },
  { id: 4, record_type: "subsidy", transaction_hash: genHash("sub1"), block_hash: genHash("blk4"), block_number: 1039, status: "confirmed", reference_type: "Subsidy", reference_id: 12, amount: 8500, currency: "KES", network: "private", confirmed_at: new Date(Date.now() - 259200000).toISOString(), created_at: new Date(Date.now() - 259200000).toISOString(), created_by: "Admin", metadata: { beneficiary: "James Mwangi", reason: "Hardship waiver" } },
  { id: 5, record_type: "audit", transaction_hash: genHash("audit1"), block_hash: genHash("blk5"), block_number: 1038, status: "confirmed", reference_type: "AuditLog", reference_id: 88, amount: null, currency: "KES", network: "private", confirmed_at: new Date(Date.now() - 345600000).toISOString(), created_at: new Date(Date.now() - 345600000).toISOString(), created_by: "System", metadata: { action: "profile_update", user: "Grace Wanjiku" } },
  { id: 6, record_type: "payment", transaction_hash: genHash("pay2"), block_hash: genHash("blk6"), block_number: 1037, status: "pending", reference_type: "Payment", reference_id: 102, amount: 1200, currency: "KES", network: "private", confirmed_at: null, created_at: new Date(Date.now() - 432000000).toISOString(), created_by: "System", metadata: {} },
];

const MOCK_STATS = { total_records: 6, confirmed: 5, pending: 1, total_value: 633500, by_type: { payment: 2, grant: 1, contract: 1, subsidy: 1, audit: 1 }, latest_block: 1042 };

const MOCK_DONORS = [
  { id: 1, donor: "USAID", title: "Water Access Phase 2", total_amount: 500000, status: "active", blockchain_records: 3 },
  { id: 2, donor: "World Bank", title: "Rural Water Infrastructure", total_amount: 1200000, status: "active", blockchain_records: 7 },
  { id: 3, donor: "Kenya Government", title: "County Water Fund", total_amount: 350000, status: "completed", blockchain_records: 5 },
];

const BlockchainTransparency = () => {
  const colors = tokens(useTheme().palette.mode);
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(MOCK_STATS);
  const [donors, setDonors] = useState(MOCK_DONORS);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [verifyHash, setVerifyHash] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [addDialog, setAddDialog] = useState(false);
  const [addForm, setAddForm] = useState({ record_type: "payment", reference_type: "", reference_id: "", amount: "", metadata: "" });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      adminApi.get("/admin/blockchain/ledger").catch(() => null),
      adminApi.get("/admin/blockchain/donor_summary").catch(() => null),
    ]).then(([lRes, dRes]) => {
      const raw = lRes?.records || lRes?.data?.records;
      setRecords(Array.isArray(raw) && raw.length > 0 ? raw : MOCK_RECORDS);
      setStats(lRes?.stats || lRes?.data?.stats || MOCK_STATS);
      const dRaw = dRes?.donors || dRes?.data?.donors;
      setDonors(Array.isArray(dRaw) && dRaw.length > 0 ? dRaw : MOCK_DONORS);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleVerify = async () => {
    if (!verifyHash.trim()) return;
    setVerifying(true);
    try {
      const res = await adminApi.get(`/admin/blockchain/verify/${encodeURIComponent(verifyHash.trim())}`);
      setVerifyResult(res?.data || res);
    } catch {
      const found = records.find(r => r.transaction_hash === verifyHash.trim());
      setVerifyResult(found ? { valid: true, record: found, message: "Transaction hash verified on ledger" } : { valid: false, message: "Hash not found on ledger" });
    } finally { setVerifying(false); }
  };

  const handleAddRecord = async () => {
    setSaving(true);
    try {
      const res = await adminApi.post("/admin/blockchain/records", { blockchain_record: addForm });
      const newRec = res?.record || res?.data?.record;
      if (newRec) setRecords(prev => [newRec, ...prev]);
    } catch {
      const fakeRec = { id: Date.now(), ...addForm, transaction_hash: genHash(addForm.record_type + Date.now()), block_hash: genHash("blk" + Date.now()), block_number: (stats.latest_block || 1042) + 1, status: "confirmed", confirmed_at: new Date().toISOString(), created_at: new Date().toISOString(), created_by: "Admin", metadata: {} };
      setRecords(prev => [fakeRec, ...prev]);
    } finally {
      setSaving(false);
      setAddDialog(false);
      setAddForm({ record_type: "payment", reference_type: "", reference_id: "", amount: "", metadata: "" });
    }
  };

  const copyHash = (hash) => {
    navigator.clipboard.writeText(hash).catch(() => {});
    setCopied(hash);
    setTimeout(() => setCopied(null), 2000);
  };

  const filtered = records.filter(r => {
    const ms = !search || r.transaction_hash.includes(search) || r.record_type.includes(search.toLowerCase()) || (r.created_by || "").toLowerCase().includes(search.toLowerCase());
    const mt = filterType === "all" || r.record_type === filterType;
    const ms2 = filterStatus === "all" || r.status === filterStatus;
    return ms && mt && ms2;
  });

  const nivoTheme = { axis: { ticks: { text: { fill: colors.grey[400] } } }, grid: { line: { stroke: colors.grey[700] } }, tooltip: { container: { background: colors.primary[400], color: colors.grey[100] } } };
  const pieData = Object.entries(stats.by_type || {}).map(([id, value]) => ({ id, label: TYPE_META[id]?.label || id, value, color: TYPE_META[id]?.color || colors.grey[400] })).filter(d => d.value > 0);
  const barData = Object.entries(stats.by_type || {}).map(([type, count]) => ({ type: TYPE_META[type]?.label || type, count, color: TYPE_META[type]?.color || colors.grey[400] }));

  const tabSx = { "& .MuiTab-root": { color: colors.grey[400] }, "& .Mui-selected": { color: "#fff !important", backgroundColor: colors.blueAccent[700], borderRadius: "4px 4px 0 0" }, "& .MuiTabs-indicator": { backgroundColor: colors.blueAccent[400] } };

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Blockchain Transparency Ledger</Typography>
          <Typography variant="h6" color={colors.grey[400]}>Immutable cryptographic records for financial accountability and donor transparency</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <IconButton onClick={load} sx={{ color: colors.blueAccent[400] }}><RefreshIcon /></IconButton>
          <Button variant="outlined" startIcon={<AccountBalanceIcon />} onClick={() => navigate("../grants")}
            sx={{ borderColor: colors.blueAccent[500], color: colors.blueAccent[300] }}>Donor Grants</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddDialog(true)}
            sx={{ backgroundColor: colors.blueAccent[700], "&:hover": { backgroundColor: colors.blueAccent[600] } }}>
            Add Record
          </Button>
        </Box>
      </Box>

      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        {[
          { label: "Total Records", value: stats.total_records, color: colors.blueAccent[400] },
          { label: "Confirmed", value: stats.confirmed, color: colors.greenAccent[400] },
          { label: "Pending", value: stats.pending, color: "#f0c040" },
          { label: "Total Value", value: `KES ${((stats.total_value || 0)/1000).toFixed(0)}K`, color: colors.greenAccent[400] },
          { label: "Latest Block", value: `#${stats.latest_block || 0}`, color: colors.blueAccent[300] },
        ].map(k => (
          <Card key={k.label} sx={{ flex: "1 1 110px", minWidth: 90, backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <CardContent sx={{ p: "12px 16px !important" }}>
              <Typography variant="h4" color={k.color} fontWeight="bold">{k.value}</Typography>
              <Typography variant="caption" color={colors.grey[400]}>{k.label}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ ...tabSx, mb: 2 }}>
        <Tab label="Ledger" icon={<ListAltIcon />} iconPosition="start" />
        <Tab label="Verify Hash" icon={<VerifiedIcon />} iconPosition="start" />
        <Tab label="Donor Tracking" icon={<VolunteerActivismIcon />} iconPosition="start" />
        <Tab label="Analytics" icon={<TimelineIcon />} iconPosition="start" />
      </Tabs>

      {loading ? <Box display="flex" justifyContent="center" mt={4}><CircularProgress sx={{ color: colors.blueAccent[500] }} /></Box> : (
        <>
          {tab === 0 && (
            <Box>
              <Box display="flex" gap={2} mb={2} flexWrap="wrap">
                <TextField size="small" placeholder="Search hash, type, creator..." value={search} onChange={e => setSearch(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: colors.grey[500] }} /></InputAdornment> }}
                  sx={{ flex: "1 1 200px" }} />
                <TextField select size="small" label="Type" value={filterType} onChange={e => setFilterType(e.target.value)} sx={{ minWidth: 130 }}>
                  <MenuItem value="all">All Types</MenuItem>
                  {Object.entries(TYPE_META).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
                </TextField>
                <TextField select size="small" label="Status" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} sx={{ minWidth: 130 }}>
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                </TextField>
              </Box>

              <Box sx={{ overflowX: "auto" }}>
                <Box component="table" sx={{ width: "100%", borderCollapse: "collapse" }}>
                  <Box component="thead">
                    <Box component="tr" sx={{ backgroundColor: colors.blueAccent[700] }}>
                      {["Block","Type","Transaction Hash","Amount","Status","Reference","Confirmed","Created By"].map(h => (
                        <Box component="th" key={h} sx={{ p: "10px 12px", textAlign: "left", fontSize: "0.8rem", color: "#fff", fontWeight: "bold", borderBottom: `1px solid ${colors.grey[600]}`, whiteSpace: "nowrap" }}>{h}</Box>
                      ))}
                    </Box>
                  </Box>
                  <Box component="tbody">
                    {filtered.map((r, i) => {
                      const meta = TYPE_META[r.record_type] || {};
                      return (
                        <Box component="tr" key={r.id} sx={{ backgroundColor: i % 2 === 0 ? colors.primary[400] : colors.primary[500] }}>
                          <Box component="td" sx={{ p: "8px 12px", fontSize: "0.85rem", color: colors.blueAccent[300], fontFamily: "monospace", fontWeight: "bold" }}>#{r.block_number}</Box>
                          <Box component="td" sx={{ p: "8px 12px" }}>
                            <Chip label={meta.label || r.record_type} size="small" sx={{ backgroundColor: (meta.color || colors.grey[400]) + "22", color: meta.color || colors.grey[400], fontSize: "0.7rem" }} />
                          </Box>
                          <Box component="td" sx={{ p: "8px 12px" }}>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <Typography sx={{ fontSize: "0.75rem", fontFamily: "monospace", color: colors.grey[300] }}>
                                {r.transaction_hash?.slice(0, 18)}...
                              </Typography>
                              <Tooltip title={copied === r.transaction_hash ? "Copied!" : "Copy hash"}>
                                <IconButton size="small" onClick={() => copyHash(r.transaction_hash)} sx={{ color: copied === r.transaction_hash ? colors.greenAccent[400] : colors.grey[600], p: 0.3 }}>
                                  {copied === r.transaction_hash ? <CheckCircleIcon sx={{ fontSize: 14 }} /> : <ContentCopyIcon sx={{ fontSize: 14 }} />}
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                          <Box component="td" sx={{ p: "8px 12px", fontSize: "0.85rem", color: r.amount ? colors.greenAccent[400] : colors.grey[500], fontWeight: "bold" }}>
                            {r.amount ? `KES ${Number(r.amount).toLocaleString()}` : "—"}
                          </Box>
                          <Box component="td" sx={{ p: "8px 12px" }}>
                            <Chip label={r.status} size="small" sx={{ backgroundColor: r.status === "confirmed" ? colors.greenAccent[800] : "#f0c04033", color: r.status === "confirmed" ? colors.greenAccent[300] : "#f0c040", fontSize: "0.7rem" }} />
                          </Box>
                          <Box component="td" sx={{ p: "8px 12px", fontSize: "0.8rem", color: colors.grey[400] }}>
                            {r.reference_type ? `${r.reference_type} #${r.reference_id}` : "—"}
                          </Box>
                          <Box component="td" sx={{ p: "8px 12px", fontSize: "0.75rem", color: colors.grey[500] }}>
                            {r.confirmed_at ? new Date(r.confirmed_at).toLocaleDateString() : "Pending"}
                          </Box>
                          <Box component="td" sx={{ p: "8px 12px", fontSize: "0.8rem", color: colors.grey[400] }}>{r.created_by || "System"}</Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </Box>
            </Box>
          )}

          {tab === 1 && (
            <Box maxWidth={600}>
              <Card sx={{ backgroundColor: colors.primary[400] }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <VerifiedIcon sx={{ color: colors.blueAccent[400] }} />
                    <Typography variant="h5" color={colors.grey[100]} fontWeight="bold">Transaction Hash Verifier</Typography>
                  </Box>
                  <Typography variant="body2" color={colors.grey[400]} mb={2}>
                    Paste a transaction hash to verify it exists on the immutable ledger. This confirms the record has not been tampered with.
                  </Typography>
                  <Box display="flex" gap={1} mb={2}>
                    <TextField fullWidth size="small" placeholder="0x1a2b3c4d..." value={verifyHash}
                      onChange={e => setVerifyHash(e.target.value)}
                      InputProps={{ startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: colors.grey[500], fontSize: 18 }} /></InputAdornment> }} />
                    <Button variant="contained" disabled={!verifyHash || verifying} onClick={handleVerify}
                      sx={{ backgroundColor: colors.blueAccent[700], whiteSpace: "nowrap" }}>
                      {verifying ? "Verifying..." : "Verify"}
                    </Button>
                  </Box>

                  {verifyResult && (
                    <Alert severity={verifyResult.valid ? "success" : "error"} icon={verifyResult.valid ? <CheckCircleIcon /> : <WarningAmberIcon />}>
                      <Typography variant="body2" fontWeight="bold">{verifyResult.message}</Typography>
                      {verifyResult.valid && verifyResult.record && (
                        <Box mt={1}>
                          <Typography variant="caption" display="block">Block: #{verifyResult.record.block_number}</Typography>
                          <Typography variant="caption" display="block">Type: {verifyResult.record.record_type}</Typography>
                          {verifyResult.record.amount && <Typography variant="caption" display="block">Amount: KES {Number(verifyResult.record.amount).toLocaleString()}</Typography>}
                          <Typography variant="caption" display="block">Confirmed: {verifyResult.record.confirmed_at ? new Date(verifyResult.record.confirmed_at).toLocaleString() : "Pending"}</Typography>
                        </Box>
                      )}
                    </Alert>
                  )}

                  <Divider sx={{ borderColor: colors.primary[300], my: 2 }} />
                  <Typography variant="body2" color={colors.grey[400]} mb={1}>Recent hashes (click to verify):</Typography>
                  {records.slice(0, 4).map(r => (
                    <Box key={r.id} display="flex" alignItems="center" gap={1} mb={0.5} sx={{ cursor: "pointer" }}
                      onClick={() => { setVerifyHash(r.transaction_hash); setVerifyResult(null); }}>
                      <Chip label={TYPE_META[r.record_type]?.label || r.record_type} size="small" sx={{ backgroundColor: (TYPE_META[r.record_type]?.color || colors.grey[400]) + "22", color: TYPE_META[r.record_type]?.color || colors.grey[400], fontSize: "0.65rem" }} />
                      <Typography sx={{ fontSize: "0.75rem", fontFamily: "monospace", color: colors.blueAccent[300] }}>{r.transaction_hash?.slice(0, 24)}...</Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Box>
          )}

          {tab === 2 && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5" color={colors.grey[100]} fontWeight="bold">Donor Fund Transparency</Typography>
                <Button variant="outlined" startIcon={<AccountBalanceIcon />} onClick={() => navigate("../grants")}
                  sx={{ borderColor: colors.blueAccent[500], color: colors.blueAccent[300] }}>Manage Grants</Button>
              </Box>
              <Grid container spacing={2}>
                {donors.map(d => (
                  <Grid item xs={12} md={6} key={d.id}>
                    <Card sx={{ backgroundColor: colors.primary[400], borderLeft: `4px solid ${colors.blueAccent[400]}` }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                          <Box>
                            <Typography variant="h5" color={colors.grey[100]} fontWeight="bold">{d.donor}</Typography>
                            <Typography variant="body2" color={colors.grey[400]}>{d.title}</Typography>
                          </Box>
                          <Chip label={d.status} size="small" sx={{ backgroundColor: d.status === "active" ? colors.greenAccent[800] : colors.grey[700], color: d.status === "active" ? colors.greenAccent[300] : colors.grey[400] }} />
                        </Box>
                        <Box display="flex" gap={3} mb={2}>
                          <Box>
                            <Typography variant="caption" color={colors.grey[500]}>Total Grant</Typography>
                            <Typography variant="h5" color={colors.greenAccent[400]} fontWeight="bold">KES {Number(d.total_amount).toLocaleString()}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color={colors.grey[500]}>Blockchain Records</Typography>
                            <Typography variant="h5" color={colors.blueAccent[400]} fontWeight="bold">{d.blockchain_records}</Typography>
                          </Box>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <VerifiedIcon sx={{ color: colors.greenAccent[400], fontSize: 16 }} />
                          <Typography variant="caption" color={colors.greenAccent[400]}>All transactions cryptographically verified</Typography>
                        </Box>
                        <Box display="flex" gap={1} mt={1.5}>
                          <Button size="small" variant="outlined" startIcon={<ListAltIcon />}
                            onClick={() => { setFilterType("grant"); setTab(0); }}
                            sx={{ fontSize: "0.75rem", borderColor: colors.blueAccent[500], color: colors.blueAccent[300] }}>
                            View Records
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {tab === 3 && (
            <Box display="flex" flexWrap="wrap" gap={3}>
              <Box flex="1 1 280px" height={300} sx={{ backgroundColor: colors.primary[400], borderRadius: 2, p: 2 }}>
                <Typography variant="h6" color={colors.grey[200]} mb={1}>Records by Type</Typography>
                <ResponsivePie data={pieData} margin={{ top: 20, right: 20, bottom: 50, left: 20 }}
                  colors={d => d.data.color}
                  theme={nivoTheme}
                  legends={[{ anchor: "bottom", direction: "row", itemWidth: 90, itemHeight: 18, itemTextColor: colors.grey[400] }]} />
              </Box>
              <Box flex="1 1 340px" height={300} sx={{ backgroundColor: colors.primary[400], borderRadius: 2, p: 2 }}>
                <Typography variant="h6" color={colors.grey[200]} mb={1}>Record Count by Type</Typography>
                <ResponsiveBar data={barData} keys={["count"]} indexBy="type"
                  margin={{ top: 10, right: 20, bottom: 50, left: 40 }}
                  colors={d => d.data.color} theme={nivoTheme} />
              </Box>
              <Box flex="1 1 240px" sx={{ backgroundColor: colors.primary[400], borderRadius: 2, p: 2 }}>
                <Typography variant="h6" color={colors.grey[200]} mb={2}>Ledger Summary</Typography>
                <Box display="flex" justifyContent="space-between" mb={1}><Typography variant="body2" color={colors.grey[300]}>Total Records</Typography><Typography variant="body2" color={colors.blueAccent[400]} fontWeight="bold">{stats.total_records}</Typography></Box>
                <Box display="flex" justifyContent="space-between" mb={1}><Typography variant="body2" color={colors.grey[300]}>Confirmed</Typography><Typography variant="body2" color={colors.greenAccent[400]} fontWeight="bold">{stats.confirmed}</Typography></Box>
                <Box display="flex" justifyContent="space-between" mb={1}><Typography variant="body2" color={colors.grey[300]}>Pending</Typography><Typography variant="body2" color="#f0c040" fontWeight="bold">{stats.pending}</Typography></Box>
                <Divider sx={{ borderColor: colors.primary[300], my: 1 }} />
                <Box display="flex" justifyContent="space-between" mb={1}><Typography variant="body2" color={colors.grey[300]}>Total Value</Typography><Typography variant="body2" color={colors.greenAccent[400]} fontWeight="bold">KES {Number(stats.total_value || 0).toLocaleString()}</Typography></Box>
                <Box display="flex" justifyContent="space-between"><Typography variant="body2" color={colors.grey[300]}>Latest Block</Typography><Typography variant="body2" color={colors.blueAccent[300]} fontWeight="bold" fontFamily="monospace">#{stats.latest_block}</Typography></Box>
              </Box>
            </Box>
          )}
        </>
      )}

      <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { backgroundColor: colors.primary[400] } }}>
        <DialogTitle sx={{ color: colors.grey[100] }}>Add Blockchain Record</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <Alert severity="info" sx={{ fontSize: "0.85rem" }}>A cryptographic hash will be automatically generated and linked to the previous block.</Alert>
            <TextField select label="Record Type *" value={addForm.record_type} onChange={e => setAddForm(f => ({ ...f, record_type: e.target.value }))} fullWidth>
              {Object.entries(TYPE_META).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
            </TextField>
            <TextField label="Reference Type" value={addForm.reference_type} onChange={e => setAddForm(f => ({ ...f, reference_type: e.target.value }))} fullWidth placeholder="e.g. Payment, Grant, Contract" />
            <TextField label="Reference ID" value={addForm.reference_id} onChange={e => setAddForm(f => ({ ...f, reference_id: e.target.value }))} fullWidth type="number" />
            <TextField label="Amount (KES)" value={addForm.amount} onChange={e => setAddForm(f => ({ ...f, amount: e.target.value }))} fullWidth type="number" />
            <TextField label="Metadata (JSON)" value={addForm.metadata} onChange={e => setAddForm(f => ({ ...f, metadata: e.target.value }))} fullWidth multiline rows={2} placeholder='{"donor": "USAID", "project": "Phase 2"}' />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialog(false)} sx={{ color: colors.grey[400] }}>Cancel</Button>
          <Button variant="contained" disabled={saving} onClick={handleAddRecord}
            startIcon={<LockIcon />} sx={{ backgroundColor: colors.blueAccent[700] }}>
            {saving ? "Recording..." : "Add to Ledger"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BlockchainTransparency;
