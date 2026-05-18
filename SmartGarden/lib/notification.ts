import { getToken } from "firebase/messaging";
import { messaging } from "./firebase";
import { onMessage } from "firebase/messaging";

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
    if (typeof window !== "undefined" && "Notification" in window) {
      const permission = await Notification.requestPermission();
      
      if (permission === "granted") {
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
      }
    }
    return null;
  } catch (error) {
    console.error("Failed to retrieve FCM Token:", error);
    return null;
  }
};

export const setupForegroundMessageListener = async () => {
  try {
    const msg = await messaging();
    if (!msg) return;

    onMessage(msg, (payload) => {
      console.log("Foreground notification received:", payload);
      alert(`CẢNH BÁO TỪ IOT:\n${payload.notification?.title}\n${payload.notification?.body}`);
    });
  } catch (err) {
    console.log("Lỗi cài đặt Foreground listener:", err);
  }
};