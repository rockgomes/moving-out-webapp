import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'MoveOutSale — Local Moving Sales Near You',
    template: '%s | MoveOutSale',
  },
  description:
    'Find great deals from people moving in and out of your neighborhood. Browse local moving sales and connect with sellers directly.',
  openGraph: {
    title: 'MoveOutSale',
    description: 'Local moving sales near you',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
