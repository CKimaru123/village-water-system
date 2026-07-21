import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';

const useRealTimeUpdates = (onProfileUpdate, onAuditLogUpdate, clientId = null, additionalHandlers = {}) => {
  const { user } = useAuth();
  const cableRef = useRef(null);
  const subscriptionRef = useRef(null);

  useEffect(() => {
    console.log('=== REAL-TIME UPDATES HOOK ===');
    console.log('User:', user);
    console.log('Client ID:', clientId);
    
    if (!user) {
      console.log('No user, skipping WebSocket connection');
      return;
    }

    // Create ActionCable connection
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, skipping WebSocket connection');
      return;
    }

    console.log('Attempting to connect to WebSocket...');

    // Import ActionCable dynamically
    import('@rails/actioncable').then(({ createConsumer }) => {
      console.log('ActionCable loaded, creating consumer...');
      
      // Create WebSocket connection with authentication
      // const wsUrl = `ws://localhost:3001/cable?token=${token}`;
      const cableBaseUrl = process.env.REACT_APP_CABLE_URL || 'wss://village-water-system-backend.onrender.com/cable';
      const wsUrl = `${cableBaseUrl}?token=${token}`; 
      console.log('WebSocket URL:', wsUrl);
      
      const cable = createConsumer(wsUrl);
      cableRef.current = cable;

      // Subscribe to profile updates channel
      const subscription = cable.subscriptions.create(
        {
          channel: 'ProfileUpdatesChannel',
          client_id: clientId
        },
        {
          connected() {
            console.log('✅ Connected to ProfileUpdatesChannel');
          },

          disconnected() {
            console.log('❌ Disconnected from ProfileUpdatesChannel');
          },

          received(data) {
            console.log('📨 Received real-time update:', data);
            
            switch (data.type) {
              case 'profile_update':
                console.log('Processing profile update:', data);
                if (onProfileUpdate) {
                  onProfileUpdate(data);
                }
                break;
              case 'audit_log_update':
                console.log('Processing audit log update:', data);
                if (onAuditLogUpdate) {
                  onAuditLogUpdate(data);
                }
                break;
              case 'new_notification':
                console.log('Processing new notification:', data);
                if (additionalHandlers.onNewNotification) {
                  additionalHandlers.onNewNotification(data);
                }
                break;
              case 'admin_profile_update':
                console.log('Processing admin profile update:', data);
                if (additionalHandlers.onAdminProfileUpdate) {
                  additionalHandlers.onAdminProfileUpdate(data);
                }
                break;
              default:
                console.log('Unknown update type:', data.type);
            }
          },

          error(error) {
            console.error('❌ WebSocket error:', error);
          }
        }
      );

      subscriptionRef.current = subscription;

      // If admin and clientId is provided, subscribe to specific client updates
      if ((user.role === 'admin' || user.role === 'super_admin') && clientId) {
        console.log(`Admin subscribing to client ${clientId} updates`);
        subscription.perform('subscribe_to_client', { client_id: clientId });
      }
    }).catch(error => {
      console.error('❌ Failed to load ActionCable:', error);
    });

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up WebSocket connections...');
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
      if (cableRef.current) {
        cableRef.current.disconnect();
      }
    };
  }, [user, clientId, onProfileUpdate, onAuditLogUpdate, additionalHandlers]);

  return {
    isConnected: cableRef.current?.connection?.isOpen() || false
  };
};

export default useRealTimeUpdates;