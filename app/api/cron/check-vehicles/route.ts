import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendOilChangeNotification } from "@/lib/notifications"

export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    console.log('Running vehicle check cron job...')

    // Get all vehicles with current mileage
    const vehicles = await prisma.vehicle.findMany({
      where: {
        currentMileage: {
          not: null
        }
      },
      include: {
        user: true,
        oilChanges: {
          orderBy: {
            dateOfChange: 'desc'
          },
          take: 1
        },
        notifications: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // Last 3 days
            }
          }
        }
      }
    })

    const results = []

    for (const vehicle of vehicles) {
      // Skip if no oil change records
      if (vehicle.oilChanges.length === 0) {
        console.log(`Skipping ${vehicle.name} - no oil change records`)
        continue
      }

      const lastOilChange = vehicle.oilChanges[0]
      const milesUntilNext = lastOilChange.nextChangeDueAt - (vehicle.currentMileage || 0)

      // Only notify if within 200 miles or overdue
      if (milesUntilNext > 200) {
        console.log(`Skipping ${vehicle.name} - not due yet (${milesUntilNext} miles remaining)`)
        continue
      }

      // Skip if already notified in last 3 days
      if (vehicle.notifications.length > 0) {
        console.log(`Skipping ${vehicle.name} - already notified recently`)
        continue
      }

      console.log(`Sending notification for ${vehicle.name}...`)

      // Send email + push notification
      const notificationResult = await sendOilChangeNotification({
        email: vehicle.user.email,
        fcmToken: vehicle.user.fcmToken,
        vehicleName: vehicle.name,
        currentMileage: vehicle.currentMileage || 0,
        nextDueMileage: lastOilChange.nextChangeDueAt,
        milesRemaining: milesUntilNext,
      })

      // Record notification
      await prisma.notification.create({
        data: {
          vehicleId: vehicle.id,
          userId: vehicle.user.id,
          notificationType: milesUntilNext < 0 ? 'overdue' : 'upcoming',
          sentAt: new Date(),
          status: notificationResult.email.success || notificationResult.push.success ? 'sent' : 'failed',
        }
      })

      results.push({
        vehicle: vehicle.name,
        email: notificationResult.email.success ? 'sent' : 'failed',
        push: vehicle.user.fcmToken ? (notificationResult.push.success ? 'sent' : 'failed') : 'no_token',
        milesRemaining: milesUntilNext,
      })
    }

    console.log(`Cron job completed. Processed ${results.length} vehicles.`)

    return NextResponse.json({
      success: true,
      checked: vehicles.length,
      notifications: results,
    })
  } catch (error) {
    console.error('[CRON_CHECK_VEHICLES]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
