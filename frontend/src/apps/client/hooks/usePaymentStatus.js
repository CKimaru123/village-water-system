import { useState, useEffect, useRef } from 'react';

const usePaymentStatus = (checkoutRequestId) => {
  const [status, setStatus] = useState('pending');
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!checkoutRequestId) return;

    // Poll every 3 seconds for up to 2 minutes
    let attempts = 0;
    intervalRef.current = setInterval(async () => {
      attempts++;

      if (attempts > 40) {
        clearInterval(intervalRef.current);
        setStatus('timeout');
        return;
      }

      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/payments/status?checkout_request_id=${checkoutRequestId}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        const data = await response.json();

        if (data.status === 'completed') {
          setStatus('completed');
          clearInterval(intervalRef.current);
        } else if (data.status === 'failed') {
          setStatus('failed');
          clearInterval(intervalRef.current);
        }
      } catch (error) {
        console.error('Payment status check failed:', error);
      }
    }, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [checkoutRequestId]);

  return status;
};

export default usePaymentStatus;
