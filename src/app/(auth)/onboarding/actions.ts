'use server'

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const locationSchema = z.object({
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
  state: z.string().optional(),
  zip_code: z.string().optional(),
})

export type LocationFormState = {
  errors?: {
    city?: string[]
    country?: string[]
    _form?: string[]
  }
}

export async function saveLocation(
  _prev: LocationFormState,
  formData: FormData,
): Promise<LocationFormState> {
  const raw = {
    city: formData.get('city') as string,
    country: formData.get('country') as string,
    state: (formData.get('state') as string) || undefined,
    zip_code: (formData.get('zip_code') as string) || undefined,
  }

  const parsed = locationSchema.safeParse(raw)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { errors: { _form: ['You must be logged in.'] } }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      city: parsed.data.city,
      state: parsed.data.state ?? null,
      zip_code: parsed.data.zip_code ?? null,
      country: parsed.data.country,
    })
    .eq('id', user.id)

  if (error) {
    return { errors: { _form: ['Failed to save location. Please try again.'] } }
  }

  redirect('/')
}
