import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'README Generator AI',
  description: 'Auto-generate professional READMEs for any repository',
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
