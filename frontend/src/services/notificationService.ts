export interface Notification {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// Mock data for now
const mockNotifications: Notification[] = [
  {
    id: "1",
    message: "Your bill is due tomorrow.",
    read: false,
    createdAt: "2025-09-15T10:00:00Z",
  },
  {
    id: "2",
    message: "Payment received successfully.",
    read: true,
    createdAt: "2025-09-10T14:30:00Z",
  },
];

// Get all notifications
export const getNotifications = async (): Promise<Notification[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockNotifications), 500);
  });
};

export {};
