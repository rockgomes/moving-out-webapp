'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'

const profileSchema = z.object({
  display_name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  zip_code: z.string().max(20).optional(),
  country: z.string().max(10).optional(),
})

export interface ProfileFormState {
  success?: boolean
  errors?: {
    display_name?: string[]
    city?: string[]
    state?: string[]
    zip_code?: string[]
    country?: string[]
    _form?: string[]
  }
}

export async function updateProfile(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const raw = {
    display_name: formData.get('display_name'),
    city: formData.get('city') || undefined,
    state: formData.get('state') || undefined,
    zip_code: formData.get('zip_code') || undefined,
    country: formData.get('country') || undefined,
  }

  const parsed = profileSchema.safeParse(raw)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { errors: { _form: ['Not authenticated'] } }

  const { error } = await supabase
    .from('profiles')
    .update(parsed.data)
    .eq('id', user.id)

  if (error) return { errors: { _form: ['Failed to save profile. Please try again.'] } }

  revalidatePath('/', 'layout')
  return { success: true }
}
