'use server'

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

type OAuthProvider = 'facebook' | 'google'

export async function signInWithOAuth(provider: OAuthProvider) {
  const supabase = await createServerClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${appUrl}/callback`,
      scopes: provider === 'facebook' ? 'email,public_profile' : undefined,
    },
  })

  if (error || !data.url) {
    redirect('/login?error=oauth_failed')
  }

  redirect(data.url)
}
