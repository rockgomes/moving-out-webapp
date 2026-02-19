import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { CreateListingForm } from './CreateListingForm'

export const metadata: Metadata = {
  title: 'Create a Listing | MoveOutSale',
}

export default async function SellPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // middleware already handles the redirect, but guard here for TS
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Create a Listing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add photos, set your price, and publish to your neighbors.
        </p>
      </div>
      <CreateListingForm profile={profile} />
    </div>
  )
}
