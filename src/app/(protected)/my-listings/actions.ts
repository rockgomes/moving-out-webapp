'use server'

import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createMovingSale() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Redirect if one already exists
  const { data: existing } = await supabase
    .from('moving_sales')
    .select('id')
    .eq('seller_id', user.id)
    .maybeSingle()

  if (existing) {
    redirect(`/sale/${existing.id}`)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  const title = profile?.display_name
    ? `${profile.display_name}'s Moving Sale`
    : 'My Moving Sale'

  const { data: sale } = await supabase
    .from('moving_sales')
    .insert({ seller_id: user.id, title })
    .select('id')
    .single()

  if (!sale) return

  // Link all existing active listings to this sale
  await supabase
    .from('listings')
    .update({ moving_sale_id: sale.id })
    .eq('seller_id', user.id)
    .eq('status', 'active')

  redirect(`/sale/${sale.id}`)
}
