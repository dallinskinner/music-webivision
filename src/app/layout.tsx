import type { Metadata } from 'next'
import { SessionProvider } from 'next-auth/react'
import '../App.css'

export const metadata: Metadata = {
  title: 'CYBER_MTV - Music Video Player',
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
