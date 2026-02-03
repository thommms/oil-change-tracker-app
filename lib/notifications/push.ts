import admin from 'firebase-admin'

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

export async function sendPushNotification({
  token,
  vehicleName,
  currentMileage,
  nextDueMileage,
  milesRemaining,
  nextDueDate,
  daysRemaining,
  reason,
}: {
  token: string
  vehicleName: string
  currentMileage: number
  nextDueMileage: number
  milesRemaining: number
  nextDueDate?: Date
  daysRemaining?: number
  reason?: string
}) {
  try {
    const isOverdue = milesRemaining < 0 || (daysRemaining !== undefined && daysRemaining < 0)

    const message = {
      token,
      notification: {
        title: isOverdue 
          ? `🚨 ${vehicleName} - Oil Change Overdue!`
          : `⚠️ ${vehicleName} - Service Due Soon`,
        body: reason || (isOverdue
          ? `${Math.abs(milesRemaining).toLocaleString()} miles overdue! Current: ${currentMileage.toLocaleString()} mi`
          : `${milesRemaining.toLocaleString()} miles remaining. Next due: ${nextDueMileage.toLocaleString()} mi`),
      },
      data: {
        vehicleName,
        currentMileage: currentMileage.toString(),
        nextDueMileage: nextDueMileage.toString(),
        milesRemaining: milesRemaining.toString(),
        nextDueDate: nextDueDate?.toISOString() || '',
        daysRemaining: daysRemaining?.toString() || '',
        type: isOverdue ? 'overdue' : 'upcoming',
        url: '/dashboard',
      },
      webpush: {
        notification: {
          icon: '/icon-192.png',
          badge: '/badge-72.png',
          vibrate: [200, 100, 200],
        },
        fcmOptions: {
          link: process.env.NEXTAUTH_URL + '/dashboard',
        },
      },
    }

    const response = await admin.messaging().send(message)
    console.log('Push notification sent successfully:', response)
    return { success: true, response }
  } catch (error) {
    console.error('Failed to send push notification:', error)
    return { success: false, error }
  }
}
