import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import useRealTimeUpdates from './useRealTimeUpdates';

const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Real-time notification handlers
  const handleProfileUpdate = useCallback((data) => {
    if (data.notification) {
      // Check if notification already exists (prevent duplicates)
      setNotifications(prev => {
        const exists = prev.some(n => n.id === data.notification.id);
        if (exists) {
          console.log('Duplicate notification prevented (profile_update):', data.notification.id);
          return prev;
        }
        console.log('Adding new notification (profile_update):', data.notification.id);
        // Only increment unread count when actually adding a new notification
        setUnreadCount(count => count + 1);
        return [data.notification, ...prev];
      });
    }
  }, []);

  const handleNewNotification = useCallback((data) => {
    if (data.notification && data.user_id === user?.id) {
      // Check if notification already exists (prevent duplicates)
      setNotifications(prev => {
        const exists = prev.some(n => n.id === data.notification.id);
        if (exists) {
          console.log('Duplicate notification prevented (new_notification):', data.notification.id);
          return prev;
        }
        console.log('Adding new notification (new_notification):', data.notification.id);
        // Only increment unread count when actually adding a new notification
        setUnreadCount(count => count + 1);
        return [data.notification, ...prev];
      });
    }
  }, [user?.id]);

  const handleAdminProfileUpdate = useCallback((data) => {
    if (data.notification && (user?.role === 'admin' || user?.role === 'super_admin')) {
      // Check if notification already exists (prevent duplicates)
      setNotifications(prev => {
        const exists = prev.some(n => n.id === data.notification.id);
        if (exists) {
          console.log('Duplicate notification prevented (admin_profile_update):', data.notification.id);
          return prev;
        }
        console.log('Adding new notification (admin_profile_update):', data.notification.id);
        // Only increment unread count when actually adding a new notification
        setUnreadCount(count => count + 1);
        return [data.notification, ...prev];
      });
    }
  }, [user?.role]);

  // Set up real-time updates with notification handlers
  useRealTimeUpdates(
    handleProfileUpdate, 
    null, // audit log handler not needed here
    user?.id,
    {
      onNewNotification: handleNewNotification,
      onAdminProfileUpdate: handleAdminProfileUpdate
    }
  );

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${BASE_URL}/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setNotifications(result.data.notifications);
          setUnreadCount(result.data.unread_count);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem('token');
      const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${BASE_URL}/notifications/unread_count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setUnreadCount(result.data.unread_count);
        }
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [user]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    if (!user) return;

    try {
      const token = localStorage.getItem('token');
      const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${BASE_URL}/notifications/${notificationId}/mark_read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Update local state
          setNotifications(prev => 
            prev.map(notification => 
              notification.id === notificationId 
                ? { ...notification, read: true, read_at: new Date().toISOString() }
                : notification
            )
          );
          setUnreadCount(result.data.unread_count);
        }
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [user]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem('token');
      const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${BASE_URL}/notifications/mark_all_read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Update local state
          setNotifications(prev => 
            prev.map(notification => ({ 
              ...notification, 
              read: true, 
              read_at: new Date().toISOString() 
            }))
          );
          setUnreadCount(0);
        }
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [user]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    if (!user) return;

    try {
      const token = localStorage.getItem('token');
      const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${BASE_URL}/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Update local state
          setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
          setUnreadCount(result.data.unread_count);
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [user]);

  // Load notifications on mount and user change
  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
    }
  }, [user, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };
};

export default useNotifications;