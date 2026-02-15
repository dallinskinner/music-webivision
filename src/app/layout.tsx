import type { Metadata } from 'next'
import '../App.css'

export const metadata: Metadata = {
  title: 'CYBER_MTV - Music Video Player',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
