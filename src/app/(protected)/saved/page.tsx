import Link from 'next/link'
import { Heart } from 'lucide-react'
import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listings/ListingCard'
import { Button } from '@/components/ui/button'
import type { ListingWithSeller } from '@/types'

export const metadata: Metadata = { title: 'Saved Items | MoveOutSale' }

export default async function SavedPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: rows } = await supabase
    .from('saved_listings')
    .select(`
      listing_id,
      listings (
        *,
        listing_photos ( id, storage_path, display_order ),
        profiles!listings_seller_id_fkey ( id, display_name, avatar_url )
      )
    `)
    .eq('user_id', user.id)
    .order('saved_at', { ascending: false })

  const listings = (rows ?? [])
    .map((r) => r.listings)
    .filter(Boolean) as unknown as ListingWithSeller[]

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <Heart className="h-5 w-5 fill-red-500 text-red-500" />
        <h1 className="text-2xl font-bold tracking-tight">Saved Items</h1>
        {listings.length > 0 && (
          <span className="text-sm text-muted-foreground">({listings.length})</span>
        )}
      </div>

      {listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Heart className="mb-4 h-12 w-12 text-muted-foreground/20" />
          <p className="text-lg font-semibold">No saved items yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap the heart on any listing to save it here.
          </p>
          <Button asChild className="mt-4">
            <Link href="/browse">Browse Listings</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              isSaved={true}
            />
          ))}
        </div>
      )}

      {listings.length > 0 && (
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Items are saved to your account and visible only to you.
        </p>
      )}
    </div>
  )
}
