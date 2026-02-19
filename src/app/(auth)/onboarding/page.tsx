import { redirect } from 'next/navigation'
import { MapPin, Package } from 'lucide-react'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { LocationForm } from './LocationForm'

export const metadata = {
  title: 'Set your location | MoveOutSale',
}

export default async function OnboardingPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Guard: must be logged in
  if (!user) redirect('/login')

  // Guard: skip onboarding if location already set
  const { data: profile } = await supabase
    .from('profiles')
    .select('country')
    .eq('id', user.id)
    .single()

  if (profile?.country) redirect('/')

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
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Where are you located?
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              We&apos;ll show you items from neighbors who are moving nearby
            </p>
          </div>

          <LocationForm />
        </div>
      </div>
    </div>
  )
}
