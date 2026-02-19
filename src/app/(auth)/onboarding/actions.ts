'use server'

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const locationSchema = z.object({
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'Use the 2-letter state abbreviation'),
  zip_code: z.string().regex(/^\d{5}$/, 'Enter a valid 5-digit ZIP code'),
})

export type LocationFormState = {
  errors?: {
    city?: string[]
    state?: string[]
    zip_code?: string[]
    _form?: string[]
  }
}

export async function saveLocation(
  _prev: LocationFormState,
  formData: FormData,
): Promise<LocationFormState> {
  const raw = {
    city: formData.get('city') as string,
    state: (formData.get('state') as string)?.toUpperCase(),
    zip_code: formData.get('zip_code') as string,
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
      state: parsed.data.state,
      zip_code: parsed.data.zip_code,
    })
    .eq('id', user.id)

  if (error) {
    return { errors: { _form: ['Failed to save location. Please try again.'] } }
  }

  redirect('/')
}
