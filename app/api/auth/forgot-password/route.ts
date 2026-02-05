import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    console.log("🔍 Password reset requested for:", email)

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      console.log("❌ User not found:", email)
      return NextResponse.json(
        { message: "If an account exists, you will receive a reset link." },
        { status: 200 }
      )
    }

    console.log("✅ User found:", user.email)

    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 3600000) // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    })

    console.log("✅ Token created:", token.substring(0, 10) + "...")

    const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${token}`

    console.log("📧 Sending email via Resend to:", email)

    const emailResult = await resend.emails.send({
      from: 'MotorSync <noreply@zidergroup.com>',
      to: email,
      subject: 'Reset Your Password - MotorSync',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">🔒 Password Reset Request</h1>
              </div>
              <div class="content">
                <p>Hi there,</p>
                <p>We received a request to reset your password for your MotorSync account.</p>
                <p>Click the button below to reset your password:</p>
                <p style="text-align: center;">
                  <a href="${resetUrl}" class="button">Reset Password</a>
                </p>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background: white; padding: 10px; border-radius: 5px;">${resetUrl}</p>
                <p><strong>This link will expire in 1 hour.</strong></p>
                <p>If you didn't request this password reset, you can safely ignore this email.</p>
              </div>
              <div class="footer">
                <p>This is an automated message from MotorSync.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    console.log("✅ Resend API response:", JSON.stringify(emailResult, null, 2))

    return NextResponse.json(
      { message: "If an account exists, you will receive a reset link." },
      { status: 200 }
    )
  } catch (error) {
    console.error("❌ Password reset error:", error)
    return NextResponse.json(
      { message: "An error occurred. Please try again." },
      { status: 500 }
    )
  }
}
