// Firebase Messaging Service Worker
// This file MUST be served from the root of your domain

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCExdszDcQzhJHoUvOqVlRwyfqfKkoA3kY",
  authDomain: "webapp-af75d.firebaseapp.com",
  projectId: "webapp-af75d",
  storageBucket: "webapp-af75d.firebasestorage.app",
  messagingSenderId: "52507263282",
  appId: "1:52507263282:web:da4df9b6e02b2d23e8d72b",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message:', payload);

  const { title, body, icon, badge, data } = payload.notification || {};
  const notificationTitle = title || 'Dropee Admin';
  const notificationOptions = {
    body: body || '',
    icon: icon || '/vite.svg',
    badge: badge || '/vite.svg',
    data: data || {},
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open', title: 'Open Dashboard' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  const url = event.notification.data?.url || '/overview';
  event.waitUntil(clients.openWindow(url));
});
