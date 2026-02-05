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
      include: {
        vehicles: {
          include: {
            oilChanges: {
              orderBy: {
                dateOfChange: "desc",
              },
              take: 1,
            },
            mileageHistory: {
              orderBy: {
                createdAt: "desc",
              },
            },
          },
        },
      },
    })

    if (!user) {
      return new NextResponse("User not found", { status: 404 })
    }

    return NextResponse.json(user.vehicles)
  } catch (error) {
    console.error("[VEHICLES_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(request: Request) {
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

    const body = await request.json()
    const {
      name,
      make,
      model,
      year,
      licensePlate,
      imageUrl,
      currentMileage,
      oilChangeInterval,
      oilChangeIntervalMonths,
    } = body

    const vehicle = await prisma.vehicle.create({
      data: {
        userId: user.id,
        name,
        make,
        model,
        year,
        licensePlate,
        imageUrl,
        currentMileage,
        oilChangeInterval,
        oilChangeIntervalMonths,
      },
    })

    // If currentMileage is provided, create initial mileage history entry
    if (currentMileage) {
      await prisma.mileageHistory.create({
        data: {
          vehicleId: vehicle.id,
          mileage: currentMileage,
        },
      })
    }

    return NextResponse.json(vehicle)
  } catch (error) {
    console.error("[VEHICLES_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
