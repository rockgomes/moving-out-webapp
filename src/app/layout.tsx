import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://moving-out-webapp.vercel.app'),
  title: {
    default: 'MoveOutSale — Local Moving Sales Near You',
    template: '%s | MoveOutSale',
  },
  description:
    'Find great deals from people moving in and out of your neighborhood. Browse local moving sales and connect with sellers directly.',
  openGraph: {
    title: 'MoveOutSale — Local Moving Sales Near You',
    description: 'Find great deals from people moving in and out of your neighborhood.',
    type: 'website',
    siteName: 'MoveOutSale',
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
