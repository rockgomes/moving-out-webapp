import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { ProfileForm } from './ProfileForm'
import type { Profile } from '@/types'

export const metadata: Metadata = { title: 'Profile | MoveOutSale' }

export default async function ProfilePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Edit Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update your display name and location.
        </p>
      </div>
      <ProfileForm profile={profile as unknown as Profile} />
    </div>
  )
}
