import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendOilChangeNotification(
  email: string,
  vehicleName: string,
  currentMileage: number,
  nextChangeDueAt: number,
  nextChangeDueDate: Date,
  milesRemaining: number,
  daysRemaining: number
) {
  const isOverdueMileage = milesRemaining < 0
  const isOverdueTime = daysRemaining < 0

  const statusColor = isOverdueMileage || isOverdueTime ? '#ef4444' : '#f59e0b'
  const statusText = isOverdueMileage || isOverdueTime ? 'OVERDUE' : 'DUE SOON'

  try {
    await resend.emails.send({
      from: 'MotorSync <noreply@zidergroup.com>',
      to: email,
      subject: `🚨 ${vehicleName} - Oil Change ${statusText}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
              .header { background: ${statusColor}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 20px; }
              .info-box { background: white; border-left: 4px solid ${statusColor}; padding: 15px; margin: 15px 0; border-radius: 4px; }
              .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="margin: 0;">🚨 Oil Change ${statusText}</h1>
            </div>
            <div class="content">
              <p><strong>Vehicle:</strong> ${vehicleName}</p>
              
              <div class="info-box">
                <p style="margin: 0;"><strong>Current Mileage:</strong> ${currentMileage.toLocaleString()} miles</p>
              </div>

              <div class="info-box">
                <p style="margin: 0;"><strong>Next Service Due (Mileage):</strong> ${nextChangeDueAt.toLocaleString()} miles</p>
                <p style="margin: 5px 0 0 0; color: ${statusColor};">
                  <strong>${isOverdueMileage ? `${Math.abs(milesRemaining).toLocaleString()} miles OVERDUE!` : `${milesRemaining.toLocaleString()} miles remaining`}</strong>
                </p>
              </div>

              <div class="info-box">
                <p style="margin: 0;"><strong>Next Service Due (Date):</strong> ${nextChangeDueDate.toLocaleDateString()}</p>
                <p style="margin: 5px 0 0 0; color: ${statusColor};">
                  <strong>${isOverdueTime ? `${Math.abs(daysRemaining)} days OVERDUE!` : `${daysRemaining} days remaining`}</strong>
                </p>
              </div>

              <p style="margin-top: 20px;">
                ${isOverdueMileage || isOverdueTime 
                  ? 'Your vehicle is overdue for an oil change. Please schedule service as soon as possible.' 
                  : 'Your vehicle will need an oil change soon. Please schedule service at your earliest convenience.'}
              </p>
            </div>
            <div class="footer">
              <p>This is an automated reminder from MotorSync<br>Zider Group</p>
            </div>
          </body>
        </html>
      `,
    })
    console.log(`✅ Email sent to ${email} for ${vehicleName}`)
  } catch (error) {
    console.error(`❌ Failed to send email to ${email}:`, error)
    throw error
  }
}
