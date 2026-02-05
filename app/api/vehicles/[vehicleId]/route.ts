import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  context: { params: Promise<{ vehicleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return new NextResponse("User not found", { status: 404 })
    }

    const params = await context.params

    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: params.vehicleId,
        userId: user.id,
      },
      include: {
        oilChanges: {
          orderBy: {
            dateOfChange: "desc",
          },
        },
        mileageHistory: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    })

    if (!vehicle) {
      return new NextResponse("Vehicle not found", { status: 404 })
    }

    return NextResponse.json(vehicle)
  } catch (error) {
    console.error("[VEHICLE_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ vehicleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return new NextResponse("User not found", { status: 404 })
    }

    const params = await context.params

    const body = await request.json()
    const {
      name,
      make,
      model,
      year,
      licensePlate,
      imageUrl,
      oilChangeInterval,
      oilChangeIntervalMonths,
    } = body

    const vehicle = await prisma.vehicle.updateMany({
      where: {
        id: params.vehicleId,
        userId: user.id,
      },
      data: {
        name,
        make,
        model,
        year,
        licensePlate,
        imageUrl,
        oilChangeInterval,
        oilChangeIntervalMonths,
      },
    })

    if (vehicle.count === 0) {
      return new NextResponse("Vehicle not found", { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[VEHICLE_PATCH]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ vehicleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return new NextResponse("User not found", { status: 404 })
    }

    const params = await context.params

    await prisma.vehicle.deleteMany({
      where: {
        id: params.vehicleId,
        userId: user.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[VEHICLE_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
