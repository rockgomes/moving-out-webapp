import Link from 'next/link'
import { Package } from 'lucide-react'
import { OAuthButtons } from './OAuthButtons'

export const metadata = {
  title: 'Log in | MoveOutSale',
  description: 'Sign in to buy or sell items from people moving near you.',
}

interface LoginPageProps {
  searchParams: Promise<{ error?: string; next?: string }>
}

const errorMessages: Record<string, string> = {
  auth_failed: 'Authentication failed. Please try again.',
  oauth_failed: 'Could not connect to the provider. Please try again.',
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Package className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">MoveOutSale</span>
        </Link>

        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to buy or sell items from neighbors who are moving
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {errorMessages[error] ?? 'Something went wrong. Please try again.'}
            </div>
          )}

          <OAuthButtons />

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing, you agree to our{' '}
            <Link href="/terms" className="underline hover:text-foreground">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          New to MoveOutSale?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            It&apos;s free to join
          </Link>
        </p>
      </div>
    </div>
  )
}
