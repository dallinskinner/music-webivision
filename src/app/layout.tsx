import type { Metadata } from 'next'
import { SessionProvider } from 'next-auth/react'
import '../App.css'

export const metadata: Metadata = {
  title: 'vidstream.exe',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
