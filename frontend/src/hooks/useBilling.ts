import { useState, useEffect } from "react";
import { getBillingData } from "../services/billingService";

interface BillingInfo {
  id: string;
  amount: number;
  dueDate: string;
}

export const useBilling = () => {
  const [billing, setBilling] = useState<BillingInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        const data = await getBillingData();
        setBilling(data);
      } catch (err) {
        setError("Failed to fetch billing data");
      } finally {
        setLoading(false);
      }
    };

    fetchBilling();
  }, []);

  return { billing, loading, error };
};

// 👇 ensures it's treated as a module under --isolatedModules
export {};
