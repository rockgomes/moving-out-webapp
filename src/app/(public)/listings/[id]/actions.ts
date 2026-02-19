'use server'

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

export async function startConversation(listingId: string, sellerId: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=/listings/${listingId}`)
  }

  // Sellers can't message themselves
  if (user.id === sellerId) return

  // Find existing conversation or create one
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('listing_id', listingId)
    .eq('buyer_id', user.id)
    .single()

  if (existing) {
    redirect(`/messages/${existing.id}`)
  }

  const { data: created, error } = await supabase
    .from('conversations')
    .insert({ listing_id: listingId, buyer_id: user.id, seller_id: sellerId })
    .select('id')
    .single()

  if (error || !created) {
    redirect(`/listings/${listingId}?error=message_failed`)
  }

  redirect(`/messages/${created.id}`)
}
