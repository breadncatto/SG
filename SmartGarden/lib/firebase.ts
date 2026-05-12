import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDAEwzLfhTWqs2PDVtlWMC2hhHmvHgrZ2g",
  authDomain: "mp252-ba91e.firebaseapp.com",
  databaseURL: "https://mp252-ba91e-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "mp252-ba91e",
  storageBucket: "mp252-ba91e.firebasestorage.app",
  messagingSenderId: "522768269195",
  appId: "1:522768269195:web:a9ae0edf9ed77925cd398e",
  measurementId: "G-5KNGHHVZ15"
};

const app = initializeApp(firebaseConfig);

export const rtdb = getDatabase(app);

export const messaging = async () => {
  const supported = await isSupported();
  return supported ? getMessaging(app) : null;
};