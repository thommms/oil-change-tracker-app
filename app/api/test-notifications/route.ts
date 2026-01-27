import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sendOilChangeNotification } from "@/lib/notifications"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Get user with FCM token
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    // Send test notification
    const result = await sendOilChangeNotification({
      email: session.user.email,
      fcmToken: user?.fcmToken,
      vehicleName: "Test Vehicle (Kia Soul 22)",
      currentMileage: 51800,
      nextDueMileage: 51900,
      milesRemaining: 100,
    })

    return NextResponse.json({
      success: true,
      message: `Test notifications sent!`,
      results: {
        email: result.email.success ? 'Sent ✅' : 'Failed ❌',
        push: user?.fcmToken 
          ? (result.push.success ? 'Sent ✅' : 'Failed ❌') 
          : 'No FCM token (need to enable push notifications first)',
      }
    })
  } catch (error) {
    console.error('[TEST_NOTIFICATIONS]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
