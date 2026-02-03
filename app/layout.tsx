import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "MotorSync - Never Miss an Oil Change Again",
  description: "Track your vehicle oil changes and get maintenance reminders",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
