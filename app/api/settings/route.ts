import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        email: true,
        name: true,
        phone: true,
        emailNotificationsEnabled: true,
        smsNotificationsEnabled: true,
        notificationMileageThreshold: true,
        notificationDaysThreshold: true,
      },
    })

    if (!user) {
      return new NextResponse("User not found", { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("[SETTINGS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      phone,
      emailNotificationsEnabled,
      smsNotificationsEnabled,
      notificationMileageThreshold,
      notificationDaysThreshold,
    } = body

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name,
        phone,
        emailNotificationsEnabled,
        smsNotificationsEnabled,
        notificationMileageThreshold,
        notificationDaysThreshold,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("[SETTINGS_PATCH]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
