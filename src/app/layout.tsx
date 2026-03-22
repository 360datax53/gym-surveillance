import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '🎥 Gym Surveillance System',
  description: 'AI-powered member verification and security monitoring',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
