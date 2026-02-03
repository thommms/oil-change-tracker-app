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

    // Get all vehicles with their latest oil change
    const vehicles = await prisma.vehicle.findMany({
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
    const now = new Date()

    for (const vehicle of vehicles) {
      // Skip if no oil change records
      if (vehicle.oilChanges.length === 0) {
        console.log(`Skipping ${vehicle.name} - no oil change records`)
        continue
      }

      const lastOilChange = vehicle.oilChanges[0]
      
      // Check MILEAGE-based notification
      let needsServiceByMileage = false
      let milesUntilNext = null
      
      if (vehicle.currentMileage) {
        milesUntilNext = lastOilChange.nextChangeDueAt - vehicle.currentMileage
        needsServiceByMileage = milesUntilNext <= 200
      }

      // Check TIME-based notification
      const nextDueDate = new Date(lastOilChange.nextChangeDueDate)
      const daysUntilDue = Math.floor((nextDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const needsServiceByTime = daysUntilDue <= 14 // 2 weeks warning

      // Skip if neither condition is met
      if (!needsServiceByMileage && !needsServiceByTime) {
        console.log(`Skipping ${vehicle.name} - not due yet`)
        console.log(`  Mileage: ${milesUntilNext} miles remaining`)
        console.log(`  Time: ${daysUntilDue} days remaining`)
        continue
      }

      // Skip if already notified in last 3 days
      if (vehicle.notifications.length > 0) {
        console.log(`Skipping ${vehicle.name} - already notified recently`)
        continue
      }

      console.log(`Sending notification for ${vehicle.name}...`)

      // Determine notification reason
      const reasons = []
      if (needsServiceByMileage) {
        if (milesUntilNext! < 0) {
          reasons.push(`${Math.abs(milesUntilNext!).toLocaleString()} miles overdue`)
        } else {
          reasons.push(`${milesUntilNext!.toLocaleString()} miles remaining`)
        }
      }
      if (needsServiceByTime) {
        if (daysUntilDue < 0) {
          reasons.push(`${Math.abs(daysUntilDue)} days overdue`)
        } else {
          reasons.push(`${daysUntilDue} days remaining`)
        }
      }

      // Send email + push notification
      const notificationResult = await sendOilChangeNotification({
        email: vehicle.user.email,
        fcmToken: vehicle.user.fcmToken,
        vehicleName: vehicle.name,
        currentMileage: vehicle.currentMileage || 0,
        nextDueMileage: lastOilChange.nextChangeDueAt,
        milesRemaining: milesUntilNext || 0,
        nextDueDate: nextDueDate,
        daysRemaining: daysUntilDue,
        reason: reasons.join(' • '),
      })

      // Record notification
      await prisma.notification.create({
        data: {
          vehicleId: vehicle.id,
          userId: vehicle.user.id,
          notificationType: (milesUntilNext !== null && milesUntilNext < 0) || daysUntilDue < 0 ? 'overdue' : 'upcoming',
          sentAt: new Date(),
          status: notificationResult.email.success || notificationResult.push.success ? 'sent' : 'failed',
        }
      })

      results.push({
        vehicle: vehicle.name,
        email: notificationResult.email.success ? 'sent' : 'failed',
        push: vehicle.user.fcmToken ? (notificationResult.push.success ? 'sent' : 'failed') : 'no_token',
        reason: reasons.join(' • '),
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
