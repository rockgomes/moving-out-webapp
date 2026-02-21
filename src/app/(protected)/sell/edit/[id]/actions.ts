'use server'

import { revalidatePath } from 'next/cache'

export async function revalidateAfterEdit(listingId: string) {
  revalidatePath(`/listings/${listingId}`)
  revalidatePath('/my-listings')
}
