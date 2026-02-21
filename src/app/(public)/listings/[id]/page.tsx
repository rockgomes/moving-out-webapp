import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Clock, Share2, Flag, ChevronRight } from 'lucide-react'
import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ListingCard } from '@/components/listings/ListingCard'
import { MessageSellerButton } from './MessageSellerButton'
import { CATEGORIES } from '@/lib/constants'
import { formatPrice } from '@/lib/currency'
import type { ListingWithSeller } from '@/types'

const CONDITION_LABELS: Record<string, string> = {
  new: 'New',
  like_new: 'Like New',
  good: 'Good',
  fair: 'Fair',
}

const CONDITION_VARIANTS: Record<string, 'default' | 'secondary' | 'outline'> = {
  new: 'default',
  like_new: 'default',
  good: 'secondary',
  fair: 'outline',
}

interface ListingPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createServerClient()
  const { data } = await supabase.from('listings').select('title, description').eq('id', id).single()
  if (!data) return { title: 'Listing not found | MoveOutSale' }
  return {
    title: `${data.title} | MoveOutSale`,
    description: data.description ?? undefined,
  }
}

export default async function ListingPage({ params }: ListingPageProps) {
  const { id } = await params
  const supabase = await createServerClient()

  // Fetch listing with photos and seller
  const { data: listing } = await supabase
    .from('listings')
    .select(`
      *,
      listing_photos ( id, storage_path, display_order ),
      profiles!listings_seller_id_fkey ( id, display_name, avatar_url, city, state, created_at )
    `)
    .eq('id', id)
    .single()

  if (!listing) notFound()

  // Check if the current user is the owner
  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === listing.seller_id

  // Fetch more from this seller (excluding current listing)
  const { data: moreBySeller } = await supabase
    .from('listings')
    .select(`
      *,
      listing_photos ( id, storage_path, display_order ),
      profiles!listings_seller_id_fkey ( id, display_name, avatar_url )
    `)
    .eq('seller_id', listing.seller_id)
    .eq('status', 'active')
    .neq('id', id)
    .limit(4)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const photos = (listing.listing_photos as unknown as { id: string; storage_path: string; display_order: number }[] ?? [])
    .slice()
    .sort((a, b) => a.display_order - b.display_order)
    .map((p) => `${supabaseUrl}/storage/v1/object/public/listing-photos/${p.storage_path}`)

  const seller = listing.profiles as unknown as { id: string; display_name: string | null; avatar_url: string | null; city: string | null; state: string | null; created_at: string } | null
  const sellerInitials = seller?.display_name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  const categoryLabel = CATEGORIES.find((c) => c.slug === listing.category)?.label ?? listing.category

  const location = [listing.city ?? seller?.city, listing.state ?? seller?.state]
    .filter(Boolean).join(', ')

  const timeAgo = (() => {
    // eslint-disable-next-line react-hooks/purity
    const diff = Date.now() - new Date(listing.created_at).getTime()
    const days = Math.floor(diff / 86400000)
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return `${Math.floor(days / 7)} weeks ago`
  })()

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav className="mb-5 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/home" className="hover:text-foreground">Browse</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/home?category=${listing.category}`} className="hover:text-foreground">
          {categoryLabel}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="line-clamp-1 text-foreground">{listing.title}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
        {/* Left: photos */}
        <div className="flex flex-col gap-3">
          {/* Main photo */}
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-muted">
            {photos[0] ? (
              <Image
                src={photos[0]}
                alt={listing.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 60vw"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground/20 text-6xl">📦</div>
            )}
          </div>

          {/* Thumbnail strip */}
          {photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {photos.map((src, i) => (
                <div key={i} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border bg-muted">
                  <Image src={src} alt={`Photo ${i + 1}`} fill className="object-cover" sizes="80px" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: details */}
        <div className="flex flex-col gap-5">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold leading-snug text-foreground">{listing.title}</h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-3xl font-bold text-primary">
              {formatPrice(Number(listing.price), listing.country)}
            </span>
            <Badge variant={CONDITION_VARIANTS[listing.condition] ?? 'secondary'}>
              {CONDITION_LABELS[listing.condition] ?? listing.condition}
            </Badge>
            <Badge variant="outline">{categoryLabel}</Badge>
            {listing.status === 'reserved' && <Badge variant="secondary">Reserved</Badge>}
            {listing.status === 'sold' && <Badge variant="outline">Sold</Badge>}
          </div>

          {listing.description && (
            <div>
              <p className="mb-1.5 text-sm font-semibold text-foreground">Description</p>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {listing.description}
              </p>
            </div>
          )}

          {/* Location + time */}
          <div className="flex flex-col gap-1.5">
            {location && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                {location}
              </div>
            )}
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0" />
              Listed {timeAgo}
            </div>
          </div>

          {/* Seller card */}
          {seller && (
            <div className="flex items-center justify-between rounded-xl border bg-white p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={seller.avatar_url ?? undefined} alt={seller.display_name ?? 'Seller'} />
                  <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                    {sellerInitials ?? 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-foreground">{seller.display_name ?? 'Anonymous'}</p>
                  <p className="text-xs text-muted-foreground">
                    Member since {new Date(seller.created_at).getFullYear()}
                  </p>
                </div>
              </div>
              <Link href={`/sellers/${seller.id}`} className="text-sm font-medium text-primary hover:underline">
                View Sale →
              </Link>
            </div>
          )}

          {/* CTA buttons */}
          <div className="flex flex-col gap-2">
            <MessageSellerButton
              listingId={listing.id}
              sellerId={listing.seller_id}
              isOwner={isOwner}
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 gap-1.5 text-muted-foreground hover:text-foreground">
                <Share2 className="h-4 w-4" /> Share
              </Button>
              <Button variant="outline" className="flex-1 gap-1.5 text-muted-foreground hover:text-foreground">
                <Flag className="h-4 w-4" /> Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* More from seller */}
      {moreBySeller && moreBySeller.length > 0 && (
        <div className="mt-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">More from {seller?.display_name?.split(' ')[0] ?? 'this seller'}&apos;s Moving Sale</h2>
            <Link href={`/sellers/${listing.seller_id}`} className="text-sm font-medium text-primary hover:underline">
              View all items →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {(moreBySeller as unknown as ListingWithSeller[]).map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
