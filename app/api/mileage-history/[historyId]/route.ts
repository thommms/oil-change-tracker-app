import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ historyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const resolvedParams = await params

    // Get the mileage history entry to verify ownership
    const mileageHistory = await prisma.mileageHistory.findUnique({
      where: {
        id: resolvedParams.historyId
      },
      include: {
        vehicle: true
      }
    })

    if (!mileageHistory) {
      return new NextResponse("Mileage history not found", { status: 404 })
    }

    // Check if user owns this vehicle
    if (mileageHistory.vehicle.userId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 403 })
    }

    // Don't allow deleting if it's the only mileage entry AND it matches current mileage
    const allMileageHistory = await prisma.mileageHistory.findMany({
      where: {
        vehicleId: mileageHistory.vehicleId
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // If this is the most recent entry, update vehicle's currentMileage to the next most recent
    if (allMileageHistory.length > 0 && allMileageHistory[0].id === resolvedParams.historyId) {
      if (allMileageHistory.length > 1) {
        // Update to second most recent
        await prisma.vehicle.update({
          where: {
            id: mileageHistory.vehicleId
          },
          data: {
            currentMileage: allMileageHistory[1].mileage
          }
        })
      } else {
        // Last entry - set currentMileage to null
        await prisma.vehicle.update({
          where: {
            id: mileageHistory.vehicleId
          },
          data: {
            currentMileage: null
          }
        })
      }
    }

    // Delete the mileage history entry
    await prisma.mileageHistory.delete({
      where: {
        id: resolvedParams.historyId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[MILEAGE_HISTORY_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
