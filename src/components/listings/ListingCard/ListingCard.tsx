import Image from 'next/image'
import Link from 'next/link'
import { Package } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { ListingWithSeller } from '@/types'
import { SaveButton } from '../SaveButton'
import { formatPrice } from '@/lib/currency'

interface ListingCardProps {
  listing: ListingWithSeller
  isSaved?: boolean // undefined = user not logged in, don't show heart
}

export function ListingCard({ listing, isSaved }: ListingCardProps) {
  const photo = listing.listing_photos
    ?.slice()
    .sort((a, b) => a.display_order - b.display_order)[0]

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const photoUrl = photo
    ? `${supabaseUrl}/storage/v1/object/public/listing-photos/${photo.storage_path}`
    : null

  const initials = listing.profiles?.display_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link href={`/listings/${listing.id}`} className="absolute inset-0 z-0" aria-label={listing.title} />

      {/* Photo */}
      <div className="relative h-[190px] w-full shrink-0 bg-muted">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={listing.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 320px"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground/20" />
          </div>
        )}

        {/* Save button — only shown to logged-in users */}
        {isSaved !== undefined && (
          <SaveButton
            listingId={listing.id}
            isSaved={isSaved}
            className="absolute right-2.5 top-2.5 z-10"
          />
        )}
      </div>

      {/* Body */}
      <div className="relative z-0 flex flex-col gap-2.5 p-[18px]">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-[15px] font-semibold leading-snug text-foreground">
            {listing.title}
          </h3>
          <span className="shrink-0 text-base font-bold text-primary">
            {formatPrice(Number(listing.price), listing.country)}
          </span>
        </div>

        {listing.description && (
          <p className="line-clamp-2 text-[13px] leading-[1.4] text-muted-foreground">
            {listing.description}
          </p>
        )}

        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage
              src={listing.profiles?.avatar_url ?? undefined}
              alt={listing.profiles?.display_name ?? 'Seller'}
            />
            <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
              {initials ?? 'U'}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium text-muted-foreground">
            {listing.profiles?.display_name ?? 'Anonymous'}
          </span>
        </div>
      </div>
    </div>
  )
}
