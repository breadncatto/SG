importScripts("https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyDAEwzLfhTWqs2PDVtlWMC2hhHmvHgrZ2g",
  authDomain: "mp252-ba91e.firebaseapp.com",
  databaseURL: "https://mp252-ba91e-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "mp252-ba91e",
  storageBucket: "mp252-ba91e.firebasestorage.app",
  messagingSenderId: "522768269195",
  appId: "1:522768269195:web:a9ae0edf9ed77925cd398e"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Received background push notification:", payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png' 
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});