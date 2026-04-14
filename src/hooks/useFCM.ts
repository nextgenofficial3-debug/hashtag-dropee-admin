import { useCallback, useEffect, useRef, useState } from "react";
import { app, getMessaging, getToken, onMessage, isSupported } from "@/lib/firebase";
import { supabase } from "@/integrations/supabase/client";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string;
const APP_NAME = "admin";

export function useFCM() {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isReady, setIsReady] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setPermission(Notification.permission);
  }, []);

  /** Save FCM token to Supabase for this user/device */
  const saveToken = useCallback(async (token: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("fcm_tokens").upsert(
      { user_id: user.id, token, app: APP_NAME, updated_at: new Date().toISOString() },
      { onConflict: "token" }
    );
  }, []);

  /** Request permission + get FCM registration token */
  const requestPermission = useCallback(async () => {
    const supported = await isSupported();
    if (!supported) {
      console.warn("FCM not supported in this browser");
      return null;
    }

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") return null;

      // Register the firebase messaging service worker
      const swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

      const messaging = getMessaging(app);
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: swReg,
      });

      if (token) {
        setFcmToken(token);
        setIsReady(true);
        await saveToken(token);

        // Listen for foreground messages
        unsubscribeRef.current = onMessage(messaging, (payload) => {
          const { title, body } = payload.notification || {};
          if (title && "Notification" in window && Notification.permission === "granted") {
            new Notification(title, {
              body: body || "",
              icon: "/vite.svg",
            });
          }
        });
      }

      return token;
    } catch (err) {
      console.error("FCM error:", err);
      return null;
    }
  }, [saveToken]);

  /** Remove token from Supabase on sign-out */
  const removeToken = useCallback(async () => {
    if (fcmToken) {
      await supabase.from("fcm_tokens").delete().eq("token", fcmToken);
      setFcmToken(null);
      setIsReady(false);
    }
    unsubscribeRef.current?.();
  }, [fcmToken]);

  // Auto-initialize if permission was already granted
  useEffect(() => {
    if (Notification.permission === "granted") {
      requestPermission();
    }
    return () => { unsubscribeRef.current?.(); };
  }, []);

  return { fcmToken, permission, isReady, requestPermission, removeToken };
}
