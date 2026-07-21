import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../hooks/useAuth";

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';
const NotificationsContext = createContext(undefined);

// ── Quiet hours check ─────────────────────────────────────────────────────────
// Returns true if current local time falls within the quiet window
function isQuietHours(prefs) {
  if (!prefs?.quiet_hours_enabled) return false;
  const from = prefs.quiet_hours_from || "22:00";
  const to   = prefs.quiet_hours_to   || "07:00";
  const now  = new Date();
  const [fh, fm] = from.split(":").map(Number);
  const [th, tm] = to.split(":").map(Number);
  const cur  = now.getHours() * 60 + now.getMinutes();
  const fMin = fh * 60 + fm;
  const tMin = th * 60 + tm;
  // Handle overnight window (e.g. 22:00 → 07:00)
  if (fMin > tMin) return cur >= fMin || cur < tMin;
  return cur >= fMin && cur < tMin;
}

export const NotificationsProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState({});
  const [prefsLoading, setPrefsLoading] = useState(false);
  const cableRef = useRef(null);
  const subRef   = useRef(null);
  const audioRef = useRef(null);   // cached Audio instance
  const prefsRef = useRef({});     // always-current prefs for use inside callbacks

  // Keep prefsRef in sync with state
  useEffect(() => { prefsRef.current = preferences; }, [preferences]);

  const headers = useCallback(() => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  }, []);

  // ── Sound playback ────────────────────────────────────────────────────────
  const playSound = useCallback(() => {
    const soundEnabled = localStorage.getItem("notif_sound") !== "false";
    if (!soundEnabled) return;
    if (isQuietHours(prefsRef.current)) return;
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio("/assets/notification.wav");
        audioRef.current.volume = 0.6;
      }
      // Reset and play
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Autoplay blocked — silently ignore (browser policy)
      });
    } catch (e) {
      console.warn("Notification sound error:", e);
    }
  }, []);

  // ── Fetch all notifications ───────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      console.debug("[NotificationsContext] Fetching notifications for user", user.id);
      setLoading(true);
      const res = await fetch(`${BASE_URL}/notifications`, { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        console.debug("[NotificationsContext] fetchNotifications response", data);
        if (data.success) {
          setNotifications(data.data.notifications || []);
          setUnreadCount(data.data.unread_count ?? 0);
        }
      }
    } catch (e) {
      console.error("fetchNotifications:", e);
    } finally {
      setLoading(false);
    }
  }, [user, headers]);

  // ── Mark single as read ───────────────────────────────────────────────────
  const markAsRead = useCallback(async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/notifications/${id}/mark_read`, {
        method: "PATCH", headers: headers(),
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, read: true, read_at: new Date().toISOString() } : n)
        );
        setUnreadCount(data.data?.unread_count ?? 0);
      }
    } catch (e) { console.error("markAsRead:", e); }
  }, [headers]);

  // ── Mark all as read ──────────────────────────────────────────────────────
  const markAllAsRead = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/notifications/mark_all_read`, {
        method: "PATCH", headers: headers(),
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() })));
        setUnreadCount(0);
      }
    } catch (e) { console.error("markAllAsRead:", e); }
  }, [headers]);

  // ── Delete notification ───────────────────────────────────────────────────
  const deleteNotification = useCallback(async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/notifications/${id}`, {
        method: "DELETE", headers: headers(),
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(prev => prev.filter(n => n.id !== id));
        setUnreadCount(data.data?.unread_count ?? 0);
      }
    } catch (e) { console.error("deleteNotification:", e); }
  }, [headers]);

  // ── Add incoming real-time notification (dedup + sound + quiet hours) ─────
  const addNotification = useCallback((notif) => {
    console.debug("[NotificationsContext] addNotification", notif);
    setNotifications(prev => {
      if (prev.some(n => n.id === notif.id)) return prev;
      setUnreadCount(c => c + 1);
      // Play sound only if not in quiet hours and sound is enabled
      if (!isQuietHours(prefsRef.current)) {
        playSound();
      }
      return [notif, ...prev];
    });
  }, [playSound]);

  // ── Fetch preferences ─────────────────────────────────────────────────────
  const fetchPreferences = useCallback(async () => {
    if (!user) return;
    try {
      setPrefsLoading(true);
      const res = await fetch(`${BASE_URL}/client/notification_preferences`, { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        const loaded = data.data?.preferences || data.preferences || {};
        setPreferences(loaded);
        prefsRef.current = loaded;
      }
    } catch (e) { console.error("fetchPreferences:", e); }
    finally { setPrefsLoading(false); }
  }, [user, headers]);

  // ── Save preferences ──────────────────────────────────────────────────────
  const savePreferences = useCallback(async (prefs) => {
    const res = await fetch(`${BASE_URL}/client/notification_preferences`, {
      method: "PATCH", headers: headers(),
      body: JSON.stringify({ preferences: prefs }),
    });
    if (!res.ok) throw new Error("Failed to save preferences");
    setPreferences(prefs);
    prefsRef.current = prefs;
  }, [headers]);

  // ── WebSocket (ActionCable) ───────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    import("@rails/actioncable").then(({ createConsumer }) => {
      // 1. Define the base URL (falls back to your deployed Render URL if .env is missing)
      const cableBaseUrl = process.env.REACT_APP_CABLE_URL || 'wss://village-water-system-backend.onrender.com/cable';

      // 2. Create the consumer, appending the token for authentication
      const cable = createConsumer(`${cableBaseUrl}?token=${token}`);

      // 3. Keep your existing ref assignment exactly as it was
      cableRef.current = cable;

      const sub = cable.subscriptions.create(
        { channel: "ProfileUpdatesChannel", client_id: user.id },
        {
          received(data) {
            console.debug("[NotificationsContext] ActionCable received", data);
            if (data.notification) {
              if (data.type === "new_notification" && data.user_id === user.id) {
                console.debug("[NotificationsContext] New notification for user", user.id, data.notification);
                addNotification(data.notification);
              } else if (data.type === "profile_update" || data.type === "admin_profile_update") {
                console.debug("[NotificationsContext] Profile update notification", data.notification);
                addNotification(data.notification);
              }
            }
          },
        }
      );
      subRef.current = sub;
    }).catch(console.error);

    return () => {
      subRef.current?.unsubscribe();
      cableRef.current?.disconnect();
    };
  }, [user, addNotification]);

  // ── Load on mount / user change ───────────────────────────────────────────
  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchPreferences();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <NotificationsContext.Provider value={{
      notifications, unreadCount, loading,
      preferences, prefsLoading,
      fetchNotifications, markAsRead, markAllAsRead, deleteNotification,
      fetchPreferences, savePreferences, playSound, isQuietHours,
    }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotificationsContext = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotificationsContext must be used inside NotificationsProvider");
  return ctx;
};

export default NotificationsContext;
