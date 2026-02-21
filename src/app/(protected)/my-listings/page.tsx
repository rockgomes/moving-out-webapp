import Link from 'next/link'
import Image from 'next/image'
import { Plus, Package, Truck } from 'lucide-react'
import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/currency'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusButton } from './StatusButton'
import { createMovingSale } from './actions'

export const metadata: Metadata = { title: 'My Listings | MoveOutSale' }

const STATUS_LABELS = { active: 'Active', reserved: 'Reserved', sold: 'Sold' }
const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline'> = {
  active: 'default',
  reserved: 'secondary',
  sold: 'outline',
}

export default async function MyListingsPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: listings }, { data: movingSale }] = await Promise.all([
    supabase
      .from('listings')
      .select('*, listing_photos ( storage_path, display_order )')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('moving_sales')
      .select('id, title')
      .eq('seller_id', user.id)
      .maybeSingle(),
  ])

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">My Listings</h1>
        <div className="flex items-center gap-2">
          <Button asChild size="sm">
            <Link href="/sell"><Plus className="mr-1.5 h-4 w-4" />New Listing</Link>
          </Button>
        </div>
      </div>

      {/* Moving Sale banner */}
      {movingSale ? (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-5 py-4">
          <div className="flex items-center gap-3">
            <Truck className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">{movingSale.title}</p>
              <p className="text-xs text-muted-foreground">Your moving sale is live</p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/sale/${movingSale.id}`}>View Sale</Link>
          </Button>
        </div>
      ) : (
        <form action={createMovingSale} className="mb-6">
          <div className="flex items-center justify-between rounded-xl border border-dashed px-5 py-4">
            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-semibold text-foreground">Bundle your listings</p>
                <p className="text-xs text-muted-foreground">
                  Create a Moving Sale to group all your items in one shareable page
                </p>
              </div>
            </div>
            <Button type="submit" variant="outline" size="sm">
              Start Moving Sale
            </Button>
          </div>
        </form>
      )}

      {!listings || listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package className="mb-4 h-12 w-12 text-muted-foreground/30" />
          <p className="text-lg font-semibold">No listings yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Create your first listing to start selling</p>
          <Button asChild className="mt-4">
            <Link href="/sell">Create a Listing</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {listings.map((listing) => {
            const photos = (listing.listing_photos as unknown as { storage_path: string; display_order: number }[] ?? [])
              .slice().sort((a, b) => a.display_order - b.display_order)
            const photoUrl = photos[0]
              ? `${supabaseUrl}/storage/v1/object/public/listing-photos/${photos[0].storage_path}`
              : null

            return (
              <div key={listing.id} className="flex items-center gap-4 rounded-xl border bg-white p-4">
                {/* Photo */}
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {photoUrl ? (
                    <Image src={photoUrl} alt={listing.title} fill className="object-cover" sizes="64px" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Package className="h-6 w-6 text-muted-foreground/30" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">{listing.title}</p>
                    <Badge variant={STATUS_VARIANTS[listing.status]}>
                      {STATUS_LABELS[listing.status]}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-sm font-semibold text-primary">
                    {formatPrice(Number(listing.price), listing.country)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Listed {new Date(listing.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/listings/${listing.id}`}>View</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/sell/edit/${listing.id}`}>Edit</Link>
                  </Button>
                  <StatusButton listingId={listing.id} currentStatus={listing.status} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
