import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "./firebase";

const VAPID_KEY = "BIsfJGDgqWTSE8nG2WIlRbS5kuPEDluKJkUMuYtREPadi7XkgIGKZu2kkziM2OepEKUBfWPCPypZ6Q8PulOguxc";

export const getDeviceId = () => {
  if (typeof window === "undefined") return null;
  
  let deviceId = localStorage.getItem("smart_garden_device_id");
  if (!deviceId) {
    deviceId = crypto.randomUUID ? crypto.randomUUID() : `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem("smart_garden_device_id", deviceId);
  }
  return deviceId;
};

export const requestPushNotificationPermission = async () => {
  try {
    if (typeof window === "undefined" || !("Notification" in window)) return null;
    
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const msg = await messaging();
    if (!msg) return null;

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    await navigator.serviceWorker.ready;

    const token = await getToken(msg, { 
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration 
    });
    
    console.log("FCM token:", token);
    return token;
  } catch (error) {
    console.error("Failed to retrieve FCM Token:", error);
    return null;
  }
};

let isListenerAttached = false;

export const setupForegroundMessageListener = async (onNewMessage?: () => void) => {
  if (isListenerAttached) return;

  try {
    const msg = await messaging();
    if (!msg) return;

    onMessage(msg, (payload) => {
      console.log("Message received:", payload);
      
      if (Notification.permission === "granted") {
        new Notification(payload.notification?.title || "New device's alert", {
          body: payload.notification?.body || "New device's event!",
          icon: "/logo.png"
        });
      }

      if (onNewMessage) {
        onNewMessage();
      }
    });

    isListenerAttached = true;
    console.log("Foreground test!");
  } catch (err) {
    console.log("Err Foreground listener:", err);
  }
};