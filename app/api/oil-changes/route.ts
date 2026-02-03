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

    const body = await request.json()
    const { vehicleId, mileageAtChange, dateOfChange, notes } = body

    if (!vehicleId || !mileageAtChange) {
      return new NextResponse("Vehicle ID and mileage are required", { status: 400 })
    }

    // Get vehicle details
    const vehicle = await prisma.vehicle.findUnique({
      where: {
        id: vehicleId,
        userId: session.user.id
      }
    })

    if (!vehicle) {
      return new NextResponse("Vehicle not found", { status: 404 })
    }

    // Calculate next due mileage
    const nextChangeDueAt = parseInt(mileageAtChange) + vehicle.oilChangeInterval

    // Calculate next due date
    const changeDate = dateOfChange ? new Date(dateOfChange) : new Date()
    const nextChangeDueDate = new Date(changeDate)
    nextChangeDueDate.setMonth(nextChangeDueDate.getMonth() + vehicle.oilChangeIntervalMonths)

    // Create oil change record
    const oilChange = await prisma.oilChange.create({
      data: {
        vehicleId,
        mileageAtChange: parseInt(mileageAtChange),
        dateOfChange: changeDate,
        nextChangeDueAt,
        nextChangeDueDate,
        notes,
      }
    })

    // Update vehicle's current mileage
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { currentMileage: parseInt(mileageAtChange) }
    })

    return NextResponse.json(oilChange)
  } catch (error) {
    console.error("[OIL_CHANGE_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
