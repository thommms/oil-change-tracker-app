import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { token } = await request.json()

    if (!token) {
      return new NextResponse("Token is required", { status: 400 })
    }

    // Save FCM token to user
    await prisma.user.update({
      where: {
        email: session.user.email
      },
      data: {
        fcmToken: token
      }
    })

    console.log('FCM token saved for user:', session.user.email)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[FCM_TOKEN_POST]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
