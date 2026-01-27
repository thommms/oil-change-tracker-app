import { sendOilChangeEmail } from './email'
import { sendPushNotification } from './push'

export async function sendOilChangeNotification({
  email,
  fcmToken,
  vehicleName,
  currentMileage,
  nextDueMileage,
  milesRemaining,
}: {
  email: string
  fcmToken?: string | null
  vehicleName: string
  currentMileage: number
  nextDueMileage: number
  milesRemaining: number
}) {
  const results = {
    email: { success: false, data: null, error: null },
    push: { success: false, data: null, error: null },
  }

  // Send Email
  const emailResult = await sendOilChangeEmail({
    to: email,
    vehicleName,
    currentMileage,
    nextDueMileage,
    milesRemaining,
  })
  results.email = emailResult as any

  // Send Push Notification (if token exists)
  if (fcmToken) {
    const pushResult = await sendPushNotification({
      token: fcmToken,
      vehicleName,
      currentMileage,
      nextDueMileage,
      milesRemaining,
    })
    results.push = pushResult as any
  }

  return results
}
