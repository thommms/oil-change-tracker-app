// Give the service worker access to Firebase Messaging.
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js')

// Initialize the Firebase app in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyCIvEbPUtKCiBzoq8mLwUZVi-ukgW3rOs4",
  authDomain: "oil-change-tracker-1c347.firebaseapp.com",
  projectId: "oil-change-tracker-1c347",
  storageBucket: "oil-change-tracker-1c347.firebasestorage.app",
  messagingSenderId: "24293062562",
  appId: "1:24293062562:web:43cfde17f576db4c9764fb"
})

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging()

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload)
  
  const notificationTitle = payload.notification.title
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [200, 100, 200],
    data: payload.data,
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.')
  
  event.notification.close()
  
  // Navigate to dashboard
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/dashboard')
  )
})
