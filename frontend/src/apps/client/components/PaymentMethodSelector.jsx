import { useState } from 'react';
import { Box, Button, Typography, RadioGroup, FormControlLabel, Radio, TextField } from '@mui/material';
import { PaymentOutlined, PhoneAndroid, CreditCard } from '@mui/icons-material';

const PaymentMethodSelector = ({ invoice, onPaymentInitiated }) => {
  const [method, setMethod] = useState('mpesa');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          invoice_id: invoice.id,
          payment_method: method,
          phone: phone // for mpesa/airtel
        })
      });

      const data = await response.json();

      if (data.success) {
        if (data.payment_link) {
          // Flutterwave card payment — redirect to hosted page
          window.location.href = data.payment_link;
        } else {
          // M-Pesa/Airtel — show confirmation
          onPaymentInitiated(data);
        }
      } else {
        alert(data.message || 'Payment failed');
      }
    } catch (error) {
      alert('Payment error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Select Payment Method</Typography>

      <RadioGroup value={method} onChange={(e) => setMethod(e.target.value)}>
        <FormControlLabel
          value="mpesa"
          control={<Radio />}
          label={<Box display="flex" alignItems="center"><PhoneAndroid sx={{ mr: 1 }} /> M-Pesa</Box>}
        />
        <FormControlLabel
          value="airtel_money"
          control={<Radio />}
          label={<Box display="flex" alignItems="center"><PhoneAndroid sx={{ mr: 1 }} /> Airtel Money</Box>}
        />
        <FormControlLabel
          value="card"
          control={<Radio />}
          label={<Box display="flex" alignItems="center"><CreditCard sx={{ mr: 1 }} /> Card/Bank</Box>}
        />
      </RadioGroup>

      {(method === 'mpesa' || method === 'airtel_money') && (
        <TextField
          label="Phone Number"
          placeholder="07XX XXX XXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          fullWidth
          sx={{ mt: 2 }}
        />
      )}

      <Button
        variant="contained"
        color="primary"
        startIcon={<PaymentOutlined />}
        onClick={handlePay}
        disabled={loading || (method !== 'card' && !phone)}
        fullWidth
        sx={{ mt: 3 }}
      >
        {loading ? 'Processing...' : `Pay KES ${invoice.total_amount}`}
      </Button>
    </Box>
  );
};

export default PaymentMethodSelector;
