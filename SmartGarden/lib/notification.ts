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

export const setupForegroundMessageListener = async () => {
  if (isListenerAttached) return;
  isListenerAttached = true; 

  try {
    const msg = await messaging();
    if (!msg) {
      isListenerAttached = false; 
      return;
    }

    onMessage(msg, (payload) => {
      console.log("Foreground message:", payload);
      if (Notification.permission === "granted") {
        new Notification(payload.notification?.title || "Alert noti", {
          body: payload.notification?.body || "New event!",
          icon: "/logo.png",
        });
      }
    });

    console.log("Foreground activated!");
  } catch (err) {
    isListenerAttached = false; 
    console.log("Err Foreground listener:", err);
  }
};