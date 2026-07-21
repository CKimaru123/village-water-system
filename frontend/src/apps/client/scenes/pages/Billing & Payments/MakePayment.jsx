import React, { useState, useEffect, useRef } from "react";
import {
  Box, Typography, Card, CardContent, Grid, Button, TextField,
  CircularProgress, Alert, Divider, Chip, RadioGroup, FormControlLabel,
  Radio, FormControl, FormLabel, Stepper, Step, StepLabel,
} from "@mui/material";
import { tokens } from "../../../theme";
import PaymentIcon from "@mui/icons-material/Payment";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../../utils/api";

const METHODS = [
  { value: "mpesa",         label: "M-Pesa",       desc: "Enter your M-Pesa PIN on your phone",         icon: <PhoneAndroidIcon /> },
  { value: "airtel_money",  label: "Airtel Money",  desc: "Enter your Airtel Money PIN on your phone",   icon: <PhoneAndroidIcon /> },
  { value: "card",          label: "Card / Bank",   desc: "Pay via debit/credit card or bank transfer",  icon: <CreditCardIcon /> },
  { value: "cash",          label: "Cash",          desc: "Record cash payment (admin confirms)",         icon: <AccountBalanceIcon /> },
];

const STEPS = ["Select Method", "Confirm & Pay", "Done"];

const MakePayment = () => {
  const colors    = tokens("dark");
  const navigate  = useNavigate();
  const location  = useLocation();
  const passedInvoice = location.state?.invoice || null;

  const [invoice,    setInvoice]    = useState(passedInvoice);
  const [method,     setMethod]     = useState("mpesa");
  const [phone,      setPhone]      = useState("");
  const [reference,  setReference]  = useState("");
  const [amount,     setAmount]     = useState(passedInvoice?.total_amount || "");
  const [loading,    setLoading]    = useState(!passedInvoice);
  const [submitting, setSubmitting] = useState(false);
  const [step,       setStep]       = useState(0);
  const [result,     setResult]     = useState(null);
  const [error,      setError]      = useState(null);
  const [isDemo,     setIsDemo]     = useState(false);
  const [waitingPin, setWaitingPin] = useState(false);
  const wsRef = useRef(null);

  // Fetch current invoice if not passed
  useEffect(() => {
    if (!passedInvoice) {
      api.get("/client/current_bill")
        .then(res => {
          const inv = res?.data?.invoice || null;
          const demo = res?.demo === true || res?.data?.demo === true;
          setInvoice(inv);
          setIsDemo(demo);
          setAmount(inv?.total_amount || "");
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, []);

  // Pre-fill phone from user profile
  useEffect(() => {
    api.get("/auth/me")
      .then(res => {
        const p = res?.data?.data?.user?.phone || res?.data?.user?.phone || "";
        if (p) setPhone(p);
      })
      .catch(() => {});
  }, []);

  // WebSocket — listen for payment_confirmed event
  const listenForConfirmation = () => {
    const token = localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    if (!token) return;
    try {
      // const ws = new WebSocket(`ws://localhost:3001/cable?token=${token}`);
      const cableBaseUrl = process.env.REACT_APP_CABLE_URL || 'ws://localhost:3001/cable';
      const ws = new WebSocket(`${cableBaseUrl}?token=${token}`);
      wsRef.current = ws;
      ws.onopen = () => {
        ws.send(JSON.stringify({ command: "subscribe", identifier: JSON.stringify({ channel: "MeterReadingsChannel" }) }));
      };
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.message?.event === "payment_confirmed") {
            const p = msg.message.payment;
            setResult({ success: true, amount: p.amount, reference: p.reference, method: "M-Pesa" });
            setWaitingPin(false);
            setStep(2);
            ws.close();
          }
        } catch (_) {}
      };
      ws.onerror = () => {};
    } catch (_) {}
  };

  const handleSubmit = async () => {
    if (!invoice) return setError("No invoice to pay.");
    if (isDemo) return setError("This is a demo bill — no real invoice has been generated yet. Ask your admin to generate your invoice first.");
    if (Number(amount) <= 0) return setError("Enter a valid amount.");
    if ((method === "mpesa" || method === "airtel_money") && !phone) return setError("Phone number is required.");

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        invoice_id:     invoice.id,
        amount:         Number(amount),
        payment_method: method,
        ...(phone && { phone_number: phone }),
        ...(reference && { transaction_reference: reference }),
      };

      const res = await api.post("/payments", payload);
      const data = res?.data || res;

      if (method === "mpesa" || method === "airtel_money") {
        // STK push sent — wait for PIN confirmation
        setWaitingPin(true);
        setStep(2);
        listenForConfirmation();
        setResult({ waiting: true, message: data?.message || "PIN request sent to your phone." });
      } else if (method === "card") {
        // Redirect to Flutterwave hosted page
        const link = data?.payment_link;
        if (link) {
          window.open(link, "_blank");
          setResult({ redirect: true, message: "Payment page opened in a new tab. Come back here once done." });
          setStep(2);
        } else {
          setResult({ success: true, ...data });
          setStep(2);
        }
      } else {
        // Cash / cheque — immediate
        setResult({ success: true, amount, method, reference: data?.payment?.transaction_reference });
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = n => `KES ${Number(n || 0).toLocaleString()}`;

  if (loading) return (
    <Box m="20px" display="flex" justifyContent="center" alignItems="center" minHeight="400px">
      <CircularProgress sx={{ color: colors.blueAccent[500] }} />
    </Box>
  );

  return (
    <Box m="20px">
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <PaymentIcon sx={{ color: colors.blueAccent[400], fontSize: 32 }} />
        <Typography variant="h2" color={colors.grey[100]} fontWeight="bold">Make Payment</Typography>
      </Box>

      <Stepper activeStep={step} sx={{ mb: 4 }}>
        {STEPS.map(s => (
          <Step key={s}><StepLabel sx={{ "& .MuiStepLabel-label": { color: colors.grey[300] } }}>{s}</StepLabel></Step>
        ))}
      </Stepper>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {step < 2 && (
        <Grid container spacing={3}>
          {/* Invoice summary */}
          {invoice && (
            <Grid item xs={12} md={4}>
              <Card sx={{ backgroundColor: colors.primary[400] }}>
                <CardContent>
                  <Typography variant="h5" color={colors.grey[100]} mb={2}>Invoice</Typography>
                  {isDemo && (
                    <Alert severity="warning" sx={{ mb: 2, py: 0.5 }}>
                      Demo bill — no real invoice generated yet. Payment is disabled until admin generates your invoice.
                    </Alert>
                  )}
                  <Typography color={colors.grey[300]}>#{invoice.invoice_number}</Typography>
                  <Typography color={colors.grey[300]}>Period: {invoice.billing_period}</Typography>
                  <Typography color={colors.grey[300]}>Due: {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "—"}</Typography>
                  <Divider sx={{ borderColor: colors.grey[700], my: 2 }} />
                  <Typography variant="h4" color={colors.greenAccent[400]} fontWeight="bold">{fmt(invoice.total_amount)}</Typography>
                  {invoice.days_overdue > 0 && (
                    <Chip label={`${invoice.days_overdue} days overdue`} size="small"
                      sx={{ mt: 1, backgroundColor: colors.redAccent[500], color: "#fff" }} />
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Payment form */}
          <Grid item xs={12} md={invoice ? 8 : 12}>
            <Card sx={{ backgroundColor: colors.primary[400] }}>
              <CardContent>
                {/* Method selection */}
                {step === 0 && (
                  <>
                    <Typography variant="h5" color={colors.grey[100]} mb={2}>Choose Payment Method</Typography>
                    <Grid container spacing={2} mb={3}>
                      {METHODS.map(m => (
                        <Grid item xs={12} sm={6} key={m.value}>
                          <Card
                            onClick={() => setMethod(m.value)}
                            sx={{
                              backgroundColor: method === m.value ? colors.blueAccent[800] : colors.primary[500],
                              border: `2px solid ${method === m.value ? colors.blueAccent[400] : colors.grey[700]}`,
                              cursor: "pointer", transition: "all 0.15s",
                              "&:hover": { borderColor: colors.blueAccent[400] }
                            }}>
                            <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Box sx={{ color: method === m.value ? colors.blueAccent[300] : colors.grey[400] }}>{m.icon}</Box>
                                <Box>
                                  <Typography color={colors.grey[100]} fontWeight="bold">{m.label}</Typography>
                                  <Typography variant="caption" color={colors.grey[400]}>{m.desc}</Typography>
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                    <Button variant="contained" onClick={() => setStep(1)} fullWidth
                      sx={{ backgroundColor: colors.blueAccent[600] }}>
                      Continue →
                    </Button>
                  </>
                )}

                {/* Confirm details */}
                {step === 1 && (
                  <>
                    <Typography variant="h5" color={colors.grey[100]} mb={2}>
                      {METHODS.find(m => m.value === method)?.label} — Confirm Details
                    </Typography>

                    <TextField fullWidth label="Amount (KES)" type="number" value={amount}
                      onChange={e => setAmount(e.target.value)} sx={{ mb: 2 }}
                      InputProps={{ sx: { color: colors.grey[100] } }}
                      InputLabelProps={{ sx: { color: colors.grey[300] } }} />

                    {(method === "mpesa" || method === "airtel_money") && (
                      <TextField fullWidth label="Phone Number (e.g. 0712345678)" value={phone}
                        onChange={e => setPhone(e.target.value)} sx={{ mb: 2 }}
                        helperText="A PIN prompt will be sent to this number"
                        InputProps={{ sx: { color: colors.grey[100] } }}
                        InputLabelProps={{ sx: { color: colors.grey[300] } }} />
                    )}

                    {(method === "cash" || method === "bank_transfer") && (
                      <TextField fullWidth label="Transaction Reference (optional)" value={reference}
                        onChange={e => setReference(e.target.value)} sx={{ mb: 2 }}
                        InputProps={{ sx: { color: colors.grey[100] } }}
                        InputLabelProps={{ sx: { color: colors.grey[300] } }} />
                    )}

                    {method === "card" && (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        You will be redirected to a secure Flutterwave payment page to enter your card details.
                      </Alert>
                    )}

                    <Box display="flex" gap={2}>
                      <Button variant="outlined" onClick={() => setStep(0)} sx={{ color: colors.grey[300], borderColor: colors.grey[600] }}>
                        Back
                      </Button>
                      <Button variant="contained" fullWidth disabled={submitting || isDemo}
                        startIcon={submitting ? <CircularProgress size={18} /> : <PaymentIcon />}
                        sx={{ backgroundColor: colors.greenAccent[600], "&:hover": { backgroundColor: colors.greenAccent[700] } }}
                        onClick={handleSubmit}>
                        {submitting ? "Processing..." : isDemo ? "Demo — Payment Disabled" : `Pay ${amount ? fmt(amount) : ""}`}
                      </Button>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Result step */}
      {step === 2 && result && (
        <Card sx={{ backgroundColor: colors.primary[400], maxWidth: 520, mx: "auto", mt: 4 }}>
          <CardContent sx={{ textAlign: "center", py: 4 }}>
            {result.waiting ? (
              <>
                <HourglassTopIcon sx={{ fontSize: 64, color: colors.blueAccent[400], mb: 2 }} />
                <Typography variant="h3" color={colors.grey[100]} mb={1}>Waiting for PIN</Typography>
                <Typography color={colors.grey[300]} mb={3}>{result.message}</Typography>
                <CircularProgress size={28} sx={{ color: colors.blueAccent[400] }} />
                <Typography variant="caption" color={colors.grey[500]} display="block" mt={2}>
                  Enter your {method === "mpesa" ? "M-Pesa" : "Airtel Money"} PIN on your phone to complete payment.
                </Typography>
              </>
            ) : result.redirect ? (
              <>
                <CheckCircleIcon sx={{ fontSize: 64, color: colors.blueAccent[400], mb: 2 }} />
                <Typography variant="h3" color={colors.grey[100]} mb={1}>Payment Page Opened</Typography>
                <Typography color={colors.grey[300]} mb={3}>{result.message}</Typography>
              </>
            ) : (
              <>
                <CheckCircleIcon sx={{ fontSize: 64, color: colors.greenAccent[400], mb: 2 }} />
                <Typography variant="h3" color={colors.grey[100]} mb={1}>Payment Recorded</Typography>
                <Typography color={colors.grey[300]}>Amount: {fmt(result.amount)}</Typography>
                {result.reference && <Typography color={colors.grey[300]}>Ref: {result.reference}</Typography>}
              </>
            )}
            <Box display="flex" gap={2} justifyContent="center" mt={3}>
              <Button variant="contained" sx={{ backgroundColor: colors.blueAccent[500] }}
                onClick={() => navigate("../payment-history")}>
                View History
              </Button>
              <Button variant="outlined" sx={{ color: colors.grey[300], borderColor: colors.grey[500] }}
                onClick={() => navigate("../current-bill")}>
                Back to Bill
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default MakePayment;
