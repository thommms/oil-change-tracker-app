import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return new NextResponse("Token and password are required", { status: 400 })
    }

    if (password.length < 6) {
      return new NextResponse("Password must be at least 6 characters", { status: 400 })
    }

    // Find valid token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!resetToken) {
      return new NextResponse("Invalid or expired reset token", { status: 400 })
    }

    if (resetToken.used) {
      return new NextResponse("This reset link has already been used", { status: 400 })
    }

    if (new Date() > resetToken.expiresAt) {
      return new NextResponse("This reset link has expired", { status: 400 })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update user password
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword }
    })

    // Mark token as used
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true }
    })

    return NextResponse.json({ 
      success: true, 
      message: "Password has been reset successfully" 
    })
  } catch (error) {
    console.error('[RESET_PASSWORD_ERROR]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
