import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"
import crypto from "crypto"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return new NextResponse("Email is required", { status: 400 })
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    })

    // Always return success (don't reveal if email exists)
    if (!user) {
      return NextResponse.json({ 
        success: true, 
        message: "If an account exists with this email, you will receive a password reset link." 
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Save token to database
    await prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        userId: user.id,
        expiresAt,
      }
    })

    // Send reset email
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`
    
    await resend.emails.send({
      from: 'Oil Change Tracker <onboarding@resend.dev>',
      to: [email],
      subject: '🔐 Reset Your Password',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: #2563eb;
                color: white;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
                margin-bottom: 20px;
              }
              .content {
                background: #f9fafb;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 20px;
              }
              .button {
                display: inline-block;
                background: #2563eb;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: bold;
                margin-top: 20px;
              }
              .footer {
                text-align: center;
                color: #6b7280;
                font-size: 12px;
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="margin: 0;">🔐 Password Reset Request</h1>
            </div>

            <div class="content">
              <p>Hi ${user.name || 'there'},</p>
              <p>
                We received a request to reset your password for your Oil Change Tracker account.
              </p>
              <p>
                Click the button below to create a new password. This link will expire in 1 hour.
              </p>

              <center>
                <a href="${resetUrl}" class="button">
                  Reset Password
                </a>
              </center>

              <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
                Or copy and paste this link into your browser:<br>
                <a href="${resetUrl}" style="color: #2563eb;">${resetUrl}</a>
              </p>

              <p style="margin-top: 20px; font-size: 14px; color: #dc2626;">
                If you didn't request this password reset, you can safely ignore this email.
              </p>
            </div>

            <div class="footer">
              <p>
                This is an automated email from Oil Change Tracker.<br>
                Please do not reply to this email.
              </p>
            </div>
          </body>
        </html>
      `,
    })

    return NextResponse.json({ 
      success: true, 
      message: "If an account exists with this email, you will receive a password reset link." 
    })
  } catch (error) {
    console.error('[FORGOT_PASSWORD_ERROR]', error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
