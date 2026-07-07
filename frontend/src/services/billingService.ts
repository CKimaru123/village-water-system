import axios from "axios";

export interface BillingInfo {
  id: string;
  amount: number;
  dueDate: string;
}

// Base URL for your backend API (replace with your real endpoint)
const API_URL = "http://localhost:5000/api/billing";

// ✅ Fetch all billing data
export const getBillingData = async (): Promise<BillingInfo[]> => {
  const response = await axios.get<BillingInfo[]>(API_URL);
  return response.data;
};

// ✅ Fetch a single bill by ID
export const getBillById = async (id: string): Promise<BillingInfo> => {
  const response = await axios.get<BillingInfo>(`${API_URL}/${id}`);
  return response.data;
};

// ✅ Create a new bill
export const createBill = async (bill: Omit<BillingInfo, "id">): Promise<BillingInfo> => {
  const response = await axios.post<BillingInfo>(API_URL, bill);
  return response.data;
};

// ✅ Update a bill
export const updateBill = async (id: string, updates: Partial<BillingInfo>): Promise<BillingInfo> => {
  const response = await axios.put<BillingInfo>(`${API_URL}/${id}`, updates);
  return response.data;
};

// ✅ Delete a bill
export const deleteBill = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`);
};

// 👇 ensures TypeScript treats this file as a module under --isolatedModules
export {};
