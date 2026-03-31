import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { supabase } from './supabase';

const firebaseConfig = {
  apiKey: "AIzaSyA4UCMLGDYoXNJvJ8TOOU9HX6GsRYFYuLw",
  authDomain: "macbook-ipad-project.firebaseapp.com",
  projectId: "macbook-ipad-project",
  storageBucket: "macbook-ipad-project.firebasestorage.app",
  messagingSenderId: "70460099632",
  appId: "1:70460099632:web:9affa6c56c351958d131f5",
  measurementId: "G-YKNXNMJXZ4"
};

const VAPID_KEY = 'BKHH9CInQp86OvzHkquemOHrJ-K_q2ghEd-IMriVJBggzTD-2J3S8WgV8kG5j5QxfymCVZmJfm1rd95NKbXG0Lc';

const app = initializeApp(firebaseConfig);

let messaging = null;
try {
  messaging = getMessaging(app);
} catch (e) {
  console.warn('Firebase Messaging not supported in this browser:', e);
}

export async function requestNotificationPermission() {
  if (!messaging) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      console.log('✅ Customer Web FCM Token:', token);
      return token;
    }
    console.warn('⚠️ Notification permission denied');
    return null;
  } catch (error) {
    console.error('❌ Error getting FCM token:', error);
    return null;
  }
}

export async function saveFcmTokenToSupabase(token) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('fcm_tokens').upsert({
      user_id: user.id,
      token: token,
      device_type: 'web_customer',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,device_type' });
    console.log('✅ Customer web FCM token saved to Supabase');
  } catch (error) {
    console.error('❌ Failed to save FCM token:', error);
  }
}

export async function deleteFcmToken() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('fcm_tokens')
      .delete()
      .eq('user_id', user.id)
      .eq('device_type', 'web_customer');
    console.log('✅ Customer web FCM token deleted');
  } catch (error) {
    console.error('❌ Failed to delete FCM token:', error);
  }
}

export function onForegroundMessage(callback) {
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log('🔔 Customer Foreground message:', payload);

    if (Notification.permission === 'granted' && payload.notification) {
      new Notification(payload.notification.title, {
        body: payload.notification.body,
        icon: '/logo.png',
      });
    }

    if (callback) callback(payload);
  });
}

export { messaging, getToken, onMessage };
