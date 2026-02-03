import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import DashboardClient from "./DashboardClient"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const vehicles = await prisma.vehicle.findMany({
    where: {
      userId: session.user.id
    },
    include: {
      oilChanges: {
        orderBy: {
          dateOfChange: 'desc'
        },
        take: 1
      },
      mileageHistory: {
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      }
    }
  })

  return <DashboardClient vehicles={vehicles} session={session} />
}
