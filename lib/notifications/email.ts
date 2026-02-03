import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendOilChangeEmail({
  to,
  vehicleName,
  currentMileage,
  nextDueMileage,
  milesRemaining,
  nextDueDate,
  daysRemaining,
  reason,
}: {
  to: string
  vehicleName: string
  currentMileage: number
  nextDueMileage: number
  milesRemaining: number
  nextDueDate?: Date
  daysRemaining?: number
  reason?: string
}) {
  try {
    const isOverdue = milesRemaining < 0 || (daysRemaining !== undefined && daysRemaining < 0)

    const data = await resend.emails.send({
      from: 'Oil Change Tracker <onboarding@resend.dev>',
      to: [to],
      subject: isOverdue 
        ? `🚨 OVERDUE: ${vehicleName} needs oil change!`
        : `⚠️ ${vehicleName} needs oil change soon`,
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
                background: ${isOverdue ? '#DC2626' : '#F59E0B'};
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
              .stat {
                background: white;
                padding: 15px;
                border-radius: 6px;
                margin: 10px 0;
                border-left: 4px solid #2563eb;
              }
              .stat-label {
                font-size: 12px;
                color: #6b7280;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .stat-value {
                font-size: 24px;
                font-weight: bold;
                color: #111827;
                margin-top: 5px;
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
              .reason {
                background: #FEF3C7;
                border-left: 4px solid #F59E0B;
                padding: 12px;
                border-radius: 4px;
                margin: 15px 0;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="margin: 0;">
                ${isOverdue ? '🚨 Oil Change Overdue!' : '⚠️ Oil Change Reminder'}
              </h1>
              <p style="margin: 10px 0 0 0; font-size: 18px;">
                ${vehicleName}
              </p>
            </div>

            <div class="content">
              <p>Hi there,</p>
              
              ${reason ? `
                <div class="reason">
                  <strong>⏰ Service Due:</strong> ${reason}
                </div>
              ` : ''}

              <div class="stat">
                <div class="stat-label">Current Mileage</div>
                <div class="stat-value">${currentMileage.toLocaleString()} miles</div>
              </div>

              <div class="stat">
                <div class="stat-label">Next Service Due (Mileage)</div>
                <div class="stat-value">${nextDueMileage.toLocaleString()} miles</div>
                <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;">
                  ${milesRemaining > 0 
                    ? `${milesRemaining.toLocaleString()} miles remaining` 
                    : `${Math.abs(milesRemaining).toLocaleString()} miles overdue`}
                </p>
              </div>

              ${nextDueDate && daysRemaining !== undefined ? `
                <div class="stat">
                  <div class="stat-label">Next Service Due (Date)</div>
                  <div class="stat-value">${nextDueDate.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</div>
                  <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;">
                    ${daysRemaining > 0 
                      ? `${daysRemaining} days remaining` 
                      : `${Math.abs(daysRemaining)} days overdue`}
                  </p>
                </div>
              ` : ''}

              <p>
                ${isOverdue 
                  ? 'Please schedule an oil change as soon as possible to avoid engine damage.' 
                  : 'We recommend scheduling your oil change appointment soon to stay on top of your vehicle maintenance.'
                }
              </p>

              <center>
                <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">
                  View Dashboard
                </a>
              </center>
            </div>

            <div class="footer">
              <p>
                This is an automated reminder from your Oil Change Tracker.<br>
                You're receiving this because your vehicle is due for maintenance.
              </p>
            </div>
          </body>
        </html>
      `,
    })

    console.log('Email sent successfully:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { success: false, error }
  }
}
