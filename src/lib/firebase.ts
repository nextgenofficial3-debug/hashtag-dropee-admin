import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyCExdszDcQzhJHoUvOqVlRwyfqfKkoA3kY",
  authDomain: "webapp-af75d.firebaseapp.com",
  projectId: "webapp-af75d",
  storageBucket: "webapp-af75d.firebasestorage.app",
  messagingSenderId: "52507263282",
  appId: "1:52507263282:web:da4df9b6e02b2d23e8d72b",
  measurementId: "G-B205PFD37F",
};

// Avoid duplicate initialization in hot-reload / SSR environments
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export { app, getMessaging, getToken, onMessage, isSupported };
