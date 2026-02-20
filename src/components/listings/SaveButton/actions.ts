'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleSave(listingId: string, currentlySaved: boolean) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  if (currentlySaved) {
    await supabase
      .from('saved_listings')
      .delete()
      .eq('user_id', user.id)
      .eq('listing_id', listingId)
  } else {
    await supabase
      .from('saved_listings')
      .insert({ user_id: user.id, listing_id: listingId })
  }

  revalidatePath('/saved')
}
