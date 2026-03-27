import type { Metadata } from 'next'
import './globals.css'
import { OrganizationProvider } from '@/context/OrganizationContext'

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
      <body suppressHydrationWarning>
        <OrganizationProvider>
          {children}
        </OrganizationProvider>
      </body>
    </html>
  )
}
