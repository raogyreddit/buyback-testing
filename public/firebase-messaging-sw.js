importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyA4UCMLGDYoXNJvJ8TOOU9HX6GsRYFYuLw",
  authDomain: "macbook-ipad-project.firebaseapp.com",
  projectId: "macbook-ipad-project",
  storageBucket: "macbook-ipad-project.firebasestorage.app",
  messagingSenderId: "70460099632",
  appId: "1:70460099632:web:9affa6c56c351958d131f5",
  measurementId: "G-YKNXNMJXZ4"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('🔔 Customer Background Message:', payload);
  const notificationTitle = payload.notification?.title || 'BuyBack Elite';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/logo.png',
    badge: '/logo.png',
    data: payload.data,
  };
  return self.registration.showNotification(notificationTitle, notificationOptions);
});
